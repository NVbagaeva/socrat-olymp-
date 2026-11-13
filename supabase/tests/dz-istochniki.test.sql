-- Проверка supabase/migrations/20261113130000_dz_istochniki.sql
-- (docs/kabinet-dz-istochniki.md): ДЗ из карточек, опорных задач и
-- тренажёра, виды ответа, отметки самооценки, «Без подсказок», предел
-- 60, черновик и шаблоны, правила доступа к новым таблицам. Перед ним —
-- помощники (dz-pomoshchniki.sql), люди и классы (dz-lyudi.sql), в
-- начале — таблица примеров проверки ответа (proverka_cases).
-- Запуск: node app/scripts/check-soglasiya-sql.mjs.

select id as class_a from public.classes where name = 'А' \gset
select id as class_b from public.classes where name = 'Б' \gset

/* ── 1. Проверка ответа: одна таблица с сайтом и заглушкой ─────── */

do $$
declare c record; v jsonb;
begin
  for c in select * from proverka_cases loop
    v := public.check_ege_answer(c.input, c.answer);
    perform pg_temp.ok(v ->> 'kind' = c.expected,
      format('check_ege_answer(%L, %L): ждали %s, получили %s', c.input, c.answer, c.expected, v));
  end loop;
  perform pg_temp.ok((select count(*) from proverka_cases) >= 30, 'таблица примеров пуста');
end $$;
do $$ begin raise notice 'ok 1: проверка ответа совпадает с сайтом и заглушкой (таблица примеров)'; end $$;

/* ── Сборка ДЗ ─────────────────────────────────────────────────── */

-- Единица пункта: задача или карточка.
create function pg_temp.t(kind text, ak text, answer text, student text default null,
                          view jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('student_id', student, 'kind', kind, 'ref', kind || '|1', 'answer_kind', ak,
    'question_html', '<p>' || kind || '</p>', 'view', view, 'answer', answer,
    'razbor', case when ak = 'self' then null else jsonb_build_object('shagi', jsonb_build_array()) end,
    'source', 'новая')
$$;
create function pg_temp.part(source text, task_no int, tasks jsonb, per boolean default false) returns jsonb
language sql as $$
  select jsonb_build_object('source', source, 'task_no', task_no, 'ref', source || ':' || task_no,
    'title_html', 'Пункт', 'rule', jsonb_build_object('seed', 'z1'), 'per_student', per, 'tasks', tasks)
$$;
-- ДЗ «№7 и №8»: набор карточек №7 (самооценка, верно/неверно, вычисление),
-- опорная №8 с выбором, опорная №7, тренажёр №8 каждому свой, тренажёр №7.
create function pg_temp.smes(extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('title', 'ДЗ от 13.11', 'class_id', current_setting('dz.class_a'),
    'attempts_limit', 2, 'solutions_when', 'after_submit',
    'parts', jsonb_build_array(
      pg_temp.part('kartochki', 7, jsonb_build_array(
        pg_temp.t('7-a', 'self', null, null, '{"backHtml":"<p>Оборот</p>"}'),
        pg_temp.t('7-b', 'verno', 'net'),
        pg_temp.t('7-c', 'number', '0.6'))),
      pg_temp.part('opornye', 8, jsonb_build_array(
        pg_temp.t('P8-3-01', 'choice', '2', null, '{"choices":[{"number":"1","label":"плюс"},{"number":"2","label":"минус"}],"hints":["Четверть"]}'))),
      pg_temp.part('opornye', 7, jsonb_build_array(pg_temp.t('st-1', 'number', '-5', null, '{"hints":["Степень двойки"]}'))),
      pg_temp.part('trenazher', 8, jsonb_build_array(
        pg_temp.t('8.A', 'number', '0.5', current_setting('dz.s1')),
        pg_temp.t('8.A', 'number', '1.5', current_setting('dz.s2'))), true),
      pg_temp.part('trenazher', 7, jsonb_build_array(pg_temp.t('P05', 'number', '3'), pg_temp.t('P05', 'number', '-3')))
    )) || extra
$$;
select set_config('dz.class_a', :'class_a', false), set_config('dz.s1', :'s1', false),
       set_config('dz.s2', :'s2', false);

/* ── 2. Выдать: проверки состава ───────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select public.issue_homework_parts(pg_temp.smes()) as hw \gset
reset role;
select pg_temp.ok((select sections = '{7,8}' and task_no = 7 and individual and not no_hints
                     from public.homework where id = :'hw'), 'разделы, первый номер или «каждому свои» не те');
select pg_temp.ok((select array_agg(source order by position) = '{kartochki,opornye,opornye,trenazher,trenazher}'
                     from public.homework_parts where homework_id = :'hw'), 'пункты не по порядку');
select pg_temp.ok((select count(*) = 3 from public.homework_tasks t join public.homework_parts p on p.id = t.part_id
                    where p.homework_id = :'hw' and p.source = 'kartochki'), 'в наборе не три карточки');
-- Позиции у ученика — подряд по пунктам: общие 1…7, свои — отдельно.
select pg_temp.ok((select array_agg(position order by position) = '{1,2,3,4,5,6,7}'
                     from public.homework_tasks where homework_id = :'hw' and student_id is null), 'позиции общих задач');
select pg_temp.ok((select count(*) = 2 from public.homework_tasks where homework_id = :'hw' and student_id is not null),
  'свои задачи не у двоих');
-- Ключ: у самооценки ключа нет, у «верно / неверно» — da / net.
select pg_temp.ok((select count(*) = 8 from public.homework_keys where homework_id = :'hw'), 'ключей не 8 (самооценка без ключа)');
select pg_temp.ok((select k.answer = 'net' from public.homework_keys k join public.homework_tasks t on t.id = k.task_id
                    where t.homework_id = :'hw' and t.kind = '7-b'), 'ключ «неверно»');

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 7, jsonb_build_array(pg_temp.t('ZZ', 'number', '1')))))))$q$, 'bad_kind');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, jsonb_build_array(pg_temp.t('8.A', 'verno', 'da')))))))$q$, 'bad_answer_kind');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-a', 'choice', '1')))))))$q$, 'bad_answer_kind');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-b', 'verno', 'yes')))))))$q$, 'bad_answer');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-a', 'self', '1')))))))$q$, 'bad_answer');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('opornye', 7, jsonb_build_array(pg_temp.t('st-1', 'number', '1/2')))))))$q$, 'bad_answer');
-- Работа над ошибками: карточки каждому свои; у ученика без ошибок в
-- этом пункте карточек нет, но в ДЗ что-то есть.
select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-a', 'self', null, current_setting('dz.s1'))), true),
  pg_temp.part('opornye', 7, jsonb_build_array(pg_temp.t('st-1', 'number', '-5')))))))
  as hw_kazhdomu \gset
select pg_temp.ok((select count(*) = 1 from public.homework_tasks where homework_id = :'hw_kazhdomu' and student_id = :'s1'),
  'карточка ученику 1 не выдана');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-a', 'self', null, current_setting('dz.s1'))), true)))))$q$,
  'no_tasks');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('kartochki', 21, jsonb_build_array(pg_temp.t('7-a', 'self', null)))))))$q$, 'bad_task_no');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, jsonb_build_array(pg_temp.t('8.A', 'number', '1')), true)))))$q$, 'bad_task_student');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, jsonb_build_array(pg_temp.t('8.A', 'number', '1', current_setting('dz.s1'))))))))$q$,
  'bad_task_student');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', '[]'::jsonb)))$q$,
  'no_tasks');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('opornye', 7, '[]'::jsonb)))))$q$, 'no_tasks');
-- Предел 60: 61 задача — нельзя; 59 задач и набор из 100 карточек — можно.
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, (select jsonb_agg(pg_temp.t('8.A', 'number', '1')) from generate_series(1, 61)))))))$q$,
  'too_many_tasks');
select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, (select jsonb_agg(pg_temp.t('8.A', 'number', '1')) from generate_series(1, 59))),
  pg_temp.part('kartochki', 7, (select jsonb_agg(pg_temp.t('7-' || g, 'self', null)) from generate_series(1, 100) g))))))
  as hw60 \gset
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('parts', jsonb_build_array(
  pg_temp.part('trenazher', 8, (select jsonb_agg(pg_temp.t('8.A', 'number', '1')) from generate_series(1, 60))),
  pg_temp.part('kartochki', 7, jsonb_build_array(pg_temp.t('7-a', 'self', null)))))))$q$, 'too_many_tasks');
-- Чужой класс, ученик чужого репетитора, ученик выдаёт — нельзя.
select pg_temp.fails(format($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('class_id', %L)))$q$,
  :'class_b'), 'forbidden');
select pg_temp.fails(format($q$select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('class_id', null,
  'students', jsonb_build_array(%L))))$q$, :'s3'), 'not_your_student');
select pg_temp.as_user(:'s1');
select pg_temp.fails($q$select public.issue_homework_parts(pg_temp.smes())$q$, 'forbidden');
-- «Без подсказок»: подсказки вырезаны, «Запомни» и пример выключены.
select pg_temp.as_user(:'t1');
select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('no_hints', true, 'show_memo', true,
  'show_example', true))) as hw_nh \gset
reset role;
select pg_temp.ok((select no_hints and not show_memo and not show_example from public.homework where id = :'hw_nh'),
  '«Без подсказок» не выключил «Запомни» и пример');
select pg_temp.ok((select bool_and(not (view ? 'hints')) and bool_or(view ? 'choices')
                     from public.homework_tasks where homework_id = :'hw_nh'), 'подсказки остались в ДЗ без подсказок');
select pg_temp.ok((select count(*) = 2 from public.homework_tasks where homework_id = :'hw' and view ? 'hints'),
  'подсказки пропали из обычного ДЗ');
-- Выключенные «Запомни» и пример не хранятся, включённые — хранятся.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.issue_homework_parts(pg_temp.smes(jsonb_build_object('show_memo', true, 'parts', jsonb_build_array(
  pg_temp.part('opornye', 7, jsonb_build_array(pg_temp.t('st-1', 'number', '-5', null,
    '{"zapomni":"<p>Правило</p>","primer":{"uslovieHtml":"x"}}'))))))) as hw_memo \gset
select pg_temp.ok((select view ? 'zapomni' and not view ? 'primer' from public.homework_tasks where homework_id = :'hw_memo'),
  '«Запомни» не сохранилось или пример сохранился выключенным');
reset role;
do $$ begin raise notice 'ok 2: выдача из трёх источников — состав, виды ответа, предел 60, «Без подсказок»'; end $$;

/* ── 3. Кто что видит ──────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_parts where homework_id = %L', :'hw')) = 5,
  'ученик не видит пункты своего ДЗ');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw')) = 8,
  'ученик видит не общие 7 и свою одну');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L and student_id = %L',
  :'hw', :'s2')) = 0, 'ученик видит чужую задачу');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_keys') = 0, 'ученик видит ключ');
select pg_temp.ok((select view ->> 'backHtml' = '<p>Оборот</p>' from public.homework_tasks
                    where homework_id = :'hw' and kind = '7-a'), 'оборот самооценки не виден ученику');
select pg_temp.ok(not exists (select 1 from public.homework_tasks where homework_id = :'hw' and view::text like '%"answer"%'),
  'в том, что видит ученик, есть ответ');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework_parts set comment = 'x' where homework_id = %L$q$,
  :'hw')) = 0, 'ученик поменял комментарий пункта');
select pg_temp.as_user(:'s3');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_parts') = 0, 'чужой ученик видит пункты');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_parts') = 0, 'чужой репетитор видит пункты');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_parts where homework_id = %L', :'hw')) = 5,
  'репетитор не видит пункты');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework_parts set comment = 'Важно' where homework_id = %L and position = 1$q$,
  :'hw')) = 1, 'репетитор не поменял комментарий пункта');
select pg_temp.fails(format($q$update public.homework_parts set title_html = 'x' where homework_id = %L$q$, :'hw'),
  'permission denied');
select pg_temp.fails($q$insert into public.homework_parts (homework_id, position, source, task_no, ref, title_html)
  values (gen_random_uuid(), 1, 'opornye', 7, 'x', 'x')$q$, 'permission denied');
select pg_temp.fails(format($q$delete from public.homework_parts where homework_id = %L$q$, :'hw'), 'permission denied');
set role anon;
select pg_temp.fails('select 1 from public.homework_parts', 'permission denied');
select pg_temp.fails('select 1 from public.homework_drafts', 'permission denied');
select pg_temp.fails('select 1 from public.homework_templates', 'permission denied');
select pg_temp.fails($q$select public.issue_homework_parts('{}')$q$, 'permission denied');
select pg_temp.fails($q$select public.homework_mark(gen_random_uuid(), 'known', 0)$q$, 'permission denied');
select pg_temp.fails($q$select public.check_ege_answer('1', '1')$q$, 'permission denied');
reset role;
do $$ begin raise notice 'ok 3: пункты — своим ученикам и репетитору, ключ — никому из учеников'; end $$;

/* ── 4. Решать: карточки, выбор, самооценка ────────────────────── */

create function pg_temp.k(hw uuid, kind text, student uuid default null) returns uuid language sql as $$
  select id from public.homework_tasks where homework_id = hw and kind = $2 and student_id is not distinct from student
  limit 1
$$;
select pg_temp.k(:'hw', '7-a') as ka, pg_temp.k(:'hw', '7-b') as kb, pg_temp.k(:'hw', '7-c') as kc,
       pg_temp.k(:'hw', 'P8-3-01') as ch, pg_temp.k(:'hw', 'st-1') as op7,
       pg_temp.k(:'hw', '8.A', :'s1') as tr1, pg_temp.k(:'hw', '8.A', :'s2') as tr2 \gset

set role authenticated;
select pg_temp.as_user(:'s1');
-- Карточка «верно / неверно»: только da / net, одна попытка, оборот сразу.
select pg_temp.ok(public.homework_check(:'kb', 'верно', 3) = '{"kind":"format"}', 'не da/net — формат');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'kb'), 'not_yet');
select public.homework_check(:'kb', 'da', 3) as r \gset
select pg_temp.ok(:'r'::jsonb @> '{"kind":"wrong","state":"wrong","attempts":1,"left":0}'
  and jsonb_typeof(:'r'::jsonb -> 'solution') = 'object', 'карточка: одна попытка и оборот сразу: ' || :'r');
select pg_temp.ok(public.homework_solution(:'kb') ->> 'answer' = 'net', 'ответ карточки после ответа не виден');
-- Карточка «вычисление»: дробь с верным значением попытку не тратит.
select pg_temp.ok(public.homework_check(:'kc', '3/5', 3) ->> 'kind' = 'fractionRight', 'дробь у карточки');
select pg_temp.ok(public.homework_check(:'kc', '0,6', 3) @> '{"kind":"right","state":"right","attempts":1}',
  'карточка вычисление');
-- Самооценка: не проверяется, отмечается; отметку можно поменять.
select pg_temp.fails(format($q$select public.homework_check(%L, '1', 0)$q$, :'ka'), 'not_checkable');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'ka'), 'not_checkable');
select pg_temp.fails(format($q$select public.homework_mark(%L, 'maybe', 0)$q$, :'ka'), 'bad_mark');
select pg_temp.fails(format($q$select public.homework_mark(%L, 'known', 0)$q$, :'kc'), 'not_self');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'kc'), 'not_allowed');
select pg_temp.ok(public.homework_mark(:'ka', 'repeat', 20) = 'repeat', 'отметка «Повторить»');
select pg_temp.ok(public.homework_mark(:'ka', 'known', 15) = 'known', 'отметка «Знаю»');
select pg_temp.ok((select state = 'known' and attempts = 2 and seconds = 35 from public.homework_answers
                    where task_id = :'ka'), 'отметка не записалась');
-- Опорная №8 с выбором: номер варианта, дробь — формат.
select pg_temp.ok(public.homework_check(:'ch', '1/2', 3) = '{"kind":"format"}', 'выбор: дробь — формат');
select pg_temp.ok(public.homework_check(:'ch', '1', 3) @> '{"kind":"wrong","state":"open","attempts":1,"left":1}',
  'выбор: неверный вариант');
select pg_temp.ok(public.homework_check(:'ch', '2', 3) @> '{"kind":"right","state":"right","solution":null}',
  'выбор: верный вариант, решение — после сдачи');
-- Задача тренажёра: прежняя проверка и две попытки ДЗ.
select pg_temp.ok(public.homework_check(:'tr1', '1/2', 3) ->> 'kind' = 'fractionRight', 'тренажёр: дробь');
select pg_temp.ok(public.homework_check(:'tr1', '1', 3) @> '{"kind":"wrong","left":1}', 'тренажёр: неверно');
select pg_temp.ok(public.homework_check(:'tr1', '2', 3) @> '{"kind":"wrong","state":"wrong","left":0}',
  'тренажёр: попытки кончились');
-- Чужое: задача другого ученика, отметка в чужом ДЗ.
select pg_temp.fails(format($q$select public.homework_check(%L, '1.5', 0)$q$, :'tr2'), 'not_your_task');
select pg_temp.as_user(:'s3');
select pg_temp.fails(format($q$select public.homework_mark(%L, 'known', 0)$q$, :'ka'), 'not_your_task');
select pg_temp.as_user(:'t1');
select pg_temp.fails(format($q$select public.homework_mark(%L, 'known', 0)$q$, :'ka'), 'not_your_task');
-- Репетитор видит отметки и ответы, ученик 2 — ничего от ученика 1.
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_answers where homework_id = %L', :'hw')) = 5,
  'репетитор не видит ход решения');
select pg_temp.ok((select state from public.homework_answers where task_id = :'ka') = 'known',
  'репетитор не видит «Знаю»');
select pg_temp.as_user(:'s2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_answers') = 0, 'ученик видит чужой ход решения');
-- После сдачи — только просмотр: ни отметки, ни ответа.
select pg_temp.as_user(:'s1');
select public.submit_homework(:'hw');
select pg_temp.fails(format($q$select public.homework_mark(%L, 'repeat', 0)$q$, :'ka'), 'already_submitted');
select pg_temp.fails(format($q$select public.homework_check(%L, '-5', 0)$q$, :'op7'), 'already_submitted');
select pg_temp.ok(public.homework_solution(:'op7') ? 'razbor', 'после сдачи решение не открылось');
reset role;
do $$ begin raise notice 'ok 4: карточки — одна попытка, оборот после ответа; самооценка видна репетитору'; end $$;

/* ── 5. Черновик и шаблоны — только свои ───────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
insert into public.homework_drafts (user_id, body) values (auth.uid(), '{"punkty":[{"istochnik":"trenazher"}]}');
update public.homework_drafts set body = '{"punkty":[]}', updated_at = now() where user_id = auth.uid();
insert into public.homework_templates (user_id, title, body) values (auth.uid(), 'Логарифмы', '{"punkty":[]}');
select pg_temp.fails(format($q$insert into public.homework_templates (user_id, title, body) values (%L, 'x', '{}')$q$,
  :'t2'), 'row-level security');
select pg_temp.fails($q$insert into public.homework_templates (user_id, title, body) values (auth.uid(), '  ', '{}')$q$,
  'homework_templates_title_check');
select pg_temp.fails($q$insert into public.homework_drafts (user_id, body) values (auth.uid(), '[]')
  on conflict (user_id) do update set body = excluded.body$q$, 'homework_drafts_body_check');
select pg_temp.ok((select jsonb_array_length(export_my_data() -> 'homework_drafts') = 1
                      and jsonb_array_length(export_my_data() -> 'homework_templates') = 1), 'черновик и шаблоны не в выгрузке');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_drafts') = 0
  and pg_temp.n('select 1 from public.homework_templates') = 0, 'чужой репетитор видит черновик или шаблон');
select pg_temp.ok(pg_temp.touched('delete from public.homework_templates') = 0, 'чужой репетитор удалил шаблон');
select pg_temp.as_user(:'s1');
select pg_temp.fails($q$insert into public.homework_drafts (user_id, body) values (auth.uid(), '{}')$q$,
  'row-level security');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_templates') = 0, 'ученик видит шаблоны');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.touched('delete from public.homework_drafts') = 1, 'репетитор не очистил черновик');
reset role;
-- Удаление аккаунта уносит черновик и шаблоны.
delete from auth.users where id = :'t1';
select pg_temp.ok(not exists (select 1 from public.homework_templates)
  and not exists (select 1 from public.homework_parts where homework_id = :'hw'), 'после удаления остались строки');
do $$ begin raise notice 'ok 5: черновик и шаблоны — только свои, в выгрузке, удаляются с аккаунтом'; end $$;
