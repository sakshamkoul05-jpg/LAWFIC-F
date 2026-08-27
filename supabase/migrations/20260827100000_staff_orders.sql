-- LAWFIC — staff, quoting, and moving an order through its states.
--
-- Everything a staff member can do that touches money goes through a function
-- in this file. None of it is a plain UPDATE from the client, for two reasons:
--
--   1. wallet_entries has INSERT revoked from every client role, so a refund
--      physically cannot be written by an UPDATE policy — it needs a definer;
--   2. a status change and a ledger write have to happen together or not at
--      all. A refund that credits the wallet but leaves the order 'paid', or
--      rejects the order without crediting, is worse than either failing.
--
-- Staff membership is a row in public.staff, added by hand in the SQL editor.
-- There is deliberately no UI for granting staff access: the first thing an
-- attacker with an account would look for is the button that makes them one.

-- ---------------------------------------------------------------- staff ----

create table public.staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'agent' check (role in ('agent', 'owner')),
  created_at timestamptz not null default now()
);

comment on table public.staff is
  'Add a row by hand to grant back-office access:
     insert into public.staff (user_id, role)
     select id, ''owner'' from auth.users where email = ''you@lawfic.in'';';

/**
 * Security definer so it can read public.staff regardless of RLS. Without
 * that, a policy that calls is_staff() would recurse into the policy on
 * staff itself.
 */
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;

alter table public.staff enable row level security;

create policy staff_read_self on public.staff
  for select to authenticated
  using (user_id = (select auth.uid()));

-- --------------------------------------------------- staff visibility ------

create policy service_orders_staff_read on public.service_orders
  for select to authenticated
  using (public.is_staff());

create policy profiles_staff_read on public.profiles
  for select to authenticated
  using (public.is_staff());

-- Staff can see a customer's statement, because that is what answering
-- "where did my money go" requires. They still cannot write to it.
create policy wallet_entries_staff_read on public.wallet_entries
  for select to authenticated
  using (public.is_staff());

create policy payment_intents_staff_read on public.payment_intents
  for select to authenticated
  using (public.is_staff());

-- Deliberately still no UPDATE policy on service_orders for anyone. Staff
-- change orders only through the functions below, so every transition is
-- validated rather than trusted.

-- --------------------------------------------------------------- quoting ---

/**
 * Prices an order. The two fees stay separate all the way down — there is no
 * parameter for a total, so a blended figure cannot be entered even by
 * mistake.
 */
create function public.quote_order(
  p_order_id uuid,
  p_government_fee_paise bigint,
  p_professional_fee_paise bigint,
  p_admin_notes text default null
)
returns public.service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.service_orders;
begin
  if not public.is_staff() then
    raise exception 'staff only' using errcode = '42501';
  end if;

  if p_government_fee_paise < 0 or p_professional_fee_paise < 0 then
    raise exception 'fees cannot be negative' using errcode = '22023';
  end if;

  if p_government_fee_paise + p_professional_fee_paise <= 0 then
    raise exception 'a quote must come to more than zero' using errcode = '22023';
  end if;

  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.status <> 'submitted' then
    raise exception 'order is %, so it cannot be quoted', v_order.status
      using errcode = '22023';
  end if;

  update public.service_orders
     set government_fee_paise   = p_government_fee_paise,
         professional_fee_paise = p_professional_fee_paise,
         admin_notes            = coalesce(p_admin_notes, admin_notes),
         status                 = 'quoted',
         quoted_at              = now(),
         updated_at             = now()
   where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ------------------------------------------------------------- advancing ---

/**
 * Moves a paid order along. Only the transitions that make sense are allowed;
 * an order cannot skip from 'paid' to 'completed' without being worked on, and
 * nothing can go backwards.
 */
create function public.advance_order(p_order_id uuid, p_status public.order_status)
returns public.service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.service_orders;
  v_ok    boolean;
begin
  if not public.is_staff() then
    raise exception 'staff only' using errcode = '42501';
  end if;

  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  v_ok := (v_order.status = 'paid'        and p_status = 'in_progress')
       or (v_order.status = 'in_progress' and p_status = 'completed');

  if not v_ok then
    raise exception 'cannot move an order from % to %', v_order.status, p_status
      using errcode = '22023';
  end if;

  update public.service_orders
     set status       = p_status,
         completed_at = case when p_status = 'completed' then now() else completed_at end,
         updated_at   = now()
   where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ------------------------------------------------------------- rejecting ---

/**
 * Rejects an order and, if it was paid for, credits every rupee back to the
 * wallet in the same transaction.
 *
 * The refund is written as fresh CREDIT entries, never as a reversal of the
 * original debits — the ledger is append-only, so the history has to show that
 * money went out and came back, not that it never left.
 *
 * Idempotent per debit: the key is derived from the debit's own id, so calling
 * this twice cannot refund twice.
 */
create function public.reject_order(p_order_id uuid, p_reason text)
returns public.service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  public.service_orders;
  v_debit  record;
  v_count  int := 0;
begin
  if not public.is_staff() then
    raise exception 'staff only' using errcode = '42501';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'a rejection needs a reason the customer can read'
      using errcode = '22023';
  end if;

  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.status in ('completed', 'rejected') then
    raise exception 'order is already %', v_order.status using errcode = '22023';
  end if;

  -- Credit back anything that was actually taken.
  for v_debit in
    select id, amount_paise, reason
      from public.wallet_entries
     where order_id = p_order_id and direction = 'debit'
  loop
    insert into public.wallet_entries
      (user_id, direction, amount_paise, reason, order_id, idempotency_key)
    values
      (v_order.user_id, 'credit', v_debit.amount_paise,
       'Refund — ' || v_debit.reason, p_order_id,
       'refund:' || v_debit.id)
    on conflict (idempotency_key) do nothing;
    v_count := v_count + 1;
  end loop;

  update public.service_orders
     set status      = 'rejected',
         admin_notes = p_reason,
         updated_at  = now()
   where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ------------------------------------------------------------------ grants --

revoke all on function public.quote_order(uuid, bigint, bigint, text) from public;
revoke all on function public.advance_order(uuid, public.order_status) from public;
revoke all on function public.reject_order(uuid, text) from public;
revoke all on function public.is_staff() from public;

grant execute on function public.quote_order(uuid, bigint, bigint, text) to authenticated;
grant execute on function public.advance_order(uuid, public.order_status) to authenticated;
grant execute on function public.reject_order(uuid, text) to authenticated;
grant execute on function public.is_staff() to authenticated;
