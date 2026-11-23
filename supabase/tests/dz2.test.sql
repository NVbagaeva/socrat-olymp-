-- Проверка supabase/migrations/20261123120000_dz2.sql (docs/kabinet-dz2.md):
-- новая выдача ДЗ — черновик, публикация (в том числе отложенная),
-- решение с проверкой в базе, подсказки, попытки, решения, цели
-- тренажёра, карточки и теория, сдача, опоздание, итоги учителя, возврат
-- на доработку, копия и шаблон; права: чужое ДЗ не открыть, ключ ученику
-- не уходит, учитель видит только свои ДЗ; запись в журнал (этап 1).
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
-- Задача: позиция, ответ, ученик (для индивидуальных).
create function pg_temp.t(pos int, answer text, student text default null) returns jsonb language sql as $$
  select jsonb_build_object('position', pos, 'kind', '8.A', 'task_ref', '8.A|s' || pos || '|base',
    'question_html', '<p>Задача ' || pos || '</p>', 'answer', answer, 'level', 1, 'student_id', student,
    'razbor', jsonb_build_object('shagi', jsonb_build_array(
      jsonb_build_object('chto', 'Шаг 1', 'tex', 'a'), jsonb_build_object('chto', 'Шаг 2', 'tex', 'b'))))
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set s3 'c3000000-0000-0000-0000-000000000000'
\set kid 'c9000000-0000-0000-0000-000000000000'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru,kid@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Учитель 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Аня","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Борис","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Чужой","birth_year":2000}')),
  (:'kid', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"m@x.ru"}'));
insert into public.classes (tutor_id, name) values (:'t1', '11 «А»') returning id as class_a \gset
insert into public.classes (tutor_id, name) values (:'t1', '11 «Б»') returning id as class_b \gset
insert into public.classes (tutor_id, name) values (:'t2', 'Чужой') returning id as class_c \gset
insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'s1'), (:'t1', :'s2'), (:'t2', :'s3');
insert into public.class_members (class_id, user_id) values (:'class_a', :'s1'), (:'class_b', :'s2'), (:'class_c', :'s3');

/* ── 1. Флаг и черновик ─────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.fails($q$select public.dz2_save('{"title":"x"}')$q$, 'dz2_off');
reset role;
update public.kabinet_flags set value = 'true' where key in ('dz_novye', 'zhurnal');
set role authenticated;
select pg_temp.as_user(:'t1');

-- ДЗ классу А: опорные (3 задачи), тренажёр «2 верных подряд» (4 задачи), карточки, теория.
select public.dz2_save(jsonb_build_object(
  'title', 'ДЗ к пятнице', 'note', 'Сначала теория', 'attempts_limit', 2,
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a')),
  'items', jsonb_build_array(
    jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 8, 'title', 'Глава «Степени»',
                       'spec', jsonb_build_object('glava', 'stepeni')),
    jsonb_build_object('position', 2, 'kind', 'opornye', 'task_no', 8, 'title', 'Опорные: степени',
                       'tasks', jsonb_build_array(pg_temp.t(1, '0.5'), pg_temp.t(2, '-3'), pg_temp.t(3, '12'))),
    jsonb_build_object('position', 3, 'kind', 'trenazher', 'task_no', 8, 'title', 'Тренажёр 8.A',
                       'goal_kind', 'streak', 'goal_n', 2,
                       'tasks', jsonb_build_array(pg_temp.t(1, '1'), pg_temp.t(2, '2'), pg_temp.t(3, '3'),
                                                  pg_temp.t(4, '4'))),
    jsonb_build_object('position', 4, 'kind', 'kartochki', 'task_no', 5, 'title', 'Карточки №5',
                       'spec', jsonb_build_object('kartochek', 3)))))
  as hw \gset
select pg_temp.ok((select status = 'draft' from public.homework2 where id = :'hw'), 'черновик не черновик');

-- №6 и раздел вне флага — нельзя.
select pg_temp.fails($q$select public.dz2_save(jsonb_build_object('title', 'x', 'items', jsonb_build_array(
  jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 6, 'title', 'x'))))$q$, 'bad_task_no');
select pg_temp.fails($q$select public.dz2_save(jsonb_build_object('title', 'x', 'items', jsonb_build_array(
  jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 1, 'title', 'x'))))$q$, 'bad_task_no');
-- Ответ не в нормальной записи; чужой класс и чужой ученик.
select pg_temp.fails($q$select public.dz2_save(jsonb_build_object('title', 'x', 'items', jsonb_build_array(
  jsonb_build_object('position', 1, 'kind', 'opornye', 'task_no', 8, 'title', 'x',
    'tasks', jsonb_build_array(pg_temp.t(1, '1/2'))))))$q$, 'bad_answer');
select pg_temp.fails(format($q$select public.dz2_save(jsonb_build_object('title', 'x', 'targets',
  jsonb_build_array(jsonb_build_object('class_id', %L))))$q$, :'class_c'), 'forbidden');
select pg_temp.fails(format($q$select public.dz2_save(jsonb_build_object('title', 'x', 'targets',
  jsonb_build_array(jsonb_build_object('student_id', %L))))$q$, :'s3'), 'not_your_student');
-- Контрольная выключает подсказки.
select public.dz2_save('{"title":"Контрольная","kontrol":true,"hints_allowed":true}') as kr \gset
select pg_temp.ok((select kontrol and not hints_allowed from public.homework2 where id = :'kr'),
  'у контрольной остались подсказки');

-- Ученик черновик не видит и ключей не читает.
select pg_temp.as_user(:'s1');
select pg_temp.ok(jsonb_array_length(public.dz2_moi()) = 0, 'ученик видит черновик');
select pg_temp.fails(format('select public.dz2_open(%L)', :'hw'), 'not_your_homework');
select pg_temp.fails('select * from public.homework2_keys', 'permission denied');
select pg_temp.fails('select * from public.homework2_tasks', 'permission denied');
select pg_temp.ok(pg_temp.n('select * from public.homework2') = 0, 'ученик читает таблицу ДЗ');
select pg_temp.fails(format('select public.dz2_publish(%L)', :'hw'), 'forbidden');

/* ── 2. Публикация ─────────────────────────────────────────────── */

select pg_temp.as_user(:'t2');
select pg_temp.fails(format('select public.dz2_publish(%L)', :'hw'), 'forbidden');
select pg_temp.ok(pg_temp.n(format('select * from public.homework2 where id = %L', :'hw')) = 0,
  'чужой учитель видит ДЗ');
select pg_temp.fails(format('select public.dz2_itogi(%L)', :'hw'), 'forbidden');
select pg_temp.as_user(:'t1');
select pg_temp.ok((public.dz2_publish(:'hw') ->> 'recipients')::int = 1, 'получатели — ученики класса А');
select pg_temp.fails(format('select public.dz2_publish(%L)', :'hw'), 'not_draft');
select pg_temp.fails(format('select public.dz2_delete(%L)', :'hw'), 'forbidden');
select pg_temp.fails(format($q$select public.dz2_save(jsonb_build_object('id', %L, 'title', 'x'))$q$, :'hw'),
  'not_draft');

-- Отложенная публикация: ученик класса Б не видит ДЗ до времени публикации.
select public.dz2_save(jsonb_build_object('title', 'Завтра', 'publish_at', now() + interval '1 day',
  'due_at', now() + interval '3 days',
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_b')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 5, 'title', 'Глава'))))
  as later \gset
select public.dz2_publish(:'later');
select pg_temp.as_user(:'s2');
select pg_temp.ok(jsonb_array_length(public.dz2_moi()) = 0, 'отложенное ДЗ видно раньше времени');
select pg_temp.fails(format('select public.dz2_open(%L)', :'later'), 'not_your_homework');
reset role;
update public.homework2 set publish_at = now() - interval '1 minute' where id = :'later';
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok(jsonb_array_length(public.dz2_moi()) = 1, 'ДЗ не появилось после времени публикации');

-- Чужой ученик ДЗ класса А не видит.
select pg_temp.as_user(:'s3');
select pg_temp.fails(format('select public.dz2_open(%L)', :'hw'), 'not_your_homework');

/* ── 3. Ученик решает ──────────────────────────────────────────── */

select pg_temp.as_user(:'s1');
select pg_temp.ok((public.dz2_moi() -> 0 ->> 'status') = 'not_started', 'статус до начала');
select public.dz2_open(:'hw') as o \gset
select pg_temp.ok(:'o'::jsonb::text not like '%"answer"%' and :'o'::jsonb::text not like '%razbor%',
  'ключ или разбор ушли ученику до ответа');
select pg_temp.ok(jsonb_array_length(:'o'::jsonb -> 'items') = 4, 'элементов не 4');
reset role;
select id as op1 from public.homework2_tasks t where t.homework_id = :'hw' and t.position = 1
   and t.item_id = (select id from public.homework2_items where homework_id = :'hw' and position = 2) \gset
select id as op2 from public.homework2_tasks t where t.homework_id = :'hw' and t.position = 2
   and t.item_id = (select id from public.homework2_items where homework_id = :'hw' and position = 2) \gset
select id as op3 from public.homework2_tasks t where t.homework_id = :'hw' and t.position = 3
   and t.item_id = (select id from public.homework2_items where homework_id = :'hw' and position = 2) \gset
select id as tr_item from public.homework2_items where homework_id = :'hw' and position = 3 \gset
select id as ka_item from public.homework2_items where homework_id = :'hw' and position = 4 \gset
select id as te_item from public.homework2_items where homework_id = :'hw' and position = 1 \gset
set role authenticated;
select pg_temp.as_user(:'s1');

-- Неверная запись и дробь с верным значением попытку не тратят.
select pg_temp.ok(public.dz2_check(:'op1', 'abc') ->> 'kind' = 'format', 'неверная запись');
select pg_temp.ok(public.dz2_check(:'op1', '1/2') ->> 'kind' = 'fractionRight', 'дробь с верным значением');
select pg_temp.ok((public.dz2_check(:'op1', ' 0,5 ') ->> 'kind') = 'right', 'верный ответ с запятой');
select pg_temp.ok((public.dz2_check(:'op1', '7') ->> 'kind') = 'closed', 'закрытая задача снова проверяется');
-- Решение «сразу» — после закрытия задачи; ответ и разбор приходят.
select pg_temp.ok((public.dz2_open(:'hw') -> 'items' -> 1 -> 'tasks' -> 0 -> 'solution' ->> 'answer') = '0.5',
  'решение закрытой задачи не пришло');
-- Подсказка: шаг разбора, счёт шагов.
select pg_temp.ok((public.dz2_hint(:'op2', 1) -> 'step' ->> 'chto') = 'Шаг 1', 'подсказка — не первый шаг');
-- Две попытки: вторая неверная закрывает задачу.
select pg_temp.ok((public.dz2_check(:'op2', '3') ->> 'left')::int = 1, 'осталась не одна попытка');
select pg_temp.ok((public.dz2_check(:'op2', '4') ->> 'state') = 'wrong', 'попытки кончились, а задача открыта');
select pg_temp.ok((public.dz2_moi() -> 0 ->> 'status') = 'in_progress', 'статус «в процессе»');

-- Журнал (этап 1): проверенная базой запись с подсказкой и ошибкой.
select pg_temp.ok((select verified and outcome = 'wrong' and hint_steps = 1 and place = 'dz'
                     from public.zhurnal_zadachi where id = :'op2'), 'журнал: проверка ДЗ не записана');
select pg_temp.ok((select outcome = 'right' from public.zhurnal_zadachi where id = :'op1'), 'журнал: верная');

-- Тренажёр «2 верных подряд»: верно, неверно, верно, верно.
reset role;
select id as tr1 from public.homework2_tasks where item_id = :'tr_item' and position = 1 \gset
select id as tr2 from public.homework2_tasks where item_id = :'tr_item' and position = 2 \gset
select id as tr3 from public.homework2_tasks where item_id = :'tr_item' and position = 3 \gset
select id as tr4 from public.homework2_tasks where item_id = :'tr_item' and position = 4 \gset
set role authenticated;
select pg_temp.as_user(:'s1');
select public.dz2_check(:'tr1', '1');
select public.dz2_check(:'tr2', '9');
select public.dz2_check(:'tr2', '9');
select public.dz2_check(:'tr3', '3');
reset role;
select pg_temp.ok(not (public.dz2_progress(:'tr_item', :'s1') ->> 'completed')::boolean,
  'цель «2 подряд» засчитана после ошибки');
set role authenticated;
select pg_temp.as_user(:'s1');
select public.dz2_check(:'tr4', '4');
reset role;
select pg_temp.ok((public.dz2_progress(:'tr_item', :'s1') ->> 'completed')::boolean, 'цель «2 подряд» не засчитана');
set role authenticated;
select pg_temp.as_user(:'s1');

-- Карточки и теория.
select pg_temp.ok(not (public.dz2_mark(:'ka_item', 2) ->> 'completed')::boolean, 'карточки: 2 из 3 — готово');
select pg_temp.ok((public.dz2_mark(:'ka_item', 3) ->> 'completed')::boolean, 'карточки: 3 из 3 — не готово');
select pg_temp.ok((public.dz2_mark(:'te_item', 1) ->> 'completed')::boolean, 'теория: «прочитано» не отмечено');
select pg_temp.fails(format('select public.dz2_mark(%L, 1)', :'tr_item'), 'not_your_task');

-- Чужой ученик не решает чужую задачу; школьник без согласия — нет.
select pg_temp.as_user(:'s2');
select pg_temp.fails(format($q$select public.dz2_check(%L, '1')$q$, :'op3'), 'not_your_task');
select pg_temp.fails(format('select public.dz2_hint(%L, 1)', :'op3'), 'not_your_task');

/* ── 4. Сдача, итоги, возврат ──────────────────────────────────── */

select pg_temp.as_user(:'s1');
select pg_temp.ok((public.dz2_submit(:'hw') ->> 'status') = 'submitted', 'сдача');
select pg_temp.fails(format($q$select public.dz2_check(%L, '12')$q$, :'op3'), 'already_submitted');
select pg_temp.fails(format('select public.dz2_submit(%L)', :'hw'), 'already_submitted');

select pg_temp.as_user(:'t1');
select public.dz2_itogi(:'hw') as it \gset
select pg_temp.ok((:'it'::jsonb -> 'ucheniki' -> 0 ->> 'status') = 'submitted', 'итоги: статус «сдал»');
select pg_temp.ok((:'it'::jsonb -> 'ucheniki' -> 0 -> 'progress' -> :'tr_item' ->> 'completed')::boolean,
  'итоги: прогресс элемента');
select pg_temp.ok(jsonb_array_length(public.dz2_otvety(:'hw', :'s1')) = 7, 'ответы: не 7 задач');
select pg_temp.ok((select (x ->> 'answer_key') = '-3' and jsonb_array_length(x -> 'answers') = 2
                     from jsonb_array_elements(public.dz2_otvety(:'hw', :'s1')) x where x ->> 'id' = :'op2'),
  'ответы ученика и верный ответ учителю');
select pg_temp.fails(format('select public.dz2_otvety(%L, %L)', :'hw', :'s3'), 'forbidden');
select public.dz2_vernut(:'hw', :'s1', 'Перерешай №3');
select pg_temp.fails(format($q$select public.dz2_vernut(%L, %L, 'x')$q$, :'hw', :'s1'), 'not_submitted');
select public.dz2_comment(:'hw', :'s1', 'Молодец с тренажёром');
select pg_temp.as_user(:'t2');
select pg_temp.fails(format($q$select public.dz2_vernut(%L, %L, 'x')$q$, :'hw', :'s1'), 'forbidden');
select pg_temp.fails(format($q$select public.dz2_comment(%L, %L, 'x')$q$, :'hw', :'s1'), 'forbidden');
-- 2г: итоги и ответы чужого ДЗ учителю не отдаются, ученику — тоже.
select pg_temp.fails(format('select public.dz2_otvety(%L, %L)', :'hw', :'s1'), 'forbidden');
select pg_temp.fails(format('select public.dz2_itogi(%L)', :'hw'), 'forbidden');

select pg_temp.as_user(:'s1');
select pg_temp.fails(format('select public.dz2_itogi(%L)', :'hw'), 'forbidden');
select pg_temp.fails(format('select public.dz2_otvety(%L, %L)', :'hw', :'s1'), 'forbidden');
select pg_temp.ok((public.dz2_open(:'hw') ->> 'status') = 'returned'
                  and (public.dz2_open(:'hw') ->> 'return_comment') = 'Перерешай №3', 'возврат на доработку');
select pg_temp.ok((public.dz2_check(:'op3', '12') ->> 'kind') = 'right', 'после возврата нельзя решать');

-- Дедлайн прошёл: late_ok — сдача с опозданием; closed — приём закрыт, статус «не сдал».
reset role;
update public.homework2 set due_at = now() - interval '1 hour' where id = :'hw';
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok((public.dz2_submit(:'hw') ->> 'status') = 'late', 'сдача после дедлайна — не «с опозданием»');
select pg_temp.as_user(:'s2');
reset role;
update public.homework2 set publish_at = now() - interval '2 hours', due_at = now() - interval '1 hour', after_due = 'closed' where id = :'later';
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok((public.dz2_moi() -> 0 ->> 'status') = 'missed', 'статус «не сдал» после дедлайна');
select pg_temp.fails(format('select public.dz2_submit(%L)', :'later'), 'due_passed');

-- Решения «никогда»: ученик не видит ни после закрытия задачи.
select pg_temp.as_user(:'t1');
select public.dz2_save(jsonb_build_object('title', 'Без решений', 'solutions_when', 'never', 'hints_allowed', false,
  'targets', jsonb_build_array(jsonb_build_object('student_id', :'s2')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'opornye', 'task_no', 8, 'title', 'x',
    'tasks', jsonb_build_array(pg_temp.t(1, '5')))))) as nev \gset
select public.dz2_publish(:'nev');
reset role;
select id as nt from public.homework2_tasks where homework_id = :'nev' \gset
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.dz2_check(:'nt', '5') -> 'solution' = 'null'::jsonb or
                  public.dz2_check(:'nt', '5') -> 'solution' is null, 'решение «никогда» пришло');
select pg_temp.ok(public.dz2_open(:'nev')::text not like '%"solution"%' and public.dz2_open(:'nev')::text not like '%razbor%',
  'ключ ушёл при решениях «никогда»');
select pg_temp.fails(format('select public.dz2_hint(%L, 1)', :'nt'), 'not_allowed');

/* ── 5. Индивидуальные числа, копия, шаблон ────────────────────── */

select pg_temp.as_user(:'t1');
select public.dz2_save(jsonb_build_object('title', 'Свои числа', 'individual', true,
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a'), jsonb_build_object('class_id', :'class_b')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'opornye', 'task_no', 8, 'title', 'x',
    'tasks', jsonb_build_array(pg_temp.t(1, '11', :'s1'))))) ) as ind \gset
select pg_temp.fails(format('select public.dz2_publish(%L)', :'ind'), 'no_tasks');
select public.dz2_save(jsonb_build_object('id', :'ind', 'title', 'Свои числа', 'individual', true,
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a'), jsonb_build_object('class_id', :'class_b')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'opornye', 'task_no', 8, 'title', 'x',
    'tasks', jsonb_build_array(pg_temp.t(1, '11', :'s1'), pg_temp.t(1, '22', :'s2'))))));
select public.dz2_publish(:'ind');
select pg_temp.as_user(:'s1');
select pg_temp.ok((select count(*) = 1 from jsonb_array_elements(public.dz2_open(:'ind') -> 'items' -> 0 -> 'tasks')),
  'ученик видит не только свою задачу');
reset role;
select id as ind2 from public.homework2_tasks where homework_id = :'ind' and student_id = :'s2' \gset
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.dz2_check(%L, '22')$q$, :'ind2'), 'not_your_task');

-- «Повторить ДЗ» другому классу: копия в черновик без целей и без индивидуальных задач.
select pg_temp.as_user(:'t1');
select public.dz2_copy(:'hw') as kop \gset
select pg_temp.ok((select status = 'draft' and copied_from = :'hw'::uuid from public.homework2 where id = :'kop'),
  'копия не черновик');
select pg_temp.ok(pg_temp.n(format('select * from public.homework2_items where homework_id = %L', :'kop')) = 4,
  'копия без элементов');
select pg_temp.ok(pg_temp.n(format('select * from public.homework2_targets where homework_id = %L', :'kop')) = 0,
  'копия с целями');
select public.dz2_copy(:'ind') as kop2 \gset
reset role;
select pg_temp.ok(not exists (select 1 from public.homework2_tasks where homework_id = :'kop2'),
  'индивидуальные задачи скопировались');
select pg_temp.ok((select count(*) = 7 from public.homework2_keys k join public.homework2_tasks t on t.id = k.task_id
                    where t.homework_id = :'kop'), 'ключи копии');
set role authenticated;
select pg_temp.as_user(:'t1');
-- Рабочая копия мастера: сохраняется в черновик и копируется с ним.
select public.dz2_chernovik(:'kop', '{"korzina": {"v": 1, "elementy": []}}');
select pg_temp.ok((select chernovik ->> 'korzina' is not null from public.homework2 where id = :'kop'),
  'рабочая копия не сохранилась');
select pg_temp.fails(format($q$select public.dz2_chernovik(%L, '{}')$q$, :'hw'), 'forbidden');
select (public.dz2_copy(:'kop')) as kop3 \gset
select pg_temp.ok((select chernovik is not null from public.homework2 where id = :'kop3'), 'рабочая копия не скопировалась');
select pg_temp.as_user(:'t2');
select pg_temp.fails(format($q$select public.dz2_chernovik(%L, '{}')$q$, :'kop'), 'forbidden');
select pg_temp.as_user(:'t1');
select public.dz2_copy(:'hw', 'template') as tpl \gset
select pg_temp.fails(format('select public.dz2_publish(%L)', :'tpl'), 'not_draft');
select public.dz2_delete(:'tpl');
select pg_temp.as_user(:'t2');
select pg_temp.fails(format('select public.dz2_copy(%L)', :'hw'), 'forbidden');

-- Изменение после выдачи: событие ученикам.
select pg_temp.as_user(:'t1');
select public.dz2_edit(:'ind', jsonb_build_object('note', 'Новое пояснение', 'due_at', now() + interval '2 days'));
reset role;
select pg_temp.ok((select count(*) = 2 from public.homework2_events where homework_id = :'ind' and event = 'edited'),
  'событие «изменено» не всем ученикам');
select pg_temp.ok(exists (select 1 from public.homework2_events where homework_id = :'hw' and event = 'submitted'
                           and user_id = :'t1'), 'событие «сдано» учителю');

/* ── 6. Аноним, выгрузка, удаление ─────────────────────────────── */

set role anon;
select pg_temp.fails('select public.dz2_moi()', 'permission denied');
select pg_temp.fails(format('select public.dz2_open(%L)', :'hw'), 'permission denied');
reset role;
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.export_my_data()::text like '%homework2_answers%', 'ход решения не в выгрузке');
select pg_temp.as_user(:'kid');
select pg_temp.ok(jsonb_array_length(public.dz2_moi()) = 0, 'школьнику выдано');
reset role;
delete from auth.users where id = :'s1';
select pg_temp.ok(not exists (select 1 from public.homework2_answers where user_id = :'s1')
                  and not exists (select 1 from public.homework2_recipients where user_id = :'s1'),
  'ход решения удалённого аккаунта остался');

\echo 'Новая выдача ДЗ: OK'
