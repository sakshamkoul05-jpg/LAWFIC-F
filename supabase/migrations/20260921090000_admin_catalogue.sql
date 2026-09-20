-- ════════════════════════════════════════════════════════════════════════
--  Categories, the services inside them, and jobs.
--
--  WHY THESE TABLES DID NOT EXIST
--
--  The service catalogue has lived in lib/catalogue.ts — compiled into the
--  bundle, edited by deploying. That is fine for a catalogue nobody but a
--  developer changes, and wrong the moment the client wants to add a category
--  from the back office.
--
--  Jobs never existed at all. /jobs is a placeholder page.
--
--  THE SAME SHAPE AS promotions, DELIBERATELY
--
--  The home page already reads its banners from a table and falls back to the
--  compiled list when the read fails (lib/promotions-db.ts). These follow that
--  exactly: the table is the source of truth, the code keeps a copy as a
--  fallback, and a failed read shows last week's catalogue rather than an
--  empty site. Two patterns for the same problem would be worse than one.
--
--  RUN THIS ONCE in the Supabase SQL editor. It is idempotent.
-- ════════════════════════════════════════════════════════════════════════

-- ── Categories ──────────────────────────────────────────────────────────
create table if not exists public.categories (
  -- The slug IS the id. It is what the URL and the code already use, and a
  -- separate uuid would mean every lookup carries a translation step.
  id          text primary key,
  name        text not null,
  summary     text not null default '',
  icon        text not null default 'business',
  position    int  not null default 0,
  is_live     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── The services inside a category ──────────────────────────────────────
create table if not exists public.category_services (
  id          uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories(id) on delete cascade,
  slug        text not null,
  name        text not null,
  blurb       text not null default '',
  -- 'live' can be ordered today; 'soon' is listed but not yet orderable.
  status      text not null default 'soon' check (status in ('live', 'soon')),
  -- Extra words people search by that are not in the name: "udyog aadhaar",
  -- "pvt ltd", "49a". The search index folds these in.
  aliases     text[] not null default '{}',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category_id, slug)
);

-- ── Jobs ────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  employer        text not null default '',
  city            text not null default '',
  state           text not null default '',
  -- Free text rather than an enum: the shape of Indian hiring does not fit a
  -- fixed list, and a constraint nobody can edit from the back office is a
  -- constraint that will be worked around with a misspelled value.
  employment_type text not null default 'Full time',
  category        text not null default '',
  description     text not null default '',
  -- One of these is how somebody applies. Both may be set; neither is required
  -- at the database level because a draft is allowed to be incomplete.
  apply_url       text,
  apply_email     text,
  -- Paise, like every other money column in this schema. Null means
  -- "not disclosed", which is different from zero.
  salary_min_paise bigint,
  salary_max_paise bigint,
  is_live         boolean not null default false,
  position        int not null default 0,
  posted_at       timestamptz not null default now(),
  -- A job with a date in the past stops being public without anybody
  -- remembering to switch it off. Null means it runs until switched off.
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────
-- The public reads are always "live rows in order", so that is what is
-- indexed. Without these every page load is a sequential scan, which is
-- invisible at eleven rows and is not at eleven thousand.
create index if not exists categories_live_position_idx
  on public.categories (is_live, position);
create index if not exists category_services_category_idx
  on public.category_services (category_id, position);
create index if not exists jobs_live_posted_idx
  on public.jobs (is_live, posted_at desc);

-- The back office looks a customer's balance up by taking their newest ledger
-- row. Descending on seq means that is an index seek rather than a sort of
-- everything they have ever done.
create index if not exists wallet_entries_user_seq_idx
  on public.wallet_entries (user_id, seq desc);

-- ── Row level security ──────────────────────────────────────────────────
alter table public.categories        enable row level security;
alter table public.category_services enable row level security;
alter table public.jobs              enable row level security;

-- THE PUBLIC SEES LIVE ROWS ONLY.
-- Staff see everything through their own policy below, which is what lets the
-- back office show a draft that the site does not.
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (is_live);

drop policy if exists category_services_public_read on public.category_services;
create policy category_services_public_read on public.category_services
  for select using (
    exists (select 1 from public.categories c
            where c.id = category_services.category_id and c.is_live)
  );

drop policy if exists jobs_public_read on public.jobs;
create policy jobs_public_read on public.jobs
  for select using (
    is_live and (expires_at is null or expires_at > now())
  );

-- STAFF DO EVERYTHING.
-- is_staff() already exists and is what every other back-office policy uses.
-- Writing the membership test inline here instead would mean two definitions
-- of "is this person staff", and they would drift.
drop policy if exists categories_staff_all on public.categories;
create policy categories_staff_all on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists category_services_staff_all on public.category_services;
create policy category_services_staff_all on public.category_services
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists jobs_staff_all on public.jobs;
create policy jobs_staff_all on public.jobs
  for all using (public.is_staff()) with check (public.is_staff());

-- ── updated_at ──────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists category_services_touch on public.category_services;
create trigger category_services_touch before update on public.category_services
  for each row execute function public.touch_updated_at();

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ── The user directory, for the back office ─────────────────────────────
--
-- WHY A FUNCTION AND NOT auth.admin.listUsers()
--
-- The back office needs an email and a last-login date beside each profile.
-- The admin API can supply both, but only page by page and with no way to ask
-- for a specific set of ids: at fifty users that is one call, and at ten
-- thousand it is two hundred sequential HTTP round trips before the page can
-- render. That is the difference between a dashboard and a progress bar.
--
-- This is one indexed query instead, joinable against profiles in memory.
--
-- SECURITY DEFINER IS DOING REAL WORK HERE
--
-- auth.users is not reachable through PostgREST and should not be. The
-- function runs as its owner so it can read that table, and the is_staff()
-- guard inside the query is what stops it handing the directory to anyone who
-- happens to be signed in. Both halves are load-bearing: remove the guard and
-- every authenticated customer can enumerate every email address on the site.
create or replace function public.staff_user_directory()
returns table (
  id                 uuid,
  email              text,
  last_sign_in_at    timestamptz,
  created_at         timestamptz,
  email_confirmed_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id, u.email::text, u.last_sign_in_at, u.created_at, u.email_confirmed_at
  from auth.users u
  where public.is_staff();
$$;

revoke all on function public.staff_user_directory() from public;
revoke all on function public.staff_user_directory() from anon;
grant execute on function public.staff_user_directory() to authenticated;
