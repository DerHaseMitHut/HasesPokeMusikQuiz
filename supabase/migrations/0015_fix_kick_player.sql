-- Robuste Neuauflage von 0014: dort standen die RLS-Policy UND die FK-Umbenennung im selben
-- SQL-Block. Wenn der DROP CONSTRAINT wegen falsch geratenem Constraint-Namen fehlschlägt,
-- rollt Supabase den GESAMTEN Block zurück -- inklusive der eigentlich schon erfolgreichen
-- Kick-Berechtigung. Hier beides idempotent und getrennt, damit ein Teilfehler nicht mehr
-- den funktionierenden Teil mit sich reißt.

drop policy if exists players_delete on players;
grant delete on players to authenticated;
create policy players_delete on players
  for delete to authenticated
  using (is_host());

-- FK-Constraint-Namen zur Laufzeit ermitteln statt zu raten.
do $$
declare
  fkey_name text;
begin
  select conname into fkey_name
  from pg_constraint
  where conrelid = 'buzzer_state'::regclass
    and confrelid = 'players'::regclass;

  if fkey_name is not null then
    execute format('alter table buzzer_state drop constraint %I', fkey_name);
  end if;

  alter table buzzer_state add constraint buzzer_state_winner_player_id_fkey
    foreign key (winner_player_id) references players (id) on delete set null;
end $$;
