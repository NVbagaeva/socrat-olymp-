-- Проверка supabase/migrations/20261111120000_dz.sql (docs/kabinet-dz-8.md):
-- код класса и вступление по коду, имя ученика для репетитора, ДЗ №8 —
-- выдача, задачи и ключ, проверка ответа в базе, когда видно решение.
-- Идёт на всех миграциях с правами по умолчанию своего сервера
-- (lite-defaults.sql) и каталогом банка.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-11-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-11-11',
    'accept_soglashenie', true, 'accept_soglasie', true) || extra
$$;

-- Ожидаемая ошибка. Несколько допустимых причин — через «|».
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

-- Сколько строк видит текущая роль.
create function pg_temp.n(sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
  execute 'select count(*) from (' || sql || ') q' into v;
  return v;
end $$;

-- Сколько строк затронул запрос (update/delete под RLS молча трогает 0).
create function pg_temp.touched(sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
  execute sql;
  get diagnostics v = row_count;
  return v;
end $$;

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

-- Задача ДЗ и ДЗ целиком (общее, три задачи №8: ключи 0.5, −3 и 12).
create function pg_temp.task(pos int, kind text, answer text, student text default null) returns jsonb
language sql as $$
  select jsonb_build_object('student_id', student, 'position', pos, 'kind', kind, 'ref', kind || '|42|1',
    'question_html', '<p>Задача ' || pos || '</p>', 'answer', answer,
    'razbor', jsonb_build_object('steps', jsonb_build_array('<p>Шаг</p>'), 'answer', answer),
    'source', 'новая', 'comment', null)
$$;
create function pg_temp.dz(extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('title', 'ДЗ №8', 'note', 'К пятнице', 'task_no', 8,
    'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '0.5'), pg_temp.task(2, '8.B', '-3'),
                               pg_temp.task(3, '8.H', '12'))) || extra
$$;
-- ДЗ классу А (его id — в настройке dz.class_a).
create function pg_temp.dz_a(extra jsonb) returns jsonb language sql as $$
  select pg_temp.dz(jsonb_build_object('class_id', current_setting('dz.class_a')) || extra)
$$;
-- Задача ДЗ по позиции (и ученику — для индивидуального ДЗ).
create function pg_temp.tid(hw uuid, pos int, student uuid default null) returns uuid language sql as $$
  select id from public.homework_tasks
   where homework_id = hw and position = pos and student_id is not distinct from student
$$;

\set admin 'a0000000-0000-0000-0000-000000000000'
\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set s3 'c3000000-0000-0000-0000-000000000000'
\set s4 'c4000000-0000-0000-0000-000000000000'
\set s5 'c5000000-0000-0000-0000-000000000000'
\set kid 'c9000000-0000-0000-0000-000000000000'

-- Люди: администратор, два репетитора, взрослые ученики без репетитора
-- и школьник без согласия родителя.
insert into vault.secrets (name, secret)
values ('allowed_emails', 'admin@x.ru,t1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru,s4@x.ru,s5@x.ru,kid@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'admin', 'admin@x.ru', pg_temp.meta('{"name":"Админ"}')),
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Репетитор 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Репетитор 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 3","birth_year":2000}')),
  (:'s4', 's4@x.ru', pg_temp.meta('{"role":"student","name":"Подбирает код","birth_year":2000}')),
  (:'s5', 's5@x.ru', pg_temp.meta('{"role":"student","name":"Ученик Б","birth_year":2000}')),
  (:'kid', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}'));
select public.grant_admin('admin@x.ru');

/* ── 1. Код класса ставит база ─────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
insert into public.classes (tutor_id, name) values (auth.uid(), '11 «А»') returning id as class_a, join_code as code_a \gset
insert into public.classes (tutor_id, name) values (auth.uid(), 'Закрытый') returning id as class_closed \gset
insert into public.classes (tutor_id, name) values (auth.uid(), 'Архив') returning id as class_arch \gset
insert into public.classes (tutor_id, name) values (auth.uid(), 'Пустой') returning id as class_v \gset
select pg_temp.ok(:'code_a' ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$', 'код класса не из 6 знаков алфавита');
select pg_temp.fails($q$insert into public.classes (tutor_id, name, join_code) values (auth.uid(), 'x', 'AAAAAA')$q$,
  'permission denied');
select pg_temp.fails(format($q$update public.classes set join_code = 'AAAAAA' where id = %L$q$, :'class_a'),
  'permission denied');
select pg_temp.ok(pg_temp.touched(format($q$update public.classes set join_open = false where id = %L$q$,
  :'class_closed')) = 1, 'репетитор не выключил приём по коду');
select pg_temp.ok(pg_temp.touched(format($q$update public.classes set archived_at = now() where id = %L$q$,
  :'class_arch')) = 1, 'репетитор не убрал класс в архив');
select pg_temp.as_user(:'t2');
insert into public.classes (tutor_id, name) values (auth.uid(), 'Класс Б') returning id as class_b, join_code as code_b \gset
select pg_temp.ok(pg_temp.touched(format($q$update public.classes set join_open = false where id = %L$q$,
  :'class_a')) = 0, 'чужой репетитор выключил приём');
reset role;
select join_code as code_closed from public.classes where id = :'class_closed' \gset
select join_code as code_arch from public.classes where id = :'class_arch' \gset

-- Пачка классов: коды разные, из алфавита, все знаки алфавита в ходу.
insert into public.classes (tutor_id, name) select :'t1', 'Пачка ' || g from generate_series(1, 600) g;
do $$ begin
  perform pg_temp.ok((select count(*) = count(distinct join_code) from public.classes), 'коды классов повторяются');
  perform pg_temp.ok((select bool_and(join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$') from public.classes),
    'код класса не из алфавита');
  perform pg_temp.ok((select count(distinct ch) = 31
                        from public.classes, regexp_split_to_table(join_code, '') ch), 'в кодах не все 31 знак');
  perform pg_temp.fails($q$update public.classes set join_code = (select join_code from public.classes limit 1)$q$,
    'classes_join_code_key');
end $$;
delete from public.classes where name like 'Пачка %';
do $$ begin raise notice 'ok 1: код класса ставит база — 6 знаков без похожих, уникальный'; end $$;

/* ── 2. Новый код — только владелец ────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select public.rotate_class_code(:'class_a') as code_a2 \gset
select pg_temp.ok(:'code_a2' <> :'code_a' and :'code_a2' ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$', 'новый код плохой');
select pg_temp.ok((select join_code from public.classes where id = :'class_a') = :'code_a2', 'новый код не записан');
select pg_temp.as_user(:'t2');
select pg_temp.fails(format($q$select public.rotate_class_code(%L)$q$, :'class_a'), 'forbidden');
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.rotate_class_code(%L)$q$, :'class_a'), 'forbidden');
reset role;
do $$ begin raise notice 'ok 2: новый код класса — только владельцу'; end $$;

/* ── 3. Вступить по коду ───────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.join_class(:'code_a') ->> 'error' = 'bad_code', 'старый код после смены работает');
select public.join_class(' ' || lower(substr(:'code_a2', 1, 3)) || ' - ' || lower(substr(:'code_a2', 4))) as j1 \gset
select pg_temp.ok(:'j1'::jsonb = jsonb_build_object('class_id', :'class_a', 'class_name', '11 «А»',
  'tutor_name', 'Репетитор 1'), 'ответ join_class: ' || :'j1');
select pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 1
  and pg_temp.n('select 1 from public.tutor_students where ended_at is null') = 1, 'вступивший не в классе или не связан');
select pg_temp.ok(public.join_class(:'code_a2') ->> 'class_id' = :'class_a', 'повторное вступление сломалось');
select pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 1, 'повторное вступление задвоило класс');
select pg_temp.as_user(:'s2');
select public.join_class(:'code_a2');
-- Приём выключен, класс в архиве, кода нет — один ответ bad_code.
select pg_temp.as_user(:'s3');
select pg_temp.ok(public.join_class('OOOOOO') ->> 'error' = 'bad_code', 'несуществующий код');
select pg_temp.ok(public.join_class(:'code_closed') ->> 'error' = 'bad_code', 'приём выключен, а ученик вступил');
select pg_temp.ok(public.join_class(:'code_arch') ->> 'error' = 'bad_code', 'класс в архиве, а ученик вступил');
select pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 0
  and pg_temp.n('select 1 from public.tutor_students') = 0, 'неверный код что-то записал');
select public.join_class(:'code_a2');
-- Вступают только ученики; школьник — после согласия родителя.
select pg_temp.as_user(:'t2');
select pg_temp.fails(format($q$select public.join_class(%L)$q$, :'code_a2'), 'forbidden');
select pg_temp.as_user(:'admin');
select pg_temp.fails(format($q$select public.join_class(%L)$q$, :'code_a2'), 'forbidden');
select pg_temp.as_user(:'kid');
select pg_temp.fails(format($q$select public.join_class(%L)$q$, :'code_a2'), 'progress_not_allowed');
set role anon;
select pg_temp.fails(format($q$select public.join_class(%L)$q$, :'code_a2'), 'permission denied');
set role authenticated;
-- Подбор: 10 неверных кодов за час — дальше отказ, даже с верным кодом.
select pg_temp.as_user(:'s4');
do $$ begin
  for i in 1..10 loop
    perform pg_temp.ok(public.join_class('OOOOO' || i) ->> 'error' = 'bad_code', 'неверный код принят');
  end loop;
end $$;
select pg_temp.fails(format($q$select public.join_class(%L)$q$, :'code_b'), 'too_many_tries');
select pg_temp.fails('select 1 from public.class_join_tries', 'permission denied');
select pg_temp.fails($q$delete from public.class_join_tries$q$, 'permission denied');
reset role;
select pg_temp.ok((select count(*) from public.class_join_tries where user_id = :'s4') = 10,
  'неудачные попытки не записались');
update public.class_join_tries set at = at - interval '61 minutes' where user_id = :'s4';
set role authenticated;
select pg_temp.as_user(:'s4');
select pg_temp.ok(public.join_class(:'code_b') ->> 'class_id' = :'class_b', 'через час вступить не дали');
select pg_temp.as_user(:'s5');
select public.join_class(:'code_b');
-- Репетитор перестал вести ученика — вступление по коду связывает снова.
reset role;
update public.tutor_students set ended_at = now() where user_id = :'s1';
set role authenticated;
select pg_temp.as_user(:'s1');
select public.join_class(:'code_a2');
select pg_temp.ok(pg_temp.n('select 1 from public.tutor_students where ended_at is null') = 1,
  'повторное вступление не сняло ended_at');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 3, 'в классе А не трое');
reset role;
do $$ begin raise notice 'ok 3: вступление по коду — ученику, без регистра и дефисов, 10 ошибок в час'; end $$;

/* ── 4. Имя ученика — только для репетитора ────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.touched(format($q$update public.tutor_students set alias = 'Петя, 11 Б' where user_id = %L$q$,
  :'s1')) = 1, 'репетитор не переименовал ученика');
select pg_temp.ok((select alias from public.my_students where user_id = :'s1') = 'Петя, 11 Б', 'репетитор не видит имя');
select pg_temp.ok(pg_temp.n('select 1 from public.my_students') = 3, 'репетитор видит не троих учеников');
select pg_temp.fails(format($q$update public.tutor_students set alias = repeat('я', 61) where user_id = %L$q$, :'s1'),
  'tutor_students_alias_check');
select pg_temp.fails(format($q$update public.tutor_students set alias = '   ' where user_id = %L$q$, :'s1'),
  'tutor_students_alias_check');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.touched(format($q$update public.tutor_students set alias = 'взлом' where user_id = %L$q$,
  :'s1')) = 0, 'чужой репетитор переименовал ученика');
select pg_temp.ok(pg_temp.n(format($q$select 1 from public.my_students where user_id = %L$q$, :'s1')) = 0,
  'чужой репетитор видит ученика');
select pg_temp.as_user(:'s1');
select pg_temp.fails('select alias from public.tutor_students', 'permission denied');
select pg_temp.fails('select * from public.tutor_students', 'permission denied');
select pg_temp.ok(pg_temp.n('select tutor_id, user_id, linked_at, ended_at from public.tutor_students') = 1,
  'ученик не видит свою связь с репетитором');
select pg_temp.ok(pg_temp.n('select 1 from public.my_students') = 0, 'ученик видит my_students');
select pg_temp.ok(pg_temp.touched($q$update public.tutor_students set alias = 'Я'$q$) = 0, 'ученик сменил имя у репетитора');
do $$ declare d jsonb := public.export_my_data(); begin
  perform pg_temp.ok(jsonb_array_length(d -> 'tutor_students') = 1 and not (d -> 'tutor_students' -> 0 ? 'alias'),
    'имя от репетитора попало в выгрузку ученика');
end $$;
set role anon;
select pg_temp.fails('select 1 from public.my_students', 'permission denied');
reset role;
do $$ begin raise notice 'ok 4: имя ученика видит и меняет только его репетитор'; end $$;

/* ── 5. Выдать ДЗ ──────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t2');
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('class_id', :'class_b'))) as hw_t2 \gset
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz('{"class_id":%s}'))$q$,
  to_json(:'class_a'::text)), 'forbidden');
select pg_temp.as_user(:'t1');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz('{"class_id":%s}'))$q$,
  to_json(:'class_b'::text)), 'forbidden');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz('{"students":[%s]}'))$q$,
  to_json(:'s5'::text)), 'not_your_student');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz('{"class_id":%s,"students":[%s]}'))$q$,
  to_json(:'class_v'::text), to_json(:'s1'::text)), 'not_in_class');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz())$q$, 'no_recipients');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz('{"class_id":%s}'))$q$,
  to_json(:'class_v'::text)), 'no_recipients');
-- Дальше — классу А; проверяется сама выдача.
select set_config('dz.class_a', :'class_a', false);
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"due_at":"2020-01-01T00:00:00Z"}'))$q$, 'bad_due');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"solutions_when":"after_due"}'))$q$, 'bad_due');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"attempts_limit":3}'))$q$, 'bad_settings');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"solutions_when":"never"}'))$q$, 'bad_settings');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"origin":"chat"}'))$q$, 'bad_settings');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"task_no":21}'))$q$, 'bad_task_no');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a('{"tasks":[]}'))$q$, 'no_tasks');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz_a('{"parent_id":%s}'))$q$,
  to_json(:'hw_t2'::text)), 'bad_parent');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', '0,5')))))$q$, 'bad_answer');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', '1/2')))))$q$, 'bad_answer');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', null)))))$q$, 'bad_answer');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.ZZ', '1')))))$q$, 'bad_kind');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '12.A', '1')))))$q$, 'bad_kind');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', '1') - 'razbor'))))$q$, 'bad_razbor');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  (select jsonb_agg(pg_temp.task(g, '8.A', '1')) from generate_series(1, 61) g))))$q$, 'too_many_tasks');
select pg_temp.fails($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', '1'), pg_temp.task(1, '8.B', '2')))))$q$, 'homework_tasks_position_idx');
-- Общее ДЗ: задачи без ученика. Индивидуальное: у каждой задачи —
-- получатель, у каждого получателя — задачи.
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz_a(jsonb_build_object('tasks',
  jsonb_build_array(pg_temp.task(1, '8.A', '1', %L)))))$q$, :'s1'), 'bad_task_student');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('individual', true,
  'students', jsonb_build_array(%L, %L), 'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '1', %L),
  pg_temp.task(1, '8.A', '1', %L)))))$q$, :'s1', :'s2', :'s1', :'s3'), 'bad_task_student');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('individual', true,
  'students', jsonb_build_array(%L, %L), 'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '1', %L),
  pg_temp.task(1, '8.A', '1')))))$q$, :'s1', :'s2', :'s1'), 'bad_task_student');
select pg_temp.fails(format($q$select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('individual', true,
  'students', jsonb_build_array(%L, %L), 'tasks', jsonb_build_array(pg_temp.task(1, '8.A', '1', %L)))))$q$,
  :'s1', :'s2', :'s1'), 'no_tasks');

-- Выданные ДЗ:
--   A — классу А (ученики 1–3): решение сразу, попыток без ограничения;
--   B — ученику 1: одна попытка, решение после сдачи;
--   C — ученикам 1 и 2: две попытки, решение после срока;
--   E — ученику 1: одна попытка, решение сразу;
--   D — классу А: для закрытия репетитором;
--   I — индивидуальное ученикам 1 и 2;
--   P — работа над ошибками по A.
select public.issue_homework_tasks(pg_temp.dz_a('{"solutions_when":"instant","show_memo":true,"origin":"generator"}')) as hw_a \gset
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('students', jsonb_build_array(:'s1'),
  'attempts_limit', 1))) as hw_b \gset
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('students', jsonb_build_array(:'s1', :'s2'),
  'attempts_limit', 2, 'solutions_when', 'after_due', 'due_at', now() + interval '2 days'))) as hw_c \gset
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('students', jsonb_build_array(:'s1'),
  'attempts_limit', 1, 'solutions_when', 'instant'))) as hw_e \gset
select public.issue_homework_tasks(pg_temp.dz_a('{}')) as hw_d \gset
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('individual', true,
  'students', jsonb_build_array(:'s1', :'s2'), 'tasks', jsonb_build_array(
    pg_temp.task(1, '8.A', '1.5', :'s1'), pg_temp.task(2, '8.B', '2', :'s1'),
    pg_temp.task(1, '8.C', '4', :'s2'), pg_temp.task(2, '8.D', '-0.25', :'s2'))))) as hw_i \gset
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('students', jsonb_build_array(:'s1'),
  'parent_id', :'hw_a', 'origin', 'oshibki'))) as hw_p \gset
reset role;
select pg_temp.ok((select count(*) = 3 from public.homework_recipients where homework_id = :'hw_a')
  and (select count(*) = 3 from public.homework_tasks where homework_id = :'hw_a')
  and (select count(*) = 3 from public.homework_keys where homework_id = :'hw_a'), 'ДЗ A: не три ученика и три задачи');
select pg_temp.ok((select task_no = 8 and solutions_when = 'instant' and show_memo and not show_example
                     and origin = 'generator' and attempts_limit is null and not individual
                     from public.homework where id = :'hw_a'), 'настройки ДЗ A не записались');
select pg_temp.ok((select count(*) = 4 from public.homework_tasks where homework_id = :'hw_i' and student_id is not null)
  and (select individual from public.homework where id = :'hw_i'), 'индивидуальное ДЗ записалось не так');
select pg_temp.ok((select parent_id = :'hw_a' and origin = 'oshibki' from public.homework where id = :'hw_p'),
  'работа над ошибками не связана с ДЗ');
select pg_temp.ok((select answer = '-3' and ref = '8.B|42|1' and source = 'новая' and razbor ? 'steps'
                     from public.homework_keys where task_id = pg_temp.tid(:'hw_a', 2)), 'ключ записан не так');
-- Ученик 3 вне класса А больше не ведётся репетитором — ДЗ классу его не берёт.
update public.tutor_students set ended_at = now() where user_id = :'s3';
set role authenticated;
select pg_temp.as_user(:'t1');
select public.issue_homework_tasks(pg_temp.dz_a('{}')) as hw_x \gset
reset role;
select pg_temp.ok((select count(*) = 2 from public.homework_recipients where homework_id = :'hw_x'),
  'ДЗ классу ушло ученику, которого репетитор не ведёт');
delete from public.homework where id = :'hw_x';
update public.tutor_students set ended_at = null where user_id = :'s3';
do $$ begin raise notice 'ok 5: ДЗ выдаёт репетитор своим ученикам; ответ, прототип и задачи проверены'; end $$;

/* ── 6. Кто что видит ──────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_a')) = 3,
  'ученик не видит задачи общего ДЗ');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_i')) = 2
  and pg_temp.n(format('select 1 from public.homework_tasks where student_id = %L', :'s2')) = 0,
  'ученик 1 видит не свои индивидуальные задачи');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_keys') = 0, 'ученик видит ключ');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_t2')) = 0,
  'ученик видит задачи чужого ДЗ');
select pg_temp.as_user(:'s2');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_i')) = 2
  and pg_temp.n(format('select 1 from public.homework_tasks where student_id = %L', :'s1')) = 0,
  'ученик 2 видит не свои индивидуальные задачи');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_b')) = 0,
  'ученик 2 видит задачи ДЗ ученика 1');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_keys') = 0, 'ученик 2 видит ключ');
select pg_temp.as_user(:'s3');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_i')) = 0,
  'ученик 3 видит индивидуальное ДЗ, выданное не ему');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_tasks') = 3
  and pg_temp.n('select 1 from public.homework_keys') = 3, 'репетитор 2 видит задачи или ключи чужих ДЗ');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_tasks where homework_id = %L', :'hw_i')) = 4
  and pg_temp.n(format('select 1 from public.homework_keys where homework_id = %L', :'hw_i')) = 4,
  'репетитор не видит задачи и ключи своего ДЗ');
select pg_temp.as_user(:'admin');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_keys where homework_id = %L', :'hw_a')) = 3,
  'администратор не видит ключ');
set role anon;
do $$
declare t text;
begin
  foreach t in array array['homework_tasks', 'homework_keys', 'homework_answers', 'class_join_tries', 'my_students']
  loop
    perform pg_temp.fails(format('select 1 from public.%I limit 1', t), 'permission denied');
  end loop;
  perform pg_temp.fails($q$select public.issue_homework_tasks('{}')$q$, 'permission denied');
  perform pg_temp.fails($q$select public.homework_check(gen_random_uuid(), '1', 0)$q$, 'permission denied');
  perform pg_temp.fails($q$select public.homework_reveal(gen_random_uuid())$q$, 'permission denied');
  perform pg_temp.fails($q$select public.homework_solution(gen_random_uuid())$q$, 'permission denied');
  perform pg_temp.fails($q$select public.rotate_class_code(gen_random_uuid())$q$, 'permission denied');
end $$;
reset role;
do $$ begin raise notice 'ok 6: задачи — получателям (общие и свои), ключ — только репетитору ДЗ'; end $$;

/* ── 7. Проверка ответа ────────────────────────────────────────── */

select pg_temp.tid(:'hw_a', 1) as a1, pg_temp.tid(:'hw_a', 2) as a2, pg_temp.tid(:'hw_a', 3) as a3 \gset
select pg_temp.tid(:'hw_b', 1) as b1, pg_temp.tid(:'hw_b', 2) as b2 \gset
select pg_temp.tid(:'hw_c', 1) as c1, pg_temp.tid(:'hw_c', 2) as c2 \gset
select pg_temp.tid(:'hw_e', 1) as e1, pg_temp.tid(:'hw_d', 1) as d1, pg_temp.tid(:'hw_p', 1) as p1 \gset
select pg_temp.tid(:'hw_i', 1, :'s1') as i1, pg_temp.tid(:'hw_i', 1, :'s2') as i2 \gset
select set_config('dz.a3', :'a3', false);

set role authenticated;
select pg_temp.as_user(:'s1');
-- Неверная запись и дробь с верным значением попытку не тратят.
select pg_temp.ok(public.homework_check(:'a1', '1/2', 10) = '{"kind":"fractionRight","decimal":"0.5"}',
  'дробь с верным значением');
select pg_temp.ok(public.homework_check(:'a1', ' 2∕4 ', 10) ->> 'kind' = 'fractionRight', 'дробная черта ∕');
select pg_temp.ok(public.homework_check(:'a1', '1 / 2', 10) ->> 'kind' = 'fractionRight', 'дробь с пробелами');
select pg_temp.ok(public.homework_check(:'a1', '1,5/3', 10) ->> 'kind' = 'fractionRight', 'дробь с десятичными частями');
select pg_temp.ok(public.homework_check(:'a1', 'abc', 10) = '{"kind":"format"}', 'буквы — формат');
select pg_temp.ok(public.homework_check(:'a1', '1/0', 10) = '{"kind":"format"}', 'q = 0 — формат');
select pg_temp.ok(public.homework_check(:'a1', '50%', 10) = '{"kind":"format"}', 'проценты — формат');
select pg_temp.ok(public.homework_check(:'a1', '0 1/2', 10) = '{"kind":"format"}', 'смешанное число — формат');
select pg_temp.ok((select attempts = 0 and state = 'open' and seconds = 0 and entries = '[]'
                     from public.homework_answers where task_id = :'a1'), 'запись или дробь потратили попытку');
select pg_temp.ok((select started_at is not null from public.homework_recipients
                    where homework_id = :'hw_a' and user_id = auth.uid()), 'проверка не отметила начало ДЗ');
-- Неверная дробь — обычная неверная попытка.
select public.homework_check(:'a1', '3/2', 5000) as r \gset
select pg_temp.ok(:'r'::jsonb = '{"kind":"wrong","state":"open","attempts":1,"left":null,"solution":null}',
  'неверная дробь: ' || :'r');
select public.homework_check(:'a1', '0,50', -7) as r \gset
select pg_temp.ok(:'r'::jsonb @> '{"kind":"right","state":"right","attempts":2,"left":null}'
  and jsonb_typeof(:'r'::jsonb -> 'solution') = 'object', 'верно — закрыто, решение сразу: ' || :'r');
select pg_temp.ok(public.homework_check(:'a1', '0.5') = '{"kind":"closed","state":"right"}', 'закрытая задача');
select pg_temp.ok((select seconds = 3600 and jsonb_array_length(entries) = 2
                     and entries -> 0 ->> 'a' = '3/2' and entries -> 0 -> 'n' = 'null'
                     and not (entries -> 0 ->> 'ok')::boolean
                     and entries -> 1 ->> 'a' = '0,50' and entries -> 1 ->> 'n' = '0.5'
                     and (entries -> 1 ->> 'ok')::boolean and entries -> 1 ? 'at'
                     from public.homework_answers where task_id = :'a1'), 'ход решения записан не так');
-- Минусы: дефис U+2010 (ученик 1) и знак минус U+2212 (ученик 2).
select pg_temp.ok(public.homework_check(:'a2', '3') ->> 'kind' = 'wrong', '3 вместо −3');
select pg_temp.ok(public.homework_check(:'a2', E'‐3') ->> 'kind' = 'right', 'минус ‐ не распознан');
-- Без ограничения попыток задача остаётся открытой; в ходе — первые 20.
do $$ declare r jsonb; begin
  for i in 1..25 loop
    r := public.homework_check(current_setting('dz.a3')::uuid, (100 + i)::text, 1);
  end loop;
  perform pg_temp.ok(r = '{"kind":"wrong","state":"open","attempts":25,"left":null,"solution":null}',
    'без ограничения: ' || r::text);
  perform pg_temp.ok((select jsonb_array_length(entries) = 20 and seconds = 25 from public.homework_answers
                       where task_id = current_setting('dz.a3')::uuid), 'ход решения не ограничен 20 записями');
end $$;
-- Одна попытка, решение после сдачи.
select public.homework_check(:'b1', '7', 30) as r \gset
select pg_temp.ok(:'r'::jsonb = '{"kind":"wrong","state":"wrong","attempts":1,"left":0,"solution":null}',
  'одна попытка: ' || :'r');
select pg_temp.ok(public.homework_check(:'b1', '0.5') = '{"kind":"closed","state":"wrong"}', 'кончились попытки');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'b1'), 'not_yet');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'b2'), 'not_allowed');
select public.start_homework(:'hw_b');
select public.submit_homework(:'hw_b');
select pg_temp.ok(public.homework_solution(:'b1') ->> 'answer' = '0.5'
  and jsonb_typeof(public.homework_solution(:'b1') -> 'razbor') = 'object', 'после сдачи решения нет');
select pg_temp.ok(public.homework_solution(:'b2') ->> 'answer' = '-3', 'после сдачи нет решения нерешённой задачи');
select pg_temp.fails(format($q$select public.homework_check(%L, '-3')$q$, :'b2'), 'already_submitted');
-- Две попытки, решение после срока.
select pg_temp.ok(public.homework_check(:'c1', '1') @> '{"kind":"wrong","state":"open","attempts":1,"left":1}',
  'первая из двух попыток');
select public.homework_check(:'c1', '2') as r \gset
select pg_temp.ok(:'r'::jsonb = '{"kind":"wrong","state":"wrong","attempts":2,"left":0,"solution":null}',
  'две попытки: ' || :'r');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'c1'), 'not_yet');
-- Одна попытка, решение сразу: попытки кончились — решение в ответе.
select pg_temp.ok(jsonb_typeof(public.homework_check(:'e1', '1') -> 'solution') = 'object',
  'instant: после последней попытки нет решения');
select pg_temp.ok(public.homework_solution(:'e1') ->> 'answer' = '0.5', 'instant: закрытая задача без решения');
-- Индивидуальная задача: своя — да, чужая — нет.
select pg_temp.ok(public.homework_check(:'i1', '3/2') = '{"kind":"fractionRight","decimal":"1.5"}',
  'своя индивидуальная задача');
select pg_temp.fails(format($q$select public.homework_check(%L, '4')$q$, :'i2'), 'not_your_task');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'i2'), 'not_your_task');
select pg_temp.fails(format($q$select public.homework_check(%L, '1')$q$, :'hw_a'), 'not_your_task');

-- Ученик 2: «Показать решение» в ДЗ с решением сразу.
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.homework_check(:'a2', '−3') ->> 'kind' = 'right', 'минус − не распознан');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'a3'), 'not_yet');
select pg_temp.ok(jsonb_typeof(public.homework_reveal(:'a3')) = 'object', '«Показать решение» не вернуло разбор');
select pg_temp.ok(public.homework_check(:'a3', '12') = '{"kind":"closed","state":"revealed"}', 'открытое решение не закрыло задачу');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'a3'), 'not_allowed');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'a2'), 'not_allowed');
select pg_temp.ok(public.homework_solution(:'a3') ->> 'answer' = '12', 'после «Показать решение» решения нет');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'c2'), 'not_allowed');
select pg_temp.fails(format($q$select public.homework_check(%L, '1')$q$, :'b1'), 'not_your_task');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'b1'), 'not_your_task');

-- Решения после срока: до срока — не видны; срок прошёл — открыты, а
-- отвечать и «Показать решение» уже нельзя (due_passed).
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.homework_check(:'c2', '5') @> '{"kind":"wrong","state":"open","solution":null}',
  'до срока проверка ДЗ «после срока» не работает');
reset role;
update public.homework set due_at = now() - interval '1 day' where id = :'hw_c';
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.homework_solution(:'c1') ->> 'answer' = '0.5', 'после срока решения нет');
select pg_temp.ok(public.homework_solution(:'c2') ->> 'answer' = '-3', 'после срока нет решения открытой задачи');
select pg_temp.fails(format($q$select public.homework_check(%L, '-3')$q$, :'c2'), 'due_passed');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'c2'), 'due_passed');
select pg_temp.ok((select attempts = 1 and state = 'open' from public.homework_answers where task_id = :'c2'),
  'ответ после срока записался');
-- Решения сразу и после сдачи: после срока — только просмотр (с
-- миграции 20261113130000_dz_istochniki.sql; прежде ответ принимался с
-- опозданием). Решения открыты: срок прошёл — как сдано.
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'p1'), 'not_yet');
reset role;
update public.homework set due_at = now() - interval '1 day' where id in (:'hw_a', :'hw_p');
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.homework_check(%L, '12')$q$, :'a3'), 'due_passed');
select pg_temp.fails(format($q$select public.homework_check(%L, '0.5')$q$, :'p1'), 'due_passed');
select pg_temp.fails(format($q$select public.submit_homework(%L)$q$, :'hw_p'), 'due_passed');
select pg_temp.ok(public.homework_solution(:'p1') ->> 'answer' = '0.5', 'после срока решение «после сдачи» закрыто');

-- Репетитор видит решения всегда, но сам не отвечает; чужой — ничего.
select pg_temp.as_user(:'t1');
select pg_temp.ok(public.homework_solution(:'a3') ->> 'answer' = '12'
  and public.homework_solution(:'i2') ->> 'answer' = '4', 'репетитор не видит решение');
select pg_temp.fails(format($q$select public.homework_check(%L, '12')$q$, :'a3'), 'not_your_task');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'a3'), 'not_your_task');
-- ДЗ закрыто репетитором — отвечать нельзя, а решения «после сдачи»
-- открываются и тем, кто не сдал.
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'d1'), 'not_yet');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework set closed_at = now() where id in (%L, %L)$q$,
  :'hw_d', :'hw_p')) = 2, 'репетитор не закрыл ДЗ');
select pg_temp.as_user(:'t2');
select pg_temp.fails(format($q$select public.homework_solution(%L)$q$, :'a3'), 'not_your_task');
select pg_temp.as_user(:'s1');
select pg_temp.fails(format($q$select public.homework_check(%L, '0.5')$q$, :'d1'), 'homework_closed');
select pg_temp.ok(public.homework_solution(:'d1') ->> 'answer' = '0.5'
  and public.homework_solution(:'p1') ->> 'answer' = '0.5', 'ДЗ закрыто, а решения «после сдачи» не открылись');
select pg_temp.as_user(:'s3');
select pg_temp.fails(format($q$select public.homework_check(%L, '0.5')$q$, :'b1'), 'not_your_task');
reset role;

-- Школьник без согласия родителя не решает: прогресс не сохраняется.
insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'kid');
set role authenticated;
select pg_temp.as_user(:'t1');
select public.issue_homework_tasks(pg_temp.dz(jsonb_build_object('students', jsonb_build_array(:'kid'),
  'solutions_when', 'instant'))) as hw_k \gset
reset role;
select pg_temp.tid(:'hw_k', 1) as k1 \gset
set role authenticated;
select pg_temp.as_user(:'kid');
select pg_temp.fails(format($q$select public.homework_check(%L, '0.5')$q$, :'k1'), 'progress_not_allowed');
select pg_temp.fails(format($q$select public.homework_reveal(%L)$q$, :'k1'), 'progress_not_allowed');
reset role;
do $$ begin raise notice 'ok 7: проверка в базе — попытки, формат, дробь, минусы; решение — по настройке ДЗ'; end $$;

/* ── 8. Ход решения: свой — ученику, все — репетитору ДЗ ───────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_answers') >= 6
  and pg_temp.n('select 1 from public.homework_answers where user_id <> auth.uid()') = 0, 'ученик 1 видит чужой ход решения');
select pg_temp.as_user(:'s2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_answers') = 2, 'ученик 2 видит не только свой ход решения');
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.n(format('select 1 from public.homework_answers where user_id = %L', :'s2')) = 2
  and pg_temp.n(format('select 1 from public.homework_answers where user_id = %L', :'s1')) >= 6,
  'репетитор не видит ход решения своего ДЗ');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.n('select 1 from public.homework_answers') = 0, 'репетитор 2 видит ход решения чужого ДЗ');
reset role;
do $$ begin raise notice 'ok 8: ход решения — свой ученику, все — репетитору ДЗ'; end $$;

/* ── 9. Напрямую: репетитор — только текст, ученик — ничего ─────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework_tasks set comment = 'Смотри знак' where id = %L$q$,
  :'a1')) = 1, 'репетитор не оставил комментарий к задаче');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework set note = 'До субботы' where id = %L$q$,
  :'hw_a')) = 1, 'репетитор не поменял заметку ДЗ');
select pg_temp.fails(format($q$update public.homework_tasks set question_html = '<p>x</p>' where id = %L$q$, :'a1'),
  'permission denied');
select pg_temp.fails(format($q$update public.homework set attempts_limit = 1 where id = %L$q$, :'hw_a'),
  'permission denied');
select pg_temp.fails(format($q$update public.homework_keys set answer = '1' where task_id = %L$q$, :'a1'),
  'permission denied');
select pg_temp.fails(format($q$update public.homework_answers set state = 'right' where task_id = %L$q$, :'a3'),
  'permission denied');
select pg_temp.fails(format($q$insert into public.homework_tasks (homework_id, position, kind, question_html)
  values (%L, 9, '8.A', 'x')$q$, :'hw_a'), 'permission denied');
select pg_temp.fails(format($q$delete from public.homework_tasks where id = %L$q$, :'a1'), 'permission denied');
select pg_temp.as_user(:'t2');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework_tasks set comment = 'взлом' where id = %L$q$,
  :'a1')) = 0, 'чужой репетитор поменял комментарий');
select pg_temp.as_user(:'s1');
select pg_temp.ok((select comment from public.homework_tasks where id = :'a1') = 'Смотри знак',
  'ученик не видит комментарий репетитора');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework_tasks set comment = 'взлом' where id = %L$q$,
  :'a1')) = 0, 'ученик поменял комментарий');
select pg_temp.ok(pg_temp.touched(format($q$update public.homework set note = 'взлом' where id = %L$q$,
  :'hw_a')) = 0, 'ученик поменял заметку ДЗ');
select pg_temp.fails(format($q$update public.homework_tasks set question_html = 'x' where id = %L$q$, :'a1'),
  'permission denied');
select pg_temp.fails($q$update public.homework_answers set state = 'right'$q$, 'permission denied');
select pg_temp.fails(format($q$insert into public.homework_answers (task_id, homework_id, user_id)
  values (%L, %L, auth.uid())$q$, :'b2', :'hw_b'), 'permission denied');
select pg_temp.fails($q$delete from public.homework_answers$q$, 'permission denied');
select pg_temp.fails($q$update public.homework_keys set answer = '1'$q$, 'permission denied');
select pg_temp.fails($q$update public.homework_recipients set submitted_at = null$q$, 'permission denied');
reset role;
do $$ begin raise notice 'ok 9: напрямую репетитор меняет только текст, ученик — ничего'; end $$;

/* ── 10. Выгрузка и удаление ученика ───────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s2');
do $$ declare d jsonb := public.export_my_data(); begin
  perform pg_temp.ok(jsonb_array_length(d -> 'homework_answers') = 2, 'в выгрузке нет хода решения ДЗ');
end $$;
select public.delete_my_account();
reset role;
do $$ declare bad text; begin
  perform pg_temp.ok(not exists (select 1 from public.homework_answers where user_id = 'c2000000-0000-0000-0000-000000000000')
    and not exists (select 1 from public.homework_tasks where student_id = 'c2000000-0000-0000-0000-000000000000'),
    'после удаления остались ход решения или задачи ученика');
  select string_agg(conrelid::regclass::text, ', ') into bad
  from pg_constraint
  where contype = 'f' and confrelid = 'auth.users'::regclass and confdeltype <> 'c'
    and connamespace = 'public'::regnamespace;
  if bad is not null then raise exception 'FAIL: без ON DELETE CASCADE: %', bad; end if;
  raise notice 'ok 10: выгрузка с ходом решения, удаление каскадом';
end $$;
