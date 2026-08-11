-- Der Video-Sync-Algorithmus berechnet die erwartete Wiedergabeposition aller Kandidaten
-- als position_seconds + (server_now() - updated_at). Das funktioniert nur korrekt, wenn
-- updated_at garantiert eine echte Server-Zeit ist — käme der Zeitstempel vom Client (Host),
-- würde jede Abweichung der Host-Uhr von der Serverzeit sich als systematischer Sync-Fehler
-- auf alle Kandidaten übertragen. Dieser Trigger überschreibt updated_at bei jedem UPDATE
-- immer mit der tatsächlichen DB-Zeit, unabhängig davon, was der Client sendet.
create function playback_state_touch() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger playback_state_touch_trigger
  before update on playback_state
  for each row
  execute function playback_state_touch();
