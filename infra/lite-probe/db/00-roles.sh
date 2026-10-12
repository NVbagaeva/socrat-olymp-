#!/bin/sh
# Роли, которые в образе supabase/postgres есть из коробки, а в чистом
# PostgreSQL их нужно создать. Названия те же, что у Supabase: на них
# опираются миграции GoTrue, PostgREST и правила RLS в supabase/trial.
#
# Запускается один раз, при первом создании тома базы.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v auth_admin_pass="$AUTH_ADMIN_PASSWORD" \
  -v authenticator_pass="$AUTHENTICATOR_PASSWORD" <<'SQL'
-- Роли запросов: под ними PostgREST выполняет SQL по JWT.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- PostgREST входит как authenticator и переключается на роль из JWT.
create role authenticator login noinherit password :'authenticator_pass';
grant anon, authenticated, service_role to authenticator;

-- Служба входа (GoTrue) владеет схемой auth и сама ведёт её миграции.
create role supabase_auth_admin login noinherit createrole password :'auth_admin_pass';
create schema auth authorization supabase_auth_admin;
grant create on database postgres to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;

-- Как в Supabase: доступ к public выдан ролям запросов, а что из него
-- видно, решают правила RLS каждой таблицы.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Функции auth.uid() и auth.jwt() создаст GoTrue; ролям запросов нужно
-- право их вызывать.
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges for role supabase_auth_admin in schema auth
  grant execute on functions to anon, authenticated, service_role;
SQL
