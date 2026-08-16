-- OBS Studio's Browser-Source hat keine eigene Login-Session (separater Browser-Kontext,
-- kein geteiltes localStorage) -- Host-Login dort ist unpraktikabel. Statt eines Passworts
-- bekommt die OBS-Ansicht einen Zugangs-Token in der URL. rooms_select ist bereits
-- "using (true)" (jeder eingeloggte Nutzer darf Räume lesen), die Kamera-/Punktedaten
-- dahinter ebenso -- der Token ist also kein neues Sicherheitsloch, sondern ersetzt nur den
-- bisherigen (in OBS nicht bedienbaren) Host-Login-Zwang für genau diese eine Ansicht.
alter table rooms add column obs_token text not null default gen_random_uuid()::text;
