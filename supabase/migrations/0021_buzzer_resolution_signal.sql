-- Gemeinsames Signal für Soundeffekte: alle Clients (Host/Kandidat/OBS) sollen den
-- "richtig"/"falsch"-Sound hören, nicht nur der Host, der den Knopf klickt. last_resolution_id
-- ist eine bei jedem Ereignis neue UUID (garantiert eine Änderung erkennbar, auch wenn zwei
-- Runden hintereinander z.B. beide "wrong" sind), last_resolution der Ereignistyp dazu.
alter table buzzer_state add column if not exists last_resolution text;
alter table buzzer_state add column if not exists last_resolution_id text;
