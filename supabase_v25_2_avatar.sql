-- RNDM Chat v25.2 — avatar upload/storage hardening
update storage.buckets
set public=true, file_size_limit=5242880,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','image/avif']
where id='avatars';

drop policy if exists avatar_upload on storage.objects;
drop policy if exists avatar_update on storage.objects;
drop policy if exists avatar_delete on storage.objects;

create policy avatar_upload on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy avatar_update on storage.objects for update to authenticated
using (bucket_id='avatars' and owner_id=(select auth.uid())::text)
with check (bucket_id='avatars' and owner_id=(select auth.uid())::text);

create policy avatar_delete on storage.objects for delete to authenticated
using (bucket_id='avatars' and owner_id=(select auth.uid())::text);
