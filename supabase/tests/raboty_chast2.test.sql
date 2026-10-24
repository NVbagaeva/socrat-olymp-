-- Проверка supabase/migrations/20261024120000_raboty_chast2.sql: выдача
-- варианта, ответы, фото, сдача, проверка учителем по критериям, история
-- баллов, доработка, сроки, уведомления — и кто что видит.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (набор «Работы»).

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

-- Пользователи: администратор, два репетитора, три ученика (у второго репетитора — свой).
insert into auth.users (id, email, raw_user_meta_data)
values ('a0000000-0000-0000-0000-000000000000', 'admin@x.ru',
        pg_temp.meta('{"role":"admin","name":"Наталья","bootstrap_admin":true}'));
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000000', false);
select public.create_invitation('tutor') as t1_code \gset
select public.create_invitation('tutor') as t2_code \gset
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('b1000000-0000-0000-0000-000000000000', 't1@x.ru', pg_temp.meta(jsonb_build_object('name', 'Учитель 1', 'invite_code', :'t1_code'))),
  ('b2000000-0000-0000-0000-000000000000', 't2@x.ru', pg_temp.meta(jsonb_build_object('name', 'Учитель 2', 'invite_code', :'t2_code')));
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
insert into public.classes (tutor_id, name) values ('b1000000-0000-0000-0000-000000000000', '11 «А»')
returning id as class_id \gset
select public.create_invitation('student', :'class_id') as s1_code \gset
select public.create_invitation('student', :'class_id') as s2_code \gset
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select public.create_invitation('student') as s3_code \gset
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('c1000000-0000-0000-0000-000000000000', 's1@x.ru', pg_temp.meta(jsonb_build_object('role','student','name','Аня','birth_year',2000,'invite_code',:'s1_code'))),
  ('c2000000-0000-0000-0000-000000000000', 's2@x.ru', pg_temp.meta(jsonb_build_object('role','student','name','Боря','birth_year',2000,'invite_code',:'s2_code'))),
  ('c3000000-0000-0000-0000-000000000000', 's3@x.ru', pg_temp.meta(jsonb_build_object('role','student','name','Вера','birth_year',2000,'invite_code',:'s3_code')));

-- Ключи версии PV-01.1: часть 1 — запись бланка, часть 2 — поля автопроверки.
insert into public.variant_keys (variant_code, versiya, task_no, punkt, pole)
select 'PV-01', 1, n, '', to_jsonb(a) from unnest(
  array[1,2,3,4,5,6,7,8,9,10,11,12,13],
  array['2.5','-26','100','0.32','0.36','0.84','1.25','-1.5','-1','0.8','75','0.125','1560000']) as t(n, a);
insert into public.variant_keys (variant_code, versiya, task_no, punkt, pole) values
  ('PV-01', 1, 15, 'б', '{"vid":"chislo","verno":"\\frac{3\\sqrt2}{2}"}');

-- 1. Выдача: своему классу — да, чужому ученику — нет; уведомления ученикам.
set role authenticated;
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.issue_variant_work('Чужим', null, null, null,
  array['c1000000-0000-0000-0000-000000000000']::uuid[], 'PV-01', 1::smallint, 'teacher')$q$, 'not_your_student');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails($q$select public.issue_variant_work('Сам себе', null, null, null, null, 'PV-01', 1::smallint, 'teacher')$q$, 'forbidden');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select public.issue_variant_work('Пробник 1', 'Решения — фото', now() + interval '3 days', :'class_id', null,
  'PV-01', 1::smallint, 'teacher') as work_id \gset
do $$ begin
  perform pg_temp.ok((select count(*) from public.variant_work_recipients) = 2, 'вариант должен уйти двум ученикам класса');
  raise notice 'ok 1: вариант выдаётся только своим ученикам';
end $$;
reset role;
select pg_temp.ok((select count(*) from public.notifications where kind = 'work_issued') = 2, 'ученикам — уведомления о выдаче');

-- 2. Ответы: ученик — свои; чужой ученик в чужую работу не пишет.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c3000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.save_answer(%L, 1::smallint, '', '"2,5"')$q$, :'work_id'), 'not_your_work');
select pg_temp.fails('select * from public.variant_keys', 'permission denied');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select public.save_answer(:'work_id', 1::smallint, '', '"2,5"');
select public.save_answer(:'work_id', 2::smallint, '', '"−26"');
select public.save_answer(:'work_id', 3::smallint, '', '"99"');
select public.save_answer(:'work_id', 13::smallint, '', '"1560000,00"');
select public.save_answer(:'work_id', 15::smallint, 'б', '"\\frac{3}{\\sqrt2}"');
select public.save_answer(:'work_id', 16::smallint, '', '{"kuski":[]}');
select pg_temp.fails('select * from public.variant_keys', 'permission denied');
select pg_temp.fails($q$insert into public.photos (submission_id, task_no, position, object_key, bytes, width, height, expires_at)
  values (gen_random_uuid(), 14, 1, 'raboty/x/14/y.jpg', 1, 1, 1, now())$q$, 'permission denied');
select public.my_submission(:'work_id') as sub1 \gset
reset role;

-- Фото кладёт сервис загрузки (service_role): у ученика 1 — по №14 и №15.
insert into public.photos (id, submission_id, task_no, position, object_key, bytes, width, height, expires_at)
values ('f1000000-0000-0000-0000-000000000000', :'sub1', 14, 1,
        'raboty/' || :'sub1' || '/14/f1000000-0000-0000-0000-000000000000.jpg', 800000, 1500, 2000,
        public.konets_uchebnogo_goda(now())),
       ('f2000000-0000-0000-0000-000000000000', :'sub1', 15, 1,
        'raboty/' || :'sub1' || '/15/f2000000-0000-0000-0000-000000000000.jpg', 700000, 2000, 1500,
        public.konets_uchebnogo_goda(now()));
select pg_temp.fails(format($q$insert into public.photos (submission_id, task_no, position, object_key, bytes, width, height, expires_at)
  values (%L, 14, 1, 'raboty/%s/14/f3000000-0000-0000-0000-000000000000.jpg', 1, 1, 1, now())$q$, :'sub1', :'sub1'),
  'photos_position_idx');
select pg_temp.fails(format($q$insert into public.photos (submission_id, task_no, position, object_key, bytes, width, height, expires_at)
  values (%L, 14, 2, '../../etc/passwd', 1, 1, 1, now())$q$, :'sub1'), 'object_key_check');

-- 3. Кто видит фото: ученик и его учитель — да; другой ученик и чужой учитель — нет.
do $$ begin
  perform pg_temp.ok(public.can_read_photo('f1000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000'), 'ученик видит своё фото');
  perform pg_temp.ok(public.can_read_photo('f1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000'), 'учитель видит фото своего ученика');
  perform pg_temp.ok(not public.can_read_photo('f1000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000'), 'одноклассник не видит чужое фото');
  perform pg_temp.ok(not public.can_read_photo('f1000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000000'), 'чужой учитель не видит фото');
  perform pg_temp.ok(not public.can_read_photo('f1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000'), 'администратор фото не видит');
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-0000-0000-000000000000', false);
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.photos), 'одноклассник видит метаданные чужих фото');
  perform pg_temp.ok(not exists (select 1 from public.submission_answers), 'одноклассник видит чужие ответы');
  perform pg_temp.ok(not exists (select 1 from public.submissions), 'одноклассник видит чужую работу');
end $$;
select pg_temp.fails($q$select public.can_read_photo('f1000000-0000-0000-0000-000000000000', auth.uid())$q$, 'permission denied');
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.photos), 'чужой учитель видит фото');
  perform pg_temp.ok(not exists (select 1 from public.submissions), 'чужой учитель видит работу');
end $$;
select pg_temp.fails('select object_key from public.photos', 'permission denied');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
do $$ begin
  perform pg_temp.ok((select count(*) from public.photos) = 2, 'ученик видит метаданные своих фото');
  raise notice 'ok 3: фото и ответы видят только ученик и его учитель';
end $$;

-- 4. Сдача: часть 1 — сразу, часть 2 без ответа и фото — 0 «не приступал».
select public.submit_work(:'work_id');
select pg_temp.fails(format($q$select public.save_answer(%L, 4::smallint, '', '"0,32"')$q$, :'work_id'), 'closed');
select pg_temp.fails(format($q$select public.submit_work(%L)$q$, :'work_id'), 'already_submitted');
do $$ begin
  perform pg_temp.ok((select ball from public.grades where task_no = 1) = 1, '№1 верно');
  perform pg_temp.ok((select ball from public.grades where task_no = 2) = 1, '№2: «−26» — то же число');
  perform pg_temp.ok((select ball from public.grades where task_no = 3) = 0, '№3 неверно');
  perform pg_temp.ok((select ball from public.grades where task_no = 13) = 1, '№13: «1560000,00» — то же число');
  perform pg_temp.ok((select sum(ball) from public.grades where task_no <= 13) = 3, 'часть 1 — 3 балла');
  -- До проверки баллы части 2 ученику не видны.
  perform pg_temp.ok(not exists (select 1 from public.grades where task_no >= 14), 'ученик видит баллы части 2 до проверки');
  perform pg_temp.ok((select (score ->> 'test') is null from public.submission_scores), 'тестовый балл до проверки');
end $$;
reset role;
do $$ begin
  perform pg_temp.ok((select count(*) from public.grades where task_no >= 14 and ne_pristupal) = 4,
    '№17–20 без ответа и фото — «не приступал» (у №14 фото, у №15 и №16 ответ)');
  perform pg_temp.ok((select count(*) from public.grade_history where reason = 'auto') = 17, 'история: 13 + 4 автоматических балла');
  raise notice 'ok 4: сдача — часть 1 сразу, «не приступал» по пустым заданиям части 2';
end $$;

-- 5. Проверка учителем: баллы по критериям, не больше максимума, правка части 1.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.set_grade(%L, 14::smallint, 2::smallint, 0::smallint, 0::smallint, null)$q$, :'sub1'), 'forbidden');
select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.start_check(%L)$q$, :'sub1'), 'forbidden');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.set_grade(%L, 14::smallint, 2::smallint, 0::smallint, 0::smallint, null)$q$, :'sub1'), 'not_checking');
select public.start_check(:'sub1');
select pg_temp.fails(format($q$select public.set_grade(%L, 14::smallint, 3::smallint, null, null, null)$q$, :'sub1'), 'ball_over_max');
select pg_temp.fails(format($q$select public.set_grade(%L, 19::smallint, 5::smallint, null, null, null)$q$, :'sub1'), 'ball_over_max');
select pg_temp.fails(format($q$select public.set_grade(%L, 3::smallint, 1::smallint, null, null, null)$q$, :'sub1'), 'part2_only');
select public.set_grade(:'sub1', 14::smallint, 2::smallint, 0::smallint, 0::smallint, 'Всё верно');
select public.set_grade(:'sub1', 15::smallint, 3::smallint, 0::smallint, 0::smallint, null);
select pg_temp.fails(format($q$select public.finish_check(%L, null)$q$, :'sub1'), 'не оценены №16');
select public.set_grade(:'sub1', 16::smallint, 1::smallint, 1::smallint, 0::smallint, 'Потеряна точка 9');
select public.override_part1(:'sub1', 3::smallint, true, 'Ответ записан в другой форме');
select public.save_photo_marks('f1000000-0000-0000-0000-000000000000',
  '{"v":1,"items":[{"t":"ok","x":0.4,"y":0.3},{"t":"text","x":0.1,"y":0.8,"s":"Хорошо"}]}');
do $$ begin
  perform pg_temp.ok((select score ->> 'total' from public.submission_scores) = '10', 'итог 4 + 6 = 10 до завершения');
  perform pg_temp.ok((select (score ->> 'ungraded2')::int from public.submission_scores) = 0, 'все задания 14–20 оценены');
end $$;
select public.finish_check(:'sub1', 'Молодец, проверь №16');
reset role;
do $$ begin
  perform pg_temp.ok((select count(*) from public.grade_history where reason = 'part1') = 1, 'история: ручная правка части 1');
  perform pg_temp.ok((select count(*) from public.grade_history where reason = 'grade') = 3, 'история: три балла части 2');
  perform pg_temp.ok((select vruchnuyu from public.grades where task_no = 3), 'правка части 1 помечена');
  perform pg_temp.ok((select count(*) from public.notifications where kind = 'work_checked'
                      and user_id = 'c1000000-0000-0000-0000-000000000000') = 1, 'ученику — уведомление о проверке');
  raise notice 'ok 5: баллы по критериям, максимум, правка части 1, завершение';
end $$;

-- 6. Ученик после проверки: баллы, критерии, пометки, итог и тестовый балл.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
do $$
declare s jsonb := (select score from public.submission_scores);
begin
  perform pg_temp.ok((select count(*) from public.grades) = 20, 'ученик видит баллы всех 20 заданий');
  perform pg_temp.ok((select kriteriy from public.grades where task_no = 16) = 1, 'ученик видит строку критериев');
  perform pg_temp.ok(s ->> 'part1' = '4' and s ->> 'part2' = '6' and s ->> 'total' = '10', 'итог 4 + 6 = 10');
  perform pg_temp.ok((s ->> 'test')::int = (select testovyy from public.shkala where pervichnyy = 10), 'тестовый балл по шкале');
  perform pg_temp.ok((select count(*) from public.photo_marks) = 1, 'ученик видит пометки проверенной работы');
  raise notice 'ok 6: ученик видит баллы, критерии, пометки и тестовый балл';
end $$;

-- 7. Повторная проверка: история «открыта снова», пересчёт итога, уведомление.
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select public.start_check(:'sub1');
select public.set_grade(:'sub1', 15::smallint, 2::smallint, 1::smallint, 0::smallint, 'Нет обоснования в б');
select public.finish_check(:'sub1', null);
reset role;
do $$ begin
  perform pg_temp.ok((select count(*) from public.grade_history where reason = 'reopen') = 1, 'история: повторное открытие');
  perform pg_temp.ok((select old_ball = 3 and new_ball = 2 from public.grade_history
                      where reason = 'grade' and task_no = 15 order by id desc limit 1), 'история: было 3 → стало 2');
  perform pg_temp.ok((select score ->> 'total' from public.submission_scores
                      where user_id = 'c1000000-0000-0000-0000-000000000000') = '9', 'итог пересчитан: 9');
  perform pg_temp.ok((select count(*) from public.notifications where kind = 'work_regraded') = 1, 'уведомление о пересмотре');
  raise notice 'ok 7: повторная проверка — история и пересчёт';
end $$;

-- 8. Доработка: ученик меняет только возвращённое задание и сдаёт снова.
set role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-0000-0000-000000000000', false);
select public.save_answer(:'work_id', 15::smallint, 'б', '"2"');
select public.submit_work(:'work_id');
select public.my_submission(:'work_id') as sub2 \gset
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select public.start_check(:'sub2');
select public.return_task(:'sub2', 15::smallint, 'Пришлите фото решения');
select set_config('request.jwt.claim.sub', 'c2000000-0000-0000-0000-000000000000', false);
select public.save_answer(:'work_id', 15::smallint, 'б', '"\\frac{3\\sqrt2}{2}"');
select pg_temp.fails(format($q$select public.save_answer(%L, 14::smallint, 'а', '["2\\pi n"]')$q$, :'work_id'), 'closed');
select public.submit_work(:'work_id');
reset role;
do $$ begin
  perform pg_temp.ok((select status from public.submissions where user_id = 'c2000000-0000-0000-0000-000000000000') = 'submitted', 'после доработки — снова на проверке');
  perform pg_temp.ok((select count(*) from public.notifications where kind = 'task_returned') = 1, 'уведомление о доработке');
  raise notice 'ok 8: доработка одного задания';
end $$;

-- 9. Срок: после срока не сохранить, после продления — можно.
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select public.issue_variant_work('Самопроверка', null, now() + interval '1 day', null,
  array['c1000000-0000-0000-0000-000000000000']::uuid[], 'PV-01', 1::smallint, 'self') as work2 \gset
reset role;
update public.variant_works set due_at = now() - interval '1 minute' where id = :'work2';
set role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select pg_temp.fails(format($q$select public.save_answer(%L, 1::smallint, '', '"2,5"')$q$, :'work2'), 'closed');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
select public.extend_work(:'work2', now() + interval '2 days', 'c1000000-0000-0000-0000-000000000000');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000000', false);
select public.save_answer(:'work2', 1::smallint, '', '"2,5"');
select public.submit_work(:'work2');
reset role;
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.grades g join public.submissions s on s.id = g.submission_id
                                  where s.work_id = (select id from public.variant_works where title = 'Самопроверка')
                                    and g.ne_pristupal), 'в самопроверке «не приступал» не ставится');
  raise notice 'ok 9: срок закрывает загрузку, продление открывает';
end $$;

-- 10. Удаление аккаунта ученика уносит его работы, фото и баллы.
delete from auth.users where id = 'c1000000-0000-0000-0000-000000000000';
do $$ begin
  perform pg_temp.ok(not exists (select 1 from public.photos where object_key like 'raboty/%' and submission_id not in (select id from public.submissions)), 'фото без работы');
  perform pg_temp.ok((select count(*) from public.submissions) = 1, 'осталась только работа второго ученика');
  raise notice 'ok 10: удаление аккаунта — каскадом';
end $$;
