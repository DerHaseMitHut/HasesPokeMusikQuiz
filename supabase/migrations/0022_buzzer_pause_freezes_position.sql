-- Der Buzzer-Trigger (0020) hat playback_state bisher nur mit is_playing = false pausiert,
-- ohne position_seconds zu aktualisieren. expectedPositionSeconds() (Client) liefert im
-- pausierten Zustand direkt position_seconds zurück -- das war noch der Stand vom letzten
-- Laden/"Von vorne"/Play-Klick, nicht die tatsächliche Stelle, an der gerade gebuzzert wurde.
-- Ergebnis: das Video sprang beim Buzzern auf die alte (meist frühere) Position zurück, statt
-- exakt dort stehen zu bleiben.
--
-- Fix: dieselbe Formel wie der Client (position_seconds + verstrichene Zeit seit updated_at)
-- serverseitig berechnen und als neue position_seconds einfrieren, BEVOR is_playing auf false
-- gesetzt wird.
create or replace function claim_buzzer_winner() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update buzzer_state
     set winner_player_id = new.player_id,
         is_open = false,
         won_at = new.created_at
   where room_id = new.room_id
     and round_id = new.round_id
     and winner_player_id is null;

  get diagnostics affected = row_count;

  if affected > 0 then
    update playback_state
       set position_seconds = case
             when is_playing then position_seconds + extract(epoch from (now() - updated_at))
             else position_seconds
           end,
           is_playing = false
     where room_id = new.room_id;
  end if;

  return new;
end;
$$;
