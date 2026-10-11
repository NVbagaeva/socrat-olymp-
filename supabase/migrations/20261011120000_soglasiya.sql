-- Согласия с правовыми документами (152-ФЗ).
--
-- Что здесь:
--   legal_editions   — редакции документов; текущая — самая поздняя дата;
--   consents         — журнал согласий: кто, что, какой редакции, когда, с какого IP;
--   parent_consents  — ученик младше 18: год рождения, почта родителя, подтверждение;
--   функции регистрации, повторного согласия, письма родителю, выгрузки и удаления.
--
-- Регистрация идёт через сервер сайта (сессия С-3, docs/CABINET_UX_SPEC.md):
-- он создаёт пользователя через admin API и кладёт в raw_user_meta_data
-- отметки галочек, редакцию документов и IP запроса. Открытая регистрация
-- в GoTrue выключена, поэтому подделать IP из браузера нельзя. Триггер
-- ниже не даст создать пользователя без обеих галочек текущей редакции.
--
-- Удаление аккаунта сносит всё, что ссылается на auth.users (ON DELETE
-- CASCADE), кроме consents: у журнала нет внешнего ключа на пользователя,
-- записи получают account_deleted_at и через три года удаляются
-- purge_old_consents() (политика, п. 6.4). Новые таблицы с данными
-- пользователя заводятся с user_id … references auth.users on delete cascade —
-- проверка supabase/tests/soglasiya.test.sql ловит таблицу без каскада.

create type public.consent_kind as enum ('soglashenie', 'soglasie', 'soglasie_roditelya');

create table public.legal_editions (
  version date primary key,
  published_at timestamptz not null default now()
);
comment on table public.legal_editions is
  'Редакции правовых документов. version = дата из app/src/content/legal/operator.json. '
  'Новая редакция: добавить строку — при следующем входе пользователи снова отметят галочки.';

create or replace function public.current_documents_version()
returns date
language sql stable
set search_path = ''
as $$ select max(version) from public.legal_editions $$;

create table public.consents (
  id bigint generated always as identity primary key,
  -- Без внешнего ключа: запись переживает удаление аккаунта.
  user_id uuid not null,
  -- Почта на момент согласия: после удаления аккаунта по ней подтверждается,
  -- кто давал согласие.
  email text not null,
  kind public.consent_kind not null,
  version date not null references public.legal_editions (version),
  accepted_at timestamptz not null default now(),
  ip inet,
  -- Только для soglasie_roditelya: кто подтвердил.
  parent_email text,
  account_deleted_at timestamptz,
  constraint consents_parent_email check ((kind = 'soglasie_roditelya') = (parent_email is not null))
);
create index consents_user_idx on public.consents (user_id, kind, version);
create index consents_purge_idx on public.consents (account_deleted_at) where account_deleted_at is not null;
comment on table public.consents is
  'Журнал согласий. Хранится 3 года после удаления аккаунта (политика, п. 6.4).';

create table public.parent_consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_year smallint not null,
  parent_email text not null,
  -- sha256 одноразового токена из письма; сам токен не хранится.
  token_hash text,
  letter_sent_at timestamptz,
  confirmed_at timestamptz,
  confirm_ip inet
);
comment on table public.parent_consents is
  'Ученики младше 18: до confirmed_at прогресс не сохраняется (can_save_progress).';

alter table public.legal_editions enable row level security;
alter table public.consents enable row level security;
alter table public.parent_consents enable row level security;

-- Читать — только своё. Писать — только через функции ниже.
create policy legal_editions_read on public.legal_editions for select to anon, authenticated using (true);
create policy consents_read_own on public.consents for select to authenticated using (user_id = auth.uid());
create policy parent_consents_read_own on public.parent_consents for select to authenticated using (user_id = auth.uid());
-- Хеш токена своему владельцу не показываем.
revoke select on public.parent_consents from authenticated;
grant select (user_id, birth_year, parent_email, letter_sent_at, confirmed_at) on public.parent_consents to authenticated;

-- Совершеннолетие по году рождения: в год 18-летия считаем ученика младше
-- (день рождения неизвестен) — как parentConsentNeeded в app/src/lib/account/consents.ts.
create or replace function public.parent_consent_needed(p_birth_year int, p_today date default current_date)
returns boolean
language sql immutable
as $$ select extract(year from p_today)::int - p_birth_year <= 18 $$;

-- Регистрация. raw_user_meta_data от сервера сайта:
--   { "role": "student"|"tutor", "name": "…", "documents_version": "ГГГГ-ММ-ДД",
--     "accept_soglashenie": true, "accept_soglasie": true, "signup_ip": "…",
--     "birth_year": 2010, "parent_email": "…" }
create or replace function public.handle_new_user_consents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_version date := public.current_documents_version();
  v_ip inet := nullif(meta ->> 'signup_ip', '')::inet;
  v_birth int := nullif(meta ->> 'birth_year', '')::int;
  v_parent text := lower(nullif(trim(meta ->> 'parent_email'), ''));
begin
  if v_version is null then
    raise exception 'legal_editions пуста: регистрация невозможна без опубликованной редакции документов';
  end if;
  if coalesce((meta ->> 'accept_soglashenie')::boolean, false) is not true
     or coalesce((meta ->> 'accept_soglasie')::boolean, false) is not true then
    raise exception 'consents_required: без согласия с соглашением и на обработку ПДн регистрация невозможна'
      using errcode = 'check_violation';
  end if;
  if (meta ->> 'documents_version')::date is distinct from v_version then
    raise exception 'outdated_documents: пользователь видел редакцию %, текущая %', meta ->> 'documents_version', v_version
      using errcode = 'check_violation';
  end if;

  insert into public.consents (user_id, email, kind, version, ip)
  values (new.id, new.email, 'soglashenie', v_version, v_ip),
         (new.id, new.email, 'soglasie', v_version, v_ip);

  if meta ->> 'role' = 'student' then
    if v_birth is null then
      raise exception 'birth_year_required: ученик указывает год рождения' using errcode = 'check_violation';
    end if;
    if public.parent_consent_needed(v_birth) then
      if v_parent is null or v_parent = lower(new.email) then
        raise exception 'parent_email_required: ученику младше 18 нужна почта родителя' using errcode = 'check_violation';
      end if;
      insert into public.parent_consents (user_id, birth_year, parent_email) values (new.id, v_birth, v_parent);
    end if;
  end if;
  return new;
end $$;

create trigger on_auth_user_created_consents
  after insert on auth.users
  for each row execute function public.handle_new_user_consents();

-- Каких документов текущей редакции пользователь ещё не принял.
-- Не пусто — сайт показывает окно «Документы обновлены».
create or replace function public.documents_to_accept()
returns public.consent_kind[]
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(k order by k), '{}')
  from unnest(array['soglashenie', 'soglasie']::public.consent_kind[]) as k
  where not exists (
    select 1 from public.consents c
    where c.user_id = auth.uid() and c.kind = k and c.version = public.current_documents_version()
  )
$$;

-- Окно «Документы обновлены»: обе галочки заново. IP передаёт сервер сайта.
create or replace function public.accept_documents(p_user_id uuid, p_version date, p_ip inet)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if p_version is distinct from public.current_documents_version() then
    raise exception 'outdated_documents: принять можно только текущую редакцию' using errcode = 'check_violation';
  end if;
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then
    raise exception 'no_user';
  end if;
  insert into public.consents (user_id, email, kind, version, ip)
  select p_user_id, v_email, k, p_version, p_ip
  from unnest(array['soglashenie', 'soglasie']::public.consent_kind[]) as k
  where not exists (
    select 1 from public.consents c where c.user_id = p_user_id and c.kind = k and c.version = p_version
  );
end $$;

-- Новый токен для письма родителю. Возвращает сам токен — сервер вставит его
-- в ссылку и отправит письмо. Не чаще раза в минуту: иначе исключение too_soon.
create or replace function public.issue_parent_token(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.parent_consents;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  select * into v_row from public.parent_consents where user_id = p_user_id for update;
  if not found then
    raise exception 'no_parent_consent: родитель для этого аккаунта не нужен';
  end if;
  if v_row.confirmed_at is not null then
    raise exception 'already_confirmed';
  end if;
  if v_row.letter_sent_at is not null and v_row.letter_sent_at > now() - interval '1 minute' then
    raise exception 'too_soon: повторное письмо — не чаще раза в минуту' using errcode = 'P0001';
  end if;
  update public.parent_consents
     set token_hash = encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
         letter_sent_at = now()
   where user_id = p_user_id;
  return v_token;
end $$;

-- Родитель перешёл по ссылке. Записывает согласие родителя в журнал.
create or replace function public.confirm_parent_consent(p_token text, p_ip inet)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.parent_consents;
  v_email text;
begin
  select * into v_row from public.parent_consents
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
   for update;
  if not found then
    raise exception 'bad_token: ссылка устарела — попросите ученика отправить письмо ещё раз';
  end if;
  select email into v_email from auth.users where id = v_row.user_id;
  update public.parent_consents
     set confirmed_at = now(), confirm_ip = p_ip, token_hash = null
   where user_id = v_row.user_id;
  insert into public.consents (user_id, email, kind, version, ip, parent_email)
  values (v_row.user_id, v_email, 'soglasie_roditelya', public.current_documents_version(), p_ip, v_row.parent_email);
  return v_row.user_id;
end $$;

-- Можно ли сохранять прогресс. Подключается в политиках RLS таблиц
-- прогресса: with check (user_id = auth.uid() and public.can_save_progress(user_id)).
create or replace function public.can_save_progress(p_user_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.parent_consents where user_id = p_user_id and confirmed_at is null
  )
$$;

-- «Выгрузить мои данные»: аккаунт, согласия и строки всех таблиц public
-- с колонкой user_id, которые ссылаются на auth.users. Новые таблицы
-- попадают в выгрузку сами. Служебные колонки (хеши токенов) не выгружаются.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
  v_rows jsonb;
  t record;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select jsonb_build_object(
           'exported_at', now(),
           'account', jsonb_build_object(
             'id', u.id, 'email', u.email, 'created_at', u.created_at,
             'name', u.raw_user_meta_data ->> 'name', 'role', u.raw_user_meta_data ->> 'role'),
           'consents', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'kind', c.kind, 'version', c.version, 'accepted_at', c.accepted_at,
                      'ip', host(c.ip), 'parent_email', c.parent_email) order by c.accepted_at)
             from public.consents c where c.user_id = v_uid), '[]'::jsonb))
    into v_result
    from auth.users u where u.id = v_uid;

  for t in
    select distinct tc.table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
      and ccu.table_schema = 'auth' and ccu.table_name = 'users' and kcu.column_name = 'user_id'
    order by tc.table_name
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(x) - ''token_hash''), ''[]''::jsonb) from public.%I x where x.user_id = $1',
      t.table_name)
      into v_rows using v_uid;
    v_result := v_result || jsonb_build_object(t.table_name, v_rows);
  end loop;
  return v_result;
end $$;

-- «Удалить аккаунт»: всё каскадом от auth.users, журнал согласий остаётся
-- с отметкой account_deleted_at.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  update public.consents set account_deleted_at = now() where user_id = v_uid and account_deleted_at is null;
  delete from auth.users where id = v_uid;
end $$;

-- Раз в сутки (pg_cron): записи о согласии старше трёх лет после удаления аккаунта.
create or replace function public.purge_old_consents()
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.consents where account_deleted_at < now() - interval '3 years' returning 1
  )
  select count(*)::int from gone
$$;

-- Кто что может вызывать. Функции, которые получают IP или выдают токен,
-- вызывает только сервер сайта (service_role): иначе ученик сам получил бы
-- токен и подтвердил согласие за родителя.
revoke execute on function public.accept_documents(uuid, date, inet) from public, anon, authenticated;
revoke execute on function public.issue_parent_token(uuid) from public, anon, authenticated;
revoke execute on function public.confirm_parent_consent(text, inet) from public, anon, authenticated;
revoke execute on function public.purge_old_consents() from public, anon, authenticated;
revoke execute on function public.handle_new_user_consents() from public, anon, authenticated;
grant execute on function public.accept_documents(uuid, date, inet) to service_role;
grant execute on function public.issue_parent_token(uuid) to service_role;
grant execute on function public.confirm_parent_consent(text, inet) to service_role;
grant execute on function public.purge_old_consents() to service_role;

revoke execute on function public.documents_to_accept() from public, anon;
revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.documents_to_accept() to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.can_save_progress(uuid) to authenticated, service_role;
