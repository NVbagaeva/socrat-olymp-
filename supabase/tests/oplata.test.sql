-- Проверка supabase/migrations/20261129120000_oplata.sql (docs/oplata-robokassa.md):
-- цена — из базы, заказ — только своей роли и с офертой, чужие заказы не
-- видны, зачесть оплату может только сервис, повтор уведомления ничего не
-- меняет, новый срок продолжает действующий, заказ переживает удаление
-- аккаунта. Идёт на всех миграциях с правами по умолчанию своего сервера
-- (lite-defaults.sql) и ценами из supabase/seed/tarify.sql.
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

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;

grant execute on all functions in schema pg_temp to anon, authenticated, service_role;

\set t1 'e1000000-0000-0000-0000-000000000000'
\set s1 'e2000000-0000-0000-0000-000000000000'
\set s2 'e3000000-0000-0000-0000-000000000000'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,s1@x.ru,s2@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}'));

/* ── 1. Цена — из таблицы, по дате ─────────────────────────────── */

select pg_temp.ok(public.oplata_tsena('uchenik', 'd30', '2026-12-01') = 390, 'ученик, 30 дней');
select pg_temp.ok(public.oplata_tsena('repetitor', 'd30', '2027-05-20') = 890, 'учитель, 30 дней в мае');
select pg_temp.ok(public.oplata_tsena('uchenik', 'ege', '2026-12-01') = 1990, 'до ЕГЭ в декабре');
select pg_temp.ok(public.oplata_tsena('uchenik', 'ege', '2027-03-15') = 1290, 'до ЕГЭ в марте');
select pg_temp.ok(public.oplata_tsena('repetitor', 'ege', '2027-05-31') = 1590, 'учитель до ЕГЭ 31 мая');
select pg_temp.ok(public.oplata_tsena('uchenik', 'ege', '2027-06-01') is null, '«До ЕГЭ» с 1 июня не продаётся');
select pg_temp.ok(public.oplata_tsena('uchenik', 'd30', '2027-06-10') = 390, '30 дней в июне продаются');

/* ── 2. Заказ: только после входа, своей роли, с офертой ────────── */

set role anon;
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'd30', true)$q$, 'permission denied');
select pg_temp.fails($q$select public.oplata_tsena('uchenik', 'd30')$q$, 'permission denied');
select pg_temp.fails($q$select * from public.tarif_tseny$q$, 'permission denied');
reset role;

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails($q$select public.oplata_sozdat('repetitor', 'd30', true)$q$, 'wrong_tarif');
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'god', true)$q$, 'wrong_srok');
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'd30', false)$q$, 'oferta');
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'd30', null)$q$, 'oferta');
select public.oplata_sozdat('uchenik', 'd30', true) as z1 \gset
select pg_temp.ok((:'z1'::jsonb ->> 'summa') = '390.00', 'сумма заказа 390.00: ' || :'z1');
select pg_temp.ok((:'z1'::jsonb ->> 'email') = 's1@x.ru', 'почта для чека');
select pg_temp.ok((:'z1'::jsonb ->> 'opisanie') = 'Будет на ЕГЭ: тариф «Ученик», 30 дней', 'описание: ' || :'z1');
select (:'z1'::jsonb ->> 'inv_id')::bigint as inv1 \gset
select pg_temp.ok(:inv1 >= 1001, 'номер заказа с 1001');
-- Напрямую в таблицу — нельзя, зачесть самому себе — нельзя.
select pg_temp.fails($q$insert into public.oplata_zakazy (user_id, tarif, srok, summa, opisanie)
  values (auth.uid(), 'uchenik', 'ege', 1, 'x')$q$, 'permission denied');
select pg_temp.fails(format($q$update public.oplata_zakazy set status = 'oplachen' where inv_id = %s$q$, :inv1),
  'permission denied');
select pg_temp.fails(format($q$select public.oplata_zachest(%s, 390)$q$, :inv1), 'permission denied');
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'd30', true) from generate_series(1, 25)$q$,
  'too_many');
select pg_temp.ok((select count(*) from public.oplata_zakazy) = 1, 'свой заказ виден');
select pg_temp.ok(public.moy_dostup() is null, 'до оплаты доступа нет');

select pg_temp.as_user(:'s2');
select pg_temp.ok((select count(*) from public.oplata_zakazy) = 0, 'чужой заказ виден');
select public.oplata_sozdat('uchenik', 'ege', true) as z2 \gset
select (:'z2'::jsonb ->> 'inv_id')::bigint as inv2 \gset

select pg_temp.as_user(:'t1');
select pg_temp.fails($q$select public.oplata_sozdat('uchenik', 'd30', true)$q$, 'wrong_tarif');
select public.oplata_sozdat('repetitor', 'd30', true) as z3 \gset
select pg_temp.ok((:'z3'::jsonb ->> 'summa') = '890.00', 'учитель: 890.00');
reset role;

/* ── 3. Зачесть оплату — только сервис, сумма должна совпасть ───── */

set role service_role;
select pg_temp.fails($q$select public.oplata_zachest(999999, 390)$q$, 'net_zakaza');
select pg_temp.fails(format($q$select public.oplata_zachest(%s, 1)$q$, :inv1), 'summa');
select public.oplata_zachest(:inv1, 390.000000) as r1 \gset
select pg_temp.ok((:'r1'::jsonb ->> 'itog') = 'oplachen', 'оплата не зачтена: ' || :'r1');
select public.oplata_zachest(:inv1, 390) as r1b \gset
select pg_temp.ok((:'r1b'::jsonb ->> 'itog') = 'uzhe', 'повтор уведомления: ' || :'r1b');
select public.oplata_zachest(:inv2, 1990) as r2 \gset
reset role;

select pg_temp.ok(abs(extract(epoch from dostup_do - now() - interval '30 days')) < 60,
  'срок 30 дней от оплаты') from public.oplata_zakazy where inv_id = :inv1;
select pg_temp.ok(dostup_do = '2027-07-01 00:00:00+03'::timestamptz, 'до ЕГЭ — до конца 30 июня по Москве')
  from public.oplata_zakazy where inv_id = :inv2;

-- Второй заказ на 30 дней продолжает первый.
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok((public.moy_dostup() ->> 'tarif') = 'uchenik', 'после оплаты доступ есть');
select (public.oplata_sozdat('uchenik', 'd30', true) ->> 'inv_id')::bigint as inv4 \gset
reset role;
set role service_role;
select public.oplata_zachest(:inv4, 390) as r4 \gset
reset role;
select pg_temp.ok(
  (select dostup_s from public.oplata_zakazy where inv_id = :inv4) =
  (select dostup_do from public.oplata_zakazy where inv_id = :inv1), 'новый срок не продолжил прежний');
select pg_temp.ok(abs(extract(epoch from dostup_do - now() - interval '60 days')) < 60, 'итого 60 дней')
  from public.oplata_zakazy where inv_id = :inv4;

/* ── 4. Письма: открыт, продлён, заканчивается ───────────────────── */

select pg_temp.ok((select vid from public.oplata_pisma where inv_id = :inv1) = 'oplachen', 'письмо «открыт»');
select pg_temp.ok((select vid from public.oplata_pisma where inv_id = :inv4) = 'prodlen', 'письмо «продлён»');
select pg_temp.ok((select vid from public.oplata_pisma where inv_id = :inv2) = 'oplachen', 'письмо ученику 2');
select pg_temp.ok((select count(*) from public.oplata_pisma where inv_id = :inv1) = 1, 'повтор уведомления — второе письмо');

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails($q$select public.oplata_pisma_zabrat(10)$q$, 'permission denied');
select pg_temp.fails($q$select public.oplata_tick_konec()$q$, 'permission denied');
select pg_temp.fails($q$select * from public.oplata_pisma$q$, 'permission denied');
reset role;

set role service_role;
select public.oplata_pisma_zabrat(10) as pachka \gset
select pg_temp.ok(jsonb_array_length(:'pachka'::jsonb) = 3, 'в пачке 3 письма: ' || :'pachka');
select pg_temp.ok((:'pachka'::jsonb -> 0 ->> 'to') = 's1@x.ru' and (:'pachka'::jsonb -> 0 ->> 'tarif') = 'uchenik'
  and (:'pachka'::jsonb -> 0 ->> 'summa') = '390.00', 'строка письма: ' || :'pachka');
select pg_temp.ok(jsonb_array_length(public.oplata_pisma_zabrat(10)) = 0, 'взятое письмо выдано второй раз');
select public.oplata_pisma_itog((select id from public.oplata_pisma where inv_id = :inv1), 'sent');
select public.oplata_pisma_itog((select id from public.oplata_pisma where inv_id = :inv4), 'povtor');
select pg_temp.fails($q$select public.oplata_pisma_itog(1, 'nu')$q$, 'bad_rezultat');
reset role;
select pg_temp.ok((select status from public.oplata_pisma where inv_id = :inv1) = 'sent', 'итог sent');
select pg_temp.ok((select status = 'zhdet' and send_after > now() + interval '4 minutes'
  from public.oplata_pisma where inv_id = :inv4), 'повтор через 5 минут');

-- Учителю: срок кончается через 2 дня → «заканчивается», один раз.
set role service_role;
select public.oplata_zachest((:'z3'::jsonb ->> 'inv_id')::bigint, 890);
reset role;
update public.oplata_zakazy set dostup_do = now() + interval '2 days'
 where inv_id = (:'z3'::jsonb ->> 'inv_id')::bigint;
-- Срок «До ЕГЭ» ученика 2 кончается с концом продаж — напоминания нет;
-- 60 дней ученика 1 — далеко.
set role service_role;
select pg_temp.ok(public.oplata_tick_konec() = 1, 'напоминание учителю');
select pg_temp.ok(public.oplata_tick_konec() = 0, 'напоминание второй раз');
reset role;
select pg_temp.ok((select user_id from public.oplata_pisma where vid = 'konec') = :'t1', 'напоминание не тому');
-- Оплатил следующий срок до отправки — напоминание отменяется.
set role authenticated;
select pg_temp.as_user(:'t1');
select (public.oplata_sozdat('repetitor', 'd30', true) ->> 'inv_id')::bigint as inv5 \gset
reset role;
set role service_role;
select public.oplata_zachest(:inv5, 890);
select pg_temp.ok(not exists (select 1 from jsonb_array_elements(public.oplata_pisma_zabrat(10)) e
  where e ->> 'vid' = 'konec'), 'напоминание после продления ушло');
reset role;
select pg_temp.ok((select status from public.oplata_pisma where vid = 'konec') = 'otmeneno', 'напоминание не отменено');

/* ── 5. Удаление аккаунта: заказ остаётся для учёта ─────────────── */

delete from auth.users where id = :'s2';
select pg_temp.ok(user_id is null and status = 'oplachen', 'заказ после удаления аккаунта')
  from public.oplata_zakazy where inv_id = :inv2;
select pg_temp.ok((select count(*) from public.oplata_pisma where user_id = :'s2') = 0, 'письма удалённому');

do $$ begin raise notice 'ok: оплата — цена, заказ, зачёт, продление, письма, удаление аккаунта'; end $$;
