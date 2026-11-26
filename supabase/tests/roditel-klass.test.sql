-- Проверка миграций 20261128130000_roditel_pismo.sql (письмо родителю) и
-- 20261128140000_klass_po_kodu.sql (класс по коду до вступления).
-- Идёт на всех миграциях с правами по умолчанию своего сервера.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs.

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-11-11');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-11-11',
    'accept_soglashenie', true, 'accept_soglasie', true) || extra
$$;
create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', what; end if;
end $$;
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
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set kid 'c9000000-0000-0000-0000-000000000000'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,s1@x.ru,s2@x.ru,kid@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Мария Петровна"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  (:'kid', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}'));

/* ── 1. Письмо родителю ────────────────────────────────────────── */

-- Служебные функции закрыты для сайта.
select pg_temp.ok(not has_function_privilege('authenticated', 'public.roditel_zabrat(int)', 'execute')
  and not has_function_privilege('anon', 'public.roditel_zabrat(int)', 'execute')
  and not has_function_privilege('authenticated', 'public.roditel_itog(uuid, boolean)', 'execute')
  and not has_function_privilege('authenticated', 'public.confirm_parent_consent(text, inet)', 'execute')
  and not has_function_privilege('anon', 'public.roditel_pismo_snova()', 'execute')
  and has_function_privilege('service_role', 'public.roditel_zabrat(int)', 'execute'),
  'права на функции письма родителю');

-- Новый школьник ждёт письма; рассыльщик забирает его один раз.
create temp table pismo as select * from public.roditel_zabrat(20);
select pg_temp.ok((select count(*) = 1 and bool_and(user_id = :'kid' and parent_email = 'mama@x.ru'
                     and imya = 'Школьник' and length(token) = 64) from pismo), 'roditel_zabrat: письмо школьнику');
select pg_temp.ok((select count(*) from public.roditel_zabrat(20)) = 0, 'второй проход прислал то же письмо');
select pg_temp.ok((select token_hash = encode(sha256(convert_to((select token from pismo), 'UTF8')), 'hex')
                     and letter_sent_at is not null and pisem_n = 1
                     from public.parent_consents where user_id = :'kid'), 'в базе — хеш токена и отметка письма');

-- Ученик: «ещё раз» — не раньше чем через 10 минут.
set role authenticated;
select pg_temp.as_user(:'kid');
select pg_temp.fails('select public.roditel_pismo_snova()', 'too_soon');
-- Взрослому ученику родитель не нужен.
select pg_temp.as_user(:'s1');
select pg_temp.fails('select public.roditel_pismo_snova()', 'no_parent_consent');
reset role;

update public.parent_consents set letter_sent_at = now() - interval '11 minutes' where user_id = :'kid';
set role authenticated;
select pg_temp.as_user(:'kid');
select pg_temp.ok(public.roditel_pismo_snova() ->> 'ok' = 'true', '«ещё раз» через 11 минут');
reset role;
create temp table pismo2 as select * from public.roditel_zabrat(20);
select pg_temp.ok((select count(*) from pismo2) = 1, 'повторное письмо не забрано');
-- Старая ссылка больше не действует.
select pg_temp.fails(format('select public.confirm_parent_consent(%L, null)', (select token from pismo)), 'bad_token');

-- Не больше 5 писем в сутки.
update public.parent_consents set pisem_n = 5, letter_sent_at = now() - interval '1 hour' where user_id = :'kid';
set role authenticated;
select pg_temp.as_user(:'kid');
select pg_temp.fails('select public.roditel_pismo_snova()', 'too_many');
reset role;

-- Временный сбой — повтор через 5 минут, постоянный — без повтора.
select public.roditel_itog(:'kid', true);
select pg_temp.ok((select pismo_nuzhno_s > now() + interval '4 minutes' from public.parent_consents
                    where user_id = :'kid'), 'повтор через 5 минут');
select public.roditel_itog(:'kid', false);
select pg_temp.ok((select pismo_nuzhno_s is null from public.parent_consents where user_id = :'kid'),
  'постоянный сбой — без повтора');

-- Ссылка старше 14 дней не подходит.
update public.parent_consents set letter_sent_at = now() - interval '15 days' where user_id = :'kid';
select pg_temp.fails(format('select public.confirm_parent_consent(%L, %L)', (select token from pismo2), '203.0.113.9'), 'bad_token');
update public.parent_consents set letter_sent_at = now() - interval '1 day' where user_id = :'kid';

-- До согласия прогресс не сохраняется, после — сохраняется; IP записан.
select pg_temp.ok(not public.can_save_progress(:'kid'), 'до согласия прогресс сохраняется');
select pg_temp.ok(public.confirm_parent_consent((select token from pismo2), '203.0.113.9') = :'kid',
  'согласие не записано');
select pg_temp.ok(public.can_save_progress(:'kid'), 'после согласия прогресс не сохраняется');
select pg_temp.ok((select count(*) = 1 from public.consents where user_id = :'kid' and kind = 'soglasie_roditelya'
                     and ip = '203.0.113.9' and parent_email = 'mama@x.ru'), 'нет записи согласия родителя');
select pg_temp.ok((select count(*) from public.roditel_zabrat(20)) = 0, 'после согласия снова письмо');
select pg_temp.fails(format('select public.confirm_parent_consent(%L, null)', (select token from pismo2)), 'bad_token');
do $$ begin raise notice 'ok 1: письмо родителю — одно, повтор с пределами, ссылка 14 дней и один раз'; end $$;

/* ── 2. Класс по коду до вступления ────────────────────────────── */

insert into public.classes (tutor_id, name) values (:'t1', '11 «А»') returning id as class_a, join_code as kod \gset

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok((select x ->> 'class_name' = '11 «А»' and x ->> 'tutor_name' = 'Мария Петровна'
                     and x ->> 'uzhe' = 'false' from (select public.klass_po_kodu(lower(:'kod')) x) q),
  'klass_po_kodu: класс и учитель');
reset role;
select pg_temp.ok(not exists (select 1 from public.class_members where user_id = :'s1')
  and not exists (select 1 from public.tutor_students where user_id = :'s1'), 'просмотр вступил в класс');

set role authenticated;
select pg_temp.as_user(:'s1');
select public.join_class(:'kod');
select pg_temp.ok(public.klass_po_kodu(:'kod') ->> 'uzhe' = 'true', 'уже в классе — не видно');

-- Неверные коды: общий с join_class предел 10 в час.
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.klass_po_kodu('ZZZZZZ') ->> 'error' = 'bad_code', 'неверный код');
reset role;
select pg_temp.ok((select count(*) = 1 from public.class_join_tries where user_id = :'s2'), 'попытка не записана');
insert into public.class_join_tries (user_id) select :'s2' from generate_series(1, 9);
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.fails(format('select public.klass_po_kodu(%L)', :'kod'), 'too_many_tries');
select pg_temp.fails(format('select public.join_class(%L)', :'kod'), 'too_many_tries');

-- Учителю и анониму — нельзя; школьнику до согласия — нельзя (он уже подтверждён выше,
-- поэтому проверяем учителя и анонима).
select pg_temp.as_user(:'t1');
select pg_temp.fails(format('select public.klass_po_kodu(%L)', :'kod'), 'forbidden');
reset role;
select pg_temp.ok(not has_function_privilege('anon', 'public.klass_po_kodu(text)', 'execute'),
  'klass_po_kodu открыт анониму');
do $$ begin raise notice 'ok 2: класс по коду — без вступления, тот же предел попыток, только ученику'; end $$;
