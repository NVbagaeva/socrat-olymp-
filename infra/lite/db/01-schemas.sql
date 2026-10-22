-- Схема службы входа и права по умолчанию — как в Supabase.
-- Запускается один раз, при первом создании тома базы, после ролей.

create schema auth authorization supabase_auth_admin;
grant create on database postgres to supabase_auth_admin;

-- Доступ к public выдан ролям запросов, а что из него видно, решают
-- правила RLS каждой таблицы.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Функции auth.uid() и auth.jwt() создаст GoTrue; ролям запросов нужно
-- право их вызывать.
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges for role supabase_auth_admin in schema auth
  grant execute on functions to anon, authenticated, service_role;

-- Учёт применённых миграций (bin/migrate.sh).
create schema lite;
revoke all on schema lite from public;
create table lite.migrations (
  name text primary key,
  sha256 text not null,
  applied_at timestamptz not null default now()
);
