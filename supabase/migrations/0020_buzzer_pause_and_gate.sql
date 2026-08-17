-- Zwei Verhaltensänderungen für den Buzzer, beide im bereits bestehenden security-definer-
-- Trigger-Mechanismus (0003_buzzer_claim_trigger.sql), da Kandidaten weder playback_state
-- direkt ändern noch buzz_events-Inserts selbst validieren dürfen.

-- 1) Wer zuerst buzzert, pausiert für alle das Video (nur beim tatsächlichen Gewinn der Runde,
-- nicht bei jedem Versuch -- daher die row_count-Prüfung).
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
    update playback_state set is_playing = false where room_id = new.room_id;
  end if;

  return new;
end;
$$;

-- 2) Während der Lösungs-Clip läuft, ist Buzzern nicht möglich -- der Insert wird abgelehnt,
-- bevor der obige Trigger überhaupt greift.
create function guard_buzz_event() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from playback_state
    where room_id = new.room_id and current_clip = 'solution'
  ) then
    raise exception 'Buzzern ist während der Lösung nicht möglich';
  end if;
  return new;
end;
$$;

create trigger buzz_events_guard_solution
  before insert on buzz_events
  for each row
  execute function guard_buzz_event();
