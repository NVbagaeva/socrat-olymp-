-- Проверка supabase/migrations/20261025120000_variant_works.sql: онлайн-вариант
-- через кабинет — выдача, решение, проверка в базе, ключ закрыт от ученика.
-- Таблицу случаев нормализации (общую с сайтом, lib/variant/online/
-- normalizeCases.json) runner дописывает в начало этого файла временной
-- таблицей pg_temp.normalize_cases (scripts/check-soglasiya-sql.mjs).
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-10-15');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-15',
    'accept_soglashenie', true, 'accept_soglasie', true, 'signup_ip', '203.0.113.7') || extra
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

-- Люди: администратор, два репетитора, класс; ученики — в классе, отдельный
-- и чужой (у второго репетитора).
insert into auth.users (id, email, raw_user_meta_data)
values ('a0000000-0000-0000-0000-000000000000', 'admin@x.ru',
        pg_temp.meta('{"role":"admin","name":"Наталья","bootstrap_admin":true}'));
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000000', false);
select public.create_invitation('tutor') as tutor_code \gset
select public.create_invitation('tutor') as tutor2_code \gset
reset role;
insert into auth.users (id, email, raw_user_meta_data)
values ('b1000000-0000-0000-0000-000000000000', 't1@x.ru',
        pg_temp.meta(jsonb_build_object('name', 'Репетитор 1', 'invite_code', :'tutor_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('b2000000-0000-0000-0000-000000000000', 't2@x.ru',
        pg_temp.meta(jsonb_build_object('name', 'Репетитор 2', 'invite_code', :'tutor2_code')));
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
insert into public.classes (tutor_id, name) values ('b1000000-0000-0000-0000-000000000000', '11 «А»')
returning id as class_id \gset
select public.create_invitation('student', :'class_id') as s1_code \gset
select public.create_invitation('student') as s2_code \gset
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select public.create_invitation('student') as s3_code \gset
reset role;
insert into auth.users (id, email, raw_user_meta_data)
values ('c1000000-0000-0000-0000-000000000000', 's1@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Ученик 1','birth_year',2000,'invite_code',:'s1_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('c2000000-0000-0000-0000-000000000000', 's2@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Ученик 2','birth_year',2000,'invite_code',:'s2_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('c3000000-0000-0000-0000-000000000000', 's3@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Чужой','birth_year',2000,'invite_code',:'s3_code')));

-- 1. Нормализация ответа в базе — та же таблица случаев, что у сайта.
do $$
declare c record; n int := 0;
begin
  for c in select * from pg_temp.normalize_cases loop
    if public.normalize_ege_answer(c.input) is distinct from c.expected then
      raise exception 'FAIL: normalize_ege_answer(%) = %, ждали %',
        quote_literal(c.input), public.normalize_ege_answer(c.input), coalesce(c.expected, 'null');
    end if;
    n := n + 1;
  end loop;
  if n < 30 then raise exception 'FAIL: случаев нормализации всего %', n; end if;
  raise notice 'ok 1: нормализация ответа совпадает с сайтом (% случаев)', n;
end $$;

-- Работа: 2 варианта по 3 задания; ключ — «0,5», «−3», «12».
create function pg_temp.work(mode text, extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object(
    'title', 'Пробный ЕГЭ', 'kind', 'probnik', 'set_code', 'K7M2-1Z0GH-4F', 'mode', mode,
    'timer_kind', 'none',
    'variants', jsonb_build_array(
      jsonb_build_object('variant', 1, 'set_variant', 4, 'tasks', jsonb_build_array(
        jsonb_build_object('position', 1, 'ege_no', 4, 'prototype_id', 'p4-01', 'task_ref', 'p4-01-1',
                           'statement', '<p>Задача 1</p>', 'answer', '0,50',
                           'hints', '[{"question":"Что ищем?","options":["a","b"],"correct":1,"comment":null}]'::jsonb),
        jsonb_build_object('position', 2, 'ege_no', 9, 'prototype_id', '9.1.1', 'task_ref', '9.1.1#1',
                           'statement', '<p>Задача 2</p>', 'figure', '<svg/>', 'answer', '−3'),
        jsonb_build_object('position', 3, 'ege_no', 12, 'prototype_id', '12.A', 'task_ref', '12.A-1',
                           'statement', '<p>Задача 3</p>', 'answer', '12', 'points', 2))),
      jsonb_build_object('variant', 2, 'set_variant', 7, 'tasks', jsonb_build_array(
        jsonb_build_object('position', 1, 'ege_no', 4, 'prototype_id', 'p4-01', 'task_ref', 'p4-01-2',
                           'statement', '<p>Задача 1 в2</p>', 'answer', '7'))))
  ) || extra
$$;

-- 2. Выдаёт только репетитор, своим ученикам; неверный ключ не примется.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.issue_variant_work(pg_temp.work('trening'))$q$, 'forbidden');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.issue_variant_work(pg_temp.work('trening',
  '{"student_ids":["c3000000-0000-0000-0000-000000000000"]}'))$q$, 'not_your_student');
select pg_temp.fails($q$select public.issue_variant_work(pg_temp.work('trening') ||
  jsonb_build_object('variants', '[{"variant":1,"tasks":[{"position":1,"ege_no":4,"prototype_id":"p",
    "task_ref":"t","statement":"x","answer":"1/2"}]}]'::jsonb, 'student_ids', '["c2000000-0000-0000-0000-000000000000"]'::jsonb))$q$,
  'bad_answer');
select pg_temp.fails($q$select public.issue_variant_work(pg_temp.work('trening'))$q$, 'no_recipients');
select public.issue_variant_work(pg_temp.work('trening', jsonb_build_object('class_id', :'class_id',
  'student_ids', '["c2000000-0000-0000-0000-000000000000"]'::jsonb))) as tw \gset
select public.issue_variant_work(pg_temp.work('kontrol', jsonb_build_object('class_id', :'class_id',
  'timer_kind', 'down', 'timer_minutes', 90))) as kw \gset
select pg_temp.ok((select count(*) = 2 from public.variant_work_recipients where work_id = :'tw'),
  'получатели тренировки: класс + отдельный ученик');
select pg_temp.ok((select set_variants = '{4,7}' from public.variant_works where id = :'tw'),
  'номера вариантов в партии сохранены');
select pg_temp.ok((select answer from public.variant_work_keys
                    where work_id = :'tw' and variant = 1 and position = 2) = '-3',
  'репетитор видит ключ своей работы, ответ в нормальной записи');
do $$ begin raise notice 'ok 2: выдаёт репетитор своим ученикам, ключ в формате ЕГЭ'; end $$;

-- 3. Ученик видит условия, но не ключ; чужой не видит ничего.
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.ok((select count(*) = 4 from public.variant_work_tasks where work_id = :'tw'), 'ученик видит условия');
select pg_temp.ok((select count(*) = 0 from public.variant_work_keys), 'ученик не видит ключ');
select set_config('request.jwt.claim.sub', 'c3000000-0000-0000-0000-000000000000', false);
select pg_temp.ok((select count(*) = 0 from public.variant_work_tasks), 'чужой ученик не видит условий');
select pg_temp.fails(format($q$select public.variant_start(%L, 1::smallint)$q$, :'tw'), 'not_your_work');
do $$ begin raise notice 'ok 3: условия — получателям, ключ — никому из учеников'; end $$;

-- 4. Тренировка: проверка сразу, подсказка после ошибки, вторая попытка,
--    в баллы — первая; неверная запись попытку не тратит.
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select public.variant_start(:'tw', 1::smallint) as ta \gset
select pg_temp.ok(public.variant_start(:'tw', 1::smallint) = :'ta', 'незавершённая попытка продолжается');
select pg_temp.ok(public.variant_check(:'ta', 1::smallint, '1/2') ->> 'verdict' = 'format', 'дробь — неверная запись');
select pg_temp.ok(public.variant_check(:'ta', 1::smallint, '0,5') ->> 'verdict' = 'right', '0,5 = 0,50');
select pg_temp.fails(format($q$select public.variant_check(%L, 1::smallint, '0.5')$q$, :'ta'), 'already_checked');
do $$ declare r jsonb; begin
  r := public.variant_check((select id from public.variant_attempts
                              where user_id = auth.uid() and finished_at is null), 2::smallint, '3');
  perform pg_temp.ok(r ->> 'verdict' = 'wrong' and jsonb_typeof(r -> 'hints') = 'array', 'ошибка — подсказки');
end $$;
select pg_temp.ok(public.variant_check(:'ta', 2::smallint, '-3,0') ->> 'verdict' = 'right', 'вторая попытка верна');
select pg_temp.fails(format($q$select public.variant_check(%L, 2::smallint, '-3')$q$, :'ta'), 'already_checked');
select pg_temp.ok((select count(*) = 0 from public.variant_work_keys), 'ключ закрыт и во время работы');
select public.variant_submit(:'ta', '[null, null, "12"]', '[30, 45, 60]', '{2}') as tr \gset
select pg_temp.ok((:'tr'::jsonb ->> 'primary')::int = 3 and (:'tr'::jsonb ->> 'max')::int = 4,
  'баллы: №1 (1) + №3 (2); №2 исправлен со второй попытки — не в баллы');
select pg_temp.ok((:'tr'::jsonb -> 'tasks' -> 1 ->> 'key') = '-3'
              and (:'tr'::jsonb -> 'tasks' -> 1 ->> 'right')::boolean = false
              and (:'tr'::jsonb -> 'tasks' -> 1 ->> 'second_right')::boolean
              and (:'tr'::jsonb -> 'tasks' -> 1 ->> 'hinted')::boolean,
  'итог: ключ после завершения, вторая попытка и подсказка записаны');
select pg_temp.ok((:'tr'::jsonb ->> 'seconds')::int = 135, 'время — сумма по заданиям');
select pg_temp.fails(format($q$select public.variant_check(%L, 3::smallint, '12')$q$, :'ta'), 'already_finished');
do $$ begin raise notice 'ok 4: тренировка — сразу, подсказка, вторая попытка, в баллы первая'; end $$;

-- 5. Контрольная: до завершения не проверяется; отсчёт — в базе.
select public.variant_start(:'kw', 2::smallint) as ka \gset
select pg_temp.ok((select deadline_at between now() + interval '89 minutes' and now() + interval '91 minutes'
                     from public.variant_attempts where id = :'ka'), 'отсчёт 90 минут поставила база');
select pg_temp.fails(format($q$select public.variant_check(%L, 1::smallint, '7')$q$, :'ka'), 'kontrol');
select public.variant_save_draft(:'ka', '{"answers":{"0":"7"},"later":[0]}');
select pg_temp.ok((select first_right is null from public.variant_answers where attempt_id = :'ka'),
  'до завершения верно/неверно нет');
select public.variant_submit(:'ka', '["7,000"]', '[100]') as kr \gset
select pg_temp.ok((:'kr'::jsonb ->> 'primary')::int = 1 and not (:'kr'::jsonb ->> 'late')::boolean, 'контрольная: верно, в срок');
do $$ begin raise notice 'ok 5: контрольная — проверка только при завершении, отсчёт в базе'; end $$;

-- 6. Репетитор видит попытки и итог своих работ; второй репетитор — нет.
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select pg_temp.ok((select count(*) = 2 from public.variant_attempts), 'репетитор видит попытки учеников');
select pg_temp.ok((public.variant_result(:'ta') ->> 'primary')::int = 3, 'репетитор открывает итог');
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select pg_temp.ok((select count(*) = 0 from public.variant_attempts), 'чужой репетитор попыток не видит');
select pg_temp.fails(format($q$select public.variant_result(%L)$q$, :'ta'), 'not_your_attempt');
select pg_temp.ok((select count(*) = 0 from public.variant_work_keys), 'чужой репетитор ключ не видит');
do $$ begin raise notice 'ok 6: итоги — ученику и его репетитору'; end $$;

-- 7. Писать напрямую нельзя: ни ответы, ни баллы.
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$update public.variant_attempts set primary_score = 99$q$, 'permission denied');
select pg_temp.fails($q$insert into public.variant_answers (attempt_id, user_id, position)
  values (gen_random_uuid(), auth.uid(), 1)$q$, 'permission denied');
do $$ begin raise notice 'ok 7: попытки и баллы пишут только функции'; end $$;

-- 8. Выгрузка и удаление ученика — с попытками варианта.
do $$ declare d jsonb := public.export_my_data(); begin
  perform pg_temp.ok(jsonb_array_length(d -> 'variant_attempts') = 2
                 and jsonb_array_length(d -> 'variant_answers') = 4, 'выгрузка с попытками варианта');
end $$;
select public.delete_my_account();
reset role;
do $$ declare bad text; begin
  perform pg_temp.ok(not exists (select 1 from public.variant_attempts
                                  where user_id = 'c1000000-0000-0000-0000-000000000000'), 'попытки удалены');
  select string_agg(conrelid::regclass::text, ', ') into bad
  from pg_constraint
  where contype = 'f' and confrelid = 'auth.users'::regclass and confdeltype <> 'c'
    and connamespace = 'public'::regnamespace;
  if bad is not null then raise exception 'FAIL: без ON DELETE CASCADE: %', bad; end if;
  raise notice 'ok 8: выгрузка и удаление ученика — с попытками варианта';
end $$;
