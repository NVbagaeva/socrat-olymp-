-- Проверка supabase/migrations/20261011120000_soglasiya.sql.
-- Запуск: node app/scripts/check-soglasiya-sql.mjs (поднимает временный PostgreSQL).
-- Каждая проверка — блок DO; первая же ошибка останавливает файл (ON_ERROR_STOP).

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Пример «прочих данных пользователя»: так будут устроены таблицы кабинета.
create table public.progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  task text not null
);
alter table public.progress enable row level security;
create policy progress_own on public.progress for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_save_progress(user_id));
grant insert, select on public.progress to authenticated;

insert into public.legal_editions (version) values ('2026-10-15');

create function pg_temp.meta(extra jsonb) returns jsonb language sql as $$
  select jsonb_build_object('role', 'tutor', 'name', 'Тест', 'documents_version', '2026-10-15',
    'accept_soglashenie', true, 'accept_soglasie', true, 'signup_ip', '203.0.113.7') || extra
$$;

-- 1. Без галочек регистрация невозможна — даже в обход формы.
do $$ begin
  begin
    insert into auth.users (email, raw_user_meta_data) values ('a@x.ru', pg_temp.meta('{"accept_soglasie": false}'));
    raise exception 'FAIL: регистрация без согласия на ПДн прошла';
  exception when check_violation then null; end;
  begin
    insert into auth.users (email, raw_user_meta_data) values ('a@x.ru', pg_temp.meta('{"accept_soglashenie": false}'));
    raise exception 'FAIL: регистрация без соглашения прошла';
  exception when check_violation then null; end;
  begin
    insert into auth.users (email, raw_user_meta_data) values ('a@x.ru', '{"role":"tutor"}');
    raise exception 'FAIL: регистрация без отметок прошла';
  exception when check_violation then null; end;
  begin
    insert into auth.users (email, raw_user_meta_data) values ('a@x.ru', pg_temp.meta('{"documents_version": "2026-01-01"}'));
    raise exception 'FAIL: регистрация со старой редакцией прошла';
  exception when check_violation then null; end;
  if exists (select 1 from auth.users) or exists (select 1 from public.consents) then
    raise exception 'FAIL: после отказов в базе остались строки';
  end if;
  raise notice 'ok 1: без галочек регистрации нет';
end $$;

-- 2. Регистрация репетитора — две записи согласия с версией, временем и IP.
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'tutor@x.ru', pg_temp.meta('{}'));
do $$ declare n int; begin
  select count(*) into n from public.consents
   where user_id = '11111111-1111-1111-1111-111111111111' and version = '2026-10-15'
     and ip = '203.0.113.7' and accepted_at is not null and kind in ('soglashenie', 'soglasie');
  if n <> 2 then raise exception 'FAIL: ожидалось 2 записи согласия, есть %', n; end if;
  raise notice 'ok 2: записи согласия в базе (тип, версия, время, IP)';
end $$;

-- 3. Ученик младше 18: без почты родителя нельзя; с почтой — ждёт подтверждения.
do $$ begin
  begin
    insert into auth.users (email, raw_user_meta_data) values ('kid@x.ru', pg_temp.meta('{"role":"student","birth_year":2011}'));
    raise exception 'FAIL: ученик младше 18 без почты родителя прошёл';
  exception when check_violation then null; end;
  begin
    insert into auth.users (email, raw_user_meta_data) values ('kid@x.ru', pg_temp.meta('{"role":"student"}'));
    raise exception 'FAIL: ученик без года рождения прошёл';
  exception when check_violation then null; end;
  raise notice 'ok 3: ученику нужны год рождения и почта родителя';
end $$;

insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'kid@x.ru',
        pg_temp.meta('{"role":"student","birth_year":2011,"parent_email":"Mama@X.ru"}'));
insert into auth.users (id, email, raw_user_meta_data)
values ('33333333-3333-3333-3333-333333333333', 'adult@x.ru',
        pg_temp.meta('{"role":"student","birth_year":2000}'));

do $$ begin
  if not exists (select 1 from public.parent_consents where user_id = '22222222-2222-2222-2222-222222222222'
                 and parent_email = 'mama@x.ru' and confirmed_at is null) then
    raise exception 'FAIL: нет ожидающего согласия родителя';
  end if;
  if exists (select 1 from public.parent_consents where user_id = '33333333-3333-3333-3333-333333333333') then
    raise exception 'FAIL: взрослому ученику завели согласие родителя';
  end if;
  if public.can_save_progress('22222222-2222-2222-2222-222222222222') then
    raise exception 'FAIL: прогресс сохраняется до подтверждения родителя';
  end if;
  if not public.can_save_progress('33333333-3333-3333-3333-333333333333') then
    raise exception 'FAIL: взрослому ученику прогресс не сохраняется';
  end if;
  if public.parent_consent_needed(2008, '2026-10-11') is not true or public.parent_consent_needed(2007, '2026-10-11') then
    raise exception 'FAIL: граница 18 лет';
  end if;
  raise notice 'ok 4: до подтверждения прогресс не сохраняется';
end $$;

-- 5. RLS: до подтверждения строка прогресса не вставляется.
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ begin
  begin
    insert into public.progress (user_id, task) values ('22222222-2222-2222-2222-222222222222', '12.A');
    raise exception 'FAIL: RLS пропустил прогресс до подтверждения';
  exception when insufficient_privilege then null; end;
  raise notice 'ok 5: RLS не пускает прогресс до подтверждения';
end $$;
reset role;

-- 6. Письмо родителю: токен, не чаще раза в минуту, подтверждение по ссылке.
create table pg_temp.tok (t text);
insert into pg_temp.tok select public.issue_parent_token('22222222-2222-2222-2222-222222222222');
do $$ begin
  begin
    perform public.issue_parent_token('22222222-2222-2222-2222-222222222222');
    raise exception 'FAIL: второе письмо через секунду ушло';
  exception when raise_exception then
    if sqlerrm not like 'too_soon%' then raise; end if;
  end;
  -- минута прошла
  update public.parent_consents set letter_sent_at = now() - interval '61 seconds'
   where user_id = '22222222-2222-2222-2222-222222222222';
  raise notice 'ok 6: повтор письма не чаще раза в минуту';
end $$;
-- Повтор через минуту: старая ссылка перестаёт работать, работает новая.
create table pg_temp.tok2 (t text);
insert into pg_temp.tok2 select public.issue_parent_token('22222222-2222-2222-2222-222222222222');
do $$ begin
  if exists (select 1 from public.parent_consents where token_hash = encode(sha256(convert_to((select t from pg_temp.tok), 'UTF8')), 'hex')) then
    raise exception 'FAIL: старая ссылка всё ещё действует';
  end if;
  begin
    perform public.confirm_parent_consent('neverno', '198.51.100.1');
    raise exception 'FAIL: подтверждение с неверным токеном прошло';
  exception when raise_exception then
    if sqlerrm not like 'bad_token%' then raise; end if;
  end;
  perform public.confirm_parent_consent((select t from pg_temp.tok2), '198.51.100.1');
  if not public.can_save_progress('22222222-2222-2222-2222-222222222222') then
    raise exception 'FAIL: после подтверждения прогресс всё ещё не сохраняется';
  end if;
  if not exists (select 1 from public.consents where user_id = '22222222-2222-2222-2222-222222222222'
                 and kind = 'soglasie_roditelya' and parent_email = 'mama@x.ru' and ip = '198.51.100.1') then
    raise exception 'FAIL: нет записи согласия родителя';
  end if;
  begin
    perform public.confirm_parent_consent((select t from pg_temp.tok2), '198.51.100.1');
    raise exception 'FAIL: ссылка сработала второй раз';
  exception when raise_exception then
    if sqlerrm not like 'bad_token%' then raise; end if;
  end;
  raise notice 'ok 7: ссылка из письма подтверждает согласие, одноразовая';
end $$;

-- 8. Ученик не может сам выдать себе токен или подтвердить согласие.
set role authenticated;
do $$ begin
  begin
    perform public.issue_parent_token('22222222-2222-2222-2222-222222222222');
    raise exception 'FAIL: ученик сам получил токен';
  exception when insufficient_privilege then null; end;
  begin
    perform public.confirm_parent_consent('x', null);
    raise exception 'FAIL: ученик вызвал подтверждение';
  exception when insufficient_privilege then null; end;
  begin
    perform token_hash from public.parent_consents;
    raise exception 'FAIL: ученику виден хеш токена';
  exception when insufficient_privilege then null; end;
  raise notice 'ok 8: токен и подтверждение — только сервер';
end $$;
-- RLS: чужие согласия не видны.
do $$ declare n int; begin
  select count(*) into n from public.consents where user_id <> auth.uid();
  if n <> 0 then raise exception 'FAIL: видно чужих согласий: %', n; end if;
  raise notice 'ok 9: видны только свои согласия';
end $$;
reset role;

-- 10. Новая редакция — снова две галочки.
insert into public.legal_editions (version) values ('2027-02-01');
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$ begin
  if public.documents_to_accept() <> array['soglashenie', 'soglasie']::public.consent_kind[] then
    raise exception 'FAIL: после новой редакции documents_to_accept = %', public.documents_to_accept();
  end if;
end $$;
reset role;
select public.accept_documents('11111111-1111-1111-1111-111111111111', '2027-02-01', '203.0.113.8');
do $$ begin
  begin
    perform public.accept_documents('11111111-1111-1111-1111-111111111111', '2026-10-15', null);
    raise exception 'FAIL: приняли старую редакцию';
  exception when check_violation then null; end;
end $$;
set role authenticated;
do $$ begin
  if cardinality(public.documents_to_accept()) <> 0 then
    raise exception 'FAIL: после принятия всё ещё есть что принять';
  end if;
  raise notice 'ok 10: новая редакция — повторное согласие';
end $$;
reset role;

-- 11. Выгрузка: аккаунт, согласия и прочие таблицы, без хеша токена.
insert into public.progress (user_id, task) values ('22222222-2222-2222-2222-222222222222', '12.A');
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ declare j jsonb := public.export_my_data(); begin
  if j #>> '{account,email}' <> 'kid@x.ru' then raise exception 'FAIL: в выгрузке нет почты'; end if;
  if jsonb_array_length(j -> 'consents') <> 3 then raise exception 'FAIL: в выгрузке % согласий', jsonb_array_length(j -> 'consents'); end if;
  if jsonb_array_length(j -> 'progress') <> 1 then raise exception 'FAIL: в выгрузке нет прогресса'; end if;
  if jsonb_array_length(j -> 'parent_consents') <> 1 then raise exception 'FAIL: в выгрузке нет данных о родителе'; end if;
  if j::text like '%token_hash%' then raise exception 'FAIL: в выгрузке хеш токена'; end if;
  raise notice 'ok 11: выгрузка JSON';
end $$;

-- 12. Удаление: всё, кроме журнала согласий.
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '22222222-2222-2222-2222-222222222222')
     or exists (select 1 from public.progress where user_id = '22222222-2222-2222-2222-222222222222')
     or exists (select 1 from public.parent_consents where user_id = '22222222-2222-2222-2222-222222222222') then
    raise exception 'FAIL: после удаления остались данные аккаунта';
  end if;
  if (select count(*) from public.consents where user_id = '22222222-2222-2222-2222-222222222222'
        and account_deleted_at is not null) <> 3 then
    raise exception 'FAIL: записи о согласии не сохранились';
  end if;
  if (select count(*) from public.consents where account_deleted_at is not null) <> 3 then
    raise exception 'FAIL: пометка удаления задела чужие согласия';
  end if;
  raise notice 'ok 12: удаление сносит всё, кроме записей о согласии';
end $$;

-- 13. Через три года журнал удалённого аккаунта чистится, живые не трогаются.
update public.consents set account_deleted_at = now() - interval '3 years 1 day'
 where user_id = '22222222-2222-2222-2222-222222222222';
do $$ declare n int := public.purge_old_consents(); begin
  if n <> 3 then raise exception 'FAIL: purge удалил %', n; end if;
  if not exists (select 1 from public.consents where user_id = '11111111-1111-1111-1111-111111111111') then
    raise exception 'FAIL: purge задел живой аккаунт';
  end if;
  raise notice 'ok 13: через 3 года записи удалённого аккаунта чистятся';
end $$;

-- 14. Каждая таблица public со ссылкой на auth.users удаляется каскадом:
-- иначе «удалить аккаунт» либо упадёт, либо оставит данные.
do $$ declare bad text; begin
  select string_agg(conrelid::regclass::text, ', ') into bad
  from pg_constraint
  where contype = 'f' and confrelid = 'auth.users'::regclass and confdeltype <> 'c'
    and connamespace = 'public'::regnamespace;
  if bad is not null then raise exception 'FAIL: без ON DELETE CASCADE: %', bad; end if;
  raise notice 'ok 14: все ссылки на auth.users — с каскадом';
end $$;
