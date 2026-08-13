-- Host-einstellbare Layout-Größen (Kamera-Größe, Video-Höhe, Sidebar-Breiten), die live an
-- Teilnehmer- und OBS-Ansicht übertragen werden. Seitenverhältnisse bleiben immer erhalten,
-- weil nur jeweils eine Basisgröße gespeichert wird (Kamera-Breite -> Höhe folgt aus 16:9,
-- Video-Maximalhöhe -> Breite folgt aus 55:29) -- die App erzwingt das, nicht die DB.
alter table rooms add column layout jsonb not null default '{}'::jsonb;

-- Für Live-Sync in Kandidaten-/OBS-Ansicht, analog zu 0010_enable_realtime.sql.
alter publication supabase_realtime add table rooms;
