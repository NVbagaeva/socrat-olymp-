-- Общее начало тестов журнала (zhurnal.test.sql, dostup-uchitelya.test.sql):
-- люди, два класса у двух репетиторов и помощники. Подключается
-- запускателем перед самим тестом (app/scripts/check-soglasiya-sql.mjs).

\set ON_ERROR_STOP on
set client_min_messages = notice;

insert into public.legal_editions (version) values ('2026-11-22');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-11-22',
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

-- Действие с задачей.
create function pg_temp.ev(seq int, type text, answer text default null, ok boolean default null,
                           step int default null, active int default 0) returns jsonb language sql as $$
  select jsonb_build_object('seq', seq, 'type', type, 'answer', answer, 'ok', ok, 'step', step,
    'at', now() - interval '30 seconds', 'active_ms', active)
$$;
-- Задача №8 из тренажёра: показана минуту назад.
create function pg_temp.run(id text, extra jsonb default '{}', events jsonb default '[]') returns jsonb
language sql as $$
  select jsonb_build_object('id', id, 'source', 'trainer', 'task_no', 8, 'kind', '8.A',
    'ref', '8.A|42|1', 'gen', 'v1', 'session', 's-1', 'started_at', now() - interval '1 minute',
    'snapshot', jsonb_build_object('statement', '<p>Найдите значение выражения</p>', 'answer', '0.5'),
    'events', events) || extra
$$;
create function pg_temp.push(runs jsonb, works jsonb default '[]') returns jsonb language sql as $$
  select public.journal_push(jsonb_build_object('runs', runs, 'works', works))
$$;

\set admin 'a0000000-0000-0000-0000-000000000000'
\set t1 'b1000000-0000-0000-0000-000000000000'
\set t2 'b2000000-0000-0000-0000-000000000000'
\set s1 'c1000000-0000-0000-0000-000000000000'
\set s2 'c2000000-0000-0000-0000-000000000000'
\set s3 'c3000000-0000-0000-0000-000000000000'
\set kid 'c9000000-0000-0000-0000-000000000000'

-- Администратор, два репетитора, ученики: s1 — у первого, s2 — у
-- второго, s3 — без репетитора, школьник без согласия родителя.
insert into vault.secrets (name, secret)
values ('allowed_emails', 'admin@x.ru,t1@x.ru,t2@x.ru,s1@x.ru,s2@x.ru,s3@x.ru,kid@x.ru');
insert into auth.users (id, email, raw_user_meta_data) values
  (:'admin', 'admin@x.ru', pg_temp.meta('{"name":"Админ"}')),
  (:'t1', 't1@x.ru', pg_temp.meta('{"name":"Репетитор 1"}')),
  (:'t2', 't2@x.ru', pg_temp.meta('{"name":"Репетитор 2"}')),
  (:'s1', 's1@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 1","birth_year":2000}')),
  (:'s2', 's2@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 2","birth_year":2000}')),
  (:'s3', 's3@x.ru', pg_temp.meta('{"role":"student","name":"Ученик 3","birth_year":2000}')),
  (:'kid', 'kid@x.ru', pg_temp.meta('{"role":"student","name":"Школьник","birth_year":2012,"parent_email":"mama@x.ru"}'));
select public.grant_admin('admin@x.ru');

insert into public.tutor_students (tutor_id, user_id) values (:'t1', :'s1'), (:'t2', :'s2');
