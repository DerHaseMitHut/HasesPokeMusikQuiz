-- Storage-Policies für den Bucket "song-videos" (Rätsel-/Lösungs-Clips).
-- Der Bucket selbst muss einmalig im Dashboard angelegt werden (Storage → New bucket
-- → Name "song-videos" → Public bucket: an), das kann keine Migration übernehmen.
--
-- "public" heißt hier nur: die getPublicUrl()-Downloads laufen ohne RLS-Check über den
-- öffentlichen Storage-Endpunkt. Hochladen/Ändern/Löschen bleibt trotzdem RLS-geschützt
-- und ausschließlich dem Host vorbehalten.
create policy song_videos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'song-videos' and public.is_host());

create policy song_videos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'song-videos' and public.is_host())
  with check (bucket_id = 'song-videos' and public.is_host());

create policy song_videos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'song-videos' and public.is_host());
