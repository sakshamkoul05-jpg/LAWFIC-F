-- ════════════════════════════════════════════════════════════════════════
--  Roles for the back office: owner, admin, staff, guest.
--
--  THE TRAP THIS AVOIDS
--
--  public.staff already has a `role` column and nothing reads it. Every
--  back-office policy is `for all using (is_staff())`, and is_staff() is true
--  for ANY row in that table. So adding a read-only guest the obvious way —
--  a row with role 'guest' — would have handed that guest write access to the
--  promotions, categories and jobs tables. A permission system that grants
--  more than it withholds is worse than none.
--
--  So is_staff() is REDEFINED to mean "may act": owner, admin or staff, never
--  guest. Every existing policy keeps working and keeps meaning what its
--  author intended. Read access for a guest comes from a separate predicate
--  and separate select policies.
--
--  WHAT CANNOT BE DONE FROM THE USER INTERFACE
--
--  Creating the first owner. The bootstrap stays hand-run SQL, because a
--  button that mints the first administrator is the button an attacker with
--  any account goes looking for. This migration only lets an EXISTING owner
--  hand out roles, and the database — not the page — is what enforces that.
--
--  RUN THIS ONCE in the Supabase SQL editor. It is idempotent.
-- ════════════════════════════════════════════════════════════════════════

-- ── The ladder ──────────────────────────────────────────────────────────
-- A table rather than an enum so the back office can list the roles with
-- their descriptions without a second copy of them living in TypeScript.
create table if not exists public.staff_roles (
  role        text primary key,
  rank        int  not null unique,
  label       text not null,
  description text not null
);

insert into public.staff_roles (role, rank, label, description) values
  ('owner', 40, 'Super admin',
   'Everything, including adding and removing people. Only an owner can change who has access.'),
  ('admin', 30, 'Admin',
   'Everything except managing people: orders, customers, content, categories, jobs and site settings.'),
  ('staff', 20, 'Staff',
   'The day-to-day work: orders, customers, content, categories and jobs. Cannot change site settings or people.'),
  ('guest', 10, 'Guest',
   'Read only. Can see the back office and everything in it, and cannot change anything.')
on conflict (role) do update
  set rank = excluded.rank,
      label = excluded.label,
      description = excluded.description;

alter table public.staff_roles enable row level security;

drop policy if exists staff_roles_read on public.staff_roles;
create policy staff_roles_read on public.staff_roles
  for select using (auth.uid() is not null);

-- ── Columns the old table did not have ──────────────────────────────────
alter table public.staff add column if not exists added_by   uuid references auth.users(id);
alter table public.staff add column if not exists updated_at timestamptz not null default now();
alter table public.staff add column if not exists note       text;

-- Anything already in the table that is not a known role becomes an owner
-- rather than becoming nothing. The only existing row is the real owner, and
-- a constraint that locks the one administrator out of their own site is a
-- migration that cannot be undone from the user interface.
update public.staff set role = 'owner'
where role not in (select role from public.staff_roles);

alter table public.staff drop constraint if exists staff_role_known;
alter table public.staff add constraint staff_role_known
  foreign key (role) references public.staff_roles(role);

-- ── Predicates ──────────────────────────────────────────────────────────

-- Anyone with a seat, including a guest. Read access.
create or replace function public.is_back_office()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;

-- MAY ACT. Deliberately excludes guest — see the header. Every policy written
-- before roles existed calls this, and every one of them meant "can change
-- things", so this is what it has to keep meaning.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.role in ('owner', 'admin', 'staff')
  );
$$;

create or replace function public.staff_role()
returns text language sql stable security definer set search_path = public as $$
  select s.role from public.staff s where s.user_id = auth.uid();
$$;

create or replace function public.staff_rank()
returns int language sql stable security definer set search_path = public as $$
  select coalesce(
    (select r.rank from public.staff s
       join public.staff_roles r on r.role = s.role
     where s.user_id = auth.uid()),
    0);
$$;

-- One place that answers "may I". The page hides what a role cannot do and
-- the action returns an honest error, but this is the answer both of them ask.
create or replace function public.staff_can(capability text)
returns boolean language sql stable security definer set search_path = public as $$
  select case capability
    when 'view'       then public.staff_rank() >= 10  -- guest and up
    when 'operate'    then public.staff_rank() >= 20  -- staff and up
    when 'settings'   then public.staff_rank() >= 30  -- admin and up
    when 'people'     then public.staff_rank() >= 40  -- owner only
    else false
  end;
$$;

-- ── Who may change who ──────────────────────────────────────────────────
alter table public.staff enable row level security;

drop policy if exists staff_self_read on public.staff;
drop policy if exists staff_back_office_read on public.staff;
create policy staff_back_office_read on public.staff
  for select using (public.is_back_office());

-- Only an owner writes here, and the database is what says so. A page that
-- hides the button is a page; this is the rule.
drop policy if exists staff_owner_write on public.staff;
create policy staff_owner_write on public.staff
  for all using (public.staff_can('people')) with check (public.staff_can('people'));

-- ── The two ways to lock everybody out, both refused ────────────────────
create or replace function public.staff_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owners_left int;
begin
  -- 1. An owner demoting or deleting THEMSELVES. Always a mistake, and the
  --    one mistake that cannot be undone from the user interface afterwards.
  if tg_op = 'DELETE' and old.user_id = auth.uid() then
    raise exception 'You cannot remove your own access. Ask another owner.';
  end if;

  if tg_op = 'UPDATE' and old.user_id = auth.uid() and new.role <> old.role then
    raise exception 'You cannot change your own role. Ask another owner.';
  end if;

  -- 2. Removing the last owner by any route, including one owner demoting
  --    another. A site with no owner has no way back except hand-run SQL.
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into owners_left
    from public.staff
    where role = 'owner' and user_id <> old.user_id;

    if owners_left = 0 then
      raise exception 'That is the last owner. Make somebody else an owner first.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_guard_trigger on public.staff;
create trigger staff_guard_trigger
  before update or delete on public.staff
  for each row execute function public.staff_guard();

-- ── Read access for a guest ─────────────────────────────────────────────
-- The write policies on these tables call is_staff() and therefore already
-- exclude guests. These add the read half so a guest can see the back office
-- without being able to change it.
drop policy if exists promotions_back_office_read on public.promotions;
create policy promotions_back_office_read on public.promotions
  for select using (public.is_back_office());

drop policy if exists categories_back_office_read on public.categories;
create policy categories_back_office_read on public.categories
  for select using (public.is_back_office());

drop policy if exists category_services_back_office_read on public.category_services;
create policy category_services_back_office_read on public.category_services
  for select using (public.is_back_office());

drop policy if exists jobs_back_office_read on public.jobs;
create policy jobs_back_office_read on public.jobs
  for select using (public.is_back_office());

-- The customer directory is the one read a guest does NOT get. It is every
-- email address on the site, and "read only" is not the same as "may see
-- everyone's contact details".
create or replace function public.staff_user_directory()
returns table (
  id                 uuid,
  email              text,
  last_sign_in_at    timestamptz,
  created_at         timestamptz,
  email_confirmed_at timestamptz
)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.email::text, u.last_sign_in_at, u.created_at, u.email_confirmed_at
  from auth.users u
  where public.is_staff();
$$;

revoke all on function public.staff_user_directory() from public;
revoke all on function public.staff_user_directory() from anon;
grant execute on function public.staff_user_directory() to authenticated;
