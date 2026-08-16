-- Host-hochladbare Kandidaten-Icons (PNG), rund zugeschnitten per CSS in CamTile (object-cover
-- + rounded-full), kein serverseitiges Bild-Processing nötig.
alter table players add column if not exists avatar_storage_path text;

-- Bucket "player-avatars" muss einmalig im Dashboard angelegt werden (Storage → New bucket →
-- Name "player-avatars" → Public bucket: an), analog zu "song-videos" (0007_storage_policies.sql).
create policy player_avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'player-avatars' and public.is_host());

create policy player_avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'player-avatars' and public.is_host())
  with check (bucket_id = 'player-avatars' and public.is_host());

create policy player_avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'player-avatars' and public.is_host());
