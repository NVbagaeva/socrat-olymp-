-- Перенос ДЗ этапа 3: до миграции 20261113130000_dz_istochniki.sql
-- создаются ДЗ кодом этапа 3 (issue_homework_tasks, homework_check,
-- homework_reveal, submit_homework) — общее, индивидуальное, работа
-- над ошибками с разным числом задач у учеников. Снимок задач, ключей и
-- хода решения — в perenos.snimok, его сверяет dz-perenos.test.sql.

select id as class_a from public.classes where name = 'А' \gset

create function pg_temp.task(pos int, kind text, answer text, student text default null) returns jsonb
language sql as $$
  select jsonb_build_object('student_id', student, 'position', pos, 'kind', kind, 'ref', kind || '|42|base',
    'question_html', '<p>Задача ' || pos || ' (' || kind || ')</p>', 'answer', answer,
    'razbor', jsonb_build_object('steps', jsonb_build_array('<p>Шаг</p>'), 'answer', answer),
    'source', 'банк ' || kind || ' № 3', 'comment', case when pos = 1 then 'Сначала эту' end)
$$;

set role authenticated;
select pg_temp.as_user(:'t1');
-- Общее ДЗ, три задачи.
select public.issue_homework_tasks(jsonb_build_object('title', 'Общее', 'class_id', :'class_a', 'task_no', 8,
  'attempts_limit', 2, 'solutions_when', 'instant',
  'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '0.5'), pg_temp.task(2, '8.B', '-3'), pg_temp.task(3, '8.H', '12'))))
  as hw_obshchee \gset
-- Индивидуальное: по два аналога каждому.
select public.issue_homework_tasks(jsonb_build_object('title', 'Каждому свои', 'class_id', :'class_a', 'task_no', 8,
  'individual', true,
  'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '1', :'s1'), pg_temp.task(2, '8.C', '2', :'s1'),
                             pg_temp.task(1, '8.A', '3', :'s2'), pg_temp.task(2, '8.C', '4', :'s2'))))
  as hw_svoi \gset
-- Работа над ошибками: у первого две задачи разных типов, у второго — одна.
select public.issue_homework_tasks(jsonb_build_object('title', 'Ошибки', 'class_id', :'class_a', 'task_no', 8,
  'individual', true, 'origin', 'oshibki', 'parent_id', :'hw_svoi',
  'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '5', :'s1'), pg_temp.task(2, '8.D', '6', :'s1'),
                             pg_temp.task(1, '8.E', '7', :'s2'))))
  as hw_oshibki \gset

-- Ход решения: ученик 1 решил одну, ошибся в другой, открыл решение третьей и сдал.
select pg_temp.as_user(:'s1');
select public.homework_check(id, '0,5', 30) from public.homework_tasks where homework_id = :'hw_obshchee' and position = 1;
select public.homework_check(id, '7', 40) from public.homework_tasks where homework_id = :'hw_obshchee' and position = 2;
select public.homework_reveal(id) from public.homework_tasks where homework_id = :'hw_obshchee' and position = 3;
select public.submit_homework(:'hw_obshchee');
select public.homework_check(id, '1', 10) from public.homework_tasks where homework_id = :'hw_svoi' and position = 1;
-- Ученик 2 начал и не закончил.
select pg_temp.as_user(:'s2');
select public.homework_check(id, '9', 10) from public.homework_tasks where homework_id = :'hw_svoi' and position = 1;
reset role;

-- Снимок до миграции.
create schema perenos;
create table perenos.snimok as
select t.id, t.homework_id, t.student_id, t.position, t.kind, t.question_html, t.comment,
       k.ref, k.answer, k.razbor, k.source,
       (select jsonb_agg(to_jsonb(a) - 'updated_at' order by a.user_id) from public.homework_answers a
         where a.task_id = t.id) as answers
  from public.homework_tasks t join public.homework_keys k on k.task_id = t.id;
create table perenos.dz as
select id, title, task_no, individual, attempts_limit, solutions_when, origin, parent_id from public.homework;
create table perenos.poluchateli as select * from public.homework_recipients;
do $$ begin
  perform pg_temp.ok((select count(*) = 10 from perenos.snimok), 'до миграции не 10 задач этапа 3');
  raise notice 'ДЗ этапа 3 созданы: 3 ДЗ, 10 задач, ход решения двух учеников';
end $$;
