-- Aktiviert Supabase Realtime (Postgres Changes) für die drei Tabellen, die alle
-- Clients live mitverfolgen müssen: Punktestand, Song-/Clip-Wiedergabe, Buzzer-Status.
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table playback_state;
alter publication supabase_realtime add table buzzer_state;
