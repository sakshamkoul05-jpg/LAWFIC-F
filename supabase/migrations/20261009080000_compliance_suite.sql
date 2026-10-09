-- The compliance suite: businesses, what they have filed, the licences they
-- hold, and the documents they keep with us.
--
-- WHY A BUSINESS IS ITS OWN ROW AND NOT COLUMNS ON THE PROFILE
--
-- A customer is a person. Their obligations belong to a business, and plenty of
-- people have more than one — a proprietorship and the Pvt Ltd they started
-- later, or a CA's office looking after a dozen. Putting "GST scheme" on the
-- profile would mean the second business could not exist without overwriting
-- the first. So the calendar, the filings and the licences all hang off a
-- business, and a person can own several.
--
-- WHAT THE DATABASE KNOWS AND WHAT IT DOES NOT
--
-- The calendar itself is not stored. It is computed from the business's
-- answers (lib/compliance/calendar.ts) because the law moves — a due date
-- extended by CBIC is one edit to the rules file, not a backfill over every
-- customer's rows. What IS stored is the one thing the customer knows and we
-- cannot compute: that they filed. `compliance_filings` is that record.
--
-- Every table is owner-only under RLS. Staff read through is_staff(), the same
-- function every other back-office policy already uses.

create table if not exists public.businesses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null check (length(name) between 1 and 120),
  entity_type    text not null
                   check (entity_type in ('proprietorship', 'partnership', 'llp', 'opc', 'pvt_ltd')),
  /* Two-letter code from lib/states.ts. Decides the QRMP GSTR-3B date. */
  state          text not null default '' check (length(state) <= 4),
  gst_scheme     text not null default 'none'
                   check (gst_scheme in ('none', 'monthly', 'qrmp', 'composition')),
  has_employees  boolean not null default false,
  deducts_tds    boolean not null default false,
  tax_audit      boolean not null default false,
  /* Optional identifiers, for the customer's own reference and the vault.
     Format-checked in the app; length-bounded here as the backstop. */
  gstin          text not null default '' check (length(gstin) <= 15),
  pan            text not null default '' check (length(pan) <= 10),
  /* WhatsApp reminders. Opt-in only, and the number is the customer's to give —
     never copied silently from the account's phone. */
  whatsapp_opt_in boolean not null default false,
  whatsapp_number text not null default '' check (whatsapp_number ~ '^[0-9]{0,15}$'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists businesses_user_idx on public.businesses (user_id, created_at);

alter table public.businesses enable row level security;

drop policy if exists "own businesses" on public.businesses;
create policy "own businesses" on public.businesses
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "staff read businesses" on public.businesses;
create policy "staff read businesses" on public.businesses
  for select using (public.is_staff());

-- A filing the customer has marked done. `item_key` is the stable id the
-- calendar gives each obligation, e.g. "GSTR3B:2026-09". Unique per business,
-- so marking twice is a no-op rather than a second row.
create table if not exists public.compliance_filings (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  item_key     text not null check (length(item_key) between 3 and 60),
  filed_on     date not null default current_date,
  created_at   timestamptz not null default now(),
  constraint compliance_filings_once unique (business_id, item_key)
);

alter table public.compliance_filings enable row level security;

drop policy if exists "own filings" on public.compliance_filings;
create policy "own filings" on public.compliance_filings
  for all using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.businesses b
                where b.id = business_id and b.user_id = (select auth.uid()))
  );

-- Licences and registrations with an expiry: FSSAI, trademark, DSC, trade
-- licence, Shop & Establishment. The renewal tracker reads this.
create table if not exists public.business_licences (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null
                 check (kind in ('fssai', 'trademark', 'dsc', 'trade_licence', 'shop_establishment', 'drug_licence', 'iso', 'dir3kyc', 'other')),
  label        text not null default '' check (length(label) <= 80),
  number       text not null default '' check (length(number) <= 40),
  expires_on   date not null,
  created_at   timestamptz not null default now()
);

create index if not exists business_licences_expiry_idx
  on public.business_licences (business_id, expires_on);

alter table public.business_licences enable row level security;

drop policy if exists "own licences" on public.business_licences;
create policy "own licences" on public.business_licences
  for all using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.businesses b
                where b.id = business_id and b.user_id = (select auth.uid()))
  );

-- The document vault. The file lives in the private "vault" bucket at
-- <user_id>/<uuid>.<ext>; this row is what the customer sees and names.
create table if not exists public.vault_documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  business_id  uuid references public.businesses (id) on delete set null,
  kind         text not null default 'other'
                 check (kind in ('pan', 'gst_certificate', 'udyam_certificate',
                                 'incorporation', 'fssai', 'trademark', 'agreement',
                                 'address_proof', 'bank', 'photo', 'other')),
  label        text not null check (length(label) between 1 and 120),
  path         text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png|webp)$'),
  mime_type    text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes   integer not null check (size_bytes between 1 and 10485760),
  created_at   timestamptz not null default now()
);

create index if not exists vault_documents_user_idx on public.vault_documents (user_id, created_at desc);

alter table public.vault_documents enable row level security;

drop policy if exists "own vault rows" on public.vault_documents;
create policy "own vault rows" on public.vault_documents
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Deliberately no staff policy: the vault is the customer's, and nobody at
-- LAWFIC can list or open it. Documents for an order travel with the order.

-- The bucket. Private: every read is a short-lived signed URL minted by the
-- server for a signed-in owner. Unlike "resumes" this one carries real
-- per-user policies, so the customer's own session does the upload and no
-- service-role key is involved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vault', 'vault', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault_select_own" on storage.objects;
create policy "vault_select_own" on storage.objects for select
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "vault_insert_own" on storage.objects;
create policy "vault_insert_own" on storage.objects for insert
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "vault_delete_own" on storage.objects;
create policy "vault_delete_own" on storage.objects for delete
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Reminders already sent, so the daily job never sends the same nudge twice
-- even if it runs twice. Written only by the service role.
create table if not exists public.compliance_reminders_sent (
  business_id  uuid not null references public.businesses (id) on delete cascade,
  item_key     text not null,
  days_before  smallint not null,
  channel      text not null default 'whatsapp',
  sent_at      timestamptz not null default now(),
  primary key (business_id, item_key, days_before, channel)
);

alter table public.compliance_reminders_sent enable row level security;
-- No policies: nobody but the service role reads or writes it.
