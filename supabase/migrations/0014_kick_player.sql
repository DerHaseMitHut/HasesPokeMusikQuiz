-- Host kann Kandidaten aus dem Raum entfernen (z.B. Testteilnehmer aufräumen).
grant delete on players to authenticated;

create policy players_delete on players
  for delete to authenticated
  using (is_host());

-- Ohne ON DELETE SET NULL würde das Kicken des aktuellen Buzzer-Gewinners an der
-- Fremdschlüssel-Constraint auf buzzer_state.winner_player_id scheitern.
alter table buzzer_state drop constraint buzzer_state_winner_player_id_fkey;
alter table buzzer_state add constraint buzzer_state_winner_player_id_fkey
  foreign key (winner_player_id) references players (id) on delete set null;
