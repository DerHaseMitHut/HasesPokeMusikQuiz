-- Grundschema: Räume, Spieler, Songs, Playback-/Buzzer-Status, Buzz-Log, App-Konfiguration.

create extension if not exists pgcrypto;

create table app_config (
  id boolean primary key default true,
  host_password_hash text not null,
  constraint app_config_singleton check (id)
);

create table hosts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  host_user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  display_name text not null,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  order_index integer not null,
  title text not null,
  correct_answer text not null,
  points integer not null default 100,
  riddle_storage_path text not null,
  solution_storage_path text not null,
  revealed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (room_id, order_index)
);

create table playback_state (
  room_id uuid primary key references rooms (id) on delete cascade,
  current_song_id uuid references songs (id),
  current_clip text not null default 'riddle' check (current_clip in ('riddle', 'solution')),
  is_playing boolean not null default false,
  position_seconds numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table buzzer_state (
  room_id uuid primary key references rooms (id) on delete cascade,
  round_id uuid not null default gen_random_uuid(),
  current_song_id uuid references songs (id),
  is_open boolean not null default false,
  winner_player_id uuid references players (id),
  opened_at timestamptz,
  won_at timestamptz
);

-- Append-only: jeder Buzz-Versuch, nicht nur der Gewinner (siehe 0003_buzzer_claim_trigger.sql).
create table buzz_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  round_id uuid not null,
  player_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index buzz_events_room_round_idx on buzz_events (room_id, round_id);

-- Jeder neue Raum bekommt sofort eine playback_state- und buzzer_state-Zeile,
-- damit die App nie einen fehlenden Zustand für einen existierenden Raum behandeln muss.
create function create_room_state() returns trigger
language plpgsql
as $$
begin
  insert into playback_state (room_id) values (new.id);
  insert into buzzer_state (room_id) values (new.id);
  return new;
end;
$$;

create trigger rooms_create_state
  after insert on rooms
  for each row
  execute function create_room_state();
