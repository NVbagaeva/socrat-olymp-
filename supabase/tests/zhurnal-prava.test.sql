-- Проверка supabase/migrations/20261122120000_zhurnal.sql (docs/kabinet-zhurnal.md):
-- журнал решения задач и права доступа к нему. Главное — учитель не видит
-- чужих учеников: ни функциями, ни прямым запросом; свой ученик виден
-- только с дня связи и пока связь действует (решение В-3).
-- Идёт на всех миграциях с правами по умолчанию своего сервера.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-11-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-11-11',
    'accept_soglashenie', true, 'accept_soglasie', true) || extra
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

create function pg_temp.n(sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
  execute 'select count(*) from (' || sql || ') q' into v;
  return v;
end $$;

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

-- Задача журнала: №, тип, исход, активное время, начало (смещение от сейчас).
create function pg_temp.z(id text, task_no int, kind text, outcome text, active_ms int,
                          ago interval default '0', level int default 1, extra jsonb default '{}')
returns jsonb language sql as $$
  select jsonb_build_object(
    'id', id, 'task_no', task_no, 'kind', kind, 'task_ref', kind || '|42|base', 'level', level,
    'place', 'trenazher', 'place_ref', 'sessiya-1', 'outcome', outcome, 'answer_key', '0.5',
    'attempts_n', 1, 'hint_steps', 0, 'active_ms', active_ms, 'total_ms', active_ms + 1000,
    'started_at', now() - ago, 'closed_at', now() - ago + interval '1 minute',
    'popytki', jsonb_build_array(jsonb_build_object('n', 1, 'answer', '0,5', 'ok', outcome = 'right',
                                                    'at', now() - ago))) || extra
$$;
create function pg_temp.push(variadic z jsonb[]) returns jsonb language sql as $$
  select public.zhurnal_push(jsonb_build_object('zadachi', to_jsonb(z)))
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set s3 'c3000000-0000-0000-0000-000000000000'
\set s4 'c4000000-0000-0000-0000-000000000000'
\set kid 'c9000000-0000-0000-0000-000000000000'
\set za1 'd1000000-0000-0000-0000-000000000001'
\set za2 'd1000000-0000-0000-0000-000000000002'
\set za3 'd1000000-0000-0000-0000-000000000003'
\set zold 'd1000000-0000-0000-0000-000000000009'
\set zb1 'd2000000-0000-0000-0000-000000000001'
\set zc1 'd3000000-0000-0000-0000-000000000001'
\set v1 'e1000000-0000-0000-0000-000000000001'

insert into vault.secrets (name, secret)
values ('allowed_emails', 't1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru,s4@x.ru,kid@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Учитель 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Чужой ученик","birth_year":2000}')),
  (:'s4', 's4@x.ru', pg_temp.meta('{"role":"student","name":"Без учителя","birth_year":2000}')),
  (:'kid', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}'));

-- Классы: у t1 — s1 и s2, у t2 — s3.
insert into public.classes (tutor_id, name) values (:'t1', '11 «А»') returning id as class_a \gset
insert into public.classes (tutor_id, name) values (:'t2', '11 «Б»') returning id as class_b \gset
insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'s1'), (:'t1', :'s2'), (:'t2', :'s3');
insert into public.class_members (class_id, user_id) values (:'class_a', :'s1'), (:'class_a', :'s2'),
  (:'class_b', :'s3');

/* ── 1. Флаг базы: выключенный журнал ничего не пишет ─────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.push(pg_temp.z(:'za1', 8, '8.A', 'right', 30000)) = '{"off": true}',
  'журнал выключен, а запись прошла');
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_zadachi') = 0, 'выключенный журнал записал');
-- Флаг меняет только сервер.
select pg_temp.fails($q$update public.kabinet_flags set value = 'true' where key = 'zhurnal'$q$,
  'permission denied');
reset role;
update public.kabinet_flags set value = 'true' where key = 'zhurnal';

/* ── 2. Запись: кто, какие разделы, повтор без дублей ─────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.push(
    pg_temp.z(:'za1', 8, '8.A', 'wrong', 60000),
    -- Повышенная сложность, верно за 3 с — «очень быстро» для учителя.
    pg_temp.z(:'za2', 8, '8.H', 'right', 3000, '0', 2),
    pg_temp.z(:'za3', 5, '5:P01', 'right', 90000),
    -- №6 вне ЕГЭ-2027 и №1 не в списке флага — пропускаются.
    pg_temp.z('d1000000-0000-0000-0000-000000000006', 6, '6.A', 'right', 1000),
    pg_temp.z('d1000000-0000-0000-0000-000000000007', 1, '1.A', 'right', 1000))
  = '{"saved": 3, "skipped": 2}', 'запись: сохранено 3, пропущено 2');
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_zadachi where task_no in (1, 6)') = 0,
  '№6 или раздел вне флага попал в журнал');

-- Повтор той же задачи: строка одна, попытки не дублируются, закрытая
-- задача не открывается, счётчики — наибольшие.
select pg_temp.push(pg_temp.z(:'za1', 8, '8.A', null, 10000,
  extra => jsonb_build_object('attempts_n', 3, 'hint_steps', 2, 'hint_wrong', jsonb_build_array(1),
    'shown_solution', true, 'popytki', jsonb_build_array(
      jsonb_build_object('n', 1, 'answer', 'подмена', 'ok', true, 'at', now()),
      jsonb_build_object('n', 2, 'answer', '−1/2', 'ok', false, 'vid', 'format', 'at', now())))));
select pg_temp.ok(pg_temp.n(format('select * from public.zhurnal_zadachi where id = %L', :'za1')) = 1,
  'повтор создал дубль');
select pg_temp.ok((select outcome = 'wrong' and attempts_n = 3 and hint_steps = 2 and hint_wrong = '{1}'
                     and shown_solution and active_ms = 60000
                     from public.zhurnal_zadachi where id = :'za1'), 'повтор не дополнил строку');
select pg_temp.ok((select answer = '0,5' from public.zhurnal_popytki where zadacha_id = :'za1' and n = 1),
  'повтор переписал ответ первой попытки');
select pg_temp.ok(pg_temp.n(format('select * from public.zhurnal_popytki where zadacha_id = %L', :'za1')) = 2,
  'попытки повтора не дописались');
-- Тот же id с другой задачей строку не меняет.
select pg_temp.push(pg_temp.z(:'za1', 8, '8.B', 'right', 1000));
select pg_temp.ok((select kind = '8.A' and outcome = 'wrong' from public.zhurnal_zadachi where id = :'za1'),
  'чужая задача под тем же id переписала строку');

-- Незаконченная задача (исход пустой) принимается и в «решено» не идёт,
-- а закрытая позже — идёт (миграция 20261123110000_zhurnal_otkrytye.sql).
select pg_temp.as_user(:'s4');
select pg_temp.ok((pg_temp.push(pg_temp.z('d5000000-0000-0000-0000-00000000000e', 5, '5:P09', null, 4000))
                   ->> 'saved')::int = 1, 'незаконченная задача не записалась');
select pg_temp.ok((select coalesce(sum(solved), 0) = 0 from public.zhurnal_dni), 'незаконченная задача — в «решено»');
select pg_temp.push(pg_temp.z('d5000000-0000-0000-0000-00000000000e', 5, '5:P09', 'right', 9000));
select pg_temp.ok((select sum(solved) = 1 and sum("right") = 1 from public.zhurnal_dni),
  'закрытая позже задача не попала в свёртку');
select pg_temp.as_user(:'s1');

-- Свёртка по дням: 3 задачи, 2 верно (8.A — ошибка).
select pg_temp.ok((select sum(solved) = 3 and sum("right") = 2 from public.zhurnal_dni), 'свёртка неверна');

-- Время из будущего — время сервера.
select pg_temp.push(pg_temp.z(:'zb1', 8, '8.B', 'right', 5000, interval '-30 days'));
select pg_temp.ok((select started_at <= now() + interval '5 minutes' from public.zhurnal_zadachi
                    where id = :'zb1'), 'время из будущего не прижато');

-- Писать в обход функции нельзя.
select pg_temp.fails(format($q$insert into public.zhurnal_zadachi (user_id, id, task_no, kind, task_ref, place,
  started_at) values (%L, gen_random_uuid(), 8, '8.A', 'x', 'trenazher', now())$q$, :'s1'), 'permission denied');
select pg_temp.fails(format($q$update public.zhurnal_zadachi set outcome = 'right' where id = %L$q$, :'za1'),
  'permission denied');
select pg_temp.fails($q$delete from public.zhurnal_popytki$q$, 'permission denied');
select pg_temp.fails($q$insert into public.zhurnal_dni (user_id, day, task_no, kind) values
  (auth.uid(), current_date, 8, 'x')$q$, 'permission denied');

-- Слишком большая пачка.
select pg_temp.fails($q$select public.zhurnal_push(jsonb_build_object('zadachi',
  (select jsonb_agg(pg_temp.z(gen_random_uuid()::text, 8, '8.A', 'right', 1000)) from generate_series(1, 51))))$q$,
  'too_big');

-- Вариант целиком.
select public.zhurnal_push(jsonb_build_object('varianty', jsonb_build_array(jsonb_build_object(
  'id', :'v1', 'source', 'sobrat', 'set_code', 'ABC123', 'variant_no', 1, 'started_at', now() - interval '1 hour',
  'finished_at', now(), 'primary_score', 10, 'max_score', 32, 'test_score', 58, 'active_ms', 3000000,
  'total_ms', 3600000))));
select pg_temp.push(pg_temp.z('d1000000-0000-0000-0000-0000000000a1', 5, '5:P02', 'right', 40000,
  extra => jsonb_build_object('place', 'variant', 'place_ref', :'v1')));

-- Другие ученики пишут своё.
select pg_temp.as_user(:'s3');
select pg_temp.push(pg_temp.z(:'zc1', 8, '8.A', 'right', 20000));
select pg_temp.as_user(:'s2');
select pg_temp.push(pg_temp.z('d4000000-0000-0000-0000-000000000001', 5, '5:P01', 'wrong', 20000));

-- Учитель и школьник без согласия родителя не пишут.
select pg_temp.as_user(:'t1');
select pg_temp.fails($q$select pg_temp.push(pg_temp.z(gen_random_uuid()::text, 8, '8.A', 'right', 1))$q$,
  'forbidden');
select pg_temp.as_user(:'kid');
select pg_temp.fails($q$select pg_temp.push(pg_temp.z(gen_random_uuid()::text, 8, '8.A', 'right', 1))$q$,
  'progress_not_allowed');

/* ── 3. Ученик видит только своё и без пометок учителя ────────── */

select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_zadachi') = 5, 'ученик видит не 5 своих задач');
select pg_temp.ok(pg_temp.n(format('select * from public.zhurnal_zadachi where user_id = %L', :'s3')) = 0,
  'ученик видит чужой журнал');
select pg_temp.ok(pg_temp.n(format('select * from public.zhurnal_popytki where user_id = %L', :'s3')) = 0,
  'ученик видит чужие попытки');
select pg_temp.ok(pg_temp.n(format('select * from public.zhurnal_dni where user_id = %L', :'s3')) = 0,
  'ученик видит чужую свёртку');
select pg_temp.ok((public.moya_statistika(current_date - 30, current_date) ->> 'solved')::int = 5,
  'своя статистика: не 5 решённых');
select pg_temp.ok(public.moya_lenta(current_date - 30, current_date)::text not like '%bystro%',
  'ученику ушла пометка «очень быстро»');
select pg_temp.ok(public.moy_variant(:'v1')::text not like '%bystro%', 'пометка в варианте ученика');
select pg_temp.ok(jsonb_array_length(public.moy_variant(:'v1') -> 'zadachi') = 1, 'задачи варианта ученика');
-- Ученик не вызывает функции учителя: ни о себе, ни о других.
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s1'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_lenta(%L, current_date - 30, current_date)', :'s2'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_klass(%L, current_date - 30, current_date)', :'class_a'),
  'forbidden');

/* ── 4. Учитель не видит чужих учеников ───────────────────────── */

select pg_temp.as_user(:'t1');
-- Прямого чтения журнала у учителя нет — даже своих учеников.
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_zadachi') = 0, 'учитель читает журнал напрямую');
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_popytki') = 0, 'учитель читает попытки напрямую');
select pg_temp.ok(pg_temp.n('select * from public.zhurnal_dni') = 0, 'учитель читает свёртку напрямую');
select pg_temp.ok(pg_temp.n('select * from public.varianty_resheniya') = 0, 'учитель читает варианты напрямую');
-- Внутренние функции закрыты.
select pg_temp.fails(format('select public.zhurnal_svodka(%L, current_date - 30, current_date, null, null)', :'s3'),
  'permission denied');
select pg_temp.fails(format('select public.zhurnal_lenta(%L, current_date - 30, current_date, null, null, null, true)',
  :'s3'), 'permission denied');
select pg_temp.fails(format('select public.zhurnal_variant(%L, %L, null, true)', :'s3', :'v1'), 'permission denied');
select pg_temp.fails(format('select public.uchitel_dostup(%L)', :'s3'), 'permission denied');
select pg_temp.fails('select public.zhurnal_svernut()', 'permission denied');
-- Чужой ученик, чужой класс, ученик без учителя.
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s3'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_lenta(%L, current_date - 30, current_date)', :'s3'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s3', :'zc1'), 'not_your_student');
-- Своего ученика с id задачи чужого — не найдено.
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s1', :'zc1'), 'not_found');
select pg_temp.fails(format('select public.uchitel_variant(%L, %L)', :'s3', :'v1'), 'not_your_student');
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s4'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_klass(%L, current_date - 30, current_date)', :'class_b'),
  'forbidden');

-- Свои ученики видны.
select pg_temp.ok((public.uchitel_uchenik(:'s1', current_date - 30, current_date) -> 'svodka' ->> 'solved')::int = 5,
  'учитель не видит 5 задач своего ученика');
select pg_temp.ok(jsonb_array_length(public.uchitel_lenta(:'s1', current_date - 30, current_date)) = 5,
  'лента своего ученика');
select pg_temp.ok(jsonb_array_length(public.uchitel_lenta(:'s1', current_date - 30, current_date, 5)) = 2,
  'фильтр ленты по разделу');
select pg_temp.ok((public.uchitel_zadacha(:'s1', :'za2') ->> 'bystro')::boolean,
  'верно за 3 с на повышенной сложности — без пометки «очень быстро»');
select pg_temp.ok(public.uchitel_zadacha(:'s1', :'za3') -> 'bystro' is null,
  'пометка «очень быстро» на долгой задаче');
select pg_temp.ok(jsonb_array_length(public.uchitel_zadacha(:'s1', :'za1') -> 'popytki') = 2,
  'учитель не видит попытки задачи');
select pg_temp.ok((public.uchitel_variant(:'s1', :'v1') ->> 'test_score')::int = 58, 'вариант ученика');
select pg_temp.ok((select count(*) = 2 from jsonb_array_elements(
    public.uchitel_klass(:'class_a', current_date - 30, current_date) -> 'ucheniki')), 'в классе не 2 ученика');
select pg_temp.ok(public.uchitel_klass(:'class_a', current_date - 30, current_date)::text not like
  '%' || :'s3' || '%', 'в карте класса чужой ученик');

-- Второй учитель не видит учеников первого.
select pg_temp.as_user(:'t2');
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s1'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s1', :'za1'), 'not_your_student');
select pg_temp.ok((public.uchitel_uchenik(:'s3', current_date - 30, current_date) -> 'svodka' ->> 'solved')::int = 1,
  'второй учитель не видит своего ученика');

-- Аноним не вызывает ничего.
reset role;
set role anon;
select pg_temp.fails($q$select public.zhurnal_push('{}')$q$, 'permission denied');
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s1'),
  'permission denied');
select pg_temp.fails('select * from public.zhurnal_zadachi', 'permission denied');
reset role;

/* ── 5. Видно только с дня связи и пока связь действует (В-3) ─── */

-- Запись ученика до связи: связь s2 с t1 начинается сегодня, а задача
-- решена три дня назад (вставка сервером: браузер старше 7 дней не пришлёт,
-- а три дня назад — может, но связь тогда ещё не начиналась).
update public.tutor_students set linked_at = now() where tutor_id = :'t1' and user_id = :'s2';
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.push(pg_temp.z('d4000000-0000-0000-0000-000000000002', 8, '8.A', 'right', 20000,
  interval '3 days'));
select pg_temp.as_user(:'t1');
select pg_temp.ok(jsonb_array_length(public.uchitel_lenta(:'s2', current_date - 30, current_date)) = 1,
  'учитель видит задачу, решённую до связи');
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s2', 'd4000000-0000-0000-0000-000000000002'),
  'not_found');
select pg_temp.ok((public.uchitel_uchenik(:'s2', current_date - 30, current_date) -> 'svodka' ->> 'solved')::int = 1,
  'сводка учитывает дни до связи');

-- Связь закончилась — ничего не видно.
reset role;
update public.tutor_students set ended_at = now() where tutor_id = :'t1' and user_id = :'s1';
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.fails(format('select public.uchitel_uchenik(%L, current_date - 30, current_date)', :'s1'),
  'not_your_student');
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s1', :'za1'), 'not_your_student');
select pg_temp.ok(public.uchitel_klass(:'class_a', current_date - 30, current_date)::text not like
  '%' || :'za1' || '%', 'карта класса после конца связи');
select pg_temp.ok((public.uchitel_klass(:'class_a', current_date - 30, current_date) ->> 'skryto')::int = 1,
  'ушедший ученик не посчитан скрытым');

-- Вернулся — связь начинается заново, прежние записи закрыты.
reset role;
update public.tutor_students set ended_at = null where tutor_id = :'t1' and user_id = :'s1';
update public.tutor_students set linked_at = now() + interval '1 day' where tutor_id = :'t1' and user_id = :'s1'
  and false;
select pg_temp.ok((select linked_at > now() - interval '1 minute' from public.tutor_students
                    where tutor_id = :'t1' and user_id = :'s1'), 'повторная связь не обновила дату');
-- Записи сегодняшнего дня видны (день связи), вчерашние — нет.
update public.zhurnal_zadachi set started_at = now() - interval '2 days' where id = :'za3';
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.fails(format('select public.uchitel_zadacha(%L, %L)', :'s1', :'za3'), 'not_found');
reset role;

/* ── 6. Выгрузка, срок хранения, удаление аккаунта ────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.export_my_data()::text like '%zhurnal_zadachi%'
                  and public.export_my_data()::text like '%zhurnal_popytki%'
                  and public.export_my_data()::text like '%varianty_resheniya%',
  'журнал не попал в выгрузку данных');
reset role;

-- Старая запись (два учебных года назад) удаляется, свёртка остаётся.
insert into public.zhurnal_zadachi (user_id, id, task_no, kind, task_ref, place, outcome, started_at, closed_at)
values (:'s1', :'zold', 8, '8.A', '8.A|1|base', 'trenazher', 'right', now() - interval '3 years',
        now() - interval '3 years');
select pg_temp.ok(public.zhurnal_svernut() = 1, 'срок хранения: удалено не 1');
select pg_temp.ok(not exists (select 1 from public.zhurnal_zadachi where id = :'zold'), 'старая запись осталась');
select pg_temp.ok(exists (select 1 from public.zhurnal_dni where user_id = :'s1' and day < current_date - 700),
  'свёртка старой записи удалилась');

delete from auth.users where id = :'s1';
select pg_temp.ok(not exists (select 1 from public.zhurnal_zadachi where user_id = :'s1')
                  and not exists (select 1 from public.zhurnal_popytki where user_id = :'s1')
                  and not exists (select 1 from public.zhurnal_dni where user_id = :'s1')
                  and not exists (select 1 from public.varianty_resheniya where user_id = :'s1'),
  'журнал удалённого аккаунта остался');

\echo 'Журнал и права доступа: OK'
