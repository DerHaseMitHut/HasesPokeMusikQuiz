-- create_room_state() lief mit den Rechten des aufrufenden Hosts, aber für
-- playback_state/buzzer_state existiert keine INSERT-Policy (nur SELECT/UPDATE) —
-- die Transaktion (inkl. der eigentlichen rooms-Insert) scheiterte deshalb komplett.
-- security definer: die Zeilen werden ausschließlich vom System angelegt, nie direkt
-- vom Client, daher kein INSERT-Grant/Policy für authenticated nötig.
create or replace function create_room_state() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into playback_state (room_id) values (new.id);
  insert into buzzer_state (room_id) values (new.id);
  return new;
end;
$$;
