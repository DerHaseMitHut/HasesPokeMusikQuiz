-- Faire, race-freie Buzzer-Auflösung: der erste committete Insert gewinnt.
--
-- security definer, weil die UPDATE-Policy auf buzzer_state nur den Host zulässt —
-- Kandidaten dürfen buzzer_state ausschließlich über diesen Weg (Insert in buzz_events)
-- indirekt verändern, nie direkt.
create function claim_buzzer_winner() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update buzzer_state
     set winner_player_id = new.player_id,
         is_open = false,
         won_at = new.created_at
   where room_id = new.room_id
     and round_id = new.round_id
     and winner_player_id is null;

  return new;
end;
$$;

create trigger buzz_events_claim_winner
  after insert on buzz_events
  for each row
  execute function claim_buzzer_winner();
