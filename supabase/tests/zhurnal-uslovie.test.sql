-- Проверка supabase/migrations/20261128120000_zhurnal_uslovie.sql: условие
-- задачи в журнале не хранит активного содержимого, формулы KaTeX и текст
-- проходят; учитель получает условие своего ученика, чужой учитель и
-- аноним — ничего. Идёт на всех миграциях с правами по умолчанию своего
-- сервера. Запуск: node app/scripts/check-soglasiya-sql.mjs.

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
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', id, false)
$$;
create function pg_temp.z(id text, uslovie text) returns jsonb language sql as $$
  select jsonb_build_object('id', id, 'task_no', 5, 'kind', '5:P01', 'task_ref', '5:P01|1|base',
    'place', 'trenazher', 'outcome', 'right', 'answer_key', '1', 'active_ms', 1000, 'total_ms', 2000,
    'started_at', now(), 'closed_at', now(), 'uslovie_tex', uslovie)
$$;

\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'

insert into vault.secrets (name, secret) values ('allowed_emails', 't1@x.ru,t2@x.ru,s1@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Учитель 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Чужой учитель"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик","birth_year":2000}'));
insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'s1');
update public.kabinet_flags set value = 'true' where key = 'zhurnal';

-- Условия: id → что прислал браузер → что должно остаться.
create temp table sluchai (id uuid, prislano text, ostalos text);
insert into sluchai values
  ('d0000000-0000-0000-0000-000000000001',
   '<span class="katex"><span class="katex-mathml"><math><mfrac><mn>1</mn><mn>2</mn></mfrac></math></span>'
   || '<span class="katex-html" aria-hidden="true"><span class="mord" style="height:1.2em;">½</span></span></span>',
   '<span class="katex"><span class="katex-mathml"><math><mfrac><mn>1</mn><mn>2</mn></mfrac></math></span>'
   || '<span class="katex-html" aria-hidden="true"><span class="mord" style="height:1.2em;">½</span></span></span>'),
  ('d0000000-0000-0000-0000-000000000002', 'Найдите значение выражения 2 + 2, если a = 1.',
   'Найдите значение выражения 2 + 2, если a = 1.'),
  ('d0000000-0000-0000-0000-000000000003', '<b>т</b><script>1</script>', null),
  ('d0000000-0000-0000-0000-000000000004', '<img src=x onerror=1>', null),
  ('d0000000-0000-0000-0000-000000000005', '<span onclick="1">т</span>', null),
  ('d0000000-0000-0000-0000-000000000006', '<SVG OnLoad = 1></SVG>', null),
  ('d0000000-0000-0000-0000-000000000007', '<a href="javascript:1">т</a>', null),
  ('d0000000-0000-0000-0000-000000000008', '<span style="background:url(x)">т</span>', null),
  ('d0000000-0000-0000-0000-000000000009', '<iframe src=x></iframe>', null);
grant select on sluchai to authenticated;

/* ── 1. Запись ученика: опасное — null, остальное как было ─────── */

set role authenticated;
select pg_temp.as_user(:'s1');
select pg_temp.ok(
  public.zhurnal_push(jsonb_build_object('zadachi',
    (select jsonb_agg(pg_temp.z(id::text, prislano)) from sluchai))) = '{"saved": 9, "skipped": 0}',
  'запись не прошла целиком: опасное условие не должно отклонять пачку');
reset role;
select pg_temp.ok(not exists (
  select 1 from sluchai s join public.zhurnal_zadachi z on z.id = s.id and z.user_id = :'s1'
   where z.uslovie_tex is distinct from s.ostalos),
  'условие сохранилось не так: ' || coalesce((
    select string_agg(s.id::text, ', ') from sluchai s join public.zhurnal_zadachi z on z.id = s.id
     where z.uslovie_tex is distinct from s.ostalos), ''));
do $$ begin raise notice 'ok 1: формулы и текст проходят, скрипты, картинки, обработчики, javascript:, url() — нет'; end $$;

/* ── 2. Обход через update: та же чистка ───────────────────────── */

update public.zhurnal_zadachi set uslovie_tex = '<img src=x onerror=1>'
 where id = 'd0000000-0000-0000-0000-000000000002';
select pg_temp.ok((select uslovie_tex is null from public.zhurnal_zadachi
                    where id = 'd0000000-0000-0000-0000-000000000002'), 'update пропустил опасное условие');
do $$ begin raise notice 'ok 2: изменение строки чистится так же'; end $$;

/* ── 3. Кто получает условие ───────────────────────────────────── */

set role authenticated;
select pg_temp.as_user(:'t1');
select pg_temp.ok(public.uchitel_zadacha(:'s1', 'd0000000-0000-0000-0000-000000000001') ->> 'uslovie_tex'
                    like '<span class="katex">%', 'свой учитель не получил формулу');
select pg_temp.as_user(:'t2');
do $$ begin
  perform public.uchitel_zadacha('c1000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001');
  raise exception 'FAIL: чужой учитель получил задачу чужого ученика';
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
end $$;
select pg_temp.ok((select count(*) from public.zhurnal_zadachi) = 0, 'чужой учитель видит строки журнала');
reset role;
set role anon;
select pg_temp.ok(not has_function_privilege('anon', 'public.uchitel_zadacha(uuid, uuid)', 'execute')
  and not has_function_privilege('anon', 'public.zhurnal_uslovie_opasno(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.zhurnal_uslovie_chist()', 'execute'),
  'служебные функции открыты');
reset role;
do $$ begin raise notice 'ok 3: условие видит только свой учитель; функции проверки закрыты'; end $$;
