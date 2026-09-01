-- Resume storage: a private bucket where each user can only see and
-- write files under their own user_id prefix.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Authenticated users may upload under resumes/<their user id>/ only.
create policy "resumes_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "resumes_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "resumes_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "resumes_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );