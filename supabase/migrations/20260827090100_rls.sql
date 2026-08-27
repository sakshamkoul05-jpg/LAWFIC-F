-- LAWFIC — row level security, and the one safe way to spend from the wallet.
--
-- The rule this file exists to enforce: NO CLIENT ROLE MAY EVER WRITE TO
-- wallet_entries. Not the user's own row, not with their own session. Credits
-- come from the Razorpay webhook (service role, after an HMAC check) and
-- debits come from the security-definer function at the bottom of this file,
-- which validates the order before it moves anything.
--
-- If a policy is ever added that lets `authenticated` insert into
-- wallet_entries, the wallet is finished — anyone with the anon key and a
-- session can mint balance.

alter table public.profiles        enable row level security;
alter table public.services        enable row level security;
alter table public.service_orders  enable row level security;
alter table public.payment_intents enable row level security;
alter table public.wallet_entries  enable row level security;

-- ------------------------------------------------------------- profiles ----

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ------------------------------------------------------------- services ----

create policy services_read_active on public.services
  for select to anon, authenticated
  using (is_active);

-- ------------------------------------------------------- service_orders ----

create policy service_orders_select_own on public.service_orders
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Insert only. The BEFORE INSERT guard strips status and every fee column, so
-- what lands is always an unpriced 'submitted' row.
create policy service_orders_insert_own on public.service_orders
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Deliberately no UPDATE and no DELETE policy. Pricing and status changes are
-- staff actions, performed with the service role. A user cannot quote
-- themselves, cannot mark their own order paid, and cannot withdraw one.

-- ------------------------------------------------------ payment_intents ----

create policy payment_intents_select_own on public.payment_intents
  for select to authenticated
  using (user_id = (select auth.uid()));

-- No insert policy: intents are created server-side with the service role,
-- after the session has been checked and the amount validated. A client that
-- could write its own intent could claim any amount it liked.

-- ------------------------------------------------------- wallet_entries ----

create policy wallet_entries_select_own on public.wallet_entries
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Belt and braces on top of the append-only triggers. Grants are checked
-- before RLS, so this stops a write that a mistaken future policy would allow.
revoke insert, update, delete on public.wallet_entries from anon, authenticated;
revoke update, delete on public.wallet_entries from service_role;

-- ----------------------------------------------------- spending the wallet --

/**
 * The only way a user can move money out of their own wallet.
 *
 * Security definer so it can write to wallet_entries, which no client role
 * may touch directly — but every precondition is checked against auth.uid()
 * first, so it cannot be used to pay someone else's order or to pay an order
 * that has not been quoted.
 *
 * Idempotent on the order: the key is derived from the order id, so a
 * double-click debits once and the second call surfaces as a unique violation
 * rather than a second charge.
 *
 * The balance check lives in the wallet_entry_apply trigger, not here. This
 * function does not need to know the balance — it just tries, and the
 * database refuses an overdraft.
 */
create function public.pay_order_from_wallet(p_order_id uuid)
returns public.service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.service_orders;
  v_total bigint;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into v_order
    from public.service_orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.user_id <> v_uid then
    raise exception 'not your order' using errcode = '42501';
  end if;

  if v_order.status <> 'quoted' then
    raise exception 'order is %, not quoted', v_order.status using errcode = '22023';
  end if;

  v_total := coalesce(v_order.government_fee_paise, 0)
           + coalesce(v_order.professional_fee_paise, 0);

  if v_total <= 0 then
    raise exception 'order has no amount to pay' using errcode = '22023';
  end if;

  -- Two entries, not one blended debit: the whole point is that the government
  -- fee and our fee stay separately visible, right through to the statement.
  if coalesce(v_order.government_fee_paise, 0) > 0 then
    insert into public.wallet_entries
      (user_id, direction, amount_paise, reason, order_id, idempotency_key)
    values
      (v_uid, 'debit', v_order.government_fee_paise,
       'Government fee — ' || v_order.reference, v_order.id,
       'order:' || v_order.id || ':govt');
  end if;

  insert into public.wallet_entries
    (user_id, direction, amount_paise, reason, order_id, idempotency_key)
  values
    (v_uid, 'debit', v_order.professional_fee_paise,
     'Professional fee — ' || v_order.reference, v_order.id,
     'order:' || v_order.id || ':prof');

  update public.service_orders
     set status = 'paid', paid_at = now(), updated_at = now()
   where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.pay_order_from_wallet(uuid) from public;
grant execute on function public.pay_order_from_wallet(uuid) to authenticated;

-- ------------------------------------------------------------ my balance ----

/** Convenience read. Returns 0 rather than nothing for a user with no entries. */
create function public.my_wallet_balance()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select balance_after_paise
       from public.wallet_entries
      where user_id = auth.uid()
      order by seq desc
      limit 1),
    0
  );
$$;

revoke all on function public.my_wallet_balance() from public;
grant execute on function public.my_wallet_balance() to authenticated;
