-- Правила доступа (RLS) единой схемы: аноним, чужой ученик, чужой класс,
-- репетитор без класса. Идёт на всех миграциях с правами по умолчанию
-- своего сервера (lite-defaults.sql) и каталогом банка.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-10-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-11',
    'accept_soglashenie', true, 'accept_soglasie', true) || extra
$$;

create function pg_temp.fails(sql text, needle text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    -- Несколько допустимых причин — через «|»: отказать может и правило
    -- RLS, и триггер, смотря что сработает раньше.
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

/* ── 1. Регистрация по списку ──────────────────────────────────── */

-- Списка нет — закрыто для всех.
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('t1@x.ru', pg_temp.meta('{}'))$q$, 'invite_required');
select pg_temp.ok(auth_hooks.before_user_created('{"user":{"email":"t1@x.ru"}}') -> 'error' ->> 'message' = 'invite_only',
  'хук без списка должен отказывать');

insert into vault.secrets (name, secret)
values ('allowed_emails', 't1@x.ru, T2@X.ru,t3@x.ru,s1@x.ru,s2@x.ru , kid@x.ru');

-- Хук: чужой адрес — отказ, свой — пропуск, IP запоминается.
select pg_temp.ok(auth_hooks.before_user_created('{"user":{"email":"stranger@x.ru"}}') -> 'error' ->> 'message' = 'invite_only',
  'хук пропустил чужой адрес');
select pg_temp.ok(auth_hooks.before_user_created(
  '{"metadata":{"ip_address":"203.0.113.7"},"user":{"email":"T1@x.ru"}}') = '{}'::jsonb, 'хук не пропустил адрес из списка');
select pg_temp.ok(auth_hooks.before_user_created(
  '{"metadata":{"ip_address":"не адрес"},"user":{"email":"t2@x.ru"}}') = '{}'::jsonb, 'хук упал на кривом IP');

-- Триггер повторяет отбор сам: мимо хука тоже не пройти.
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('stranger@x.ru', pg_temp.meta('{}'))$q$, 'invite_required');
-- Галочки обязательны и на этом пути.
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('t1@x.ru', pg_temp.meta('{"accept_soglasie":false}'))$q$, 'consents_required');
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('t1@x.ru', pg_temp.meta('{"documents_version":"2020-01-01"}'))$q$, 'outdated_documents');
-- Роль — только ученик или репетитор.
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('t1@x.ru', pg_temp.meta('{"role":"admin"}'))$q$, 'bad_role');
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('s1@x.ru', pg_temp.meta('{"role":"student"}'))$q$, 'birth_year_required');
select pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
  values ('kid@x.ru', pg_temp.meta('{"role":"student","birth_year":2012}'))$q$, 'parent_email_required');

insert into auth.users (id, email, raw_user_meta_data) values
  ('b1000000-0000-0000-0000-000000000000', 't1@x.ru', pg_temp.meta('{"name":"Репетитор 1","signup_ip":"198.51.100.99"}')),
  ('b2000000-0000-0000-0000-000000000000', 't2@x.ru', pg_temp.meta('{"name":"Репетитор 2"}')),
  ('b3000000-0000-0000-0000-000000000000', 't3@x.ru', pg_temp.meta('{"name":"Репетитор без класса"}')),
  ('c1000000-0000-0000-0000-000000000000', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000,"grade":11}')),
  ('c2000000-0000-0000-0000-000000000000', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  ('c3000000-0000-0000-0000-000000000000', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}'));

do $$ begin
  perform pg_temp.ok((select count(*) from public.profiles) = 6, 'профилей не шесть');
  perform pg_temp.ok((select role from public.profiles where user_id = 'c1000000-0000-0000-0000-000000000000') = 'student',
    'роль ученика из формы не записалась');
  perform pg_temp.ok((select host(ip) from public.consents
    where user_id = 'b1000000-0000-0000-0000-000000000000' limit 1) = '203.0.113.7',
    'в журнале согласий не IP от службы входа (поле signup_ip из формы читаться не должно)');
  perform pg_temp.ok((select ip from public.consents
    where user_id = 'b3000000-0000-0000-0000-000000000000' limit 1) is null, 'IP без хука должен быть пустым');
  perform pg_temp.ok((select count(*) from public.consents) = 12, 'согласий не по два на человека');
  raise notice 'ok 1: регистрация по списку — те же галочки, роль из формы, IP от службы входа';
end $$;

/* ── Данные: два репетитора с классами, третий — без ───────────── */

insert into public.tutor_students (tutor_id, user_id) values
  ('b1000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000'),
  ('b1000000-0000-0000-0000-000000000000', 'c3000000-0000-0000-0000-000000000000'),
  ('b2000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000');
insert into public.classes (id, tutor_id, name) values
  ('d1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Класс А'),
  ('d2000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000000', 'Класс Б');
insert into public.class_members (class_id, user_id) values
  ('d1000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000'),
  ('d2000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000');

set role authenticated;
select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
select public.issue_homework('ДЗ класса А', null, null, 'd1000000-0000-0000-0000-000000000000', null,
  '[{"task_no":8,"count":2}]') as hw_a \gset
insert into public.kits (code, scope, student_href, teacher_href) values ('AA11-AA', '8', '/a/', '/b/');
select pg_temp.as_user('b2000000-0000-0000-0000-000000000000');
select public.issue_homework('ДЗ класса Б', null, null, 'd2000000-0000-0000-0000-000000000000', null,
  '[{"task_no":8,"count":2}]') as hw_b \gset
insert into public.kits (code, scope, student_href, teacher_href) values ('BB22-BB', '8', '/a/', '/b/');
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
select public.record_attempt(8::smallint, null, 'З8-1', 'right', 1000, :'hw_a', 's1');
insert into public.trainer_sessions (user_id, id, scope, task_no) values (auth.uid(), 'r1', '8', 8);
insert into public.user_storage (key, value) values ('budetege:vychisleniya-8:v1', '{"kinds":{}}');
select pg_temp.as_user('c2000000-0000-0000-0000-000000000000');
select public.record_attempt(8::smallint, null, 'З8-2', 'wrong', 1000, :'hw_b', 's2');
insert into public.trainer_sessions (user_id, id, scope, task_no) values (auth.uid(), 'r2', '8', 8);
insert into public.user_storage (key, value) values ('budetege:vychisleniya-8:v1', '{"kinds":{"8.A":{}}}');
reset role;

/* ── 2. Схема: RLS везде, анониму — только справочники ─────────── */

do $$
declare bad text;
begin
  select string_agg(c.relname, ', ') into bad
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and not c.relrowsecurity;
  perform pg_temp.ok(bad is null, 'таблицы без RLS: ' || coalesce(bad, ''));

  select string_agg(distinct g.table_name || ':' || g.privilege_type, ', ') into bad
  from information_schema.role_table_grants g
  where g.table_schema = 'public' and g.grantee = 'anon'
    and not (g.privilege_type = 'SELECT' and g.table_name in ('ege_tasks', 'bank_prototypes', 'legal_editions'));
  perform pg_temp.ok(bad is null, 'у анонима лишние права на таблицы: ' || coalesce(bad, ''));

  select string_agg(distinct g.table_name || '.' || g.column_name || ':' || g.privilege_type, ', ') into bad
  from information_schema.column_privileges g
  where g.table_schema = 'public' and g.grantee = 'anon'
    and not (g.privilege_type = 'SELECT' and g.table_name in ('ege_tasks', 'bank_prototypes', 'legal_editions'));
  perform pg_temp.ok(bad is null, 'у анонима лишние права на колонки: ' || coalesce(bad, ''));

  select string_agg(p.oid::regprocedure::text, ', ') into bad
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
    and has_function_privilege('anon', p.oid, 'execute');
  perform pg_temp.ok(bad is null, 'аноним может вызвать функции: ' || coalesce(bad, ''));

  -- Служебные функции закрыты и вошедшему.
  select string_agg(p.oid::regprocedure::text, ', ') into bad
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname in ('grant_admin', 'email_allowed', 'accept_documents', 'issue_parent_token',
                      'confirm_parent_consent', 'purge_old_consents', 'handle_new_user_invite',
                      'handle_new_user_consents')
    and has_function_privilege('authenticated', p.oid, 'execute');
  perform pg_temp.ok(bad is null, 'вошедший может вызвать служебные функции: ' || coalesce(bad, ''));

  perform pg_temp.ok(not has_schema_privilege('anon', 'auth_hooks', 'usage')
    and not has_schema_privilege('authenticated', 'auth_hooks', 'usage')
    and not has_schema_privilege('authenticated', 'vault', 'usage'),
    'схемы auth_hooks и vault открыты ролям запросов');
  raise notice 'ok 2: RLS на всех таблицах; анониму — только чтение справочников и ни одной функции';
end $$;

/* ── 3. Аноним ─────────────────────────────────────────────────── */

set role anon;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'tutor_students', 'classes', 'class_members', 'invitations',
    'homework', 'homework_items', 'homework_recipients', 'attempts', 'task_progress', 'trainer_sessions',
    'kits', 'user_storage', 'consents', 'parent_consents', 'variant_works', 'variant_work_tasks',
    'variant_work_keys', 'variant_work_recipients', 'variant_attempts', 'variant_answers']
  loop
    perform pg_temp.fails(format('select 1 from public.%I limit 1', t), 'permission denied');
  end loop;
  perform pg_temp.ok((select count(*) from public.ege_tasks) = 21, 'каталог разделов (21) анониму виден');
  perform pg_temp.fails($q$insert into public.kits (user_id, code, scope, student_href, teacher_href)
    values ('b1000000-0000-0000-0000-000000000000', 'ZZ99-ZZ', '8', '/a/', '/b/')$q$, 'permission denied');
  perform pg_temp.fails($q$insert into public.user_storage (user_id, key, value)
    values ('c1000000-0000-0000-0000-000000000000', 'budetege:x', '{}')$q$, 'permission denied');
  perform pg_temp.fails($q$update public.profiles set display_name = 'взлом'$q$, 'permission denied');
  perform pg_temp.fails($q$delete from public.class_members$q$, 'permission denied');
  perform pg_temp.fails($q$insert into public.legal_editions (version) values ('2030-01-01')$q$, 'permission denied');
  perform pg_temp.fails($q$select public.delete_my_account()$q$, 'permission denied');
  perform pg_temp.fails($q$select public.export_my_data()$q$, 'permission denied');
  perform pg_temp.fails($q$select public.my_role()$q$, 'permission denied');
  perform pg_temp.fails($q$select public.can_save_progress('c1000000-0000-0000-0000-000000000000')$q$, 'permission denied');
  perform pg_temp.fails($q$select public.record_attempt(8::smallint, null, null, 'right', 1, null, null)$q$, 'permission denied');
  perform pg_temp.fails($q$select public.create_invitation('student')$q$, 'permission denied');
  perform pg_temp.fails($q$select * from vault.decrypted_secrets$q$, 'permission denied');
  raise notice 'ok 3: аноним — ни людей, ни прогресса, ни записи, ни функций';
end $$;
reset role;

/* ── 4. Чужой ученик ───────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user('c2000000-0000-0000-0000-000000000000');
do $$
begin
  -- Видит себя и своего репетитора, и только.
  perform pg_temp.ok(pg_temp.n('select 1 from public.profiles') = 2, 'ученик 2 видит не только себя и своего репетитора');
  perform pg_temp.ok(pg_temp.n($q$select 1 from public.profiles
    where user_id in ('c1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000')$q$) = 0,
    'ученик 2 видит чужого ученика или чужого репетитора');
  perform pg_temp.ok(pg_temp.n('select 1 from public.attempts') = 1
    and pg_temp.n('select 1 from public.task_progress') = 1, 'ученик 2 видит чужие попытки');
  perform pg_temp.ok(pg_temp.n('select 1 from public.trainer_sessions') = 1, 'ученик 2 видит чужие тренировки');
  perform pg_temp.ok(pg_temp.n('select 1 from public.user_storage') = 1, 'ученик 2 видит чужой перенесённый прогресс');
  perform pg_temp.ok(pg_temp.n('select 1 from public.consents') = 2, 'ученик 2 видит чужие согласия');
  perform pg_temp.ok(pg_temp.n('select 1 from public.parent_consents') = 0, 'ученик 2 видит чужого родителя');
  perform pg_temp.ok(pg_temp.n('select 1 from public.kits') = 0, 'ученик 2 видит комплекты репетиторов');
  perform pg_temp.ok(pg_temp.n('select 1 from public.classes') = 1
    and pg_temp.n($q$select 1 from public.classes where name = 'Класс А'$q$) = 0, 'ученик 2 видит чужой класс');
  perform pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 1, 'ученик 2 видит состав чужого класса');
  perform pg_temp.ok(pg_temp.n('select 1 from public.homework') = 1
    and pg_temp.n($q$select 1 from public.homework where title = 'ДЗ класса А'$q$) = 0, 'ученик 2 видит чужое ДЗ');
  perform pg_temp.ok(pg_temp.n('select 1 from public.homework_recipients') = 1, 'ученик 2 видит чужих получателей ДЗ');
  perform pg_temp.ok(pg_temp.n('select 1 from public.tutor_students') = 1, 'ученик 2 видит чужие связи с репетиторами');
  perform pg_temp.ok(pg_temp.n('select 1 from public.invitations') = 0, 'ученик видит приглашения');

  -- Менять чужое нельзя.
  perform pg_temp.ok(pg_temp.touched($q$update public.profiles set display_name = 'взлом'
    where user_id = 'c1000000-0000-0000-0000-000000000000'$q$) = 0, 'ученик 2 переименовал ученика 1');
  perform pg_temp.fails($q$update public.profiles set role = 'tutor' where user_id = auth.uid()$q$, 'permission denied');
  perform pg_temp.fails($q$insert into public.user_storage (user_id, key, value)
    values ('c1000000-0000-0000-0000-000000000000', 'budetege:x', '{}')$q$, 'row-level security');
  perform pg_temp.ok(pg_temp.touched($q$update public.user_storage set value = '{"взлом":1}'
    where user_id = 'c1000000-0000-0000-0000-000000000000'$q$) = 0, 'ученик 2 переписал чужой прогресс');
  perform pg_temp.ok(pg_temp.touched($q$delete from public.user_storage
    where user_id = 'c1000000-0000-0000-0000-000000000000'$q$) = 0, 'ученик 2 удалил чужой прогресс');
  perform pg_temp.ok(pg_temp.touched($q$delete from public.trainer_sessions
    where user_id = 'c1000000-0000-0000-0000-000000000000'$q$) = 0, 'ученик 2 удалил чужую тренировку');
  perform pg_temp.fails($q$insert into public.trainer_sessions (user_id, id, scope, task_no)
    values ('c1000000-0000-0000-0000-000000000000', 'x', '8', 8)$q$, 'row-level security');
  perform pg_temp.fails($q$insert into public.attempts (user_id, task_no, outcome)
    values ('c1000000-0000-0000-0000-000000000000', 8, 'right')$q$, 'permission denied');
end $$;
-- Чужое ДЗ: по номеру — отказ.
select pg_temp.fails(format($q$select public.record_attempt(8::smallint, null, null, 'right', 1, %L, null)$q$, :'hw_a'),
  'not_your_homework');
select pg_temp.fails(format($q$select public.submit_homework(%L)$q$, :'hw_a'), 'cannot_submit');
-- Сам себя в чужой класс не запишет и класс не создаст.
select pg_temp.fails($q$insert into public.class_members (class_id, user_id)
  values ('d1000000-0000-0000-0000-000000000000', auth.uid())$q$, 'row-level security|not_your_student');
select pg_temp.fails($q$insert into public.classes (tutor_id, name) values (auth.uid(), 'мой')$q$, 'row-level security');
select pg_temp.fails($q$insert into public.tutor_students (tutor_id, user_id)
  values ('b1000000-0000-0000-0000-000000000000', auth.uid())$q$, 'permission denied');
select pg_temp.fails($q$insert into public.kits (user_id, code, scope, student_href, teacher_href)
  values ('b1000000-0000-0000-0000-000000000000', 'ZZ99-ZZ', '8', '/a/', '/b/')$q$, 'row-level security');
do $$ begin raise notice 'ok 4: чужой ученик — видит только себя и своего репетитора, чужое не меняет'; end $$;

/* ── 5. Чужой класс ────────────────────────────────────────────── */

select pg_temp.as_user('b2000000-0000-0000-0000-000000000000');
do $$
begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.classes') = 1
    and pg_temp.n($q$select 1 from public.classes where id = 'd1000000-0000-0000-0000-000000000000'$q$) = 0,
    'репетитор 2 видит чужой класс');
  perform pg_temp.ok(pg_temp.n($q$select 1 from public.class_members
    where class_id = 'd1000000-0000-0000-0000-000000000000'$q$) = 0, 'репетитор 2 видит состав чужого класса');
  perform pg_temp.ok(pg_temp.n('select 1 from public.profiles') = 2, 'репетитор 2 видит не только себя и своего ученика');
  perform pg_temp.ok(pg_temp.n($q$select 1 from public.profiles
    where user_id in ('c1000000-0000-0000-0000-000000000000', 'c3000000-0000-0000-0000-000000000000',
                      'b1000000-0000-0000-0000-000000000000')$q$) = 0, 'репетитор 2 видит чужих учеников или коллегу');
  perform pg_temp.ok(pg_temp.n('select 1 from public.attempts') = 1
    and pg_temp.n($q$select 1 from public.attempts where user_id = 'c1000000-0000-0000-0000-000000000000'$q$) = 0,
    'репетитор 2 видит попытки чужого ученика');
  perform pg_temp.ok(pg_temp.n('select 1 from public.homework') = 1, 'репетитор 2 видит чужое ДЗ');
  perform pg_temp.ok(pg_temp.n('select 1 from public.homework_recipients') = 1, 'репетитор 2 видит получателей чужого ДЗ');
  perform pg_temp.ok(pg_temp.n('select 1 from public.homework_items') = 1, 'репетитор 2 видит задачи чужого ДЗ');
  perform pg_temp.ok(pg_temp.n('select 1 from public.tutor_students') = 1, 'репетитор 2 видит чужие связи');
  perform pg_temp.ok(pg_temp.n('select 1 from public.kits') = 1, 'репетитор 2 видит чужие комплекты');
  -- Прогресс в браузере и тренировки — личное ученика, даже своего.
  perform pg_temp.ok(pg_temp.n('select 1 from public.user_storage') = 0, 'репетитор видит перенесённый прогресс ученика');
  perform pg_temp.ok(pg_temp.n('select 1 from public.trainer_sessions') = 0, 'репетитор видит тренировки ученика');
  perform pg_temp.ok(pg_temp.n('select 1 from public.consents') = 2, 'репетитор видит чужие согласия');

  perform pg_temp.ok(pg_temp.touched($q$update public.classes set name = 'взлом'
    where id = 'd1000000-0000-0000-0000-000000000000'$q$) = 0, 'репетитор 2 переименовал чужой класс');
  perform pg_temp.ok(pg_temp.touched($q$delete from public.class_members
    where class_id = 'd1000000-0000-0000-0000-000000000000'$q$) = 0, 'репетитор 2 удалил ученика из чужого класса');
  perform pg_temp.ok(pg_temp.touched($q$update public.homework set title = 'взлом'$q$) = 1, 'репетитор 2 тронул чужое ДЗ');
  perform pg_temp.ok(pg_temp.touched($q$update public.tutor_students set ended_at = now()
    where tutor_id = 'b1000000-0000-0000-0000-000000000000'$q$) = 0, 'репетитор 2 разорвал чужую связь');
  perform pg_temp.ok(pg_temp.touched($q$update public.kits set section = 'взлом'
    where user_id = 'b1000000-0000-0000-0000-000000000000'$q$) = 0, 'репетитор 2 изменил чужой комплект');
end $$;
-- Своего ученика в чужой класс, чужого — в свой.
select pg_temp.fails($q$insert into public.class_members (class_id, user_id)
  values ('d1000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000')$q$, 'row-level security|not_your_student');
select pg_temp.fails($q$insert into public.class_members (class_id, user_id)
  values ('d2000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000')$q$, 'row-level security|not_your_student');
select pg_temp.fails($q$insert into public.classes (tutor_id, name)
  values ('b1000000-0000-0000-0000-000000000000', 'подкидыш')$q$, 'row-level security');
select pg_temp.fails($q$select public.issue_homework('Чужому классу', null, null,
  'd1000000-0000-0000-0000-000000000000', null, '[{"task_no":8,"count":1}]')$q$, 'forbidden');
select pg_temp.fails($q$select public.issue_homework('Чужому ученику', null, null, null,
  array['c1000000-0000-0000-0000-000000000000']::uuid[], '[{"task_no":8,"count":1}]')$q$, 'not_your_student');
select pg_temp.fails($q$select public.create_invitation('student', 'd1000000-0000-0000-0000-000000000000')$q$, 'forbidden');
do $$ begin raise notice 'ok 5: чужой класс — не виден, не меняется, ДЗ в него не выдать'; end $$;

/* ── 6. Репетитор без класса ───────────────────────────────────── */

select pg_temp.as_user('b3000000-0000-0000-0000-000000000000');
do $$
declare t text;
begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.profiles') = 1, 'репетитор без класса видит кого-то, кроме себя');
  foreach t in array array['classes', 'class_members', 'tutor_students', 'homework', 'homework_items',
    'homework_recipients', 'attempts', 'task_progress', 'trainer_sessions', 'kits', 'user_storage',
    'invitations', 'parent_consents', 'variant_works', 'variant_attempts', 'variant_answers']
  loop
    perform pg_temp.ok(pg_temp.n(format('select 1 from public.%I', t)) = 0,
      'репетитор без класса видит строки в ' || t);
  end loop;
  perform pg_temp.fails($q$select public.issue_homework('Никому', null, null, null, null,
    '[{"task_no":8,"count":1}]')$q$, 'no_recipients');
  perform pg_temp.fails($q$select public.issue_homework('Чужому', null, null, null,
    array['c1000000-0000-0000-0000-000000000000']::uuid[], '[{"task_no":8,"count":1}]')$q$, 'not_your_student');
  perform pg_temp.fails($q$insert into public.tutor_students (tutor_id, user_id)
    values (auth.uid(), 'c1000000-0000-0000-0000-000000000000')$q$, 'permission denied');
  perform pg_temp.fails($q$select public.record_attempt(8::smallint, null, null, 'right', 1, null, null)$q$, 'forbidden');
  perform pg_temp.fails($q$select public.create_invitation('tutor')$q$, 'forbidden');
end $$;
-- Свой класс создать может, а чужого ученика в него — нет.
insert into public.classes (tutor_id, name) values (auth.uid(), 'Пустой класс') returning id as empty_class \gset
select pg_temp.fails(format($q$insert into public.class_members (class_id, user_id)
  values (%L, 'c1000000-0000-0000-0000-000000000000')$q$, :'empty_class'), 'row-level security|not_your_student');
do $$ begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.classes') = 1, 'свой новый класс не виден');
  raise notice 'ok 6: репетитор без класса — пусто, чужих учеников не получить';
end $$;

/* ── 7. Своё — видно ───────────────────────────────────────────── */

select pg_temp.as_user('b1000000-0000-0000-0000-000000000000');
do $$ begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.profiles') = 3, 'репетитор 1 не видит себя и двух своих учеников');
  perform pg_temp.ok(pg_temp.n('select 1 from public.attempts') = 1, 'репетитор 1 не видит попытку своего ученика');
  perform pg_temp.ok(pg_temp.n('select 1 from public.class_members') = 1, 'репетитор 1 не видит свой класс');
  perform pg_temp.ok(pg_temp.touched($q$update public.classes set name = 'Класс А+'
    where id = 'd1000000-0000-0000-0000-000000000000'$q$) = 1, 'репетитор 1 не переименовал свой класс');
  perform pg_temp.ok(pg_temp.touched($q$delete from public.class_members
    where class_id = 'd1000000-0000-0000-0000-000000000000'$q$) = 1, 'репетитор 1 не убрал ученика из своего класса');
end $$;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000000');
do $$ begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.user_storage') = 1
    and pg_temp.n('select 1 from public.trainer_sessions') = 1
    and pg_temp.n('select 1 from public.attempts') = 1, 'ученик 1 не видит своё');
  perform pg_temp.ok(pg_temp.touched($q$update public.profiles set display_name = 'Ученик Первый', tour_done = true
    where user_id = auth.uid()$q$) = 1, 'ученик не поменял своё имя');
  perform pg_temp.ok(pg_temp.touched($q$update public.user_storage set value = '{"kinds":{"8.B":{}}}'$q$) = 1,
    'ученик не обновил свой перенесённый прогресс');
  -- Так пишет сайт: upsert по (user_id, key).
  insert into public.user_storage (key, value) values ('budetege:vychisleniya-8:v1', '{"kinds":{"8.C":{}}}')
  on conflict (user_id, key) do update set key = excluded.key, value = excluded.value;
  perform pg_temp.ok((select value -> 'kinds' ? '8.C' from public.user_storage) , 'upsert не перезаписал значение');
  perform pg_temp.fails($q$update public.user_storage set user_id = 'c2000000-0000-0000-0000-000000000000'$q$, 'permission denied');
  -- Ключ — только из хранилища сайта, значение — не больше 300 КБ.
  perform pg_temp.fails($q$insert into public.user_storage (key, value) values ('чужой-ключ', '{}')$q$, 'user_storage_key_check');
  perform pg_temp.fails($q$insert into public.user_storage (key, value)
    values ('budetege:big', to_jsonb(repeat('x', 300001)))$q$, 'user_storage_value_check');
  raise notice 'ok 7: своё видно и меняется';
end $$;

/* ── 8. Школьник до согласия родителя ──────────────────────────── */

select pg_temp.as_user('c3000000-0000-0000-0000-000000000000');
select pg_temp.fails($q$insert into public.user_storage (key, value) values ('budetege:vychisleniya-8:v1', '{}')$q$,
  'row-level security');
do $$ begin
  perform pg_temp.ok(pg_temp.n('select 1 from public.parent_consents') = 1, 'школьник не видит запись о своём родителе');
  perform pg_temp.fails('select token_hash from public.parent_consents', 'permission denied');
  raise notice 'ok 8: до согласия родителя прогресс в аккаунт не переносится';
end $$;

/* ── 9. Удаление аккаунта и предел записей ─────────────────────── */

select pg_temp.as_user('c2000000-0000-0000-0000-000000000000');
do $$ begin
  for i in 1..99 loop
    insert into public.user_storage (key, value) values ('budetege:k' || i, '{}');
  end loop;
  perform pg_temp.fails($q$insert into public.user_storage (key, value) values ('budetege:k100', '{}')$q$, 'storage_full');
end $$;
do $$ declare d jsonb := public.export_my_data(); begin
  perform pg_temp.ok(jsonb_array_length(d -> 'user_storage') = 100 and d ? 'kits', 'в выгрузке нет перенесённого прогресса');
end $$;
select public.delete_my_account();
reset role;
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.user_storage where user_id = 'c2000000-0000-0000-0000-000000000000')
    and not exists (select 1 from public.profiles where user_id = 'c2000000-0000-0000-0000-000000000000'),
    'после удаления остались данные');
  perform pg_temp.ok((select count(*) from public.consents
    where user_id = 'c2000000-0000-0000-0000-000000000000' and account_deleted_at is not null) = 2,
    'журнал согласий удалённого аккаунта не помечен');
  raise notice 'ok 9: предел записей, выгрузка и удаление каскадом';
end $$;
