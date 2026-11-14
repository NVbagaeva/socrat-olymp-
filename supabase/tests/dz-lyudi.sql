-- Люди и классы для проверок ДЗ: репетитор 1 — класс А (ученики 1 и 2),
-- репетитор 2 — класс Б (ученик 3). Коды классов — в dz.code_a, dz.code_b.

insert into public.legal_editions (version) values ('2026-11-11') on conflict do nothing;
insert into vault.secrets (name, secret)
values ('allowed_emails', 't1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Репетитор 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Репетитор 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 3","birth_year":2000}'));

set role authenticated;
select pg_temp.as_user(:'t1');
insert into public.classes (tutor_id, name) values (auth.uid(), 'А') returning id as class_a, join_code as code_a \gset
select pg_temp.as_user(:'t2');
insert into public.classes (tutor_id, name) values (auth.uid(), 'Б') returning id as class_b, join_code as code_b \gset
select pg_temp.as_user(:'s1');
select public.join_class(:'code_a');
select pg_temp.as_user(:'s2');
select public.join_class(:'code_a');
select pg_temp.as_user(:'s3');
select public.join_class(:'code_b');
reset role;
