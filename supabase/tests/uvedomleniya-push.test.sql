-- Проверка supabase/migrations/20261127120000_uvedomleniya_push.sql
-- (docs/kabinet-uvedomleniya.md, PR 3г): подписка только на адрес
-- известного сервиса push, своя подписка, переход адреса к другому
-- аккаунту, не больше 10; очередь push — только тем, у кого есть
-- подписка; пачка без названия ДЗ и имён; ответы сервиса; ключи VAPID;
-- флаг push; права.
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
create function pg_temp.st(u text, ev text, ch text) returns text language sql as $$
  select string_agg(status, ',' order by id) from public.notify_outbox
   where user_id = u::uuid and event = ev and channel = ch
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
-- Ключи браузера: 65 и 16 байт в base64url.
\set k 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM'
\set a 'tBHItJI5svbpez7KI4CCXg'
\set e1 'https://fcm.googleapis.com/fcm/send/dAbC1:APA91bH-s1-telefon'
\set e2 'https://web.push.apple.com/QGwXz_s1-iphone'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,s1@x.ru,s2@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель 1"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Аня","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Борис","birth_year":2000}'));
insert into public.classes (tutor_id, name) values (:'t1', '11 «А»') returning id as class_a \gset
insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'s1'), (:'t1', :'s2');
insert into public.class_members (class_id, user_id) values (:'class_a', :'s1'), (:'class_a', :'s2');
update public.kabinet_flags set value = 'true' where key in ('dz_novye', 'uvedomleniya');
update public.kabinet_flags set value = '["pochta"]' where key = 'uvedomleniya_kanaly';

/* ── 1. Флаг push выключен: подписаться нельзя, ключа нет ───────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', :'e1', :'k', :'a'), 'push_off');
select pg_temp.ok(public.push_klyuch() is null, 'ключ при выключенном push');
reset role;
update public.kabinet_flags set value = '["pochta", "push"]' where key = 'uvedomleniya_kanaly';

/* ── 2. Ключи VAPID: создаёт рассыльщик, один раз ──────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.push_klyuch() is null, 'ключ до того, как его создал рассыльщик');
reset role;
set role service_role;
select pg_temp.ok(public.push_vapid() is null, 'ключи VAPID до создания');
select pg_temp.fails($q$select public.push_vapid_sohranit('korotkiy', 'x')$q$, 'bad_key');
select pg_temp.ok(public.push_vapid_sohranit(repeat('P', 87), repeat('s', 43)) ->> 'public' = repeat('P', 87),
  'ключи не сохранились');
-- Второй рассыльщик со своими ключами — остаются первые.
select pg_temp.ok(public.push_vapid_sohranit(repeat('Q', 87), repeat('t', 43)) ->> 'private' = repeat('s', 43),
  'ключи VAPID перезаписаны');
reset role;
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.push_klyuch() = repeat('P', 87), 'открытый ключ не виден вошедшему');
reset role;

/* ── 3. Подписка ───────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
-- Тихие часы проверены в 3а; здесь они сдвигали бы push на утро в
-- зависимости от времени прогона.
select public.sohranit_nastroyki_uvedomleniy('{"quiet_on": false}');
select pg_temp.ok(public.moi_push() = 0, 'подписки до подписки');
select pg_temp.ok(public.push_podpisat(:'e1', :'k', :'a') = 1, 'подписка не записалась');
select pg_temp.ok(public.push_podpisat(:'e2', :'k', :'a') = 2, 'вторая подписка');
-- Повтор того же адреса — та же строка.
select pg_temp.ok(public.push_podpisat(:'e1', :'k', :'a') = 2, 'повтор подписки — дубль');
-- Чужие и внутренние адреса — нельзя.
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', 'http://fcm.googleapis.com/fcm/send/x1234567890', :'k', :'a'), 'bad_endpoint');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', 'https://rest:3000/rpc/notify_zabrat', :'k', :'a'), 'bad_endpoint');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', 'https://evil.example/fcm.googleapis.com/x', :'k', :'a'), 'bad_endpoint');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', 'https://fcm.googleapis.com.evil.example/x1234', :'k', :'a'), 'bad_endpoint');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', 'https://x.push.apple.com@evil.example/x1234', :'k', :'a'), 'bad_endpoint');
-- Кривые ключи.
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', :'e1' || 'z', 'korotkiy', :'a'), 'push_subscriptions_p256dh_check');
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', :'e1' || 'z', :'k', 'a b'), 'push_subscriptions_auth_check');
-- Напрямую таблицу не видно.
select pg_temp.fails('select * from public.push_subscriptions', 'permission denied');
reset role;

-- Тот же браузер, другой аккаунт: адрес переходит к нему.
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.push_podpisat(:'e2', :'k', :'a') = 1, 'адрес не перешёл ко второму аккаунту');
-- Чужую подписку не выключить.
select pg_temp.ok(not public.push_otpisat(:'e1'), 'выключена чужая подписка');
reset role;
select pg_temp.ok((select user_id from public.push_subscriptions where endpoint = :'e2') = :'s2'::uuid, 'владелец адреса');
select pg_temp.ok((select count(*) from public.push_subscriptions where user_id = :'s1') = 1, 'у первого осталась одна');

-- Не больше 10: лишние — самые старые.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.push_podpisat('https://fcm.googleapis.com/fcm/send/uchitel-' || i, :'k', :'a') from generate_series(1, 12) i;
select pg_temp.ok(public.moi_push() = 10, 'подписок больше 10');
reset role;
select pg_temp.ok(not exists (select 1 from public.push_subscriptions where endpoint like '%/uchitel-1' or endpoint like '%/uchitel-2'),
  'удалены не самые старые');

/* ── 4. Очередь: push — только с подпиской ─────────────────────── */

-- ДЗ классу: s1 (подписан) и s2 (подписан) — строки push; затем s2 выключает.
set role authenticated;
select pg_temp.as_user(:'s2');
select pg_temp.ok(public.push_otpisat(:'e2'), 'своя подписка не выключилась');
select pg_temp.ok(public.moi_push() = 0, 'подписка осталась');
select pg_temp.as_user(:'t1');
select public.dz2_save(jsonb_build_object('title', 'Секретное название', 'due_at', now() + interval '30 hours',
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 8, 'title', 'Глава',
                                                'spec', jsonb_build_object('glava', 'g'))))) as hw \gset
select public.dz2_publish(:'hw');
reset role;
select pg_temp.ok(pg_temp.st(:'s1', 'dz_novoe', 'push') = 'wait', 'нет строки push у подписанного');
select pg_temp.ok(pg_temp.st(:'s2', 'dz_novoe', 'push') is null, 'строка push без подписки');
select pg_temp.ok(pg_temp.st(:'s2', 'dz_novoe', 'pochta') = 'wait', 'письмо у неподписанного пропало');

/* ── 5. Пачка push ─────────────────────────────────────────────── */

set role service_role;
select public.notify_zabrat_push(20, now() + interval '1 day') as pachka \gset
reset role;
select pg_temp.ok(jsonb_array_length(:'pachka'::jsonb) = 1, 'в пачке не один push');
select pg_temp.ok((select x ->> 'event' = 'dz_novoe' and x ->> 'homework_id' = :'hw' and (x ->> 'ttl')::int = 86400
                     and jsonb_array_length(x -> 'subs') = 1 and x -> 'subs' -> 0 ->> 'endpoint' = :'e1'
                     and x -> 'subs' -> 0 ->> 'p256dh' = :'k' and x -> 'subs' -> 0 ->> 'auth' = :'a'
                     from jsonb_array_elements(:'pachka'::jsonb) x), 'в строке push не то');
-- В-5: ни названия ДЗ, ни имён, ни почты.
select pg_temp.ok(position('Секретное' in :'pachka') = 0 and position('Аня' in :'pachka') = 0
                  and position('@' in :'pachka') = 0, 'в push попало личное или название');
select pg_temp.ok(pg_temp.st(:'s1', 'dz_novoe', 'push') = 'sending', 'push не «отправляется»');
-- Письма push-пачка не трогает.
select pg_temp.ok(pg_temp.st(:'s1', 'dz_novoe', 'pochta') = 'wait', 'push-пачка забрала письмо');
set role service_role;
select public.notify_itog((select id from public.notify_outbox where user_id = :'s1' and channel = 'push'), 'sent', null);
select public.push_rezultat(:'e1', true);
reset role;
select pg_temp.ok(pg_temp.st(:'s1', 'dz_novoe', 'push') = 'sent', 'push не отправлен');
select pg_temp.ok((select last_ok_at is not null and fails = 0 from public.push_subscriptions where endpoint = :'e1'), 'last_ok_at');

-- Напоминание за 24 ч: TTL — до дедлайна; подписка исчезла (410) — удаляется,
-- следующая строка без подписки отменяется.
select public.notify_tick(now() + interval '7 hours');
select pg_temp.ok(pg_temp.st(:'s1', 'dz_napominanie', 'push') = 'wait', 'нет напоминания push');
set role service_role;
select public.notify_zabrat_push(20, now() + interval '7 hours') as p2 \gset
select pg_temp.ok(((:'p2'::jsonb) -> 0 ->> 'ttl')::int between 82000 and 83000, 'TTL напоминания не до дедлайна');
select pg_temp.ok((:'p2'::jsonb) -> 0 -> 'za' = '24'::jsonb, 'признак «за 24»');
select public.push_rezultat(:'e1', false, true);
select public.notify_itog(((:'p2'::jsonb) -> 0 ->> 'id')::bigint, 'povtor', 'gone');
reset role;
select pg_temp.ok(not exists (select 1 from public.push_subscriptions where endpoint = :'e1'), 'ушедшая подписка не удалена');
set role service_role;
select pg_temp.ok(jsonb_array_length(public.notify_zabrat_push(20, now() + interval '8 hours')) = 0, 'push без подписки выдан');
reset role;
select pg_temp.ok(pg_temp.st(:'s1', 'dz_napominanie', 'push') = 'cancelled', 'push без подписки не отменён');
select pg_temp.ok((select detail from public.notify_log where channel = 'push' and result = 'cancelled' order by id desc limit 1)
                  = 'нет подписки', 'причина отмены');

-- Сбой без «ушла» — счётчик.
set role authenticated;
select pg_temp.as_user(:'s1');
select public.push_podpisat(:'e1', :'k', :'a');
reset role;
set role service_role;
select public.push_rezultat(:'e1', false);
select public.push_rezultat(:'e1', false);
reset role;
select pg_temp.ok((select fails from public.push_subscriptions where endpoint = :'e1') = 2, 'счётчик сбоев');

-- Канал push выключен в настройках после постановки — отмена.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_save(jsonb_build_object('title', 'Второе', 'due_at', now() + interval '50 hours',
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 8, 'title', 'Глава',
                                                'spec', jsonb_build_object('glava', 'g'))))) as hw2 \gset
select public.dz2_publish(:'hw2');
select pg_temp.as_user(:'s1');
select public.sohranit_nastroyki_uvedomleniy('{"kanaly": {"dz_novoe": {"pochta": true, "push": false}}}');
reset role;
set role service_role;
select public.notify_zabrat_push(20, now() + interval '1 day');
reset role;
select pg_temp.ok((select status from public.notify_outbox where homework_id = :'hw2' and user_id = :'s1' and channel = 'push')
                  = 'cancelled', 'push, выключенный в настройках, не отменён');

/* ── 6. Флаг push выключили — пачка пустая ─────────────────────── */

update public.kabinet_flags set value = '["pochta"]' where key = 'uvedomleniya_kanaly';
set role service_role;
select pg_temp.ok(jsonb_array_length(public.notify_zabrat_push(20, now() + interval '2 days')) = 0, 'push при выключенном флаге');
reset role;
update public.kabinet_flags set value = '["pochta", "push"]' where key = 'uvedomleniya_kanaly';

/* ── 7. Права ─────────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails('select public.notify_zabrat_push()', 'permission denied');
select pg_temp.fails('select public.push_vapid()', 'permission denied');
select pg_temp.fails($q$select public.push_vapid_sohranit('a', 'b')$q$, 'permission denied');
select pg_temp.fails(format('select public.push_rezultat(%L, true)', :'e1'), 'permission denied');
reset role;
set role anon;
select pg_temp.fails(format('select public.push_podpisat(%L, %L, %L)', :'e1', :'k', :'a'), 'permission denied');
select pg_temp.fails('select public.push_klyuch()', 'permission denied');
select pg_temp.fails('select public.moi_push()', 'permission denied');
select pg_temp.fails(format('select public.push_otpisat(%L)', :'e1'), 'permission denied');
reset role;

/* ── 8. Уборка: полгода одни отказы — подписка удаляется ────────── */

update public.push_subscriptions set fails = 10, created_at = now() - interval '200 days', last_ok_at = null
 where endpoint = :'e1';
select pg_temp.ok((public.notify_svernut() ->> 'push')::int = 1, 'мёртвая подписка не удалена');

\echo 'Уведомления, push: все проверки прошли.'
