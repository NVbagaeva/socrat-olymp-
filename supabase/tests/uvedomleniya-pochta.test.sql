-- Проверка supabase/migrations/20261126120000_uvedomleniya_pochta.sql
-- (docs/kabinet-uvedomleniya.md, PR 3в): рассыльщик забирает пачку писем,
-- перепроверяет (сдано, канал выключен), отчитывается; повторы и «не
-- отправлено» после пятой попытки; зависшие возвращаются; «Отписаться»
-- по подписи без входа; сводка учителю в 19:00 без дублей; права.
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
create function pg_temp.st(u text, ev text) returns text language sql as $$
  select string_agg(status, ',' order by id) from public.notify_outbox where user_id = u::uuid and event = ev
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'

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

-- ДЗ классу с дедлайном через 30 ч.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_save(jsonb_build_object('title', 'Вероятность', 'due_at', now() + interval '30 hours',
  'targets', jsonb_build_array(jsonb_build_object('class_id', :'class_a')),
  'items', jsonb_build_array(jsonb_build_object('position', 1, 'kind', 'teoriya', 'task_no', 8, 'title', 'Глава',
                                                'spec', jsonb_build_object('glava', 'g'))))) as hw \gset
select public.dz2_publish(:'hw');
reset role;

/* ── 1. Забрать пачку ─────────────────────────────────────────── */

select public.notify_zabrat(20, now() + interval '1 day') as pachka \gset
select pg_temp.ok(jsonb_array_length(:'pachka'::jsonb) = 2, 'в пачке не два письма «Новое ДЗ»');
select pg_temp.ok((select bool_and(x ->> 'event' = 'dz_novoe' and x ->> 'title' = 'Вероятность'
                                   and x ->> 'to' in ('s1@x.ru', 's2@x.ru') and length(x -> 'otpiska' ->> 't') = 32
                                   and x ->> 'tz' = 'Europe/Moscow')
                     from jsonb_array_elements(:'pachka'::jsonb) x), 'в письме нет адреса, названия, пояса или подписи отписки');
select pg_temp.ok(pg_temp.st(:'s1', 'dz_novoe') = 'sending', 'забранное не «отправляется»');
select pg_temp.ok(jsonb_array_length(public.notify_zabrat(20, now() + interval '1 day')) = 0, 'забранное выдано дважды');

/* ── 2. Итог: отправлено, повторы, «не отправлено» ──────────────── */

select (select id from public.notify_outbox where user_id = :'s1' and event = 'dz_novoe') as o1 \gset
select (select id from public.notify_outbox where user_id = :'s2' and event = 'dz_novoe') as o2 \gset
select pg_temp.ok(public.notify_itog(:'o1', 'sent') = 'sent', 'отправлено');
select pg_temp.ok((select sent_at is not null from public.notify_outbox where id = :'o1'), 'нет времени отправки');
select pg_temp.fails(format($q$select public.notify_itog(%s, 'sent')$q$, :'o1'), 'not_sending');
select pg_temp.ok(public.notify_itog(:'o2', 'povtor', 'SMTP 451') = 'wait', 'повтор не в очереди');
select pg_temp.ok((select send_after > now() and send_after < now() + interval '2 minutes' and last_error = 'SMTP 451'
                     from public.notify_outbox where id = :'o2'), 'первый повтор — через минуту');
do $$
declare i int;
begin
  for i in 2..5 loop
    perform public.notify_zabrat(20, now() + interval '3 days');
    perform public.notify_itog((select id from public.notify_outbox where user_id = 'c2000000-0000-0000-0000-000000000000'
                                 and event = 'dz_novoe'), 'povtor', 'SMTP 451');
  end loop;
end $$;
select pg_temp.ok(pg_temp.st(:'s2', 'dz_novoe') = 'failed', 'после пятой попытки не «не отправлено»');
select pg_temp.ok((select count(*) = 5 from public.notify_log where outbox_id = :'o2'), 'в журнале не пять попыток');
select pg_temp.ok((select count(*) = 1 from public.notify_log where outbox_id = :'o1' and result = 'sent'),
  'отправка не в журнале');
select pg_temp.ok((select count(*) = 0 from public.notify_log where detail like '%@%'), 'адрес попал в журнал');

/* ── 3. Перепроверка перед письмом ────────────────────────────── */

-- Напоминания за 24 ч обоим; Борис сдал, Аня выключила напоминания письмом.
select public.notify_tick_pochta(now() + interval '7 hours');
set role authenticated;
select pg_temp.as_user(:'s2');
select public.dz2_submit(:'hw');
reset role;
select pg_temp.ok(jsonb_array_length(public.notify_zabrat(20, now() + interval '1 day')) = 1, 'должно уйти одно письмо');
select pg_temp.ok(pg_temp.st(:'s2', 'dz_napominanie') = 'cancelled', 'напоминание сдавшему не отменено');
select pg_temp.ok((select last_error = 'ДЗ сдано или закрыто' from public.notify_outbox
                    where user_id = :'s2' and event = 'dz_napominanie'), 'причина отмены');
select pg_temp.ok(pg_temp.st(:'s1', 'dz_napominanie') = 'sending', 'напоминание Ане не ушло');
select public.notify_itog((select id from public.notify_outbox where user_id = :'s1' and event = 'dz_napominanie'), 'sent');

-- Канал выключили после постановки в очередь — письмо отменяется.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_comment(:'hw', :'s1', 'Хорошо');
select pg_temp.as_user(:'s1');
select public.sohranit_nastroyki_uvedomleniy('{"kanaly": {"dz_kommentariy": {"pochta": false}}}');
reset role;
-- (комментарий ушёл в очередь до выключения — тихие часы могли сдвинуть, поэтому «через день»)
select public.notify_zabrat(20, now() + interval '1 day');
select pg_temp.ok(coalesce(pg_temp.st(:'s1', 'dz_kommentariy'), 'нет') in ('cancelled', 'нет'),
  'письмо по выключенному каналу не отменено');

/* ── 4. Зависшее «отправляется» возвращается ──────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_vernut(:'hw', :'s2', 'Перерешай');
reset role;
select public.notify_zabrat(20, now() + interval '1 day');
update public.notify_outbox set taken_at = now() - interval '20 minutes' where user_id = :'s2' and event = 'dz_vozvrat';
select pg_temp.ok(jsonb_array_length(public.notify_zabrat(20, now() + interval '1 day')) = 1, 'зависшее письмо не вернулось');
select pg_temp.ok((select tries = 2 from public.notify_outbox where user_id = :'s2' and event = 'dz_vozvrat'),
  'вторая попытка не посчитана');

/* ── 5. Отписаться ────────────────────────────────────────────── */

set role anon;
select pg_temp.fails(format($q$select public.notify_otpiska(%L, 'x')$q$, :'s2'), 'permission denied');
set role service_role;
select pg_temp.fails(format($q$select public.notify_otpiska(%L, 'neverno')$q$, :'s2'), 'bad_link');
select pg_temp.fails(format($q$select public.notify_otpiska(%L, %L)$q$, :'s2', repeat('a', 32)), 'bad_link');
reset role;
select public.notify_podpis(:'s2') as podpis \gset
select pg_temp.ok(public.notify_podpis(:'s1') <> :'podpis', 'подпись одинаковая у разных людей');
-- Письмо Борису в очереди — после отписки отменяется.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.dz2_comment(:'hw', :'s2', 'Смотри разбор');
set role service_role;
select pg_temp.ok(public.notify_otpiska(:'s2', :'podpis'), 'отписка по ссылке');
reset role;
select pg_temp.ok((select bool_and((kanaly -> e ->> 'pochta')::boolean is false and digest = 'off')
                     from public.notify_prefs, unnest(public.notify_sobytiya('student')) e where user_id = :'s2'),
  'после отписки письма не выключены');
select pg_temp.ok(coalesce(pg_temp.st(:'s2', 'dz_kommentariy'), 'cancelled') = 'cancelled', 'письмо в очереди после отписки');
select pg_temp.ok((select tz = 'Europe/Moscow' from public.notify_prefs where user_id = :'s2'), 'отписка сбросила пояс');

/* ── 6. Сводка учителю ────────────────────────────────────────── */

-- Борису ДЗ вернули — сдача снята; сдаёт Аня.
set role authenticated;
select pg_temp.as_user(:'s1');
select public.dz2_submit(:'hw');
reset role;
-- 19:30 сегодня по Москве: за сутки Аня сдала — сводка будет; в 18:30 — нет.
select ((now() at time zone 'Europe/Moscow')::date + time '19:30') at time zone 'Europe/Moscow' as v19 \gset
select ((now() at time zone 'Europe/Moscow')::date + time '18:30') at time zone 'Europe/Moscow' as v18 \gset
select pg_temp.ok((public.notify_tick_pochta(:'v18') ->> 'svodki')::int = 0, 'сводка не в 19 часов');
select pg_temp.ok((public.notify_tick_pochta(:'v19') ->> 'svodki')::int = 1, 'нет сводки в 19:30');
select pg_temp.ok((public.notify_tick_pochta(:'v19') ->> 'svodki')::int = 0, 'сводка дважды за день');
select public.notify_zabrat(20, :'v19'::timestamptz + interval '1 minute') as svodka \gset
select pg_temp.ok((select x -> 'svodka' -> 0 ->> 'title' = 'Вероятность' and (x -> 'svodka' -> 0 ->> 'vsego')::int = 2
                     from jsonb_array_elements(:'svodka'::jsonb) x where x ->> 'event' = 'digest'),
  'в сводке нет ДЗ и числа учеников');
-- Раз в неделю: не воскресенье — нет; выключена — нет.
set role authenticated;
select pg_temp.as_user(:'t1');
select public.sohranit_nastroyki_uvedomleniy('{"digest": "off"}');
reset role;
select pg_temp.ok((public.notify_tick_pochta(:'v19'::timestamptz + interval '1 day') ->> 'svodki')::int = 0,
  'сводка при выключенной');

/* ── 7. Права ─────────────────────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.fails('select public.notify_zabrat()', 'permission denied');
select pg_temp.fails($q$select public.notify_itog(1, 'sent')$q$, 'permission denied');
select pg_temp.fails('select public.notify_tick_pochta()', 'permission denied');
select pg_temp.fails(format('select public.notify_podpis(%L)', :'s1'), 'permission denied');
select pg_temp.fails('select * from public.notify_log', 'permission denied');
set role anon;
select pg_temp.fails('select public.notify_zabrat()', 'permission denied');
reset role;
set role service_role;
select public.notify_zabrat(1);
reset role;

/* ── 8. Уборка ────────────────────────────────────────────────── */

update public.notify_log set created_at = now() - interval '100 days' where outbox_id = :'o2';
select pg_temp.ok((public.notify_svernut() ->> 'log')::int = 5, 'старый журнал отправок не удалён');

\echo 'Уведомления, почта: все проверки прошли.'
