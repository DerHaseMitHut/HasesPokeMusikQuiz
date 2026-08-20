-- Scoring läuft inzwischen komplett über die feste Regel (6/4/2 richtig, +1 für die anderen bei
-- falsch, manuelle Anpassung/wertlos durch den Host) statt über einen pro Song hinterlegten
-- Punktwert -- songs.points wurde nirgends mehr gelesen. songs.correct_answer wurde ebenfalls
-- nirgends im Spielablauf angezeigt (nur im alten Setup-Formular). Beide Felder raus.
drop view if exists songs_public;

alter table songs drop column if exists correct_answer;
alter table songs drop column if exists points;

create view songs_public as
select
  s.id,
  s.room_id,
  s.order_index,
  s.riddle_storage_path,
  s.revealed,
  case when s.revealed then s.title else null end as title,
  case when s.revealed then s.solution_storage_path else null end as solution_storage_path,
  case when p.current_song_id = s.id and p.hint1_shown then s.hint1 else null end as hint1,
  case when p.current_song_id = s.id and p.hint2_shown then s.hint2 else null end as hint2
from songs s
left join playback_state p on p.room_id = s.room_id;

grant select on songs_public to authenticated;
