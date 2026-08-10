-- Spoilerfreie Sicht auf songs für Kandidaten: Titel, Lösung und Lösungs-Clip
-- bleiben null, bis der Host den Song als "revealed" markiert (siehe
-- HostControlPanel-Aktion "Lösung zeigen"). Der Rätsel-Clip ist immer sichtbar,
-- da er vor der Auflösung abgespielt werden muss.
--
-- Ohne "security_invoker = true" (Postgres-Default) läuft die View mit den Rechten
-- ihres Eigentümers und umgeht damit strukturell die restriktive RLS-Policy auf der
-- songs-Basistabelle, statt sich nur auf Client-Disziplin zu verlassen.
create view songs_public as
select
  id,
  room_id,
  order_index,
  points,
  riddle_storage_path,
  revealed,
  case when revealed then title else null end as title,
  case when revealed then correct_answer else null end as correct_answer,
  case when revealed then solution_storage_path else null end as solution_storage_path
from songs;

grant select on songs_public to authenticated;
