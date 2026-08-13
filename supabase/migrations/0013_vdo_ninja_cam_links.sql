-- Kamera-Anbindung per VDO.Ninja: statt eigener WebRTC-Infrastruktur trägt jede Person
-- ihren eigenen VDO.Ninja-Link ein (Host in rooms, Kandidat in players), der Client bettet
-- ihn per iframe ein. Keine neuen RLS-Policies nötig: rooms_update erlaubt dem Host bereits
-- das Ändern seines Raums, players_update erlaubt jedem Kandidaten das Ändern der eigenen Zeile.
alter table rooms add column vdo_url text;
alter table players add column vdo_url text;
