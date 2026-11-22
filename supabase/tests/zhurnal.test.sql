-- Проверка supabase/migrations/20261122120000_zhurnal.sql: приём пачки
-- журнала, повтор без дублей, итоги из событий, границы времени, итог
-- за день, своя статистика, свёртка. Начало — zhurnal-setup.sql.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

/* ── 1. Кто пишет ──────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001')))$$,
  'forbidden');
select pg_temp.as_user('c9000000-0000-0000-0000-000000000000');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001')))$$,
  'progress_not_allowed');
reset role;
set role anon;
select pg_temp.fails($$select public.journal_push('{}'::jsonb)$$, 'permission denied');
reset role;
select pg_temp.ok((select count(*) from public.task_runs) = 0, 'записи появились без права');
do $$ begin raise notice 'ok 1: журнал пишет только ученик с правом сохранять прогресс'; end $$;

/* ── 2. Задача, действия, итог ─────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');

-- Открытая задача: неверный ответ и первый шаг подсказки.
select pg_temp.ok(
  pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001', '{}',
    jsonb_build_array(pg_temp.ev(1, 'attempt', ' 0,6 ', false, null, 9000),
                      pg_temp.ev(2, 'hint_open'),
                      pg_temp.ev(3, 'hint_step', null, null, 1),
                      pg_temp.ev(4, 'hint_miss', null, null, 2)))))
  = '{"runs":1,"events":4,"works":0}'::jsonb, 'первая пачка принята не так');
reset role;
select pg_temp.ok((select outcome = 'open' and attempts = 1 and first_right = false
    and last_answer = ' 0,6 ' and hint_steps = 1 and hint_miss_step = 2 and closed_at is null
  from public.task_runs where id = 'd1000000-0000-0000-0000-000000000001'), 'итоги открытой задачи');

-- Продолжение: верный ответ, закрытие. Время: общее 40 с, активное 25 с.
set role authenticated;
select pg_temp.ok(
  pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001',
    jsonb_build_object('closed_at', now() - interval '10 seconds', 'outcome', 'hinted',
                       'total_ms', 40000, 'active_ms', 25000),
    jsonb_build_array(pg_temp.ev(4, 'hint_miss', null, null, 2),
                      pg_temp.ev(5, 'attempt', '0,5', true, null, 25000)))))
  = '{"runs":0,"events":1,"works":0}'::jsonb, 'продолжение принято не так');
reset role;
select pg_temp.ok((select outcome = 'hinted' and attempts = 2 and first_right = false
    and last_answer = '0,5' and total_ms = 40000 and active_ms = 25000 and closed_at is not null
    and snapshot_hash is not null
  from public.task_runs where id = 'd1000000-0000-0000-0000-000000000001'), 'итоги закрытой задачи');
select pg_temp.ok((select count(*) from public.task_events
  where run_id = 'd1000000-0000-0000-0000-000000000001') = 5, 'действий должно быть пять');
do $$ begin raise notice 'ok 2: каждая попытка, шаги подсказки и вопрос с ошибкой записаны; итог считает база'; end $$;

/* ── 3. Повтор ничего не меняет ────────────────────────────────── */

set role authenticated;
select pg_temp.ok(
  pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001',
    jsonb_build_object('closed_at', now(), 'outcome', 'right', 'total_ms', 1, 'active_ms', 1),
    jsonb_build_array(pg_temp.ev(6, 'attempt', '7', true)))))
  = '{"runs":0,"events":0,"works":0}'::jsonb, 'закрытая задача изменилась повтором');
reset role;
select pg_temp.ok((select outcome = 'hinted' and attempts = 2 and total_ms = 40000
  from public.task_runs where id = 'd1000000-0000-0000-0000-000000000001'), 'закрытая задача переписана');
select pg_temp.ok((select count(*) from public.task_snapshots) = 1, 'снимок задвоился');

-- Та же задача второй раз — второй показ, но снимок тот же.
set role authenticated;
select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000002',
  jsonb_build_object('closed_at', now(), 'outcome', 'skipped', 'total_ms', 3000, 'active_ms', 3000),
  jsonb_build_array(pg_temp.ev(1, 'skip')))));
reset role;
select pg_temp.ok((select count(*) from public.task_snapshots) = 1, 'одинаковые задачи — один снимок');
select pg_temp.ok((select count(*) from public.task_runs) = 2, 'показов должно быть два');
do $$ begin raise notice 'ok 3: повтор пачки не создаёт дублей и не меняет закрытую задачу; снимки без повторов'; end $$;

/* ── 4. Границы ────────────────────────────────────────────────── */

set role authenticated;
-- Активное больше общего и общее больше промежутка — обрезаются.
select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000003',
  jsonb_build_object('closed_at', now(), 'outcome', 'right', 'total_ms', 99999999, 'active_ms', 99999999,
                     'started_at', now() - interval '20 seconds'),
  jsonb_build_array(pg_temp.ev(1, 'attempt', '0,5', true)))));
-- Время из будущего считается «сейчас».
select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000004',
  jsonb_build_object('started_at', now() + interval '3 days'))));
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000005',
  jsonb_build_object('started_at', now() - interval '90 days'))))$$, 'too_old');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000005',
  '{"task_no": 77}')))$$, 'bad_task_no');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000005',
  '{"source": "elsewhere"}')))$$, 'task_runs_source_check');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000005',
  jsonb_build_object('closed_at', now()))))$$, 'bad_outcome');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000005',
  '{"work_id": "e0000000-0000-0000-0000-00000000dead"}')))$$, 'not_your_work');
select pg_temp.fails($$select pg_temp.push((select jsonb_agg(pg_temp.run(gen_random_uuid()::text))
  from generate_series(1, 51)))$$, 'too_many');
-- Чужую задачу не дописать.
select pg_temp.as_user('c3000000-0000-0000-0000-000000000000');
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000004', '{}',
  jsonb_build_array(pg_temp.ev(1, 'attempt', '1', true)))))$$, 'not_yours');
-- В обход функции не записать.
select pg_temp.fails($$insert into public.task_events (run_id, user_id, seq, type, at)
  values ('d1000000-0000-0000-0000-000000000004', auth.uid(), 9, 'skip', now())$$, 'permission denied');
select pg_temp.fails($$update public.task_runs set outcome = 'right'$$, 'permission denied');
select pg_temp.fails($$delete from public.task_runs$$, 'permission denied');
reset role;
select pg_temp.ok((select total_ms between 20000 and 26000 and active_ms = total_ms
  from public.task_runs where id = 'd1000000-0000-0000-0000-000000000003'), 'время не обрезано');
select pg_temp.ok((select started_at <= now() from public.task_runs
  where id = 'd1000000-0000-0000-0000-000000000004'), 'время из будущего осталось');
select pg_temp.ok((select count(*) from public.task_runs) = 4, 'лишние задачи после отказов');
do $$ begin raise notice 'ok 4: время в границах, чужое и в обход функции — отказ'; end $$;

/* ── 5. Вариант ────────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select pg_temp.ok(
  pg_temp.push(
    jsonb_build_array(
      pg_temp.run('d2000000-0000-0000-0000-000000000001',
        jsonb_build_object('source', 'variant', 'work_id', 'e1000000-0000-0000-0000-000000000001',
          'position', 1, 'closed_at', now(), 'outcome', 'right', 'total_ms', 30000, 'active_ms', 20000),
        jsonb_build_array(pg_temp.ev(1, 'attempt', '0,5', true))),
      pg_temp.run('d2000000-0000-0000-0000-000000000002',
        jsonb_build_object('source', 'variant', 'work_id', 'e1000000-0000-0000-0000-000000000001',
          'position', 2, 'task_no', 5, 'kind', 'klassika', 'ref', 'p1:3',
          'closed_at', now(), 'outcome', 'wrong', 'total_ms', 20000, 'active_ms', 20000,
          'snapshot', jsonb_build_object('statement', '<p>В случайном эксперименте…</p>', 'answer', '0.25')),
        jsonb_build_array(pg_temp.ev(1, 'attempt', '0,3', false)))),
    jsonb_build_array(jsonb_build_object('id', 'e1000000-0000-0000-0000-000000000001', 'kind', 'sobrat',
      'code', 'AB12-CD', 'variant', 1, 'mode', 'trening', 'title', 'Вариант 1',
      'started_at', now() - interval '1 minute', 'finished_at', now(),
      'primary', 1, 'max', 2, 'test', 6, 'total_ms', 50000, 'active_ms', 40000)))
  = '{"runs":2,"events":2,"works":1}'::jsonb, 'вариант принят не так');
reset role;
select pg_temp.ok((select primary_score = 1 and max_score = 2 and test_score = 6 and active_ms = 40000
  from public.work_results where id = 'e1000000-0000-0000-0000-000000000001'), 'результат варианта');
select pg_temp.ok((select count(*) = 2 and bool_and(position is not null) from public.task_runs
  where work_id = 'e1000000-0000-0000-0000-000000000001'), 'задачи варианта');
do $$ begin raise notice 'ok 5: вариант — баллы, время и задачи с ответами'; end $$;

/* ── 6. Итог за день и своя статистика ─────────────────────────── */

select pg_temp.ok((select runs = 5 and closed = 4 and right_count = 3
  from public.activity_days where user_id = 'c1000000-0000-0000-0000-000000000000' and task_no = 8),
  'итог дня по №8');
set role authenticated;
do $$
declare v jsonb := public.my_summary(current_date - 7, current_date + 1);
begin
  perform pg_temp.ok((v ->> 'solved')::int = 3, 'решено: ' || (v ->> 'solved'));
  perform pg_temp.ok(jsonb_array_length(v -> 'tasks') = 2, 'заданий в сводке: ' || (v -> 'tasks')::text);
  perform pg_temp.ok(jsonb_array_length(v -> 'works') = 1, 'вариантов в сводке');
  perform pg_temp.ok((v ->> 'active_ms')::bigint > 0, 'активное время пусто');
end $$;
-- Чужая сводка пуста: функция считает только своё.
select pg_temp.as_user('c3000000-0000-0000-0000-000000000000');
select pg_temp.ok((public.my_summary(current_date - 7, current_date + 1) ->> 'solved')::int = 0,
  'в сводку попало чужое');
reset role;
do $$ begin raise notice 'ok 6: итог за день и сводка ученика'; end $$;

/* ── 7. Выгрузка, свёртка, удаление аккаунта ───────────────────── */

set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select pg_temp.ok(jsonb_array_length(public.export_my_data() -> 'task_runs') = 6
  and jsonb_array_length(public.export_my_data() -> 'task_events') > 0
  and jsonb_array_length(public.export_my_data() -> 'work_results') = 1, 'журнала нет в выгрузке данных');
select pg_temp.fails($$select public.journal_fold()$$, 'permission denied');
reset role;
update public.task_events set at = now() - interval '13 months'
 where run_id = 'd1000000-0000-0000-0000-000000000001';
select pg_temp.ok(public.journal_fold() = 5, 'свёртка убрала не те строки');
select pg_temp.ok((select attempts = 2 and outcome = 'hinted' from public.task_runs
  where id = 'd1000000-0000-0000-0000-000000000001'), 'после свёртки итог должен остаться');

set role authenticated;
select public.delete_my_account();
reset role;
select pg_temp.ok((select count(*) from public.task_runs where user_id = 'c1000000-0000-0000-0000-000000000000') = 0
  and (select count(*) from public.task_events where user_id = 'c1000000-0000-0000-0000-000000000000') = 0
  and (select count(*) from public.work_results where user_id = 'c1000000-0000-0000-0000-000000000000') = 0
  and (select count(*) from public.activity_days where user_id = 'c1000000-0000-0000-0000-000000000000') = 0,
  'после удаления аккаунта журнал остался');

do $$
declare bad text;
begin
  select string_agg(conrelid::regclass::text, ', ') into bad
  from pg_constraint
  where contype = 'f' and confrelid = 'auth.users'::regclass and confdeltype <> 'c';
  perform pg_temp.ok(bad is null, 'ссылки на auth.users без каскада: ' || coalesce(bad, ''));
  raise notice 'ok 7: журнал в выгрузке данных, свёртка оставляет итоги, удаление аккаунта каскадом';
end $$;
