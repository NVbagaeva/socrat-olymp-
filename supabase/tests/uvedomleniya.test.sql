-- Проверка supabase/migrations/20261125120000_uvedomleniya.sql
-- (docs/kabinet-uvedomleniya.md): события ДЗ → колокольчик и очередь;
-- напоминания за 24 и 3 ч только несдавшим, без дублей; перенос
-- дедлайна; ДЗ, открытое позже окна; закрытое ДЗ; «срок прошёл» и «не
-- сдали»; тихие часы в поясе получателя; настройки; флаги; права.
-- Время «в будущем» подаётся в notify_tick(now) — так проверяются окна.
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
-- Сколько уведомлений у пользователя (по событию и ДЗ), в обход прав.
create function pg_temp.nu(u text, ev text, hw text default null) returns bigint language sql as $$
  select count(*) from public.notifications
   where user_id = u::uuid and event = ev and (hw is null or homework_id = hw::uuid)
$$;
create function pg_temp.no(u text, ev text, hw text default null) returns bigint language sql as $$
  select count(*) from public.notify_outbox
   where user_id = u::uuid and event = ev and (hw is null or homework_id = hw::uuid)
$$;
-- Опубликованное ДЗ: кому (класс или ученик), дедлайн и время открытия — от now().
create function pg_temp.dz(title text, target jsonb, due interval, pub interval default null) returns uuid
language plpgsql as $$
declare v uuid;
begin
  v := public.dz2_save(jsonb_build_object(
    'title', title, 'targets', jsonb_build_array(target),
    'due_at', now() + due, 'publish_at', case when pub is null then null else now() + pub end,
    'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 8,
                                                  'title', 'Глава', 'spec', jsonb_build_object('glava', 'g')))));
  perform public.dz2_publish(v);
  return v;
end $$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set s3 'c3000000-0000-0000-0000-000000000000'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Учитель 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Аня","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Борис","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Чужой","birth_year":2000}'));
insert into public.classes (tutor_id, name) values (:'t1', '11 «А»') returning id as class_a \gset
insert into public.classes (tutor_id, name) values (:'t2', 'Чужой') returning id as class_c \gset
insert into public.tutor_students (tutor_id, user_id, alias) values (:'t1', :'s1', null), (:'t1', :'s2', 'Боря К.'),
  (:'t2', :'s3', null);
insert into public.class_members (class_id, user_id) values (:'class_a', :'s1'), (:'class_a', :'s2'), (:'class_c', :'s3');
update public.kabinet_flags set value = 'true' where key = 'dz_novye';

/* ── 1. Флаг выключен — ничего не пишется ─────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('Без флага', jsonb_build_object('class_id', :'class_a'), interval '48 hours') as hw0 \gset
reset role;
select pg_temp.ok((select count(*) = 0 from public.notifications), 'флаг выключен, а уведомления пишутся');
select pg_temp.ok(public.notify_tick(now() + interval '25 hours') ->> 'off' = 'true', 'notify_tick без флага');

update public.kabinet_flags set value = 'true' where key = 'uvedomleniya';

/* ── 2. Публикация и отложенная публикация ────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('ДЗ 1', jsonb_build_object('class_id', :'class_a'), interval '48 hours') as hw1 \gset
select pg_temp.dz('Отложенное', jsonb_build_object('student_id', :'s1'), interval '30 hours', interval '2 hours')
  as hw2 \gset
reset role;
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_novoe', :'hw1') = 1 and pg_temp.nu(:'s2', 'dz_novoe', :'hw1') = 1,
  '«Новое ДЗ» — обоим ученикам класса');
select pg_temp.ok(pg_temp.nu(:'s3', 'dz_novoe') = 0, 'чужой ученик получил уведомление');
select pg_temp.ok((select count(*) = 0 from public.notify_outbox), 'каналы выключены, а очередь пишется');
select pg_temp.ok((select visible_at > now() + interval '1 hour' from public.notifications
                    where homework_id = :'hw2' and event = 'dz_novoe'), 'отложенное видно раньше открытия');

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(jsonb_array_length(public.moi_uvedomleniya()) = 1, 'ученик видит отложенное ДЗ до открытия');
select pg_temp.ok(public.uvedomleniya_schet() = 1, 'счётчик: одно непрочитанное');
select pg_temp.ok((public.moi_uvedomleniya() -> 0 ->> 'title') = 'ДЗ 1', 'в уведомлении название ДЗ');
reset role;

/* ── 3. Почта включена: очередь, настройки по умолчанию ─────────── */

update public.kabinet_flags set value = '["pochta"]' where key = 'uvedomleniya_kanaly';
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('ДЗ 3', jsonb_build_object('class_id', :'class_a'), interval '30 hours') as hw3 \gset
reset role;
select pg_temp.ok(pg_temp.no(:'s1', 'dz_novoe', :'hw3') = 1 and pg_temp.no(:'s2', 'dz_novoe', :'hw3') = 1,
  'письмо «Новое ДЗ» в очереди обоим');
select pg_temp.ok((select bool_and(o.send_after = public.notify_tikho(o.user_id, n.visible_at) and o.channel = 'pochta'
                                   and o.status = 'wait')
                     from public.notify_outbox o join public.notifications n on n.id = o.notification_id
                    where o.homework_id = :'hw3'), 'send_after — со сдвигом тихих часов');

/* ── 4. Напоминания за 24 и 3 ч, без дублей ───────────────────── */

-- hw1: дедлайн +48 ч. В +25 ч — окно «за 24 ч» (открыто давно).
select pg_temp.ok((public.notify_tick(now() + interval '25 hours') ->> 'r24')::int >= 2, 'напоминание за 24 ч');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw1') = 1 and pg_temp.nu(:'s2', 'dz_napominanie', :'hw1') = 1,
  'за 24 ч — обоим');
select pg_temp.ok((public.notify_tick(now() + interval '25 hours') ->> 'r24')::int = 0, 'второй прогон даёт дубли');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw1') = 1, 'дубль напоминания');

-- Борис сдаёт ДЗ 1 — учителю «сдано» с именем, письма о сдаче по умолчанию нет.
set role authenticated;
select pg_temp.as_user(:'s2');
select public.dz2_submit(:'hw1');
select pg_temp.as_user(:'t1');
select pg_temp.ok((select x ->> 'uchenik_name' = 'Боря К.' from jsonb_array_elements(public.moi_uvedomleniya()) x
                    where x ->> 'event' = 'dz_sdano'), 'учителю «сдано» с именем ученика, как у учителя');
reset role;
select pg_temp.ok(pg_temp.nu(:'t1', 'dz_sdano', :'hw1') = 1, '«сдано» учителю');
select pg_temp.ok((select payload ->> 'uchenik' = :'s2' from public.notifications where event = 'dz_sdano'),
  'в «сдано» — кто сдал');
select pg_temp.ok(pg_temp.no(:'t1', 'dz_sdano') = 0, 'письмо учителю о каждой сдаче по умолчанию');

-- За 3 ч (+46 ч): только Ане — Борис сдал.
select public.notify_tick(now() + interval '46 hours');
select pg_temp.ok((select count(*) = 1 from public.notifications
                    where homework_id = :'hw1' and event = 'dz_napominanie' and payload ->> 'za' = '3'),
  'за 3 ч — только несдавшей');
select pg_temp.ok((select user_id = :'s1' from public.notifications
                    where homework_id = :'hw1' and event = 'dz_napominanie' and payload ->> 'za' = '3'),
  'за 3 ч — не той');

-- Дедлайн прошёл (+49 ч): Ане «срок», учителю «не сдали 1 из 2».
select public.notify_tick(now() + interval '49 hours');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_srok', :'hw1') = 1 and pg_temp.nu(:'s2', 'dz_srok', :'hw1') = 0,
  '«срок прошёл» — только несдавшей');
select pg_temp.ok((select payload = '{"pozdno": true}'::jsonb from public.notifications
                    where homework_id = :'hw1' and event = 'dz_srok'), '«можно сдать с опозданием»');
select pg_temp.ok((select payload = '{"skolko": 1, "vsego": 2}'::jsonb from public.notifications
                    where homework_id = :'hw1' and event = 'dz_ne_sdali' and user_id = :'t1'),
  'учителю «не сдали 1 из 2»');
select public.notify_tick(now() + interval '50 hours');
select pg_temp.ok(pg_temp.nu(:'t1', 'dz_ne_sdali', :'hw1') = 1 and pg_temp.nu(:'s1', 'dz_srok', :'hw1') = 1,
  'дубли «срок» или «не сдали»');

/* ── 5. Перенос дедлайна, позднее открытие, закрытое ДЗ ───────── */

-- hw3: дедлайн +30 ч, в +7 ч — «за 24 ч». Учитель переносит на +40 ч — новое «за 24 ч» в +17 ч.
select public.notify_tick(now() + interval '7 hours');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw3') = 1, 'напоминание по ДЗ 3');
set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_edit(:'hw3', jsonb_build_object('due_at', now() + interval '40 hours'));
reset role;
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_izmeneno', :'hw3') = 1, '«ДЗ изменено» после переноса');
select public.notify_tick(now() + interval '17 hours');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw3') = 2, 'после переноса дедлайна — новое напоминание');

-- Открыто позже, чем за 24 ч: «за 24 ч» нет, «за 3 ч» есть.
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('Срочное', jsonb_build_object('student_id', :'s1'), interval '10 hours') as hw4 \gset
reset role;
select public.notify_tick(now() + interval '1 hour');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw4') = 0, '«за 24 ч» у ДЗ, открытого позже окна');
select public.notify_tick(now() + interval '8 hours');
select pg_temp.ok((select count(*) = 1 from public.notifications
                    where homework_id = :'hw4' and payload ->> 'za' = '3'), '«за 3 ч» у срочного ДЗ');

-- Закрытое ДЗ: ни напоминаний, ни «срока».
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('Закроют', jsonb_build_object('student_id', :'s1'), interval '30 hours') as hw5 \gset
select public.dz2_edit(:'hw5', '{"closed": true}');
reset role;
select public.notify_tick(now() + interval '7 hours');
select public.notify_tick(now() + interval '31 hours');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw5') + pg_temp.nu(:'s1', 'dz_srok', :'hw5') = 0,
  'по закрытому ДЗ напоминают');

/* ── 6. Возврат и комментарий ─────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_vernut(:'hw1', :'s2', 'Перерешай');
select public.dz2_comment(:'hw1', :'s2', 'Молодец');
reset role;
select pg_temp.ok(pg_temp.nu(:'s2', 'dz_vozvrat', :'hw1') = 1 and pg_temp.nu(:'s2', 'dz_kommentariy', :'hw1') = 1,
  'возврат и комментарий — ученику');
select pg_temp.ok((select payload = '{}'::jsonb from public.notifications where event = 'dz_kommentariy'),
  'текст комментария попал в уведомление');

/* ── 7. Тихие часы ───────────────────────────────────────────── */

select pg_temp.ok(public.notify_tikho(:'s1', '2026-12-01 23:00+03') = '2026-12-02 08:00+03', '23:00 → 8:00 утра');
select pg_temp.ok(public.notify_tikho(:'s1', '2026-12-02 07:59+03') = '2026-12-02 08:00+03', '7:59 → 8:00');
select pg_temp.ok(public.notify_tikho(:'s1', '2026-12-02 12:00+03') = '2026-12-02 12:00+03', 'днём не сдвигается');
select pg_temp.ok(public.notify_tikho(:'s1', '2026-12-02 22:00+03') = '2026-12-03 08:00+03', 'ровно 22:00 — тихо');
select pg_temp.ok(public.notify_tikho(:'s1', '2026-12-02 08:00+03') = '2026-12-02 08:00+03', 'ровно 8:00 — уже можно');

set role authenticated;
select pg_temp.as_user(:'s2');
select public.sohranit_nastroyki_uvedomleniy('{"tz": "Asia/Yekaterinburg"}');
reset role;
-- 23:00 по Москве — 1:00 в Екатеринбурге: тихо до 8:00 по Екатеринбургу (6:00 по Москве).
select pg_temp.ok(public.notify_tikho(:'s2', '2026-12-01 23:00+03') = '2026-12-02 06:00+03',
  'тихие часы — в поясе получателя');
set role authenticated;
select pg_temp.as_user(:'s2');
select public.sohranit_nastroyki_uvedomleniy('{"quiet_on": false}');
reset role;
select pg_temp.ok(public.notify_tikho(:'s2', '2026-12-01 23:00+03') = '2026-12-01 23:00+03', 'тихие часы выключены');
select pg_temp.ok((select tz = 'Asia/Yekaterinburg' from public.notify_prefs where user_id = :'s2'),
  'сохранение одного поля сбросило пояс');
set role authenticated;
select pg_temp.as_user(:'s2');
select public.sohranit_nastroyki_uvedomleniy('{"quiet_on": true, "quiet_from": "13:00", "quiet_to": "15:00", "tz": "Europe/Moscow"}');
reset role;
select pg_temp.ok(public.notify_tikho(:'s2', '2026-12-01 14:00+03') = '2026-12-01 15:00+03', 'дневные тихие часы');
select pg_temp.ok(public.notify_tikho(:'s2', '2026-12-01 23:00+03') = '2026-12-01 23:00+03', 'ночью при дневных — можно');

-- Напоминание, которое после тихих часов оказалось бы позже дедлайна, в очередь не идёт.
select pg_temp.ok(public.notify_sozdat(:'s1'::uuid, 'dz_napominanie', :'hw4'::uuid, '{"za": 3}', 'test:pozdno',
                                       '2026-12-01 23:30+03', '2026-12-02 01:00+03'), 'уведомление создаётся');
select pg_temp.ok((select count(*) = 0 from public.notify_outbox where dedupe_key like 'test:pozdno%'),
  'письмо-напоминание после дедлайна в очереди');
select pg_temp.ok((select count(*) = 1 from public.notifications where dedupe_key = 'test:pozdno'),
  'колокольчик пишется всегда');

/* ── 8. Настройки ─────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.ok((public.moi_nastroyki_uvedomleniy() -> 'kanaly' -> 'dz_sdano' ->> 'pochta') = 'false',
  'учителю письмо о сдаче по умолчанию');
select pg_temp.ok((public.moi_nastroyki_uvedomleniy() -> 'sobytiya') = '["dz_sdano", "dz_ne_sdali"]'::jsonb,
  'события учителя');
select pg_temp.ok((public.moi_nastroyki_uvedomleniy() ->> 'digest') = 'day', 'дайджест по умолчанию — ежедневный');
select pg_temp.as_user(:'s1');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{"kanaly": {"dz_sdano": {"pochta": true}}}')$q$,
  'bad_settings');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{"kanaly": {"dz_novoe": {"sms": true}}}')$q$,
  'bad_settings');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{"tz": "Mars/Base"}')$q$, 'bad_settings');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{"quiet_from": "25:00"}')$q$, 'bad_settings');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{"digest": "hour"}')$q$, 'bad_settings');
select public.sohranit_nastroyki_uvedomleniy('{"kanaly": {"dz_napominanie": {"pochta": false}, "dz_novoe": {"pochta": true}}}');
reset role;
select pg_temp.ok((select kanaly = '{"dz_napominanie": {"pochta": false}}'::jsonb from public.notify_prefs
                    where user_id = :'s1'), 'хранятся только отличия от значений по умолчанию');
set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.dz('После настроек', jsonb_build_object('student_id', :'s1'), interval '30 hours') as hw6 \gset
reset role;
select public.notify_tick(now() + interval '7 hours');
select pg_temp.ok(pg_temp.nu(:'s1', 'dz_napominanie', :'hw6') = 1 and pg_temp.no(:'s1', 'dz_napominanie', :'hw6') = 0,
  'напоминание есть в колокольчике, письма нет — выключено');
select pg_temp.ok(pg_temp.no(:'s1', 'dz_novoe', :'hw6') = 1, '«Новое ДЗ» письмом осталось');

/* ── 9. Права ─────────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails('select * from public.notifications', 'permission denied');
select pg_temp.fails('select * from public.notify_outbox', 'permission denied');
select pg_temp.fails('select * from public.notify_prefs', 'permission denied');
select pg_temp.fails('select public.notify_tick()', 'permission denied');
select pg_temp.fails('select public.notify_svernut()', 'permission denied');
select pg_temp.fails($q$select public.notify_sozdat(auth.uid(), 'dz_novoe', null, '{}', 'x', now())$q$,
  'permission denied');
select pg_temp.ok((select bool_and(x ->> 'event' in ('dz_novoe', 'dz_napominanie', 'dz_srok', 'dz_izmeneno'))
                     from jsonb_array_elements(public.moi_uvedomleniya(100)) x), 'ученица видит чужие события');
select pg_temp.ok(public.uvedomleniya_prochitat('{}'::bigint[]) = 0, 'прочитать пустой список');
reset role;
select array_agg(id) as chuzhie from public.notifications where user_id = :'s2' \gset
set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(public.uvedomleniya_prochitat(:'chuzhie'::bigint[]) = 0, 'прочитаны чужие уведомления');
select pg_temp.ok(public.uvedomleniya_prochitat() > 0, 'свои не прочитались');
select pg_temp.ok(public.uvedomleniya_schet() = 0, 'после «прочитать всё» остались непрочитанные');
select pg_temp.as_user(:'t2');
select pg_temp.ok(jsonb_array_length(public.moi_uvedomleniya()) = 0, 'чужой учитель видит уведомления');
reset role;
select pg_temp.ok((select count(*) from public.notifications where user_id = :'s2' and read_at is not null) = 0,
  'чужие уведомления помечены прочитанными');

set role anon;
select pg_temp.fails('select public.moi_uvedomleniya()', 'permission denied');
select pg_temp.fails('select public.uvedomleniya_schet()', 'permission denied');
select pg_temp.fails($q$select public.sohranit_nastroyki_uvedomleniy('{}')$q$, 'permission denied');
reset role;

set role service_role;
select public.notify_tick(now());
reset role;

/* ── 10. Уборка и удаление аккаунта ───────────────────────────── */

update public.notifications set visible_at = now() - interval '200 days' where user_id = :'s2' and event = 'dz_novoe';
select pg_temp.ok((public.notify_svernut() ->> 'notifications')::int >= 1, 'старые уведомления не удалены');
delete from auth.users where id = :'s1';
select pg_temp.ok((select count(*) = 0 from public.notifications where user_id = :'s1')
                  and (select count(*) = 0 from public.notify_outbox where user_id = :'s1')
                  and (select count(*) = 0 from public.notify_prefs where user_id = :'s1'),
  'после удаления аккаунта остались уведомления');

\echo 'Уведомления: все проверки прошли.'
