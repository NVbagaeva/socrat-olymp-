#!/bin/sh
# Роли, которые в образе supabase/postgres есть из коробки, а в чистом
# PostgreSQL их нужно создать. Названия те же, что у Supabase: на них
# опираются миграции GoTrue, PostgREST и правила RLS в supabase/trial.
#
# Запускается один раз, при первом создании тома базы. Тот же файл
# создаёт роли и в пустой базе при проверке восстановления
# (actions/restore-check.sh): роли живут вне копии pg_dump.
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
alter role supabase_auth_admin set search_path = auth;
SQL
