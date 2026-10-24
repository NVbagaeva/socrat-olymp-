-- Начальные данные для проверки сервиса загрузки (app/scripts/check-uploads.mjs):
-- те же люди и ключи, что в raboty_chast2.test.sql, и выданный вариант.
\set ON_ERROR_STOP on
insert into public.legal_editions (version) values ('2026-10-15');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-15',
    'accept_soglashenie', true, 'accept_soglasie', true, 'signup_ip', '203.0.113.7') || extra
$$;

create or replace function pg_temp.fails(sql text, needle text) returns void language plpgsql as $$
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


insert into public.variant_keys (variant_code, versiya, task_no, punkt, pole) values
  ('PV-01', 1, 16, '', '{"vid":"promezhutki","verno":{"kuski":[{"t":"interval","lo":"1","loZakr":true,"hi":"1,5","hiZakr":false},{"t":"interval","lo":"9","loZakr":true,"hi":"inf","hiZakr":false}]}}'),
  ('PV-01', 1, 20, 'а', '{"vid":"danet","verno":true}');
set role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000000', false);
create table pg_temp.w as select public.issue_variant_work('Пробник', null, now() + interval '3 days', null,
  array['c1000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000']::uuid[],
  'PV-01', 1::smallint, 'teacher') as id;
reset role;
create table public.test_work as select id from pg_temp.w;
grant select on public.test_work to authenticated, service_role;
