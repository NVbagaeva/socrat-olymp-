-- Минимальная заглушка Supabase для проверки миграций на голом PostgreSQL:
-- схема auth с таблицей users, auth.uid() и три роли. В настоящем Supabase
-- всё это уже есть — файл туда не применяется.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
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
