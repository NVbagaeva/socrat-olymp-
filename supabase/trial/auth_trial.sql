-- Пробный личный кабинет: профили, коды комплектов, удаление аккаунта,
-- регистрация только по списку адресов.
--
-- ТОЛЬКО ДЛЯ ПРОБНОГО ПРОЕКТА. Файл лежит не в supabase/migrations/
-- намеренно: его применяют вручную в SQL Editor пробного облачного
-- проекта (docs/AUTH.md, шаг 3), а CLI (`supabase db push`, `supabase
-- start`) и проверка test:soglasiya-sql его не трогают.
--
-- Почему отдельно. В supabase/migrations/ лежит миграция согласий
-- (20261011120000_soglasiya.sql, PR #170) — путь «настоящей» регистрации
-- сессии С-3: пользователя создаёт сервер сайта, открытая регистрация
-- выключена, триггер не даёт создать пользователя без галочек согласия.
-- Пробный вход регистрирует из браузера без галочек, поэтому в одном
-- проекте с той миграцией он работать не будет — и не должен: когда
-- придёт С-3, пробная регистрация уступает место серверной.
--
-- Все таблицы под RLS: человек видит и меняет только свои строки.
-- Секретов здесь нет; список разрешённых адресов живёт в Vault
-- проекта под именем allowed_emails, в репозиторий не попадает.

-- ── Роли ──────────────────────────────────────────────────────────

create type public.user_role as enum ('student', 'tutor');

-- ── Профили ───────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  role public.user_role not null default 'student',
  -- Факты онбординга, перенесённые из браузера (lib/onboarding.ts).
  welcome_seen_at timestamptz,
  tour_id text check (tour_id is null or char_length(tour_id) <= 40),
  tour_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Профиль аккаунта: имя, роль, факты онбординга. 1:1 с auth.users.';

alter table public.profiles enable row level security;

create policy "profiles: читать свой" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: менять свой" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Вставку делает триггер, удаление — каскад от auth.users:
-- политик на insert и delete нет намеренно.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Профиль создаётся вместе с пользователем: имя и роль — из данных
-- регистрации (user_metadata), роль по умолчанию — ученик.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80),
    case when new.raw_user_meta_data ->> 'role' = 'tutor' then 'tutor'::public.user_role
         else 'student'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Коды комплектов репетитора ────────────────────────────────────

create table public.kits (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code text not null check (code ~ '^[0-9A-Z]{4}-[0-9A-Z]{2}$'),
  scope text not null check (char_length(scope) <= 4),
  section text not null default '' check (char_length(section) <= 120),
  student_href text not null check (char_length(student_href) <= 2000),
  teacher_href text not null check (char_length(teacher_href) <= 2000),
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

comment on table public.kits is 'Коды комплектов печатных листов, скачанных репетитором с этого аккаунта. Сами задания не хранятся: их восстанавливает адрес листа.';

create index kits_user_created on public.kits (user_id, created_at desc);

alter table public.kits enable row level security;

create policy "kits: читать свои" on public.kits
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "kits: добавлять свои" on public.kits
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "kits: обновлять свои" on public.kits
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "kits: удалять свои" on public.kits
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── Удаление аккаунта ─────────────────────────────────────────────

-- Человек удаляет только себя. Функция работает от владельца (postgres),
-- которому можно удалять из auth.users; профиль и комплекты уходят
-- каскадом. Сессии удалённого пользователя перестают действовать.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ── Регистрация по списку ─────────────────────────────────────────

-- Хук «Before User Created» службы входа (Authentication → Hooks).
-- Срабатывает до создания пользователя и смотрит адрес в секрете Vault
-- allowed_emails: адреса через запятую, регистр не важен. Нет в
-- списке — создание отменяется с пометкой invite_only; сайт показывает
-- «Регистрация пока по приглашению». Самих адресов браузер не видит.
--
-- Секрет не найден — регистрация закрыта для всех: лучше закрыто,
-- чем открыто по недосмотру.
create schema if not exists auth_hooks;

create or replace function auth_hooks.before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed text;
  candidate text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
  rejected jsonb := jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'invite_only')
  );
begin
  select decrypted_secret into allowed
  from vault.decrypted_secrets
  where name = 'allowed_emails'
  limit 1;

  if allowed is null or candidate = '' then
    return rejected;
  end if;

  if candidate = any (
    select lower(trim(item)) from unnest(string_to_array(allowed, ',')) as item
  ) then
    return '{}'::jsonb;
  end if;

  return rejected;
end;
$$;

-- Вызывать может только служба входа.
grant usage on schema auth_hooks to supabase_auth_admin;
grant execute on function auth_hooks.before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function auth_hooks.before_user_created(jsonb) from public, anon, authenticated;
