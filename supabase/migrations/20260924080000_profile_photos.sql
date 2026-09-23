-- Profile and cover photographs.
--
-- "Change Profile & Cover Pics" is the one row in the blueprint's Profile group
-- that had nothing behind it. This is what it needs.
--
-- WHY THE BUCKET IS PRIVATE
--
-- A public bucket serves every object at a guessable URL forever, to anyone,
-- with no way to revoke it. For a face that is the wrong default: a customer
-- who removes their photograph expects it to be gone, and on a public bucket
-- the old URL keeps working for anybody who saved it. Private plus a
-- short-lived signed URL means access is granted per request, by the server,
-- to somebody we have already authenticated — and deleting the row actually
-- takes the picture away. It costs one signing call per page load, on pages
-- that are already dynamic.
--
-- WHAT IS NOT HERE
--
-- No `is_public` column and no "who can see my photo" setting. LAWFIC has no
-- public profiles — nobody can look up another customer — so a visibility
-- control would be a switch with nothing on the other side of it. If public
-- profiles are ever built, that is when the switch is worth having, and it
-- should default to off.

alter table public.user_profiles
  add column if not exists avatar_path text not null default '',
  add column if not exists cover_path  text not null default '',
  add column if not exists photos_updated_at timestamptz;

comment on column public.user_profiles.avatar_path is
  'Path in the private "profile-photos" bucket: <user_id>/avatar-<n>.webp. Empty means no photo.';
comment on column public.user_profiles.cover_path is
  'Path in the private "profile-photos" bucket: <user_id>/cover-<n>.webp. Empty means no photo.';

-- Bounded so a path can never be a URL or a traversal attempt smuggled through
-- an upsert. The application builds these strings; this is the backstop.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_photo_paths'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_photo_paths check (
        length(avatar_path) <= 200
        and length(cover_path) <= 200
        and avatar_path not like '%..%'
        and cover_path not like '%..%'
      );
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  -- 3 MB. The client crops and re-encodes to WebP before it uploads, so a real
  -- photograph arrives at a few hundred kilobytes; this is the ceiling for
  -- anything that did not come through that path.
  3145728,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Each customer reads and writes only under their own user id, exactly as the
-- resumes bucket does. Every policy drops before it is created so the file can
-- be re-run without failing halfway.
drop policy if exists "profile_photos_select_own" on storage.objects;
create policy "profile_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
