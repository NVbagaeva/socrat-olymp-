-- Открытая регистрация и доступ по тарифу (этап 1 продаж, docs/AUTH.md).
--
-- 1. Регистрация для всех. В списке allowed_emails (секрет ALLOWED_EMAILS,
--    кнопка «Сервер: миграции») появляется значение «*»: с ним
--    зарегистрироваться может любой взрослый с почтой российского сервиса
--    (отбор по домену — миграция 20261113120000, не меняется). Убрали «*»
--    из секрета и нажали «Миграции» — регистрация снова по списку, без
--    выкладки сайта.
--
-- 2. Ученики младше 18 по «*» не регистрируются: письма родителю ещё нет,
--    и такой ученик не смог бы сохранять прогресс. Ученик, чей адрес
--    записан в список явно, и ученик с кодом приглашения регистрируются
--    как раньше — с почтой родителя.
--
-- 3. Доступ по тарифу — таблица dostup: тариф и дата окончания. Пишет
--    в неё только база: пробный доступ включается сам, когда человек
--    подтвердил почту; оплаченный — функцией администратора (этап 4).
--    Браузер видит только свою строку и изменить её не может.

/* ── 1–2. Кто может зарегистрироваться ─────────────────────────── */

-- В списке есть «*»: регистрация открыта для взрослых.
create or replace function public.signup_open()
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_allowed text;
begin
  select decrypted_secret into v_allowed
  from vault.decrypted_secrets
  where name = 'allowed_emails'
  limit 1;
  return coalesce('*' = any (
    select trim(item) from unnest(string_to_array(v_allowed, ',')) as item
  ), false);
end $$;

revoke execute on function public.signup_open() from public, anon, authenticated;

-- Ученик младше 18 по данным формы. Год не указан или не число — не
-- ученик младше 18 здесь: такую форму отклонит триггер согласий
-- (birth_year_required).
create or replace function public.signup_is_minor(p_meta jsonb)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(p_meta ->> 'role', '') = 'student'
     and coalesce(p_meta ->> 'birth_year', '') ~ '^[0-9]{4}$'
     and public.parent_consent_needed((p_meta ->> 'birth_year')::int)
$$;

revoke execute on function public.signup_is_minor(jsonb) from public, anon, authenticated;

-- Можно ли регистрироваться без кода приглашения: адрес в списке — да;
-- в списке «*» — да, кроме ученика младше 18.
create or replace function public.signup_allowed(p_email text, p_meta jsonb)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.email_allowed(p_email)
      or (public.signup_open() and not public.signup_is_minor(p_meta))
$$;

revoke execute on function public.signup_allowed(text, jsonb) from public, anon, authenticated;

-- Хук службы входа: как в миграции почтовых доменов, но вместо одного
-- списка — signup_allowed. Ученику младше 18 при открытой регистрации —
-- свой ответ minor_closed: сайт объясняет, а не пишет «по приглашению».
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
  if v_email <> '' and not auth_hooks.email_domain_allowed(v_email) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'domain_not_allowed'));
  end if;

  v_invited := v_code <> '' and exists (
    select 1 from public.invitations
     where code_hash = public.invite_hash(v_code)
       and used_at is null and revoked_at is null and expires_at > now());
  if v_email = '' or not (v_invited or public.signup_allowed(v_email, v_meta)) then
    if v_email <> '' and public.signup_open() and public.signup_is_minor(v_meta) then
      return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'minor_closed'));
    end if;
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

revoke execute on function auth_hooks.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function auth_hooks.before_user_created(jsonb) to supabase_auth_admin;

-- Триггер регистрации: то же, что в миграции пробного входа, только
-- без кода приглашения проверяется signup_allowed. Это второй замок —
-- на случай, если хук выключен или пользователя создают в обход формы.
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
    if not public.signup_allowed(new.email, meta) then
      if public.signup_open() and public.signup_is_minor(meta) then
        raise exception 'minor_closed: ученикам младше 18 регистрация пока закрыта' using errcode = 'check_violation';
      end if;
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

/* ── 3. Доступ по тарифу ───────────────────────────────────────── */

-- Срок пробного доступа, дней. То же число — PROBNYY.dney в
-- app/src/lib/tarify/config.ts; расхождение ловит pnpm test:tarify.
create or replace function public.probnyy_dney()
returns int
language sql immutable
as $$ select 3 $$;

revoke execute on function public.probnyy_dney() from public, anon;
grant execute on function public.probnyy_dney() to authenticated;

-- Одна строка на аккаунт: какой тариф открыт и до какого момента.
-- Строка остаётся и после окончания срока — по ней видно, что пробный
-- доступ уже был (второй раз он не даётся).
create table public.dostup (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Тариф: роль из lib/tarify/config.ts (Rol).
  tarif text not null check (tarif in ('uchenik', 'repetitor')),
  -- До какого момента открыт полный доступ.
  do_kogda timestamptz not null,
  -- Откуда текущий срок: пробный или оплата.
  istochnik text not null check (istochnik in ('probnyy', 'oplata')),
  -- Когда включался пробный доступ; null — ещё не включался.
  probnyy_s timestamptz,
  updated_at timestamptz not null default now()
);
comment on table public.dostup is
  'Полный доступ по тарифу: тариф и срок. Пишет только база (пробный — при подтверждении почты, оплата — администратор).';

alter table public.dostup enable row level security;

-- Своя строка; администратор — все.
create policy dostup_select on public.dostup
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Ни вставки, ни правки из браузера: только чтение.
revoke all on public.dostup from anon, authenticated;
grant select on public.dostup to authenticated;

-- Есть ли сейчас полный доступ. Для правил базы на следующих шагах
-- (выдача ДЗ, листы учителя) и для сайта.
create or replace function public.est_polnyy_dostup(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.dostup
     where user_id = p_user and do_kogda > now()
  )
$$;

revoke execute on function public.est_polnyy_dostup(uuid) from public, anon;
grant execute on function public.est_polnyy_dostup(uuid) to authenticated;

-- Пробный доступ: включается сам, когда почта подтверждена. Тариф — по
-- роли: ученик → «Ученик», репетитор → «Репетитор». Администратору не
-- нужен. Один раз на аккаунт: строка уже есть — ничего не делаем.
create or replace function public.vklyuchit_probnyy()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;
  select role into v_role from public.profiles where user_id = new.id;
  if v_role is null or v_role not in ('student', 'tutor') then
    return new;
  end if;
  insert into public.dostup (user_id, tarif, do_kogda, istochnik, probnyy_s)
  values (
    new.id,
    case v_role when 'student' then 'uchenik' else 'repetitor' end,
    now() + make_interval(days => public.probnyy_dney()),
    'probnyy',
    now()
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

revoke execute on function public.vklyuchit_probnyy() from public, anon, authenticated;

-- Имя начинается на «zz»: триггеры одного события PostgreSQL вызывает
-- по алфавиту, и к этому моменту профиль (on_auth_user_created_invite)
-- уже создан. Нужно, когда почта подтверждена сразу при создании.
create trigger zz_auth_user_probnyy
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.vklyuchit_probnyy();

-- Уже подтверждённым аккаунтам учеников и репетиторов — пробный доступ
-- с момента этой миграции, как если бы они подтвердили почту сейчас.
insert into public.dostup (user_id, tarif, do_kogda, istochnik, probnyy_s)
select p.user_id,
       case p.role when 'student' then 'uchenik' else 'repetitor' end,
       now() + make_interval(days => public.probnyy_dney()),
       'probnyy',
       now()
  from public.profiles p
  join auth.users u on u.id = p.user_id
 where p.role in ('student', 'tutor') and u.email_confirmed_at is not null
on conflict (user_id) do nothing;
