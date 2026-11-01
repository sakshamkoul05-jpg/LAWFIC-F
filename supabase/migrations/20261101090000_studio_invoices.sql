-- ════════════════════════════════════════════════════════════════════════
--  Studio invoices — the bills LAWFIC issues for websites, apps, marketing
--  and the rest, made in the back office at /admin/invoices.
--
--  Not the wallet's `invoices` table: those are issued by a trigger for money
--  moving through a customer's wallet. These are written by staff for work
--  the studio does, and are stored whole so a bill can be reopened, edited
--  and printed again exactly as it was.
--
--  Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.studio_invoices (
  id           uuid primary key default gen_random_uuid(),
  number       text not null unique,
  issue_date   date not null default current_date,
  client_name  text not null default '',
  service      text not null default '',
  total_paise  bigint not null default 0 check (total_paise >= 0),
  -- everything the sheet shows; see lib/studio-invoice.ts (InvoiceData)
  data         jsonb not null default '{}'::jsonb,
  created_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists studio_invoices_issue_date_idx on public.studio_invoices (issue_date desc, created_at desc);

-- Same helper the catalogue tables use; repeated so this file runs on its own.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists studio_invoices_touch on public.studio_invoices;
create trigger studio_invoices_touch before update on public.studio_invoices
  for each row execute function public.touch_updated_at();

-- Client names, phone numbers and amounts: staff who can operate the back
-- office only. Guests (view-only) do not see them.
alter table public.studio_invoices enable row level security;

drop policy if exists studio_invoices_staff_all on public.studio_invoices;
create policy studio_invoices_staff_all on public.studio_invoices
  for all using (public.staff_can('operate')) with check (public.staff_can('operate'));
