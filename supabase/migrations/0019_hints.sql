-- Bis zu 2 Tipps pro Runde, die der Host live einzeln einblenden kann.
alter table songs add column if not exists hint1 text;
alter table songs add column if not exists hint2 text;

-- Freigabe-Status pro Runde, analog zu songs.revealed für die Lösung -- eigene Flags statt an
-- revealed gekoppelt, weil Tipps schon während des Rätsel-Clips gezeigt werden, lange bevor
-- die Lösung dran ist. Reset bei jedem Rundenwechsel passiert in loadSong() (Client).
alter table playback_state add column if not exists hint1_shown boolean not null default false;
alter table playback_state add column if not exists hint2_shown boolean not null default false;

-- songs_public neu anlegen (Spalten hinzufügen reicht bei Views nicht, wenn sich die
-- Select-Liste ändert). Tipp-Text bleibt für Kandidaten null, bis der Host ihn für die AKTUELL
-- geladene Runde freischaltet -- daher der Join gegen playback_state statt eines einfachen
-- Song-Flags wie bei revealed.
drop view if exists songs_public;

create view songs_public as
select
  s.id,
  s.room_id,
  s.order_index,
  s.points,
  s.riddle_storage_path,
  s.revealed,
  case when s.revealed then s.title else null end as title,
  case when s.revealed then s.correct_answer else null end as correct_answer,
  case when s.revealed then s.solution_storage_path else null end as solution_storage_path,
  case when p.current_song_id = s.id and p.hint1_shown then s.hint1 else null end as hint1,
  case when p.current_song_id = s.id and p.hint2_shown then s.hint2 else null end as hint2
from songs s
left join playback_state p on p.room_id = s.room_id;

grant select on songs_public to authenticated;
