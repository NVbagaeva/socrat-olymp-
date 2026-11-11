-- Пробный вход на единой схеме кабинета.
--
-- До этой миграции схем было две: пробная (supabase/trial/auth_trial.sql —
-- свои profiles, регистрация из браузера по списку адресов) и схема
-- кабинета (миграции согласий, кабинета и онлайн-варианта — регистрация
-- только по коду приглашения через сервер сайта). Теперь схема одна —
-- схема кабинета, а пробный вход живёт на ней:
--
--   • регистрация из браузера открыта адресам из списка allowed_emails
--     (секрет GitHub ALLOWED_EMAILS → кнопка «Сервер: миграции» →
--     vault.secrets). Роль — ученик или репетитор — выбирается в форме.
--     Код приглашения работает по-прежнему и списка не требует;
--   • путь регистрации один: галочки согласий обязательны для всех,
--     триггер согласий не обходится;
--   • администратор назначается только на сервере (grant_admin, кнопка
--     «Сервер: миграции» с секретом ADMIN_EMAIL). Отметки bootstrap_admin
--     из формы больше нет: её мог бы прислать любой браузер;
--   • из пробной схемы перенесены коды комплектов (kits) и факты
--     онбординга в профиле;
--   • user_storage — данные браузера, перенесённые в аккаунт («Перенести
--     ваш прогресс с этого устройства в кабинет?»);
--   • анониму в схеме public не остаётся ни одной функции и ни одной
--     таблицы, кроме справочников.

/* ── Профиль: факты онбординга ─────────────────────────────────── */

alter table public.profiles
  -- Когда окно «Впервые здесь?» было отмечено просмотренным.
  add column welcome_seen_at timestamptz,
  -- Тур, который начинали или прошли на этом аккаунте (lib/onboarding.ts).
  add column tour_id text check (tour_id is null or char_length(tour_id) <= 40),
  add column tour_done boolean not null default false;

grant update (welcome_seen_at, tour_id, tour_done) on public.profiles to authenticated;

/* ── Список приглашённых ───────────────────────────────────────── */

-- Адрес в списке allowed_emails: адреса через запятую, регистр не важен.
-- Секрета нет или он пуст — в списке нет никого: лучше закрыто, чем
-- открыто по недосмотру. Самих адресов браузер не видит.
create or replace function public.email_allowed(p_email text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_allowed text;
  v_candidate text := lower(trim(coalesce(p_email, '')));
begin
  if v_candidate = '' then
    return false;
  end if;
  select decrypted_secret into v_allowed
  from vault.decrypted_secrets
  where name = 'allowed_emails'
  limit 1;
  if v_allowed is null then
    return false;
  end if;
  return v_candidate = any (
    select lower(trim(item)) from unnest(string_to_array(v_allowed, ',')) as item
  );
end $$;

/* ── Хук службы входа ──────────────────────────────────────────── */

-- «Before User Created» (GoTrue): срабатывает до создания пользователя.
-- Адреса нет в списке и кода приглашения нет — отказ invite_only, сайт
-- показывает «Регистрация пока по приглашению». Тот же отбор повторяет
-- триггер регистрации ниже: хук нужен ради понятного ответа, а не как
-- единственный замок.
--
-- Заодно хук запоминает IP запроса: его сообщает сама служба входа
-- (по заголовку от Caddy), подделать его из браузера нельзя. Триггер
-- согласий пишет этот IP в журнал согласий.
create schema if not exists auth_hooks;
revoke all on schema auth_hooks from public;

create table auth_hooks.signup_ips (
  email text primary key,
  ip inet not null,
  seen_at timestamptz not null default now()
);
comment on table auth_hooks.signup_ips is
  'IP последней попытки регистрации с этой почты; живёт сутки. Нужен журналу согласий.';

create or replace function auth_hooks.before_user_created(event jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user jsonb := coalesce(event -> 'user', '{}'::jsonb);
  v_meta jsonb := coalesce(v_user -> 'user_metadata', v_user -> 'raw_user_meta_data', '{}'::jsonb);
  v_email text := lower(trim(coalesce(v_user ->> 'email', '')));
  v_code text := coalesce(v_meta ->> 'invite_code', '');
  v_ip inet;
  v_invited boolean;
begin
  v_invited := v_code <> '' and exists (
    select 1 from public.invitations
     where code_hash = public.invite_hash(v_code)
       and used_at is null and revoked_at is null and expires_at > now());
  if v_email = '' or not (v_invited or public.email_allowed(v_email)) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'invite_only'));
  end if;

  begin
    v_ip := nullif(event -> 'metadata' ->> 'ip_address', '')::inet;
  exception when others then
    v_ip := null;
  end;
  delete from auth_hooks.signup_ips where seen_at < now() - interval '1 day';
  if v_ip is not null then
    insert into auth_hooks.signup_ips (email, ip) values (v_email, v_ip)
    on conflict (email) do update set ip = excluded.ip, seen_at = now();
  end if;
  return '{}'::jsonb;
end $$;

-- Вызывать может только служба входа.
grant usage on schema auth_hooks to supabase_auth_admin;
revoke execute on function auth_hooks.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function auth_hooks.before_user_created(jsonb) to supabase_auth_admin;

/* ── Согласия: IP — от службы входа, а не из формы ─────────────── */

-- То же, что в миграции согласий, кроме IP: поле signup_ip из данных
-- формы больше не читается (при регистрации из браузера его прислал бы
-- сам браузер), берётся IP, который запомнил хук. Нет хука (создание
-- пользователя сервером) — IP в журнале пустой.
create or replace function public.handle_new_user_consents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_version date := public.current_documents_version();
  v_ip inet;
  v_birth int;
  v_parent text := lower(nullif(trim(meta ->> 'parent_email'), ''));
begin
  if v_version is null then
    raise exception 'legal_editions пуста: регистрация невозможна без опубликованной редакции документов';
  end if;
  if coalesce(meta ->> 'accept_soglashenie', '') <> 'true'
     or coalesce(meta ->> 'accept_soglasie', '') <> 'true' then
    raise exception 'consents_required: без согласия с соглашением и на обработку ПДн регистрация невозможна'
      using errcode = 'check_violation';
  end if;
  if coalesce(meta ->> 'documents_version', '') <> v_version::text then
    raise exception 'outdated_documents: пользователь видел редакцию %, текущая %', meta ->> 'documents_version', v_version
      using errcode = 'check_violation';
  end if;

  select ip into v_ip from auth_hooks.signup_ips
   where email = lower(new.email) and seen_at > now() - interval '10 minutes';

  insert into public.consents (user_id, email, kind, version, ip)
  values (new.id, new.email, 'soglashenie', v_version, v_ip),
         (new.id, new.email, 'soglasie', v_version, v_ip);

  if meta ->> 'role' = 'student' then
    if coalesce(meta ->> 'birth_year', '') !~ '^[0-9]{4}$' then
      raise exception 'birth_year_required: ученик указывает год рождения' using errcode = 'check_violation';
    end if;
    v_birth := (meta ->> 'birth_year')::int;
    if public.parent_consent_needed(v_birth) then
      if v_parent is null or v_parent = lower(new.email) then
        raise exception 'parent_email_required: ученику младше 18 нужна почта родителя' using errcode = 'check_violation';
      end if;
      insert into public.parent_consents (user_id, birth_year, parent_email) values (new.id, v_birth, v_parent);
    end if;
  end if;
  return new;
end $$;

/* ── Регистрация: приглашение или список ───────────────────────── */

-- Два входа в одну дверь:
--   код приглашения (invite_code) — роль и связи берутся из приглашения;
--   адрес из списка allowed_emails — роль (ученик или репетитор) из формы.
-- Администратором через регистрацию стать нельзя: см. grant_admin.
create or replace function public.handle_new_user_invite()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(coalesce(nullif(trim(meta ->> 'name'), ''), split_part(new.email, '@', 1)), 80);
  v_grade smallint := case when coalesce(meta ->> 'grade', '') ~ '^[0-9]{1,2}$'
                           then (meta ->> 'grade')::smallint end;
  v_code text := coalesce(meta ->> 'invite_code', '');
  v_inv public.invitations;
  v_role public.app_role;
begin
  if v_code = '' then
    if not public.email_allowed(new.email) then
      raise exception 'invite_required: регистрация только по приглашению' using errcode = 'check_violation';
    end if;
    if coalesce(meta ->> 'role', '') not in ('student', 'tutor') then
      raise exception 'bad_role: при регистрации выбирают «ученик» или «репетитор»' using errcode = 'check_violation';
    end if;
    v_role := (meta ->> 'role')::public.app_role;
    insert into public.profiles (user_id, role, display_name, grade)
    values (new.id, v_role, v_name, case when v_role = 'student' then v_grade end);
    return new;
  end if;

  select * into v_inv from public.invitations
   where code_hash = public.invite_hash(v_code)
     and used_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then
    raise exception 'invite_required: регистрация только по действующему приглашению' using errcode = 'check_violation';
  end if;
  if (meta ->> 'role') is distinct from v_inv.role::text then
    raise exception 'role_mismatch: роль в форме не совпадает с приглашением' using errcode = 'check_violation';
  end if;

  insert into public.profiles (user_id, role, display_name, grade)
  values (new.id, v_inv.role, v_name, case when v_inv.role = 'student' then v_grade end);
  update public.invitations set used_at = now(), used_by = new.id where id = v_inv.id;
  if v_inv.tutor_id is not null then
    insert into public.tutor_students (tutor_id, user_id) values (v_inv.tutor_id, new.id);
  end if;
  if v_inv.class_id is not null then
    insert into public.class_members (class_id, user_id) values (v_inv.class_id, new.id);
  end if;
  return new;
end $$;

/* ── Администратор ─────────────────────────────────────────────── */

-- Назначить администратора по почте уже зарегистрированного аккаунта.
-- Вызывается только на сервере (bin/migrate.sh, секрет ADMIN_EMAIL):
-- ролям запросов функция закрыта. Администратор один — уникальный
-- индекс profiles_one_admin. Аккаунт перестаёт быть учеником или
-- репетитором, поэтому для него берут отдельный адрес.
create or replace function public.grant_admin(p_email text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'no_user: аккаунта с такой почтой ещё нет';
  end if;
  if exists (select 1 from public.tutor_students where tutor_id = v_id or user_id = v_id)
     or exists (select 1 from public.classes where tutor_id = v_id) then
    raise exception 'not_clean: у аккаунта уже есть ученики, репетиторы или классы — для администратора нужен отдельный адрес';
  end if;
  update public.profiles set role = 'admin' where user_id = v_id and role <> 'admin';
  return v_id;
end $$;

/* ── Коды комплектов репетитора ────────────────────────────────── */

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
comment on table public.kits is
  'Коды комплектов печатных листов, скачанных репетитором с этого аккаунта. '
  'Сами задания не хранятся: их восстанавливает адрес листа.';
create index kits_user_created on public.kits (user_id, created_at desc);

alter table public.kits enable row level security;
revoke all on public.kits from anon, authenticated;
grant select, insert, update, delete on public.kits to authenticated;
create policy kits_read_own on public.kits for select to authenticated
  using (user_id = auth.uid());
create policy kits_insert_own on public.kits for insert to authenticated
  with check (user_id = auth.uid());
create policy kits_update_own on public.kits for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy kits_delete_own on public.kits for delete to authenticated
  using (user_id = auth.uid());

/* ── Данные браузера в аккаунте ────────────────────────────────── */

-- Что сайт хранил в браузере гостя и что человек согласился перенести
-- в аккаунт: ключ хранилища → его значение как есть. Какие ключи
-- переносить, решает сайт (app/src/lib/progressImport). Ученик младше
-- 18 до согласия родителя сюда не пишет — как и остальной прогресс.
create table public.user_storage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (key ~ '^budetege:[a-z0-9:_-]{1,80}$'),
  value jsonb not null check (octet_length(value::text) <= 300000),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
comment on table public.user_storage is
  'Данные из браузера, перенесённые в аккаунт: ключ localStorage и его значение.';

-- Не больше 100 ключей на аккаунт: таблица — не файловое хранилище.
create or replace function public.check_user_storage_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.user_storage where user_id = new.user_id) >= 100 then
    raise exception 'storage_full: в аккаунте не больше 100 записей' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger user_storage_limit before insert on public.user_storage
  for each row execute function public.check_user_storage_limit();

create or replace function public.touch_user_storage()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger user_storage_touch before update on public.user_storage
  for each row execute function public.touch_user_storage();

alter table public.user_storage enable row level security;
revoke all on public.user_storage from anon, authenticated;
grant select, insert, delete on public.user_storage to authenticated;
-- Сайт пишет через upsert (insert … on conflict do update): ему нужно
-- право менять и ключ, и значение. Владелец строки (user_id) не меняется.
grant update (key, value) on public.user_storage to authenticated;
create policy user_storage_read_own on public.user_storage for select to authenticated
  using (user_id = auth.uid());
create policy user_storage_insert_own on public.user_storage for insert to authenticated
  with check (user_id = auth.uid() and public.can_save_progress(user_id));
create policy user_storage_update_own on public.user_storage for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_save_progress(user_id));
create policy user_storage_delete_own on public.user_storage for delete to authenticated
  using (user_id = auth.uid());

/* ── Права: ничего лишнего ─────────────────────────────────────── */

-- Таблицы согласий: на своём сервере у anon и authenticated по умолчанию
-- все права на новые таблицы public (infra/lite/db/01-schemas.sql).
-- Писать в них всё равно не дают правила RLS, но оставлять право
-- незачем: снимаем и выдаём только чтение.
revoke all on public.legal_editions, public.consents, public.parent_consents from anon, authenticated;
grant select on public.legal_editions to anon, authenticated;
grant select on public.consents to authenticated;
grant select (user_id, birth_year, parent_email, letter_sent_at, confirmed_at)
  on public.parent_consents to authenticated;

-- Функции: PostgreSQL по умолчанию разрешает вызывать новую функцию всем
-- (PUBLIC), а значит и анониму через /rest/v1/rpc. Анониму в public не
-- нужна ни одна. Вошедшему остаётся ровно то, что было доступно до
-- этой миграции.
do $$
declare
  f record;
  v_keep boolean;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
  loop
    v_keep := has_function_privilege('authenticated', f.sig, 'execute');
    execute format('revoke execute on function %s from public, anon', f.sig);
    if v_keep then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- Служебные функции этой миграции — никому снаружи.
revoke execute on function public.email_allowed(text) from public, anon, authenticated;
revoke execute on function public.grant_admin(text) from public, anon, authenticated, service_role;
revoke execute on function public.check_user_storage_limit() from public, anon, authenticated;
revoke execute on function public.touch_user_storage() from public, anon, authenticated;
revoke execute on function public.handle_new_user_consents() from public, anon, authenticated;
revoke execute on function public.handle_new_user_invite() from public, anon, authenticated;
