-- Уведомления, этап 3а (docs/kabinet-uvedomleniya.md): события ДЗ →
-- колокольчик и очередь отправки; напоминания за 24 и 3 ч, «срок прошёл»
-- и «не сдали»; тихие часы в поясе получателя; настройки каналов. Дублей
-- нет: dedupe_key уникален и у уведомления, и у строки очереди.
--
-- Колокольчик пишется всегда и сразу. Почту и push отправляет рассыльщик
-- (PR 3в и 3г) по строкам notify_outbox; пока флаг каналов пуст, очередь
-- не пишется. Ученик и учитель читают только своё и только функциями.

insert into public.kabinet_flags (key, value) values
  ('uvedomleniya', 'false'::jsonb), ('uvedomleniya_kanaly', '[]'::jsonb)
on conflict (key) do nothing;

/* ── Таблицы ───────────────────────────────────────────────────── */

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null check (event in ('dz_novoe', 'dz_izmeneno', 'dz_vozvrat', 'dz_kommentariy', 'dz_sdano',
                                       'dz_napominanie', 'dz_srok', 'dz_ne_sdali')),
  homework_id uuid references public.homework2 (id) on delete cascade,
  -- Числа и признаки, без текста ДЗ и комментариев: {za: 24}, {pozdno: true}, {skolko: 3, vsego: 12}.
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 1000),
  dedupe_key text not null unique check (length(dedupe_key) <= 200),
  -- С какого момента видно (отложенная публикация ДЗ — с publish_at).
  visible_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, visible_at desc, id desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.notify_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Только отличия от значений по умолчанию: {"dz_sdano": {"pochta": true}}.
  kanaly jsonb not null default '{}'::jsonb check (jsonb_typeof(kanaly) = 'object' and pg_column_size(kanaly) < 2000),
  quiet_on boolean not null default true,
  quiet_from time not null default '22:00',
  quiet_to time not null default '08:00',
  tz text not null default 'Europe/Moscow' check (length(tz) <= 64),
  digest text not null default 'day' check (digest in ('day', 'week', 'off')),
  updated_at timestamptz not null default now()
);

create table public.notify_outbox (
  id bigint generated always as identity primary key,
  notification_id bigint references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('pochta', 'push')),
  event text not null,
  homework_id uuid references public.homework2 (id) on delete cascade,
  dedupe_key text not null unique check (length(dedupe_key) <= 220),
  -- Уже сдвинуто тихими часами получателя.
  send_after timestamptz not null,
  status text not null default 'wait' check (status in ('wait', 'sending', 'sent', 'failed', 'cancelled')),
  tries int not null default 0 check (tries between 0 and 20),
  last_error text check (length(last_error) <= 500),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notify_outbox_wait_idx on public.notify_outbox (send_after) where status = 'wait';

alter table public.notifications enable row level security;
alter table public.notify_prefs enable row level security;
alter table public.notify_outbox enable row level security;
revoke all on public.notifications, public.notify_prefs, public.notify_outbox from anon, authenticated;

/* ── Общие части ───────────────────────────────────────────────── */

create or replace function public.notify_vkl()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select value = 'true'::jsonb from public.kabinet_flags where key = 'uvedomleniya'), false) $$;

-- События, которые видит роль (для настроек).
create or replace function public.notify_sobytiya(p_role text)
returns text[]
language sql immutable set search_path = ''
as $$
  select case p_role
    when 'tutor' then array['dz_sdano', 'dz_ne_sdali']
    when 'student' then array['dz_novoe', 'dz_izmeneno', 'dz_vozvrat', 'dz_kommentariy', 'dz_napominanie', 'dz_srok']
    else array[]::text[] end
$$;

-- Канал по умолчанию: всё включено, кроме письма учителю о каждой сдаче.
create or replace function public.notify_po_umolchaniyu(p_event text, p_channel text)
returns boolean
language sql immutable set search_path = ''
as $$ select not (p_event = 'dz_sdano') $$;

create or replace function public.notify_kanal_mozhno(p_user uuid, p_event text, p_channel text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select (p.kanaly -> p_event ->> p_channel)::boolean from public.notify_prefs p where p.user_id = p_user),
                  public.notify_po_umolchaniyu(p_event, p_channel))
$$;

-- Тихие часы: момент p_t, попавший в тихие часы получателя, переносится
-- на их конец в его поясе. Интервал может переходить через полночь.
create or replace function public.notify_tikho(p_user uuid, p_t timestamptz)
returns timestamptz
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_on boolean := true;
  v_from time := '22:00';
  v_to time := '08:00';
  v_tz text := 'Europe/Moscow';
  v_local timestamp;
  v_time time;
begin
  select quiet_on, quiet_from, quiet_to, tz into v_on, v_from, v_to, v_tz
    from public.notify_prefs where user_id = p_user;
  if not found then
    v_on := true; v_from := '22:00'; v_to := '08:00'; v_tz := 'Europe/Moscow';
  end if;
  if not v_on or v_from = v_to then
    return p_t;
  end if;
  v_local := p_t at time zone v_tz;
  v_time := v_local::time;
  if v_from > v_to then
    -- Через полночь: 22:00–8:00.
    if v_time >= v_from then
      return ((v_local::date + 1) + v_to) at time zone v_tz;
    elsif v_time < v_to then
      return (v_local::date + v_to) at time zone v_tz;
    end if;
  elsif v_time >= v_from and v_time < v_to then
    return (v_local::date + v_to) at time zone v_tz;
  end if;
  return p_t;
end $$;

-- Создать уведомление и строки очереди по включённым каналам. true — новое.
-- p_srok: дедлайн для напоминания — после сдвига тихими часами позже него
-- письмо не ставится (утром придёт «срок прошёл»).
create or replace function public.notify_sozdat(p_user uuid, p_event text, p_hw uuid, p_payload jsonb,
                                                p_dedupe text, p_visible timestamptz, p_srok timestamptz default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_id bigint;
  v_channel text;
  v_after timestamptz;
begin
  insert into public.notifications (user_id, event, homework_id, payload, dedupe_key, visible_at)
  values (p_user, p_event, p_hw, coalesce(p_payload, '{}'::jsonb), p_dedupe, p_visible)
  on conflict (dedupe_key) do nothing
  returning id into v_id;
  if v_id is null then
    return false;
  end if;
  for v_channel in
    select jsonb_array_elements_text(coalesce((select value from public.kabinet_flags where key = 'uvedomleniya_kanaly'),
                                              '[]'::jsonb))
  loop
    continue when v_channel not in ('pochta', 'push');
    continue when not public.notify_kanal_mozhno(p_user, p_event, v_channel);
    v_after := public.notify_tikho(p_user, p_visible);
    continue when p_srok is not null and v_after >= p_srok;
    insert into public.notify_outbox (notification_id, user_id, channel, event, homework_id, dedupe_key, send_after)
    values (v_id, p_user, v_channel, p_event, p_hw, p_dedupe || ':' || v_channel, v_after)
    on conflict (dedupe_key) do nothing;
  end loop;
  return true;
end $$;

/* ── События ДЗ (этап 2) → уведомления ────────────────────────── */

create or replace function public.notify_iz_dz2()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  h public.homework2;
  v_visible timestamptz;
  v_student uuid;
  v_late boolean;
begin
  if not public.notify_vkl() then
    return null;
  end if;
  select * into h from public.homework2 where id = new.homework_id;
  -- Ученику — не раньше, чем ДЗ откроется (отложенная публикация).
  v_visible := greatest(coalesce(h.publish_at, new.created_at), new.created_at);
  if new.event = 'published' then
    perform public.notify_sozdat(new.user_id, 'dz_novoe', h.id, '{}'::jsonb,
                                 'hw:' || h.id || ':novoe:' || new.user_id, v_visible);
  elsif new.event = 'edited' then
    perform public.notify_sozdat(new.user_id, 'dz_izmeneno', h.id, '{}'::jsonb, 'ev:' || new.id, v_visible);
  elsif new.event = 'returned' then
    perform public.notify_sozdat(new.user_id, 'dz_vozvrat', h.id, '{}'::jsonb, 'ev:' || new.id, new.created_at);
  elsif new.event = 'commented' then
    perform public.notify_sozdat(new.user_id, 'dz_kommentariy', h.id, '{}'::jsonb, 'ev:' || new.id, new.created_at);
  elsif new.event = 'submitted' then
    -- Событие адресовано учителю; кто сдал — тот, чья сдача в этой же транзакции (dz2_submit).
    select r.user_id, r.late into v_student, v_late from public.homework2_recipients r
     where r.homework_id = h.id and r.submitted_at = now()
     order by r.user_id limit 1;
    perform public.notify_sozdat(new.user_id, 'dz_sdano', h.id,
                                 jsonb_strip_nulls(jsonb_build_object('uchenik', v_student, 'pozdno', v_late)),
                                 'ev:' || new.id, new.created_at);
  end if;
  return null;
end $$;

create trigger homework2_events_notify after insert on public.homework2_events
  for each row execute function public.notify_iz_dz2();

/* ── Раз в минуту: напоминания, «срок прошёл», «не сдали» ──────── */

create or replace function public.notify_tick(p_now timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  v_r24 int := 0;
  v_r3 int := 0;
  v_srok int := 0;
  v_nesdali int := 0;
  v_due text;
begin
  if not public.notify_vkl() then
    return jsonb_build_object('off', true);
  end if;
  -- Ученики, которые не сдали видимое, не закрытое ДЗ с дедлайном в ближайшие сутки или в прошлые сутки.
  for r in
    select h.id, h.tutor_id, h.due_at, h.after_due, coalesce(h.publish_at, h.published_at) as otkryto, rr.user_id
      from public.homework2 h
      join public.homework2_recipients rr on rr.homework_id = h.id
     where h.status = 'published' and h.due_at is not null
       and coalesce(h.publish_at, h.published_at) <= p_now
       and h.due_at between p_now - interval '1 day' and p_now + interval '24 hours'
       and rr.submitted_at is null
  loop
    v_due := extract(epoch from r.due_at)::bigint::text;
    if p_now >= r.due_at then
      if public.notify_sozdat(r.user_id, 'dz_srok', r.id, jsonb_build_object('pozdno', r.after_due = 'late_ok'),
                              'hw:' || r.id || ':srok:' || v_due || ':' || r.user_id, p_now) then
        v_srok := v_srok + 1;
      end if;
    elsif p_now >= r.due_at - interval '3 hours' then
      -- ДЗ открылось позже, чем за 3 ч, — хватает «Новое ДЗ».
      if r.otkryto <= r.due_at - interval '3 hours' then
        if public.notify_sozdat(r.user_id, 'dz_napominanie', r.id, jsonb_build_object('za', 3),
                                'hw:' || r.id || ':r3:' || v_due || ':' || r.user_id, p_now, r.due_at) then
          v_r3 := v_r3 + 1;
        end if;
      end if;
    elsif r.otkryto <= r.due_at - interval '24 hours' then
      if public.notify_sozdat(r.user_id, 'dz_napominanie', r.id, jsonb_build_object('za', 24),
                              'hw:' || r.id || ':r24:' || v_due || ':' || r.user_id, p_now, r.due_at) then
        v_r24 := v_r24 + 1;
      end if;
    end if;
  end loop;

  -- Учителю: дедлайн прошёл, сколько не сдали.
  for r in
    select h.id, h.tutor_id, h.due_at,
           count(*) filter (where rr.submitted_at is null) as ne_sdali, count(*) as vsego
      from public.homework2 h
      join public.homework2_recipients rr on rr.homework_id = h.id
     where h.status = 'published' and h.due_at is not null
       and h.due_at between p_now - interval '1 day' and p_now
     group by h.id
    having count(*) filter (where rr.submitted_at is null) > 0
  loop
    if public.notify_sozdat(r.tutor_id, 'dz_ne_sdali', r.id,
                            jsonb_build_object('skolko', r.ne_sdali, 'vsego', r.vsego),
                            'hw:' || r.id || ':nesdali:' || extract(epoch from r.due_at)::bigint, p_now) then
      v_nesdali := v_nesdali + 1;
    end if;
  end loop;

  return jsonb_build_object('r24', v_r24, 'r3', v_r3, 'srok', v_srok, 'ne_sdali', v_nesdali);
end $$;

-- Ночная уборка: уведомления старше 180 дней, отправленное старше 90.
create or replace function public.notify_svernut()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_n int;
  v_o int;
begin
  delete from public.notify_outbox
   where status in ('sent', 'failed', 'cancelled') and created_at < now() - interval '90 days';
  get diagnostics v_o = row_count;
  delete from public.notifications where visible_at < now() - interval '180 days';
  get diagnostics v_n = row_count;
  return jsonb_build_object('notifications', v_n, 'outbox', v_o);
end $$;

/* ── Пользователь: колокольчик и настройки ─────────────────────── */

create or replace function public.moi_uvedomleniya(p_limit int default 30, p_before bigint default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(x order by (x ->> 'id')::bigint desc)
      from (
        select jsonb_strip_nulls(jsonb_build_object(
                 'id', n.id, 'event', n.event, 'homework_id', n.homework_id, 'payload', n.payload,
                 'visible_at', n.visible_at, 'read', n.read_at is not null,
                 'title', (select h.title from public.homework2 h where h.id = n.homework_id),
                 -- Учителю — имя сдавшего так, как он записан у учителя.
                 'uchenik_name', case when n.event = 'dz_sdano' and n.payload ? 'uchenik' then
                   (select coalesce(ts.alias, p.display_name) from public.profiles p
                      left join public.tutor_students ts on ts.tutor_id = n.user_id and ts.user_id = p.user_id
                     where p.user_id = (n.payload ->> 'uchenik')::uuid) end)) as x
          from public.notifications n
         where n.user_id = auth.uid() and n.visible_at <= now()
           and (p_before is null or n.id < p_before)
         order by n.id desc
         limit least(greatest(coalesce(p_limit, 30), 1), 100)) q), '[]'::jsonb);
end $$;

create or replace function public.uvedomleniya_schet()
returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int from public.notifications
   where user_id = auth.uid() and read_at is null and visible_at <= now()
$$;

-- Прочитать свои: список id или все (null).
create or replace function public.uvedomleniya_prochitat(p_ids bigint[] default null)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v int;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  update public.notifications set read_at = now()
   where user_id = auth.uid() and read_at is null and visible_at <= now()
     and (p_ids is null or id = any (p_ids));
  get diagnostics v = row_count;
  return v;
end $$;

create or replace function public.moi_nastroyki_uvedomleniy()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.notify_prefs;
  v_sob text[] := public.notify_sobytiya(public.my_role()::text);
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  select * into p from public.notify_prefs where user_id = auth.uid();
  return jsonb_build_object(
    'sobytiya', to_jsonb(v_sob),
    'kanaly', coalesce((select jsonb_object_agg(e, jsonb_build_object(
                          'pochta', public.notify_kanal_mozhno(auth.uid(), e, 'pochta'),
                          'push', public.notify_kanal_mozhno(auth.uid(), e, 'push')))
                          from unnest(v_sob) e), '{}'::jsonb),
    'quiet_on', coalesce(p.quiet_on, true),
    'quiet_from', to_char(coalesce(p.quiet_from, '22:00'::time), 'HH24:MI'),
    'quiet_to', to_char(coalesce(p.quiet_to, '08:00'::time), 'HH24:MI'),
    'tz', coalesce(p.tz, 'Europe/Moscow'),
    'digest', coalesce(p.digest, 'day'),
    'dostupno', coalesce((select value from public.kabinet_flags where key = 'uvedomleniya_kanaly'), '[]'::jsonb));
end $$;

-- Сохранить: только события своей роли, каналы pochta/push, пояс из списка
-- Postgres, время ЧЧ:ММ, дайджест day/week/off. Хранятся только отличия.
create or replace function public.sohranit_nastroyki_uvedomleniy(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_sob text[] := public.notify_sobytiya(public.my_role()::text);
  v_kanaly jsonb := '{}'::jsonb;
  e text;
  c text;
  v_val jsonb;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'bad_settings' using errcode = 'check_violation';
  end if;
  if p ? 'kanaly' then
    if jsonb_typeof(p -> 'kanaly') <> 'object' then
      raise exception 'bad_settings' using errcode = 'check_violation';
    end if;
    for e in select jsonb_object_keys(p -> 'kanaly') loop
      if not (e = any (v_sob)) or jsonb_typeof(p -> 'kanaly' -> e) <> 'object' then
        raise exception 'bad_settings: событие %', e using errcode = 'check_violation';
      end if;
      for c, v_val in select key, value from jsonb_each(p -> 'kanaly' -> e) loop
        if c not in ('pochta', 'push') or jsonb_typeof(v_val) <> 'boolean' then
          raise exception 'bad_settings: канал %', c using errcode = 'check_violation';
        end if;
        if (v_val = 'true'::jsonb) <> public.notify_po_umolchaniyu(e, c) then
          v_kanaly := jsonb_set(v_kanaly, array[e], coalesce(v_kanaly -> e, '{}'::jsonb) || jsonb_build_object(c, v_val));
        end if;
      end loop;
    end loop;
  else
    v_kanaly := coalesce((select kanaly from public.notify_prefs where user_id = auth.uid()), '{}'::jsonb);
  end if;
  if (p ? 'quiet_from' and coalesce(p ->> 'quiet_from', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
     or (p ? 'quiet_to' and coalesce(p ->> 'quiet_to', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
     or (p ? 'quiet_on' and jsonb_typeof(p -> 'quiet_on') <> 'boolean')
     or (p ? 'digest' and coalesce(p ->> 'digest', '') not in ('day', 'week', 'off'))
     or (p ? 'tz' and not exists (select 1 from pg_catalog.pg_timezone_names where name = p ->> 'tz')) then
    raise exception 'bad_settings' using errcode = 'check_violation';
  end if;
  insert into public.notify_prefs as np (user_id, kanaly, quiet_on, quiet_from, quiet_to, tz, digest)
  values (auth.uid(), v_kanaly, coalesce((p ->> 'quiet_on')::boolean, true),
          coalesce((p ->> 'quiet_from')::time, '22:00'), coalesce((p ->> 'quiet_to')::time, '08:00'),
          coalesce(p ->> 'tz', 'Europe/Moscow'), coalesce(p ->> 'digest', 'day'))
  on conflict (user_id) do update set
    kanaly = excluded.kanaly,
    quiet_on = case when p ? 'quiet_on' then excluded.quiet_on else np.quiet_on end,
    quiet_from = case when p ? 'quiet_from' then excluded.quiet_from else np.quiet_from end,
    quiet_to = case when p ? 'quiet_to' then excluded.quiet_to else np.quiet_to end,
    tz = case when p ? 'tz' then excluded.tz else np.tz end,
    digest = case when p ? 'digest' then excluded.digest else np.digest end,
    updated_at = now();
  return public.moi_nastroyki_uvedomleniy();
end $$;

/* ── Права на функции ──────────────────────────────────────────── */

revoke execute on function public.notify_vkl(), public.notify_sobytiya(text), public.notify_po_umolchaniyu(text, text),
  public.notify_kanal_mozhno(uuid, text, text), public.notify_tikho(uuid, timestamptz),
  public.notify_sozdat(uuid, text, uuid, jsonb, text, timestamptz, timestamptz), public.notify_iz_dz2(),
  public.notify_tick(timestamptz), public.notify_svernut(),
  public.moi_uvedomleniya(int, bigint), public.uvedomleniya_schet(), public.uvedomleniya_prochitat(bigint[]),
  public.moi_nastroyki_uvedomleniy(), public.sohranit_nastroyki_uvedomleniy(jsonb)
  from public, anon, authenticated;
grant execute on function public.moi_uvedomleniya(int, bigint), public.uvedomleniya_schet(),
  public.uvedomleniya_prochitat(bigint[]), public.moi_nastroyki_uvedomleniy(),
  public.sohranit_nastroyki_uvedomleniy(jsonb)
  to authenticated;
grant execute on function public.notify_tick(timestamptz), public.notify_svernut() to service_role;
