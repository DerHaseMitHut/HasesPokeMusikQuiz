-- RLS: Host-Erkennung, Tabellenrechte, Policies, Schutz vor Score-Manipulation durch Kandidaten.

-- security definer + fixer search_path, damit die Funktion die RLS der hosts-Tabelle
-- umgeht (sonst würde jede Policy, die is_host() aufruft, in eine Rekursion/Sperre laufen)
-- und niemand sie durch eine eigene Funktion gleichen Namens im Schema public kapern kann.
create function is_host() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from hosts where user_id = auth.uid());
$$;

grant execute on function is_host() to authenticated;

-- Tabellenrechte: RLS filtert Zeilen, aber ohne GRANT gäbe es gar keinen Zugriff.
grant select, insert, update, delete on rooms to authenticated;
grant select, insert, update on players to authenticated;
grant select, insert, update, delete on songs to authenticated;
grant select, update on playback_state to authenticated;
grant select, update on buzzer_state to authenticated;
grant select, insert on buzz_events to authenticated;

-- ROOMS: jeder eingeloggte Nutzer darf Räume lesen (Kandidat muss per Code den Raum finden),
-- nur der Host darf Räume anlegen/ändern/löschen.
alter table rooms enable row level security;

create policy rooms_select on rooms
  for select to authenticated
  using (true);

create policy rooms_insert on rooms
  for insert to authenticated
  with check (is_host() and host_user_id = auth.uid());

create policy rooms_update on rooms
  for update to authenticated
  using (is_host())
  with check (is_host());

create policy rooms_delete on rooms
  for delete to authenticated
  using (is_host());

-- PLAYERS: alle sehen das Scoreboard; Kandidaten dürfen nur die eigene Zeile anlegen/ändern
-- (z.B. Namensänderung), der Host darf jede Zeile ändern (Punkte). Das Ändern von `score`
-- durch Nicht-Hosts wird zusätzlich per Trigger blockiert, da RLS allein keine
-- spaltenscharfe Prüfung erlaubt (siehe players_guard_update Trigger unten).
alter table players enable row level security;

create policy players_select on players
  for select to authenticated
  using (true);

create policy players_insert on players
  for insert to authenticated
  with check (user_id = auth.uid());

create policy players_update on players
  for update to authenticated
  using (user_id = auth.uid() or is_host())
  with check (user_id = auth.uid() or is_host());

create function players_guard_update() returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id darf nicht geändert werden';
  end if;
  if new.score is distinct from old.score and not is_host() then
    raise exception 'Nur der Host darf Punkte vergeben';
  end if;
  return new;
end;
$$;

create trigger players_guard_update_trigger
  before update on players
  for each row
  execute function players_guard_update();

-- SONGS: ausschließlich der Host darf die Basistabelle lesen/schreiben (enthält Titel/Lösung).
-- Kandidaten greifen nur über die songs_public-View zu (0004_songs_public_view.sql).
alter table songs enable row level security;

create policy songs_all_host on songs
  for all to authenticated
  using (is_host())
  with check (is_host());

-- PLAYBACK_STATE / BUZZER_STATE: alle lesen (für Sync), nur der Host schreibt direkt.
-- buzzer_state wird für Kandidaten indirekt über den buzz_events-Trigger aktualisiert
-- (security definer, siehe 0003_buzzer_claim_trigger.sql), nicht über diese Policy.
alter table playback_state enable row level security;

create policy playback_state_select on playback_state
  for select to authenticated
  using (true);

create policy playback_state_update on playback_state
  for update to authenticated
  using (is_host())
  with check (is_host());

alter table buzzer_state enable row level security;

create policy buzzer_state_select on buzzer_state
  for select to authenticated
  using (true);

create policy buzzer_state_update on buzzer_state
  for update to authenticated
  using (is_host())
  with check (is_host());

-- BUZZ_EVENTS: ein Kandidat darf nur für die eigene player_id und nur während einer
-- offenen Runde buzzern. Kein UPDATE/DELETE für irgendwen (append-only Log).
alter table buzz_events enable row level security;

create policy buzz_events_select on buzz_events
  for select to authenticated
  using (true);

create policy buzz_events_insert on buzz_events
  for insert to authenticated
  with check (
    exists (
      select 1 from players p
      where p.id = player_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from buzzer_state b
      where b.room_id = buzz_events.room_id
        and b.round_id = buzz_events.round_id
        and b.is_open = true
    )
  );

-- APP_CONFIG: kein direkter Client-Zugriff, nur über verify_host_password()
-- (security definer, 0005_host_password_function.sql).
alter table app_config enable row level security;

-- HOSTS: niemand darf schreiben (nur die security-definer-Funktion verify_host_password()),
-- aber ein Client darf lesen, ob die eigene user_id als Host eingetragen ist — das ist die
-- Grundlage für den Client-seitigen "bin ich Host?"-Check nach dem Login.
alter table hosts enable row level security;
grant select on hosts to authenticated;

create policy hosts_select_self on hosts
  for select to authenticated
  using (user_id = auth.uid());
