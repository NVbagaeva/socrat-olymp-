-- Открытая регистрация и доступ по тарифу
-- (миграция 20261114120000_otkrytaya_registraciya.sql).
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

create function pg_temp.hook(email text, meta jsonb) returns text language sql as $$
  select coalesce(
    auth_hooks.before_user_created(jsonb_build_object('user',
      jsonb_build_object('email', email, 'user_metadata', meta))) -> 'error' ->> 'message',
    'ok')
$$;

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

-- Год рождения взрослого и ученика младше 18 — от сегодняшней даты.
\set adult_year `date +%Y | awk '{print $1 - 25}'`
\set minor_year `date +%Y | awk '{print $1 - 15}'`

/* ── 1. Без «*» — по-прежнему по списку ────────────────────────── */

insert into vault.secrets (name, secret) values ('allowed_emails', 'listed@x.ru');
select pg_temp.ok(pg_temp.hook('stranger@x.ru', pg_temp.meta('{}')) = 'invite_only',
  'без «*» незнакомый адрес должен получать invite_only');
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('stranger@x.ru', pg_temp.meta('{}'))$q$, 'invite_required');
select pg_temp.ok(pg_temp.hook('listed@x.ru', pg_temp.meta('{}')) = 'ok',
  'адрес из списка проходит хук');
do $$ begin raise notice 'ok 1: без «*» регистрация по списку, как раньше'; end $$;

/* ── 2. «*» — открыто для взрослых ─────────────────────────────── */

update vault.secrets set secret = '*, kid@x.ru' where name = 'allowed_emails';

select pg_temp.ok(pg_temp.hook('tutor@x.ru', pg_temp.meta('{}')) = 'ok',
  'с «*» репетитор проходит хук');
insert into auth.users (id, email, raw_user_meta_data)
values ('d1000000-0000-0000-0000-000000000000', 'tutor@x.ru', pg_temp.meta('{}'));

select pg_temp.ok(pg_temp.hook('adult@x.ru',
  pg_temp.meta(jsonb_build_object('role', 'student', 'birth_year', :'adult_year'))) = 'ok',
  'с «*» взрослый ученик проходит хук');
insert into auth.users (id, email, raw_user_meta_data)
values ('d2000000-0000-0000-0000-000000000000', 'adult@x.ru',
        pg_temp.meta(jsonb_build_object('role', 'student', 'birth_year', :'adult_year')));

-- Ученик младше 18 не из списка — понятный отказ и в хуке, и в базе.
select pg_temp.ok(pg_temp.hook('teen@x.ru',
  pg_temp.meta(jsonb_build_object('role', 'student', 'birth_year', :'minor_year',
                                  'parent_email', 'mama@x.ru'))) = 'minor_closed',
  'ученик младше 18 должен получать minor_closed');
select pg_temp.fails(format($q$insert into auth.users (email, raw_user_meta_data)
  values ('teen@x.ru', pg_temp.meta(%L))$q$,
  jsonb_build_object('role', 'student', 'birth_year', :'minor_year', 'parent_email', 'mama@x.ru')),
  'minor_closed');

-- Ученик младше 18, записанный в список явно, — как раньше, с почтой родителя.
insert into auth.users (id, email, raw_user_meta_data)
values ('d3000000-0000-0000-0000-000000000000', 'kid@x.ru',
        pg_temp.meta(jsonb_build_object('role', 'student', 'birth_year', :'minor_year',
                                        'parent_email', 'papa@x.ru')));

-- Администратором через «*» не стать.
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('evil@x.ru', pg_temp.meta('{"role":"admin"}'))$q$, 'bad_role');

-- Иностранная почта не проходит и с «*»: отбор по домену раньше.
select pg_temp.ok(pg_temp.hook('someone@gmail.com', pg_temp.meta('{}')) = 'domain_not_allowed',
  'с «*» иностранная почта всё равно отклоняется');
do $$ begin raise notice 'ok 2: «*» открывает регистрацию взрослым, младше 18 — только по списку'; end $$;

/* ── 3. Пробный доступ при подтверждении почты ─────────────────── */

select pg_temp.ok(public.probnyy_dney() = 3, 'пробный доступ — 3 дня');
select pg_temp.ok(not exists (select 1 from public.dostup),
  'до подтверждения почты пробного доступа нет');

update auth.users set email_confirmed_at = now()
 where id in ('d1000000-0000-0000-0000-000000000000', 'd2000000-0000-0000-0000-000000000000');

select pg_temp.ok((select tarif = 'repetitor' and istochnik = 'probnyy'
                      and do_kogda between now() + interval '3 days' - interval '1 minute'
                                       and now() + interval '3 days' + interval '1 minute'
                     from public.dostup where user_id = 'd1000000-0000-0000-0000-000000000000'),
  'репетитор получил «Репетитор» на 3 дня');
select pg_temp.ok((select tarif = 'uchenik' from public.dostup
                    where user_id = 'd2000000-0000-0000-0000-000000000000'),
  'ученик получил «Ученик»');

-- Второй раз не даётся: срок кончился, почту «подтвердили» снова.
update public.dostup set do_kogda = now() - interval '1 day'
 where user_id = 'd1000000-0000-0000-0000-000000000000';
update auth.users set email_confirmed_at = null where id = 'd1000000-0000-0000-0000-000000000000';
update auth.users set email_confirmed_at = now() where id = 'd1000000-0000-0000-0000-000000000000';
select pg_temp.ok((select do_kogda < now() from public.dostup
                    where user_id = 'd1000000-0000-0000-0000-000000000000'),
  'пробный доступ даётся один раз');

-- Почта подтверждена сразу при создании — профиль уже есть, доступ включается.
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('d4000000-0000-0000-0000-000000000000', 'fast@x.ru', now(), pg_temp.meta('{}'));
select pg_temp.ok(exists (select 1 from public.dostup
                           where user_id = 'd4000000-0000-0000-0000-000000000000'),
  'подтверждённый сразу аккаунт получил пробный доступ');
do $$ begin raise notice 'ok 3: пробный доступ — при подтверждении почты, по роли, один раз'; end $$;

/* ── 4. Кто видит и меняет доступ ──────────────────────────────── */

set role authenticated;
select pg_temp.as_user('d2000000-0000-0000-0000-000000000000');
select pg_temp.ok((select count(*) from public.dostup) = 1, 'ученик видит только свою строку');
select pg_temp.ok(public.est_polnyy_dostup(), 'у ученика в пробном доступе полный доступ');
select pg_temp.fails($q$update public.dostup set do_kogda = now() + interval '10 years'$q$,
  'permission denied');
select pg_temp.fails($q$insert into public.dostup (user_id, tarif, do_kogda, istochnik)
  values ('d2000000-0000-0000-0000-000000000000', 'repetitor', now() + interval '1 year', 'oplata')$q$,
  'permission denied');
select pg_temp.as_user('d1000000-0000-0000-0000-000000000000');
select pg_temp.ok(not public.est_polnyy_dostup(), 'срок кончился — полного доступа нет');
reset role;

set role anon;
select pg_temp.fails($q$select * from public.dostup$q$, 'permission denied');
select pg_temp.fails($q$select public.est_polnyy_dostup('d2000000-0000-0000-0000-000000000000')$q$,
  'permission denied');
reset role;
do $$ begin raise notice 'ok 4: доступ видит только владелец, менять не может никто из браузера'; end $$;

/* ── 5. Удаление аккаунта ──────────────────────────────────────── */

delete from auth.users where id = 'd2000000-0000-0000-0000-000000000000';
select pg_temp.ok(not exists (select 1 from public.dostup
                               where user_id = 'd2000000-0000-0000-0000-000000000000'),
  'строка доступа удаляется вместе с аккаунтом');
do $$ begin raise notice 'ok 5: удаление аккаунта удаляет и доступ'; end $$;
