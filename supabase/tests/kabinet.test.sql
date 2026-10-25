-- Проверка supabase/migrations/20261015120000_kabinet.sql (роли, приглашения,
-- классы, ДЗ, попытки, сессии тренажёра) вместе с миграцией согласий и
-- каталогом supabase/seed/kabinet_katalog.sql.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (своя временная база).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-10-15');

-- Метаданные регистрации, которые кладёт сервер сайта: галочки согласий + код.
create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-15',
    'accept_soglashenie', true, 'accept_soglasie', true, 'signup_ip', '203.0.113.7') || extra
$$;

-- Ожидаемая ошибка: выполнить запрос и убедиться, что он упал с текстом.
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

-- 1. Без приглашения пользователя нет.
do $$ begin
  perform pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
    values ('x@x.ru', pg_temp.meta('{}'))$q$, 'invite_required');
  raise notice 'ok 1: без приглашения регистрации нет';
end $$;

-- 2. Администратор — первый пользователь с bootstrap_admin, и только один раз.
insert into auth.users (id, email, raw_user_meta_data)
values ('a0000000-0000-0000-0000-000000000000', 'admin@x.ru',
        pg_temp.meta('{"role":"admin","name":"Наталья","bootstrap_admin":true}'));
do $$ begin
  if (select role from public.profiles where user_id = 'a0000000-0000-0000-0000-000000000000') <> 'admin' then
    raise exception 'FAIL: нет администратора';
  end if;
  perform pg_temp.fails($q$insert into auth.users (email, raw_user_meta_data)
    values ('evil@x.ru', pg_temp.meta('{"role":"admin","bootstrap_admin":true}'))$q$, 'admin_exists');
  raise notice 'ok 2: администратор один';
end $$;

-- 3. Админ приглашает репетитора; роль из формы должна совпасть.
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000000', false);
select public.create_invitation('tutor') as tutor_code \gset
select public.create_invitation('tutor') as tutor2_code \gset
select public.create_invitation('student') as admin_student_code \gset
reset role;
select pg_temp.ok((select count(*) = 1 from public.invitations where code_hash = public.invite_hash(:'tutor_code')),
  'приглашение не найдено по хешу');
select pg_temp.fails(format($q$insert into auth.users (email, raw_user_meta_data)
  values ('t@x.ru', pg_temp.meta(jsonb_build_object('role','student','birth_year',2000,'invite_code',%L)))$q$,
  :'tutor_code'), 'role_mismatch');
insert into auth.users (id, email, raw_user_meta_data)
values ('b1000000-0000-0000-0000-000000000000', 't1@x.ru',
        pg_temp.meta(jsonb_build_object('name', 'Репетитор 1', 'invite_code', :'tutor_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('b2000000-0000-0000-0000-000000000000', 't2@x.ru',
        pg_temp.meta(jsonb_build_object('name', 'Репетитор 2', 'invite_code', lower(:'tutor2_code'))));
select pg_temp.fails(format($q$insert into auth.users (email, raw_user_meta_data)
  values ('t3@x.ru', pg_temp.meta(jsonb_build_object('invite_code',%L)))$q$, :'tutor_code'), 'invite_required');
do $$ begin
  if (select count(*) from public.profiles where role = 'tutor') <> 2 then
    raise exception 'FAIL: репетиторов не двое';
  end if;
  raise notice 'ok 3: приглашение одноразовое, роль из приглашения';
end $$;

-- 4. Репетитор: учеников — да, репетиторов — нет; класс и приглашение в класс.
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.create_invitation('tutor')$q$, 'forbidden');
insert into public.classes (tutor_id, name) values ('b1000000-0000-0000-0000-000000000000', '11 «А»')
returning id as class_id \gset
select public.create_invitation('student', :'class_id') as s1_code \gset
select public.create_invitation('student') as kid_code \gset
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.create_invitation('student', %L)$q$, :'class_id'), 'forbidden');
select pg_temp.fails($q$insert into public.classes (tutor_id, name)
  values ('b1000000-0000-0000-0000-000000000000', 'чужой')$q$, 'row-level security');
select public.create_invitation('student') as s2_code \gset
reset role;

insert into auth.users (id, email, raw_user_meta_data)
values ('c1000000-0000-0000-0000-000000000000', 's1@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Ученик 1','birth_year',2000,'grade',11,'invite_code',:'s1_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('c2000000-0000-0000-0000-000000000000', 's2@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Ученик 2','birth_year',2000,'invite_code',:'s2_code')));
insert into auth.users (id, email, raw_user_meta_data)
values ('c3000000-0000-0000-0000-000000000000', 'kid@x.ru',
        pg_temp.meta(jsonb_build_object('role','student','name','Школьник','birth_year',2011,
                                        'parent_email','mama@x.ru','invite_code',:'kid_code')));
do $$ begin
  if not exists (select 1 from public.tutor_students
                 where tutor_id = 'b1000000-0000-0000-0000-000000000000' and user_id = 'c1000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: ученик не связан с репетитором';
  end if;
  if not exists (select 1 from public.class_members where user_id = 'c1000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: ученик не попал в класс из приглашения';
  end if;
  raise notice 'ok 4: приглашение репетитора связывает ученика с ним и с классом';
end $$;

-- 5. Чужие ученики: не видны, в класс не добавляются, ДЗ им не выдать.
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
do $$ begin
  if exists (select 1 from public.profiles where user_id = 'c2000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: репетитор видит чужого ученика';
  end if;
  if (select count(*) from public.profiles) <> 3 then
    raise exception 'FAIL: репетитор 1 должен видеть себя и двух своих учеников, видит %', (select count(*) from public.profiles);
  end if;
end $$;
select pg_temp.fails(format($q$insert into public.class_members (class_id, user_id)
  values (%L, 'c2000000-0000-0000-0000-000000000000')$q$, :'class_id'), 'not_your_student');
select pg_temp.fails($q$select public.issue_homework('Чужим', null, null, null,
  array['c2000000-0000-0000-0000-000000000000']::uuid[], '[{"task_no":12,"count":1}]')$q$, 'not_your_student');
-- Школьника — в класс напрямую.
insert into public.class_members (class_id, user_id) values (:'class_id', 'c3000000-0000-0000-0000-000000000000');
-- Роль себе не повысить.
select pg_temp.fails($q$update public.profiles set role = 'admin' where user_id = auth.uid()$q$, 'permission denied');
do $$ begin raise notice 'ok 5: чужие ученики закрыты, роль не меняется'; end $$;

-- 6. ДЗ классу: задачи банка — номер и прототип.
select pg_temp.fails($q$select public.issue_homework('Плохое', null, null, null,
  array['c1000000-0000-0000-0000-000000000000']::uuid[],
  '[{"task_no":7,"prototype_code":"12:12Q.A","count":1}]')$q$, 'foreign key');
select pg_temp.fails($q$select public.issue_homework('Пустое', null, null, null,
  array['c1000000-0000-0000-0000-000000000000']::uuid[], '[]')$q$, 'no_items');
select public.issue_homework('Графики и стереометрия', 'К пятнице', now() + interval '3 days', :'class_id', null,
  '[{"task_no":12,"prototype_code":"12:12Q.A","count":5},{"task_no":3,"count":3}]') as hw_id \gset
do $$ begin
  if (select count(*) from public.homework_recipients) <> 2 then
    raise exception 'FAIL: ДЗ классу должно уйти двум ученикам, ушло %', (select count(*) from public.homework_recipients);
  end if;
  if (select count(*) from public.homework_items) <> 2 then raise exception 'FAIL: задач ДЗ не 2'; end if;
  raise notice 'ok 6: ДЗ классу — задачи банка, ученики класса';
end $$;

-- 7. Ученик видит своё ДЗ и решает; чужой ученик — не видит.
select set_config('request.jwt.claim.sub', 'c2000000-0000-0000-0000-000000000000', false);
do $$ begin
  if exists (select 1 from public.homework) or exists (select 1 from public.homework_items) then
    raise exception 'FAIL: чужое ДЗ видно';
  end if;
end $$;
select pg_temp.fails(format($q$select public.record_attempt(12::smallint, null, null, 'right', 1000, %L, null)$q$, :'hw_id'),
  'not_your_homework');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select public.start_homework(:'hw_id');
select public.record_attempt(12::smallint, '12:12Q.A', 'П12-1', 'right', 40000, :'hw_id', 's1');
select public.record_attempt(12::smallint, '12:12Q.A', 'П12-2', 'wrong', 50000, :'hw_id', 's1');
select public.record_attempt(3::smallint, null, null, 'hinted', 30000, null, null);
do $$ begin
  if (select count(*) from public.homework_items) <> 2 then raise exception 'FAIL: ученик не видит задачи ДЗ'; end if;
  if (select solved from public.task_progress where task_no = 12) <> 2
     or (select right_count from public.task_progress where task_no = 12) <> 1 then
    raise exception 'FAIL: прогресс по №12 посчитан неверно';
  end if;
  if exists (select 1 from public.profiles where user_id = 'c2000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: ученик видит другого ученика';
  end if;
  if not exists (select 1 from public.profiles where user_id = 'b1000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: ученик не видит своего репетитора';
  end if;
end $$;
select public.submit_homework(:'hw_id');
select pg_temp.fails(format($q$select public.submit_homework(%L)$q$, :'hw_id'), 'cannot_submit');
select pg_temp.fails($q$select public.issue_homework('x', null, null, null, null, '[{"task_no":1}]')$q$, 'forbidden');
do $$ begin raise notice 'ok 7: ученик видит своё ДЗ, решает и сдаёт; прогресс считается из попыток'; end $$;

-- 8. Школьник без согласия родителя прогресс не пишет.
select set_config('request.jwt.claim.sub', 'c3000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.record_attempt(1::smallint, null, null, 'right', 1, null, null)$q$, 'progress_not_allowed');
select pg_temp.fails($q$insert into public.trainer_sessions (user_id, id, scope, task_no)
  values ('c3000000-0000-0000-0000-000000000000', 'x', '8', 8)$q$, 'row-level security');
do $$ begin raise notice 'ok 8: до согласия родителя прогресс не сохраняется'; end $$;

-- 9. Сессии тренажёра: свои, одна незавершённая на раздел, репетитору не видны.
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
insert into public.trainer_sessions (user_id, id, scope, task_no, total, solved, status)
values ('c1000000-0000-0000-0000-000000000000', 'r1', '12:linear', 12, 10, 3, 'paused');
select pg_temp.fails($q$insert into public.trainer_sessions (user_id, id, scope, task_no)
  values ('c1000000-0000-0000-0000-000000000000', 'r2', '12:linear', 12)$q$, 'trainer_sessions_open_idx');
update public.trainer_sessions set status = 'finished', finished_at = now(), state = null where id = 'r1';
insert into public.trainer_sessions (user_id, id, scope, task_no)
values ('c1000000-0000-0000-0000-000000000000', 'r2', '12:linear', 12);
select pg_temp.fails($q$insert into public.trainer_sessions (user_id, id, scope, task_no)
  values ('c2000000-0000-0000-0000-000000000000', 'r9', '8', 8)$q$, 'row-level security');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
do $$ begin
  if exists (select 1 from public.trainer_sessions) then raise exception 'FAIL: репетитор видит сессии'; end if;
  if (select count(*) from public.attempts) <> 3 then raise exception 'FAIL: репетитор не видит попытки ученика'; end if;
  if (select submitted_at from public.homework_recipients
      where user_id = 'c1000000-0000-0000-0000-000000000000') is null then
    raise exception 'FAIL: репетитор не видит сдачу';
  end if;
end $$;
-- Репетитор перестал вести ученика — попытки закрываются.
update public.tutor_students set ended_at = now() where user_id = 'c1000000-0000-0000-0000-000000000000';
do $$ begin
  if exists (select 1 from public.attempts) then raise exception 'FAIL: после окончания связи попытки видны'; end if;
end $$;
reset role;
update public.tutor_students set ended_at = null;
do $$ begin raise notice 'ok 9: сессии тренажёра — только свои; попытки — пока репетитор ведёт ученика'; end $$;

-- 10. Гость: каталог — да, люди — нет. Хеш кода не читается никем.
set role anon;
do $$ begin
  if (select count(*) from public.bank_prototypes) < 100 then raise exception 'FAIL: каталог пуст'; end if;
  if (select count(*) from public.ege_tasks) <> 20 then raise exception 'FAIL: заданий не 20'; end if;
end $$;
select pg_temp.fails('select * from public.profiles', 'permission denied');
select pg_temp.fails('select * from public.attempts', 'permission denied');
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000000', false);
select pg_temp.fails('select code_hash from public.invitations', 'permission denied');
do $$ begin
  if (select count(*) from public.profiles) <> 6 then raise exception 'FAIL: админ видит не всех'; end if;
  if (select count(*) from public.invitations) <> 6 then
    raise exception 'FAIL: админ должен видеть все приглашения, видит %', (select count(*) from public.invitations);
  end if;
end $$;
reset role;
do $$ begin raise notice 'ok 10: каталог открыт, люди закрыты, хеш кода не читается'; end $$;

-- 11. Выгрузка ученика — с попытками и ДЗ; удаление — каскадом.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
do $$ declare d jsonb := public.export_my_data(); begin
  if jsonb_array_length(d -> 'attempts') <> 3 or jsonb_array_length(d -> 'homework_recipients') <> 1
     or jsonb_array_length(d -> 'trainer_sessions') <> 2 or d -> 'profiles' is null then
    raise exception 'FAIL: выгрузка неполная: %', d;
  end if;
end $$;
select public.delete_my_account();
reset role;
do $$ declare bad text; begin
  if exists (select 1 from public.attempts where user_id = 'c1000000-0000-0000-0000-000000000000')
     or exists (select 1 from public.profiles where user_id = 'c1000000-0000-0000-0000-000000000000') then
    raise exception 'FAIL: после удаления остались данные ученика';
  end if;
  select string_agg(conrelid::regclass::text, ', ') into bad
  from pg_constraint
  where contype = 'f' and confrelid = 'auth.users'::regclass and confdeltype <> 'c'
    and connamespace = 'public'::regnamespace;
  if bad is not null then raise exception 'FAIL: без ON DELETE CASCADE: %', bad; end if;
  raise notice 'ok 11: выгрузка с попытками и ДЗ, удаление каскадом';
end $$;
