-- Права доступа к журналу (supabase/migrations/20261122120000_zhurnal.sql):
-- учитель видит только своих учеников — и только пока ученик у него.
-- Проверяется чтение таблиц напрямую: правило стоит в базе, а не в
-- интерфейсе. Начало — zhurnal-setup.sql.

/* Журнал у трёх учеников: s1 (репетитор 1), s2 (репетитор 2), s3 (ничей). */
set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select pg_temp.push(
  jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001',
    jsonb_build_object('work_id', 'e1000000-0000-0000-0000-000000000001', 'source', 'variant',
      'closed_at', now(), 'outcome', 'right', 'total_ms', 9000, 'active_ms', 9000),
    jsonb_build_array(pg_temp.ev(1, 'attempt', '0,5', true)))),
  jsonb_build_array(jsonb_build_object('id', 'e1000000-0000-0000-0000-000000000001', 'kind', 'sobrat',
    'started_at', now() - interval '1 minute', 'finished_at', now(), 'primary', 1, 'max', 1)));
select pg_temp.as_user('c2000000-0000-0000-0000-000000000000');
select pg_temp.push(jsonb_build_array(pg_temp.run('d2000000-0000-0000-0000-000000000001',
  jsonb_build_object('closed_at', now(), 'outcome', 'wrong', 'total_ms', 9000, 'active_ms', 9000,
    'snapshot', jsonb_build_object('statement', '<p>Задача второго ученика</p>', 'answer', '7')),
  jsonb_build_array(pg_temp.ev(1, 'attempt', '8', false)))));
select pg_temp.as_user('c3000000-0000-0000-0000-000000000000');
select pg_temp.push(jsonb_build_array(pg_temp.run('d3000000-0000-0000-0000-000000000001',
  jsonb_build_object('snapshot', jsonb_build_object('statement', '<p>Задача третьего ученика</p>', 'answer', '9')))));
reset role;

/* ── 1. Репетитор видит своего и только своего ─────────────────── */

set role authenticated;
select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 1
  and pg_temp.n($$select 1 from public.task_runs where user_id = 'c1000000-0000-0000-0000-000000000000'$$) = 1,
  'репетитор 1: задачи');
select pg_temp.ok(pg_temp.n('select 1 from public.task_events') = 1, 'репетитор 1: действия');
select pg_temp.ok(pg_temp.n('select 1 from public.work_results') = 1, 'репетитор 1: варианты');
select pg_temp.ok(pg_temp.n('select 1 from public.activity_days') = 1, 'репетитор 1: дни');
select pg_temp.ok(pg_temp.n('select hash from public.task_snapshots') = 1, 'репетитор 1: снимки');
-- Чужие — ни по одному пути, в том числе по известному идентификатору.
select pg_temp.ok(pg_temp.n($$select 1 from public.task_runs where id = 'd2000000-0000-0000-0000-000000000001'$$) = 0
  and pg_temp.n($$select 1 from public.task_events where run_id = 'd2000000-0000-0000-0000-000000000001'$$) = 0
  and pg_temp.n($$select 1 from public.task_runs where user_id = 'c3000000-0000-0000-0000-000000000000'$$) = 0
  and pg_temp.n($$select 1 from public.activity_days where user_id <> 'c1000000-0000-0000-0000-000000000000'$$) = 0
  and pg_temp.n($$select hash from public.task_snapshots where statement_html like '%второго%' or statement_html like '%третьего%'$$) = 0,
  'репетитор 1 видит чужих учеников');
-- Чужая сводка функцией не открывается: my_summary считает только своё.
select pg_temp.ok((public.my_summary(current_date - 7, current_date + 1) ->> 'solved')::int = 0,
  'сводка репетитора не пуста');
-- Писать за ученика нельзя.
select pg_temp.fails($$select pg_temp.push(jsonb_build_array(pg_temp.run('d1000000-0000-0000-0000-000000000001', '{}',
  jsonb_build_array(pg_temp.ev(2, 'attempt', '1', true)))))$$, 'forbidden');

select pg_temp.as_user('b2000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 1
  and pg_temp.n($$select 1 from public.task_runs where user_id = 'c2000000-0000-0000-0000-000000000000'$$) = 1
  and pg_temp.n('select 1 from public.work_results') = 0, 'репетитор 2 видит не своё');
reset role;
do $$ begin raise notice 'ok 1: репетитор видит журнал только своих учеников — задачи, действия, варианты, дни, снимки'; end $$;

/* ── 2. Ответ в снимке закрыт от прямого чтения ────────────────── */

set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select pg_temp.fails('select answer from public.task_snapshots', 'permission denied');
select pg_temp.fails('select * from public.task_snapshots', 'permission denied');
select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
select pg_temp.fails('select answer from public.task_snapshots', 'permission denied');
reset role;
do $$ begin raise notice 'ok 2: ответ из снимка прямым чтением не получить'; end $$;

/* ── 3. Ученик видит только своё ───────────────────────────────── */

set role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 1
  and pg_temp.n('select 1 from public.task_events') = 1
  and pg_temp.n('select 1 from public.work_results') = 1
  and pg_temp.n('select hash from public.task_snapshots') = 1, 'ученик 1 видит не только своё');
select pg_temp.as_user('c3000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 1
  and pg_temp.n('select 1 from public.work_results') = 0, 'ученик 3 видит чужое');
reset role;
do $$ begin raise notice 'ok 3: ученик видит только свой журнал'; end $$;

/* ── 4. Аноним не видит ничего ─────────────────────────────────── */

set role anon;
select pg_temp.fails('select 1 from public.task_runs', 'permission denied');
select pg_temp.fails('select 1 from public.task_events', 'permission denied');
select pg_temp.fails('select 1 from public.work_results', 'permission denied');
select pg_temp.fails('select 1 from public.activity_days', 'permission denied');
select pg_temp.fails('select hash from public.task_snapshots', 'permission denied');
select pg_temp.fails($$select public.my_summary(current_date, current_date)$$, 'permission denied');
reset role;
do $$ begin raise notice 'ok 4: анониму журнал закрыт'; end $$;

/* ── 5. Связь закончилась — доступ пропал; администратор видит всё ── */

update public.tutor_students set ended_at = now()
 where tutor_id = 'b1000000-0000-0000-0000-000000000000' and user_id = 'c1000000-0000-0000-0000-000000000000';
set role authenticated;
select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 0
  and pg_temp.n('select 1 from public.task_events') = 0
  and pg_temp.n('select 1 from public.work_results') = 0
  and pg_temp.n('select 1 from public.activity_days') = 0
  and pg_temp.n('select hash from public.task_snapshots') = 0, 'после конца связи журнал ещё виден');
select pg_temp.as_user('a0000000-0000-0000-0000-000000000000');
select pg_temp.ok(pg_temp.n('select 1 from public.task_runs') = 3
  and pg_temp.n('select hash from public.task_snapshots') = 3, 'администратор видит не всё');
reset role;
do $$ begin raise notice 'ok 5: ученик ушёл от репетитора — журнал закрыт; администратор видит всё'; end $$;
