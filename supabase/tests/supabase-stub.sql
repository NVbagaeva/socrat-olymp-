-- Минимальная заглушка Supabase для проверки миграций на голом PostgreSQL:
-- схема auth с таблицей users, auth.uid() и три роли. В настоящем Supabase
-- всё это уже есть — файл туда не применяется.
-- Роли общие на весь сервер: вторая база проверок их уже застаёт.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  raw_user_meta_data jsonb,
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
alter default privileges in schema public grant select on tables to anon, authenticated, service_role;

-- Список приглашённых: та же витрина, что на сервере
-- (infra/lite/db/10-vault-shim.sql).
create schema vault;
revoke all on schema vault from public;
create table vault.secrets (
  name text primary key,
  secret text not null,
  updated_at timestamptz not null default now()
);
create view vault.decrypted_secrets as
  select name, secret as decrypted_secret from vault.secrets;
