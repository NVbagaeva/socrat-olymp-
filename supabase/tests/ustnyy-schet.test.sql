-- Устный счёт: рейтинговые тренировки, ники и рейтинг
-- (миграция 20261115120000_ustnyy_schet.sql). Идёт на всех миграциях с
-- правами по умолчанию своего сервера (lite-defaults.sql).
-- В начало файла раннер кладёт таблицу formaty_cases из
-- app/src/lib/ustnyySchet/formatyCases.json — ту же, по которой
-- проверяются генераторы сайта.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs.

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-10-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'student', 'name', 'Тест', 'documents_version', '2026-10-11',
    'accept_soglashenie', true, 'accept_soglasie', true, 'birth_year', 2000) || extra
$$;

create function pg_temp.fails(sql text, needle text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if not exists (select 1 from unnest(string_to_array(needle, '|')) as part
                   where sqlerrm like '%' || part || '%') then
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

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

-- Верный ответ примера — только с правами владельца базы (в тесте).
create function pg_temp.otvet(p_session uuid, p_pos int) returns text language sql as $$
  select otvet from public.ustnyy_items where session_id = p_session and pos = p_pos
$$;

insert into vault.secrets (name, secret)
values ('allowed_emails', 's1@x.ru, s2@x.ru, s3@x.ru, s4@x.ru, kid@x.ru, t1@x.ru, t2@x.ru, adm@x.ru');

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1000000-0000-0000-0000-000000000000', 's1@x.ru', pg_temp.meta('{"name":"Ученик Первый"}')),
  ('a2000000-0000-0000-0000-000000000000', 's2@x.ru', pg_temp.meta('{"name":"Ученик Второй"}')),
  ('a3000000-0000-0000-0000-000000000000', 's3@x.ru', pg_temp.meta('{"name":"Ученик Третий"}')),
  ('a4000000-0000-0000-0000-000000000000', 's4@x.ru', pg_temp.meta('{"name":"Ученик Четвёртый"}')),
  ('a5000000-0000-0000-0000-000000000000', 'kid@x.ru',
    pg_temp.meta('{"name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}')),
  ('e1000000-0000-0000-0000-000000000000', 't1@x.ru', pg_temp.meta('{"role":"tutor","name":"Репетитор 1"}')),
  ('e2000000-0000-0000-0000-000000000000', 't2@x.ru', pg_temp.meta('{"role":"tutor","name":"Репетитор 2"}')),
  ('e3000000-0000-0000-0000-000000000000', 'adm@x.ru', pg_temp.meta('{"role":"tutor","name":"Админ"}'));
select public.grant_admin('adm@x.ru');

insert into public.tutor_students (tutor_id, user_id) values
  ('e1000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000'),
  ('e1000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000');
insert into public.classes (id, tutor_id, name) values
  ('f1000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000000', 'Класс А');
insert into public.class_members (class_id, user_id) values
  ('f1000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000'),
  ('f1000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000');

/* ── 1. Аноним не может ни начать, ни записать, ни прочитать ───── */

set role anon;
select pg_temp.fails($q$select public.ustnyy_start('tablica-1m')$q$, 'permission denied');
select pg_temp.fails($q$select public.ustnyy_finish(gen_random_uuid())$q$, 'permission denied');
select pg_temp.fails($q$select public.ustnyy_reyting('tablica-1m', 'vse')$q$, 'permission denied');
select pg_temp.fails($q$select * from public.ustnyy_sessions$q$, 'permission denied');
select pg_temp.fails($q$insert into public.ustnyy_sessions (user_id, format, seed, den, deadline)
  values ('a1000000-0000-0000-0000-000000000000', 'tablica-1m', 1, current_date, now())$q$, 'permission denied');
reset role;
do $$ begin raise notice 'ok 1: аноним не начинает, не пишет и не читает рейтинг'; end $$;

/* ── 2. Старт: примеры без ответов, ответы клиенту не читаются ─── */

set role authenticated;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select public.ustnyy_start('tablica-1m') as st1 \gset
select (:'st1'::jsonb ->> 'session')::uuid as ses1 \gset
select pg_temp.ok(jsonb_array_length(:'st1'::jsonb -> 'items') = 2, 'на старте два примера');
select pg_temp.ok(:'st1'::jsonb::text not like '%otvet%', 'в ответе старта нет верных ответов');
select pg_temp.ok((:'st1'::jsonb ->> 'deadline')::bigint - (:'st1'::jsonb ->> 'server_now')::bigint = 60000,
  'срок — минута от времени сервера');
select pg_temp.fails($q$select * from public.ustnyy_items$q$, 'permission denied');
select pg_temp.fails($q$select otvet from public.ustnyy_items where pos = 1$q$, 'permission denied');
select pg_temp.ok((select count(*) from public.ustnyy_sessions) = 1, 'свою тренировку ученик видит');
reset role;
do $$ begin raise notice 'ok 2: старт без ответов; таблица примеров клиенту закрыта'; end $$;

/* ── 3. В обход функций не записать ────────────────────────────── */

set role authenticated;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$insert into public.ustnyy_sessions (user_id, format, seed, den, deadline)
  values (auth.uid(), 'tablica-1m', 1, current_date, now())$q$, 'permission denied');
select pg_temp.fails($q$update public.ustnyy_sessions set verno = 100, valid = true$q$, 'permission denied');
select pg_temp.fails($q$update public.ustnyy_items set verno = true$q$, 'permission denied');
select pg_temp.fails($q$insert into public.ustnyy_items (session_id, user_id, pos, priyom, d, klyuch, otvet)
  values (gen_random_uuid(), auth.uid(), 1, 'x', '{}', 'x', '1')$q$, 'permission denied');
select pg_temp.fails($q$update public.ustnyy_profiles set nick = 'Хакер'$q$, 'permission denied');
select pg_temp.fails($q$delete from public.ustnyy_sessions$q$, 'permission denied');
-- Служебные функции закрыты.
select pg_temp.fails($q$select public.ustnyy_gen('tablica-1m', 1, 1, 0)$q$, 'permission denied');
select pg_temp.fails($q$select public.ustnyy_vydat(gen_random_uuid(), 3)$q$, 'permission denied');
select pg_temp.fails($q$select * from public.ustnyy_luchshie('tablica-1m', '-infinity', null, null)$q$, 'permission denied');
reset role;
do $$ begin raise notice 'ok 3: insert, update и delete в обход функций запрещены'; end $$;

/* ── 4. Ответ: по порядку, ответ после ответа, чужое закрыто ───── */

select pg_temp.otvet(:'ses1', 1) as o1 \gset
set role authenticated;
select pg_temp.as_user('a2000000-0000-0000-0000-000000000000');
select pg_temp.ok((select count(*) from public.ustnyy_sessions) = 0, 'чужую тренировку не видно');
select pg_temp.fails(format($q$select public.ustnyy_answer(%L, 1, '1')$q$, :'ses1'), 'not_your_session');
select pg_temp.fails(format($q$select public.ustnyy_finish(%L)$q$, :'ses1'), 'not_your_session');

select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select pg_temp.fails(format($q$select public.ustnyy_answer(%L, 2, '1')$q$, :'ses1'), 'bad_pos');
select pg_temp.ok((public.ustnyy_answer(:'ses1', 1, 'абв') ->> 'kind') = 'format', 'буквы — не попытка');
select public.ustnyy_answer(:'ses1', 1, :'o1') as a1 \gset
select pg_temp.ok((:'a1'::jsonb ->> 'verno')::boolean, 'верный ответ засчитан');
select pg_temp.ok((:'a1'::jsonb ->> 'otvet') = :'o1', 'после ответа сервер отдаёт верный ответ');
select pg_temp.ok((:'a1'::jsonb -> 'next' ->> 'pos')::int = 3, 'буфер: следом выдан пример 3');
select pg_temp.ok((:'a1'::jsonb -> 'next')::text not like '%otvet%', 'у следующего примера ответа нет');
-- Выгрузка данных во время тренировки: ответы только на решённое.
select pg_temp.ok(jsonb_array_length(public.export_my_data() -> 'ustnyy_items') = 1,
  'выгрузка не подсказывает ответы нерешённых примеров');
select pg_temp.ok((public.export_my_data() -> 'ustnyy_sessions') is not null
  and (public.export_my_data() -> 'ustnyy_profiles') is not null, 'тренировки и ник — в выгрузке');
select public.ustnyy_finish(:'ses1') as f1 \gset
select pg_temp.ok(not (:'f1'::jsonb ->> 'valid')::boolean and :'f1'::jsonb ->> 'reason' = 'too_fast',
  'ответ мгновенно — невозможный результат, в рейтинг не идёт');
select pg_temp.fails(format($q$select public.ustnyy_answer(%L, 2, '1')$q$, :'ses1'), 'session_closed');
reset role;
do $$ begin raise notice 'ok 4: ответы по порядку, верный ответ — только после ответа, чужое закрыто'; end $$;

/* ── 5. Ответ после срока, точность, полная серия ──────────────── */

-- Помощник: пройти серию из n примеров, ошибок — p_oshibok, затем
-- «растянуть» её во времени на p_sek секунд (правка владельцем базы —
-- только в тесте) и закончить.
create function pg_temp.seriya(p_user uuid, p_format text, p_oshibok int, p_sek int) returns jsonb
language plpgsql as $$
declare
  st jsonb;
  ses uuid;
  n int;
  o text;
  r jsonb;
begin
  perform set_config('request.jwt.claim.sub', p_user::text, false);
  set local role authenticated;
  st := public.ustnyy_start(p_format);
  ses := (st ->> 'session')::uuid;
  n := (st ->> 'n')::int;
  for i in 1..n loop
    reset role;
    o := pg_temp.otvet(ses, i);
    set local role authenticated;
    r := public.ustnyy_answer(ses, i, case when i <= p_oshibok then o || '1' else o end);
  end loop;
  reset role;
  update public.ustnyy_sessions set started_at = started_at - make_interval(secs => p_sek) where id = ses;
  set local role authenticated;
  r := public.ustnyy_finish(ses);
  reset role;
  return r || jsonb_build_object('session', ses);
end $$;

select pg_temp.seriya('a1000000-0000-0000-0000-000000000000', 'kvadraty-20', 0, 40) as r1 \gset
select pg_temp.ok((:'r1'::jsonb ->> 'valid')::boolean, 'серия без ошибок за 40 с — в рейтинге: ' || :'r1');
select pg_temp.ok((:'r1'::jsonb ->> 'score_ms')::int between 39000 and 42000, 'итог серии — время сервера');
select pg_temp.ok((:'r1'::jsonb ->> 'mesto')::int = 1, 'первое место');
select pg_temp.ok((:'r1'::jsonb ->> 'rekord')::boolean, 'первый результат — рекорд');

select pg_temp.seriya('a2000000-0000-0000-0000-000000000000', 'kvadraty-20', 2, 40) as r2 \gset
select pg_temp.ok((:'r2'::jsonb ->> 'valid')::boolean and (:'r2'::jsonb ->> 'mesto')::int = 2,
  'две ошибки: +10 с штрафа — второе место: ' || :'r2');
select pg_temp.ok((:'r2'::jsonb ->> 'score_ms')::int - (:'r2'::jsonb ->> 'net_ms')::int = 10000, '5 с за ошибку');

select pg_temp.seriya('a3000000-0000-0000-0000-000000000000', 'kvadraty-20', 5, 40) as r3 \gset
select pg_temp.ok(not (:'r3'::jsonb ->> 'valid')::boolean and :'r3'::jsonb ->> 'reason' = 'accuracy',
  '75 % верных — ниже порога 80 %');

-- После срока ответ не засчитывается.
set role authenticated;
select pg_temp.as_user('a4000000-0000-0000-0000-000000000000');
select (public.ustnyy_start('tablica-1m') ->> 'session')::uuid as ses4 \gset
reset role;
update public.ustnyy_sessions set deadline = now() - interval '10 seconds' where id = :'ses4';
select pg_temp.otvet(:'ses4', 1) as o4 \gset
set role authenticated;
select pg_temp.ok((public.ustnyy_answer(:'ses4', 1, :'o4') ->> 'kind') = 'late', 'ответ после срока — late');
select pg_temp.ok((select vsego from public.ustnyy_sessions where id = :'ses4') = 0, 'и не засчитан');
select pg_temp.ok(public.ustnyy_finish(:'ses4') ->> 'reason' = 'empty', 'пустая тренировка — не в рейтинг');
reset role;
do $$ begin raise notice 'ok 5: итог по времени сервера, штраф, порог точности, ответ после срока'; end $$;

/* ── 6. Кто может начинать ─────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('a5000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$select public.ustnyy_start('tablica-1m')$q$, 'progress_not_allowed');
select pg_temp.as_user('e1000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$select public.ustnyy_start('tablica-1m')$q$, 'forbidden');
select pg_temp.as_user('a4000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$select public.ustnyy_start('net-takogo')$q$, 'bad_format');
reset role;
do $$ begin raise notice 'ok 6: без согласия родителя и не ученику — нельзя'; end $$;

/* ── 7. Предел стартов ─────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('a3000000-0000-0000-0000-000000000000');
-- У третьего ученика уже есть одна тренировка (серия выше): ещё 29.
do $$ begin
  for i in 1..29 loop perform public.ustnyy_start('tablica-1m'); end loop;
end $$;
select pg_temp.fails($q$select public.ustnyy_start('tablica-1m')$q$, 'too_many_starts');
select pg_temp.ok((select count(*) from public.ustnyy_sessions where status = 'active') = 1,
  'активная тренировка всегда одна: прежние закрыты');
reset role;
update public.ustnyy_sessions set started_at = started_at - interval '2 hours'
 where user_id = 'a3000000-0000-0000-0000-000000000000';
set role authenticated;
select pg_temp.ok(public.ustnyy_start('tablica-1m') ? 'session', 'через час — снова можно');
reset role;
do $$ begin raise notice 'ok 7: не больше 30 рейтинговых стартов в час'; end $$;

/* ── 8. Вызов дня: одинаковые примеры у всех, одна попытка ─────── */

set role authenticated;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select (public.ustnyy_start('vyzov-dnya') ->> 'session')::uuid as v1 \gset
select pg_temp.fails($q$select public.ustnyy_start('vyzov-dnya')$q$, 'vyzov_uzhe');
select pg_temp.as_user('a2000000-0000-0000-0000-000000000000');
select (public.ustnyy_start('vyzov-dnya') ->> 'session')::uuid as v2 \gset
reset role;
select pg_temp.ok(
  (select array_agg(klyuch order by pos) from public.ustnyy_items where session_id = :'v1')
  = (select array_agg(klyuch order by pos) from public.ustnyy_items where session_id = :'v2'),
  'у вызова дня у всех одни и те же примеры');
-- Все 20 примеров вызова — одинаковые и без повторов.
do $$
declare k text[];
begin
  k := array(select (public.ustnyy_gen('vyzov-dnya', 777, p, 0)).priyom from generate_series(1, 20) p);
  perform pg_temp.ok(array_length(k, 1) = 20, 'вызов дня — 20 примеров');
  perform pg_temp.ok((select count(distinct x) from unnest(k) x) >= 8, 'вызов дня — примеры разных приёмов');
end $$;
do $$ begin raise notice 'ok 8: вызов дня — одинаковые примеры, одна попытка в день'; end $$;

/* ── 9. Рейтинг: ники, скрытые, класс ──────────────────────────── */

set role authenticated;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select public.ustnyy_reyting('kvadraty-20', 'vse') as t1 \gset
select pg_temp.ok(jsonb_array_length(:'t1'::jsonb -> 'rows') = 2, 'в рейтинге двое: ' || :'t1');
select pg_temp.ok(:'t1'::jsonb::text not like '%Ученик%' and :'t1'::jsonb::text not like '%@x.ru%',
  'в рейтинге нет имён и почты — только ники');
select pg_temp.ok(:'t1'::jsonb::text not like '%imya%', 'ученику имена не отдаются');
select pg_temp.ok((:'t1'::jsonb -> 'ya' ->> 'mesto')::int = 1, 'своё место');
select pg_temp.ok((public.ustnyy_reyting('kvadraty-20', 'den') -> 'rows') = (:'t1'::jsonb -> 'rows'),
  'сегодняшние результаты — и в «сегодня»');
select pg_temp.fails($q$select public.ustnyy_reyting('kvadraty-20', 'god')$q$, 'bad_period');

-- Второй скрылся: в общем рейтинге его нет, своё место он видит.
select pg_temp.as_user('a2000000-0000-0000-0000-000000000000');
select public.ustnyy_set_pokazyvat(false);
select pg_temp.ok(jsonb_array_length(public.ustnyy_reyting('kvadraty-20', 'vse') -> 'rows') = 1,
  'скрытого нет в таблице');
select pg_temp.ok((public.ustnyy_reyting('kvadraty-20', 'vse') -> 'ya' ->> 'mesto')::int = 2,
  'скрытый видит своё место');
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select pg_temp.ok(jsonb_array_length(public.ustnyy_reyting('kvadraty-20', 'vse') -> 'rows') = 1,
  'другие скрытого не видят');

-- Рейтинг класса: одноклассникам — ники, репетитору — и имена.
select pg_temp.ok((public.ustnyy_reyting('kvadraty-20', 'vse', 'f1000000-0000-0000-0000-000000000000')
  -> 'rows')::text not like '%imya%', 'одноклассник видит только ники');
select pg_temp.as_user('e1000000-0000-0000-0000-000000000000');
select public.ustnyy_reyting('kvadraty-20', 'vse', 'f1000000-0000-0000-0000-000000000000') as tk \gset
select pg_temp.ok(jsonb_array_length(:'tk'::jsonb -> 'rows') = 2, 'репетитор видит всех учеников класса');
select pg_temp.ok(:'tk'::jsonb::text like '%Ученик Первый%', 'репетитор видит имена своих учеников');
select pg_temp.as_user('e2000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$select public.ustnyy_reyting('kvadraty-20', 'vse', 'f1000000-0000-0000-0000-000000000000')$q$,
  'not_your_class');
select pg_temp.as_user('a4000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$select public.ustnyy_reyting('kvadraty-20', 'vse', 'f1000000-0000-0000-0000-000000000000')$q$,
  'not_your_class');
reset role;

-- Без согласия родителя в рейтинг не попасть, даже если результат есть.
update public.parent_consents set confirmed_at = null where user_id = 'a1000000-0000-0000-0000-000000000000';
insert into public.parent_consents (user_id, birth_year, parent_email)
values ('a1000000-0000-0000-0000-000000000000', 2012, 'p@x.ru') on conflict (user_id) do nothing;
set role authenticated;
select pg_temp.as_user('a4000000-0000-0000-0000-000000000000');
select pg_temp.ok(jsonb_array_length(public.ustnyy_reyting('kvadraty-20', 'vse') -> 'rows') = 0,
  'без согласий результат не показывается');
reset role;
delete from public.parent_consents where user_id = 'a1000000-0000-0000-0000-000000000000';
do $$ begin raise notice 'ok 9: в рейтинге ники; скрытые и без согласий не видны; класс — по правам'; end $$;

/* ── 10. Ник ───────────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('a1000000-0000-0000-0000-000000000000');
select pg_temp.ok((public.ustnyy_moy_profil() ->> 'nick') ~ '^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [0-9]+$',
  'ник по умолчанию — «Прилагательное Зверь 27»');
select pg_temp.ok((public.ustnyy_moy_profil() ->> 'pokazyvat')::boolean, 'показ в рейтинге по умолчанию включён');
select pg_temp.ok(public.ustnyy_set_nick('ab') ->> 'error' = 'too_short', 'короткий ник');
select pg_temp.ok(public.ustnyy_set_nick(repeat('я', 21)) ->> 'error' = 'too_long', 'длинный ник');
select pg_temp.ok(public.ustnyy_set_nick('<script>') ->> 'error' = 'bad_chars', 'спецсимволы');
select pg_temp.ok(public.ustnyy_set_nick('12345') ->> 'error' = 'no_letters', 'одни цифры');
select pg_temp.ok(public.ustnyy_set_nick('Хуйло') ->> 'error' = 'bad_word', 'брань');
select pg_temp.ok(public.ustnyy_set_nick('х у й') ->> 'error' = 'bad_word', 'брань через пробелы');
select pg_temp.ok(public.ustnyy_set_nick('xyй') ->> 'error' = 'bad_word', 'брань латиницей');
select pg_temp.ok(public.ustnyy_set_nick('FUCK') ->> 'error' = 'bad_word', 'брань по-английски');
select pg_temp.ok(public.ustnyy_set_nick('Математик 7') ->> 'nick' = 'Математик 7', 'нормальный ник принят');
select pg_temp.ok(public.ustnyy_set_nick('Мандарин') ->> 'nick' = 'Мандарин', 'обычное слово не задето фильтром');
select public.ustnyy_set_nick('Математик 7');
select pg_temp.as_user('a2000000-0000-0000-0000-000000000000');
select pg_temp.ok(public.ustnyy_set_nick('математик 7') ->> 'error' = 'taken', 'ник занят (без учёта регистра)');
select pg_temp.fails($q$select public.ustnyy_admin_reset_nick('a1000000-0000-0000-0000-000000000000')$q$, 'forbidden');
select pg_temp.as_user('e3000000-0000-0000-0000-000000000000');
select public.ustnyy_admin_reset_nick('a1000000-0000-0000-0000-000000000000');
reset role;
select pg_temp.ok((select nick_auto and nick <> 'Математик 7' from public.ustnyy_profiles
  where user_id = 'a1000000-0000-0000-0000-000000000000'), 'администратор сбросил ник на случайный');
do $$ begin raise notice 'ok 10: ник — длина, символы, фильтр, занятость, сброс администратором'; end $$;

/* ── 11. Генераторы форматов: та же сложность, что на сайте ────── */

do $$
declare
  c record;
  g record;
  nums numeric[];
  x numeric;
  pr text[];
  bad text;
begin
  for c in select * from formaty_cases loop
    perform pg_temp.ok((select tip = c.tip and sek is not distinct from c.sek and n is not distinct from c.n
                          from public.ustnyy_formats where id = c.id), 'формат ' || c.id || ': тип и лимит как на сайте');
    pr := '{}';
    for i in 1..1000 loop
      select * into g from public.ustnyy_gen(c.id, 1000 + i / 7, i, 0);
      pr := array_append(pr, g.priyom);
      -- Ответ — пересчёт здесь же, по приёму.
      x := case g.priyom
        when 'tablica' then g.d[1]::numeric * g.d[2]::numeric
        when 'razlozhenie' then g.d[1]::numeric * g.d[2]::numeric
        when 'desyatichnye-umnozhenie' then g.d[1]::numeric * g.d[2]::numeric
        when 'delenie-po-chastyam' then g.d[1]::numeric / g.d[2]::numeric
        when 'po-razryadam' then case g.v when '+' then g.d[1]::numeric + g.d[2]::numeric
                                          else g.d[1]::numeric - g.d[2]::numeric end
        when 'kvadraty-11-30' then g.d[1]::numeric ^ 2
        when 'kvadrat-na-5' then (10 * g.d[1]::numeric + 5) ^ 2
        when 'kvadrat-okolo-50' then (50 + g.d[1]::numeric) ^ 2
        when 'kvadrat-okolo-kruglyh' then (g.d[1]::numeric + g.d[2]::numeric) ^ 2
        when 'doli-procenty' then case g.v when 'fd' then g.d[1]::numeric / g.d[2]::numeric
                                           else g.d[1]::numeric * 100 / g.d[2]::numeric end
        when 'procent-ot-chisla' then g.d[2]::numeric * g.d[1]::numeric / 100
        when 'otricatelnye' then case g.v when 'pm' then -g.d[1]::numeric + g.d[2]::numeric
                                          when 'mm' then -g.d[1]::numeric - g.d[2]::numeric
                                          else g.d[1]::numeric - g.d[2]::numeric end
      end;
      perform pg_temp.ok(x is not null and public.normalize_ege_answer(x::text) = g.otvet,
        format('%s: %s %s %s — ответ %s, пересчёт %s', c.id, g.priyom, g.d, g.v, g.otvet, x));
      nums := array(select unnest(g.d)::numeric) || g.otvet::numeric;
      perform pg_temp.ok((select bool_and(y between c.mn and c.mx) from unnest(nums) y),
        format('%s: %s %s вне диапазона [%s; %s]', c.id, g.d, g.otvet, c.mn, c.mx));
      perform pg_temp.ok(char_length(regexp_replace(g.otvet, '[^0-9]', '', 'g')) <= c.cifr,
        format('%s: в ответе %s больше %s цифр', c.id, g.otvet, c.cifr));
    end loop;
    select string_agg(p, ', ') into bad from (select distinct unnest(pr) p) q where not p = any (c.priyomy);
    perform pg_temp.ok(bad is null, c.id || ': чужие приёмы ' || coalesce(bad, ''));
    select string_agg(p, ', ') into bad from unnest(c.priyomy) p where not p = any (pr);
    perform pg_temp.ok(bad is null, c.id || ': не встретились приёмы ' || coalesce(bad, ''));
  end loop;
  perform pg_temp.ok((select count(*) from formaty_cases) = 5, 'в таблице сверки пять форматов');
  raise notice 'ok 11: генераторы форматов — те же диапазоны и приёмы, что на сайте; ответы верны';
end $$;

/* ── 12. Удаление аккаунта уносит всё ──────────────────────────── */

delete from auth.users where id = 'a2000000-0000-0000-0000-000000000000';
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.ustnyy_sessions where user_id = 'a2000000-0000-0000-0000-000000000000')
    and not exists (select 1 from public.ustnyy_items where user_id = 'a2000000-0000-0000-0000-000000000000')
    and not exists (select 1 from public.ustnyy_profiles where user_id = 'a2000000-0000-0000-0000-000000000000'),
    'после удаления аккаунта следов в устном счёте нет');
  raise notice 'ok 12: удаление аккаунта — каскадом';
end $$;
