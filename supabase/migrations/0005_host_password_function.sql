-- Host-Login ohne echtes Account-System: ein gemeinsames Passwort, gehasht in
-- app_config, geprüft über diese security-definer-Funktion. Bei Erfolg wird die
-- aufrufende auth.uid() (aus dem anonymen Sign-in) dauerhaft in hosts eingetragen.
create function verify_host_password(pw text) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select (crypt(pw, host_password_hash) = host_password_hash)
    into ok
    from app_config
   where id = true;

  ok := coalesce(ok, false);

  if ok then
    insert into hosts (user_id) values (auth.uid())
    on conflict (user_id) do nothing;
  end if;

  return ok;
end;
$$;

revoke all on function verify_host_password(text) from public;
grant execute on function verify_host_password(text) to authenticated;

-- Für den Clock-Skew-Ausgleich beim Video-Sync (siehe src/lib/playbackSync.ts):
-- Client vergleicht server_now() mit dem eigenen Date.now(), um updated_at aus
-- playback_state korrekt in lokale Zeit zu übersetzen.
create function server_now() returns timestamptz
language sql
stable
as $$
  select now();
$$;

grant execute on function server_now() to authenticated;

-- Einmalig NACH dem Ausführen dieser Migration im Supabase SQL-Editor auszuführen
-- (niemals ins Repo committen, niemals über die App setzen):
--
--   insert into app_config (id, host_password_hash)
--   values (true, crypt('dein-passwort-hier', gen_salt('bf')));
