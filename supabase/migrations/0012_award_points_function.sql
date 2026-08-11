-- Atomarer Score-Increment für die Punktevergabe im Host-Live-View. Ein einfaches
-- select-then-update vom Client wäre bei zwei schnell aufeinanderfolgenden Klicks
-- anfällig für einen verlorenen Update; diese Funktion macht den Increment in einem
-- Statement. security invoker (Standard): läuft mit den Rechten des Aufrufers, greift
-- also durch die bestehende players_update-Policy + players_guard_update-Trigger
-- (nur der Host darf score ändern).
create function award_points(player_id uuid, points integer) returns void
language sql
as $$
  update players set score = score + points where id = player_id;
$$;

grant execute on function award_points(uuid, integer) to authenticated;
