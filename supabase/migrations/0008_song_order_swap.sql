-- Zwei unabhängige UPDATE-Statements zum Vertauschen zweier order_index-Werte würden
-- kurzzeitig gegen die Unique-Constraint (room_id, order_index) laufen, sobald der neue
-- Wert des einen Songs noch beim anderen Song steht. Diese Funktion macht den Tausch in
-- einer Transaktion über einen garantiert freien Zwischenwert (-1).
--
-- security invoker (Standard): läuft mit den Rechten des Aufrufers, die UPDATEs greifen
-- also ganz normal durch die bestehende songs_all_host-RLS-Policy — kein Bypass nötig.
create function swap_song_order(song_a uuid, song_b uuid) returns void
language plpgsql
as $$
declare
  order_a integer;
  order_b integer;
begin
  select order_index into order_a from songs where id = song_a;
  select order_index into order_b from songs where id = song_b;

  update songs set order_index = -1 where id = song_a;
  update songs set order_index = order_a where id = song_b;
  update songs set order_index = order_b where id = song_a;
end;
$$;

grant execute on function swap_song_order(uuid, uuid) to authenticated;
