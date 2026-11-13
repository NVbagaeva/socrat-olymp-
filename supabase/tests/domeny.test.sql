-- Регистрация только с почтой российских почтовых сервисов
-- (миграция 20261113120000_pochtovye_domeny.sql): хук службы входа,
-- триггер на auth.users, смена почты, ручной список, старые
-- пользователи с иностранной почтой.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-10-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-11',
    'accept_soglashenie', true, 'accept_soglasie', true) || extra
$$;

create function pg_temp.fails(sql text, needle text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlerrm not like '%' || needle || '%' then
      raise exception 'FAIL: ждали «%», получили «%» на: %', needle, sqlerrm, sql;
    end if;
    return;
  end;
  raise exception 'FAIL: прошло, а не должно: %', sql;
end $$;

create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', what; end if;
end $$;

create function pg_temp.hook(email text) returns text language sql as $$
  select coalesce(auth_hooks.before_user_created(jsonb_build_object('user', jsonb_build_object('email', email)))
    -> 'error' ->> 'message', 'ok')
$$;

/* ── 1. Сравнение адресов ──────────────────────────────────────── */

do $$
declare
  v_yes text[] := array['anna@mail.ru', 'ANNA@MAIL.RU', '  anna@Yandex.Ru  ', 'a.b+c@ya.ru',
    'x@bk.ru', 'x@inbox.ru', 'x@list.ru', 'x@internet.ru', 'x@yandex.com', 'x@yandex.by',
    'x@yandex.kz', 'x@narod.ru', 'x@rambler.ru', 'x@lenta.ru', 'x@autorambler.ru',
    'x@myrambler.ru', 'x@ro.ru', 'x@budetege.ru'];
  v_no text[] := array['anna@gmail.com', 'ANNA@GMAIL.COM', 'anna@mail.yandex.ru',
    'anna@sub.mail.ru', 'anna@mail.ru.example.com', 'anna@mymail.ru', 'anna@yandex.ua',
    'anna @mail.ru', 'anna@ mail.ru', 'anna@mail .ru', 'anna@mail.ru@gmail.com', 'mail.ru',
    '@mail.ru', 'anna@', '', null];
  v text;
begin
  foreach v in array v_yes loop
    perform pg_temp.ok(auth_hooks.email_domain_allowed(v), format('не пропущен адрес «%s»', v));
  end loop;
  foreach v in array v_no loop
    perform pg_temp.ok(not auth_hooks.email_domain_allowed(v), format('пропущен адрес «%s»', coalesce(v, 'null')));
  end loop;
  perform pg_temp.ok((select count(*) from auth_hooks.signup_domains) = 17, 'в основном списке не 17 доменов');
end $$;

/* ── 2. Хук службы входа ───────────────────────────────────────── */

insert into vault.secrets (name, secret)
values ('allowed_emails', 'anna@mail.ru, boris@gmail.com, vera@school.example.ru, old@gmail.com');

select pg_temp.ok(pg_temp.hook('boris@gmail.com') = 'domain_not_allowed',
  'хук пропустил gmail.com, хотя адрес и в списке приглашённых');
select pg_temp.ok(pg_temp.hook('BORIS@GMAIL.COM') = 'domain_not_allowed', 'хук пропустил GMAIL.COM заглавными');
select pg_temp.ok(pg_temp.hook('anna@sub.mail.ru') = 'domain_not_allowed', 'хук пропустил поддомен');
select pg_temp.ok(pg_temp.hook('anna@mail.ru') = 'ok', 'хук не пропустил mail.ru из списка');
select pg_temp.ok(pg_temp.hook(' Anna@Mail.RU ') = 'ok', 'хук не пропустил адрес с пробелами и заглавными');
select pg_temp.ok(pg_temp.hook('gleb@mail.ru') = 'invite_only',
  'российский адрес не из списка приглашённых должен получать invite_only, как раньше');
select pg_temp.ok(coalesce(auth_hooks.before_user_created(
  '{"user":{"email":"boris@gmail.com","user_metadata":{"invite_code":"любой"}}}') -> 'error' ->> 'message', 'ok')
  = 'domain_not_allowed', 'с кодом приглашения иностранная почта прошла');

/* ── 3. Триггер: мимо хука не пройти ───────────────────────────── */

select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('boris@gmail.com', pg_temp.meta('{}'))$q$, 'domain_not_allowed');
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('Boris@GMAIL.com', pg_temp.meta('{}'))$q$, 'domain_not_allowed');
insert into auth.users (id, email, raw_user_meta_data)
values ('d1000000-0000-0000-0000-000000000000', 'anna@mail.ru', pg_temp.meta('{"name":"Анна"}'));
select pg_temp.ok((select count(*) from public.profiles where user_id = 'd1000000-0000-0000-0000-000000000000') = 1,
  'разрешённый адрес не зарегистрировался');

/* ── 4. Ручной список ──────────────────────────────────────────── */

select pg_temp.ok(not auth_hooks.email_domain_allowed('vera@school.example.ru'), 'школьный домен пропущен до добавления');
insert into auth_hooks.signup_extra (value, kind) values
  ('school.example.ru', 'domain'), ('old@gmail.com', 'email');
select pg_temp.ok(auth_hooks.email_domain_allowed('Vera@School.Example.ru'), 'добавленный домен не пропущен');
select pg_temp.ok(not auth_hooks.email_domain_allowed('vera@sub.school.example.ru'), 'поддомен добавленного домена пропущен');
select pg_temp.ok(auth_hooks.email_domain_allowed('OLD@gmail.com'), 'добавленный адрес не пропущен');
select pg_temp.ok(not auth_hooks.email_domain_allowed('other@gmail.com'), 'добавлен адрес, а пропущен весь gmail.com');
select pg_temp.ok(pg_temp.hook('vera@school.example.ru') = 'ok', 'хук не пропустил добавленный домен');
select pg_temp.fails($q$insert into auth_hooks.signup_extra (value, kind) values ('Bad.ru', 'domain')$q$, 'check');
select pg_temp.fails($q$insert into auth_hooks.signup_extra (value, kind) values ('a@b.ru', 'domain')$q$, 'check');

/* ── 5. Старый пользователь с иностранной почтой ───────────────── */

-- Зарегистрирован, пока адрес был в ручном списке (так же выглядят
-- аккаунты, созданные до этой миграции). Потом адрес из списка убрали.
insert into auth.users (id, email, raw_user_meta_data, encrypted_password)
values ('d2000000-0000-0000-0000-000000000000', 'old@gmail.com', pg_temp.meta('{"name":"Старый"}'), 'хеш-1');
delete from auth_hooks.signup_extra where value = 'old@gmail.com';
select pg_temp.ok(not auth_hooks.email_domain_allowed('old@gmail.com'), 'адрес остался в списке');

-- Вход и пароль: служба входа обновляет строку — проходит.
update auth.users set encrypted_password = 'хеш-2' where email = 'old@gmail.com';
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"name":"Старый, новое имя"}'
 where email = 'old@gmail.com';
-- Служба входа переписывает и саму почту тем же значением — тоже проходит.
update auth.users set email = email, email_change = '' where email = 'old@gmail.com';
select pg_temp.ok((select encrypted_password from auth.users where email = 'old@gmail.com') = 'хеш-2',
  'смена пароля старому пользователю не прошла');

-- Смена почты: на иностранную — отказ, на российскую — можно.
select pg_temp.fails($q$update auth.users set email_change = 'new@gmail.com' where email = 'old@gmail.com'$q$,
  'domain_not_allowed');
select pg_temp.fails($q$update auth.users set email_change = 'NEW@Outlook.com' where email = 'old@gmail.com'$q$,
  'domain_not_allowed');
select pg_temp.fails($q$update auth.users set email = 'new@gmail.com' where email = 'old@gmail.com'$q$,
  'domain_not_allowed');
update auth.users set email_change = 'new@mail.ru' where email = 'old@gmail.com';
update auth.users set email = 'new@mail.ru', email_change = '' where email = 'old@gmail.com';
select pg_temp.ok((select email from auth.users where id = 'd2000000-0000-0000-0000-000000000000') = 'new@mail.ru',
  'смена почты на российскую не прошла');
-- Обратно на иностранную — нельзя.
select pg_temp.fails($q$update auth.users set email = 'old@gmail.com' where id = 'd2000000-0000-0000-0000-000000000000'$q$,
  'domain_not_allowed');

/* ── 6. Снаружи списков не видно ───────────────────────────────── */

set role anon;
select pg_temp.fails('select * from auth_hooks.signup_extra', 'permission denied');
select pg_temp.fails('select * from auth_hooks.signup_domains', 'permission denied');
select pg_temp.fails($q$select auth_hooks.email_domain_allowed('a@mail.ru')$q$, 'permission denied');
reset role;
set role authenticated;
select pg_temp.fails($q$insert into auth_hooks.signup_extra (value, kind) values ('gmail.com', 'domain')$q$,
  'permission denied');
reset role;

do $$ begin raise notice 'Почтовые домены: всё сходится'; end $$;
