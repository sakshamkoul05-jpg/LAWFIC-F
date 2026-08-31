-- wallet_prefs: per-user wallet card customization (skin + pinned flairs).
--
-- Cosmetic only. Never touches balances, the ledger, or orders. Scoped to the
-- owner via RLS so a user can only read and write their own row.
--
-- Apply in the Supabase dashboard SQL editor (or via the CLI). The app reads
-- through the anon key and lets RLS decide, matching the wallet_entries model.

create table if not exists public.wallet_prefs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  skin       text not null default 'gilded',
  flairs     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.wallet_prefs enable row level security;

drop policy if exists "own prefs read" on public.wallet_prefs;
create policy "own prefs read"
  on public.wallet_prefs for select
  using (auth.uid() = user_id);

drop policy if exists "own prefs insert" on public.wallet_prefs;
create policy "own prefs insert"
  on public.wallet_prefs for insert
  with check (auth.uid() = user_id);

drop policy if exists "own prefs update" on public.wallet_prefs;
create policy "own prefs update"
  on public.wallet_prefs for update
  using (auth.uid() = user_id);
