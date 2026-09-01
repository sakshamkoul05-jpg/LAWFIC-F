-- 001 — user_profiles
--
-- User self-description used to personalise the site: their name, how to
-- reach them, their education, what they are preparing for (exams) or the
-- kind of job they are looking for, and their resume.
--
-- All rows are the property of exactly one auth user. RLS keeps reads/writes
-- scoped to the owner — the same shape as wallet_prefs.
--
-- The resume file itself lives in Supabase Storage under bucket "resumes",
-- path <user_id>/resume.ext. Only the URL is kept here.

create table if not exists public.user_profiles (
  user_id                   uuid primary key references auth.users (id) on delete cascade,
  full_name                 text not null default '',
  phone                     text not null default '',
  city                      text not null default '',
  qualification              text not null default '',      -- e.g. "B.Com", "B.Tech", "Class 12"
  exams_preparing           text[] not null default '{}',   -- e.g. {"UPSC","CA Foundation"}
  jobs_looking              text[] not null default '{}',   -- e.g. {"Government job","Accounts"}
  resume_path               text not null default '',        -- storage path in the "resumes" bucket
  updated_at                timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "own profile read" on public.user_profiles;
create policy "own profile read"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "own profile insert" on public.user_profiles;
create policy "own profile insert"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "own profile update" on public.user_profiles;
create policy "own profile update"
  on public.user_profiles for update
  using (auth.uid() = user_id);