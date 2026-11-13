-- После миграции 20261113130000_dz_istochniki.sql: ДЗ этапа 3
-- (dz-perenos.setup.sql) перенесены без потерь — у каждой задачи свой
-- пункт тренажёра, задачи, ключи, ход решения, получатели не тронуты, и
-- ДЗ решается дальше.

-- Задачи, ключи и ход решения — те же, что до миграции.
do $$ begin
  perform pg_temp.ok((select count(*) = 10 from public.homework_tasks), 'задач не 10');
  perform pg_temp.ok(not exists (
    select s.* from perenos.snimok s
    except
    select t.id, t.homework_id, t.student_id, t.position, t.kind, t.question_html, t.comment,
           k.ref, k.answer, k.razbor, k.source,
           (select jsonb_agg(to_jsonb(a) - 'updated_at' order by a.user_id) from public.homework_answers a
             where a.task_id = t.id)
      from public.homework_tasks t join public.homework_keys k on k.task_id = t.id), 'задача, ключ или ход решения изменились');
  perform pg_temp.ok(not exists (
    select * from perenos.dz except
    select id, title, task_no, individual, attempts_limit, solutions_when, origin, parent_id from public.homework),
    'настройки ДЗ изменились');
  perform pg_temp.ok(not exists (select * from perenos.poluchateli except select * from public.homework_recipients)
    and (select count(*) from perenos.poluchateli) = (select count(*) from public.homework_recipients),
    'получатели изменились');
  -- Пункты: позиция ДЗ — пункт тренажёра.
  perform pg_temp.ok((select count(*) = 7 from public.homework_parts), 'пунктов не 3 + 2 + 2');
  perform pg_temp.ok((select bool_and(source = 'trenazher' and task_no = 8 and rule = '{"etap3": true}')
                        from public.homework_parts), 'пункт не тренажёр №8 этапа 3');
  perform pg_temp.ok(not exists (select 1 from public.homework_tasks t join public.homework_parts p on p.id = t.part_id
                                  where p.position <> t.position or p.homework_id <> t.homework_id),
    'задача не в пункте своей позиции');
  perform pg_temp.ok((select bool_and(sections = '{8}') from public.homework), 'разделы ДЗ не {8}');
  perform pg_temp.ok((select per_student from public.homework_parts p join public.homework h on h.id = p.homework_id
                       where h.title = 'Каждому свои' and p.position = 1), 'индивидуальный пункт стал общим');
  -- Название пункта: тип, если у всех один, иначе «Задача k».
  perform pg_temp.ok((select title_html from public.homework_parts p join public.homework h on h.id = p.homework_id
                       where h.title = 'Ошибки' and p.position = 1) = 'Задача 1', 'разные типы — не «Задача 1»');
  perform pg_temp.ok((select ref from public.homework_parts p join public.homework h on h.id = p.homework_id
                       where h.title = 'Общее' and p.position = 2) = '8:8.B', 'ссылка пункта не «8:8.B»');
  perform pg_temp.ok((select bool_and(answer_kind = 'number' and view = '{}') from public.homework_tasks),
    'вид ответа старых задач не number');
  raise notice 'ok 1: ДЗ этапа 3 перенесены: пункт на позицию, задачи, ключи и ход решения те же';
end $$;

-- Дальше решается: ученик 2 отвечает, ученик 1 видит своё.
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.homework_check(t.id, '3', 5) @> '{"kind":"right","state":"right","attempts":2}',
  'после переноса ответ не принят')
  from public.homework_tasks t join public.homework h on h.id = t.homework_id
 where h.title = 'Каждому свои' and t.position = 1 and t.student_id = auth.uid();
select pg_temp.ok(pg_temp.n('select 1 from public.homework_parts') = 7, 'ученик 2 не видит пункты своих ДЗ');
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.n($q$select 1 from public.homework_answers where state in ('right','wrong','revealed')$q$) = 3,
  'ученик 1 не видит свой ход решения');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_parts') = 7, 'репетитор не видит пункты');
reset role;
do $$ begin raise notice 'ok 2: перенесённые ДЗ решаются дальше, права те же'; end $$;
