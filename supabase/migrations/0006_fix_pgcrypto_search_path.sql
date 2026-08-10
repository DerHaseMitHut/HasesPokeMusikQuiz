-- Supabase installiert pgcrypto standardmäßig ins Schema "extensions", nicht "public".
-- verify_host_password() setzte search_path nur auf "public" und fand crypt()/gen_salt()
-- deshalb nicht. Fix: "extensions" zum search_path der Funktion hinzufügen.
create or replace function verify_host_password(pw text) returns boolean
language plpgsql
security definer
set search_path = public, extensions
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
