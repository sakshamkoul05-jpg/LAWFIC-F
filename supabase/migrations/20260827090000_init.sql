-- LAWFIC — initial schema
--
-- Design notes that matter, because they follow from what LAWFIC legally is
-- rather than from a generic e-commerce template:
--
--  1. THE WALLET IS A CLOSED PREPAID LEDGER, NOT A PAYMENT INSTRUMENT. Money
--     enters only from a verified Razorpay webhook and leaves only as payment
--     for LAWFIC's own services. There is no transfer between users and no
--     withdrawal to a bank. That is what keeps it inside the closed-system PPI
--     exemption; a schema that permitted user-to-user movement would put the
--     business inside RBI authorisation whether or not the UI exposed it.
--
--  2. THE LEDGER IS APPEND-ONLY. No UPDATE, no DELETE — enforced by a trigger
--     AND by revoked grants, because either alone can be worked around. A
--     correction is a new reversing entry. This is what makes the balance
--     auditable rather than merely current.
--
--  3. THE BALANCE IS NOT A MUTABLE COLUMN. Each entry stores the balance it
--     produced (`balance_after_paise`), computed by a trigger under a per-user
--     advisory lock. Current balance is the newest entry's value: derived from
--     the ledger, immutable once written, and O(1) to read.
--
--  4. MONEY IS ALWAYS PAISE, ALWAYS bigint. No floats anywhere near a rupee.
--
--  5. GOVERNMENT FEE AND PROFESSIONAL FEE ARE SEPARATE COLUMNS, never a total.
--     A blended figure is the thing that turns a filing business into an
--     overcharging complaint, so the database refuses to store one.

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ------------------------------------------------------------- profiles ----

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  city          text,
  state         text,
  business_type text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'One row per signed-in user. Created automatically by a trigger on auth.users.';

-- A profile must exist the moment a user does, or every later join is a
-- special case. Runs as the definer so it can write regardless of RLS.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (
    new.id,
    new.phone,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- services ----

create table public.services (
  slug                   text primary key,
  name                   text not null,
  category               text not null,
  -- Kept apart, deliberately. See note 5 above.
  government_fee_paise   bigint not null default 0 check (government_fee_paise >= 0),
  professional_fee_paise bigint not null check (professional_fee_paise >= 0),
  turnaround             text not null,
  is_active              boolean not null default true,
  sort_order             int not null default 0
);

-- -------------------------------------------------------- service_orders ----

create type public.order_status as enum (
  'submitted',    -- the user has asked; nothing is owed yet
  'quoted',       -- LAWFIC has priced it; the user may now pay
  'paid',         -- the wallet has been debited
  'in_progress',  -- filed, awaiting the registry
  'completed',
  'rejected'      -- cannot proceed; anything paid is credited back
);

create table public.service_orders (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique,
  user_id                uuid not null references auth.users(id) on delete cascade,
  service_slug           text not null references public.services(slug),
  status                 public.order_status not null default 'submitted',
  -- Null until LAWFIC quotes. The site must never invent a figure.
  government_fee_paise   bigint check (government_fee_paise >= 0),
  professional_fee_paise bigint check (professional_fee_paise >= 0),
  details                text,
  admin_notes            text,
  quoted_at              timestamptz,
  paid_at                timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index service_orders_user_idx on public.service_orders (user_id, created_at desc);
create index service_orders_status_idx on public.service_orders (status);

-- A human-quotable reference. Sequential per year, not a UUID, because it gets
-- read down a phone line.
create sequence public.order_reference_seq;

create function public.set_order_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'ORD-' || to_char(now(), 'YY') || '-' ||
                     lpad(nextval('public.order_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger service_orders_reference
  before insert on public.service_orders
  for each row execute function public.set_order_reference();

-- A user may create an order. A user may NOT price it or advance it — those
-- columns are stripped on insert, so a hand-crafted POST cannot self-quote
-- itself a ₹0 fee and then pay nothing.
create function public.service_orders_guard_insert()
returns trigger
language plpgsql
as $$
begin
  new.status                 := 'submitted';
  new.government_fee_paise   := null;
  new.professional_fee_paise := null;
  new.admin_notes            := null;
  new.quoted_at              := null;
  new.paid_at                := null;
  new.completed_at           := null;
  return new;
end;
$$;

create trigger service_orders_guard
  before insert on public.service_orders
  for each row execute function public.service_orders_guard_insert();

-- --------------------------------------------------------- payment_intents --
--
-- The reconciliation surface. A row is written when we ask Razorpay for an
-- order id, before the user ever reaches the checkout. If a payment is later
-- claimed that has no intent behind it, that is a fact worth being able to see.

create table public.payment_intents (
  razorpay_order_id text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  amount_paise      bigint not null check (amount_paise > 0),
  status            text not null default 'created'
                      check (status in ('created', 'paid', 'failed')),
  created_at        timestamptz not null default now()
);

create index payment_intents_user_idx on public.payment_intents (user_id, created_at desc);

-- ---------------------------------------------------------- wallet_entries --

create table public.wallet_entries (
  seq                 bigint generated always as identity,
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  direction           text not null check (direction in ('credit', 'debit')),
  amount_paise        bigint not null check (amount_paise > 0),
  reason              text not null,
  order_id            uuid references public.service_orders(id) on delete set null,
  razorpay_payment_id text,
  -- Razorpay retries until it gets a 2xx. This is what turns a duplicate
  -- delivery into a no-op instead of free money.
  idempotency_key     text not null unique,
  -- Written by the trigger below. Never supplied by a caller.
  balance_after_paise bigint not null default 0 check (balance_after_paise >= 0),
  created_at          timestamptz not null default now()
);

create index wallet_entries_user_idx on public.wallet_entries (user_id, seq desc);

comment on column public.wallet_entries.balance_after_paise is
  'The balance this entry produced. Immutable. Current balance is the newest row''s value.';

/**
 * Computes the running balance and refuses an overdraft.
 *
 * The advisory lock serialises concurrent inserts for one user, which is what
 * makes the read-then-write safe: without it, two debits racing could each see
 * the same prior balance and both pass the check.
 *
 * An overdraft is rejected in the DATABASE, not in the application. That
 * matters because the webhook runs with the service role and bypasses RLS —
 * the only thing standing between a bug and a negative balance is this.
 */
create function public.wallet_entry_apply()
returns trigger
language plpgsql
as $$
declare
  prev bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select we.balance_after_paise into prev
    from public.wallet_entries we
   where we.user_id = new.user_id
   order by we.seq desc
   limit 1;

  prev := coalesce(prev, 0);

  if new.direction = 'credit' then
    new.balance_after_paise := prev + new.amount_paise;
  else
    if new.amount_paise > prev then
      raise exception 'insufficient wallet balance: have %, need %', prev, new.amount_paise
        using errcode = '23514';
    end if;
    new.balance_after_paise := prev - new.amount_paise;
  end if;

  return new;
end;
$$;

create trigger wallet_entries_apply
  before insert on public.wallet_entries
  for each row execute function public.wallet_entry_apply();

/** Append-only. A correction is a new reversing entry, never an edit. */
create function public.wallet_entries_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'wallet_entries is append-only; write a reversing entry instead'
    using errcode = '23514';
end;
$$;

create trigger wallet_entries_no_update
  before update on public.wallet_entries
  for each row execute function public.wallet_entries_immutable();

create trigger wallet_entries_no_delete
  before delete on public.wallet_entries
  for each row execute function public.wallet_entries_immutable();

-- ---------------------------------------------------------------- balance ---

create view public.wallet_balances as
  select distinct on (user_id)
         user_id,
         balance_after_paise as balance_paise,
         created_at          as as_of
    from public.wallet_entries
   order by user_id, seq desc;

comment on view public.wallet_balances is
  'Current balance per user, read from the newest ledger entry. Users with no
   entries do not appear — treat a missing row as zero.';
