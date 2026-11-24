-- ============================================================
-- Ien — Storage bucket + policies for editor page images
--
-- Structure: images/{user-id}/{uuid}.{ext}
-- Same folder-scoped security model as avatars:
--   storage.foldername(name)[1] = auth.uid()::text
-- ============================================================

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;
-- Public bucket: images embedded in pages are read via public URL
-- (they're non-sensitive content the owner chose to insert). Writes
-- are strictly scoped to the uploader's own folder.

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read"
  on storage.objects for select
  using (bucket_id = 'images');

drop policy if exists "images_insert_own" on storage.objects;
create policy "images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "images_update_own" on storage.objects;
create policy "images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "images_delete_own" on storage.objects;
create policy "images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
