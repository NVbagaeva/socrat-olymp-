-- Уведомления, этап 3в (docs/kabinet-uvedomleniya.md): почта. Рассыльщик
-- (контейнер notifier, роль service_role) раз в минуту вызывает
-- notify_tick, забирает пачку писем notify_zabrat и отчитывается по
-- каждому notify_itog. Перед выдачей письмо перепроверяется: ДЗ уже
-- сдано, закрыто, канал выключен — письмо отменяется. Повторы — 1, 5, 30
-- минут, 2 часа, потом «не отправлено». Журнал отправок — 90 дней.
-- «Отписаться» — ссылка с подписью: выключает письма без входа. Ссылка
-- ведёт на сам рассыльщик (Caddy: /otpiska), он вызывает функцию с ключом
-- сервера — анониму функции базы по-прежнему закрыты.
-- Сводка учителю (В-8) — в 19:00 по его поясу: каждый день или по
-- воскресеньям, только если есть что сообщить.

alter table public.notify_outbox
  add column payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 1000),
  add column taken_at timestamptz;

-- Журнал отправок: что, кому, каким каналом, чем кончилось. Без адреса и текста письма.
create table public.notify_log (
  id bigint generated always as identity primary key,
  outbox_id bigint,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null,
  event text not null,
  result text not null check (result in ('sent', 'povtor', 'failed', 'cancelled')),
  detail text check (length(detail) <= 300),
  created_at timestamptz not null default now()
);
create index notify_log_created_idx on public.notify_log (created_at);
alter table public.notify_log enable row level security;
revoke all on public.notify_log from anon, authenticated;

-- Секрет подписи ссылок «Отписаться» — создаётся один раз.
insert into vault.secrets (name, secret)
values ('notify_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

create or replace function public.notify_podpis(p_user uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select left(encode(sha256(convert_to(
           (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret')
           || ':otpiska:' || p_user::text, 'UTF8')), 'hex'), 32)
$$;

create or replace function public.notify_zhurnal(o public.notify_outbox, p_result text, p_detail text)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notify_log (outbox_id, user_id, channel, event, result, detail)
  values (o.id, o.user_id, o.channel, o.event, p_result, left(p_detail, 300))
$$;

/* ── Сводка учителю ────────────────────────────────────────────── */

-- Что было по ДЗ учителя с момента p_s: выдано, сдали всего и за период,
-- у прошедших дедлайнов — сколько не сдали. Не больше 20 ДЗ.
create or replace function public.notify_svodka(p_user uuid, p_s timestamptz)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x ->> 'due_at' nulls last), '[]'::jsonb)
    from (
      select jsonb_strip_nulls(jsonb_build_object(
               'id', h.id, 'title', h.title, 'due_at', h.due_at,
               'vsego', count(r.user_id),
               'sdali', count(r.submitted_at),
               'novyh', count(*) filter (where r.submitted_at >= p_s),
               'ne_sdali', case when h.due_at < now() then count(*) filter (where r.submitted_at is null) end)) as x
        from public.homework2 h
        join public.homework2_recipients r on r.homework_id = h.id
       where h.tutor_id = p_user and h.status in ('published', 'closed')
         and (h.due_at is null or h.due_at >= p_s - interval '7 days')
       group by h.id
      having count(*) filter (where r.submitted_at >= p_s) > 0
          or (h.due_at between p_s and now() and count(*) filter (where r.submitted_at is null) > 0)
       limit 20) q
$$;

create or replace function public.notify_svodki(p_now timestamptz)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  t record;
  v_local timestamp;
  v_s timestamptz;
  v_n int := 0;
begin
  if not ('pochta' = any (select jsonb_array_elements_text(coalesce(
            (select value from public.kabinet_flags where key = 'uvedomleniya_kanaly'), '[]'::jsonb)))) then
    return 0;
  end if;
  for t in
    select p.user_id, coalesce(np.tz, 'Europe/Moscow') as tz, coalesce(np.digest, 'day') as digest
      from public.profiles p
      left join public.notify_prefs np on np.user_id = p.user_id
     where p.role = 'tutor' and coalesce(np.digest, 'day') <> 'off'
  loop
    v_local := p_now at time zone t.tz;
    continue when extract(hour from v_local) <> 19;
    continue when t.digest = 'week' and extract(isodow from v_local) <> 7;
    v_s := p_now - case when t.digest = 'week' then interval '7 days' else interval '1 day' end;
    continue when jsonb_array_length(public.notify_svodka(t.user_id, v_s)) = 0;
    insert into public.notify_outbox (user_id, channel, event, dedupe_key, send_after, payload)
    values (t.user_id, 'pochta', 'digest', 'digest:' || t.user_id || ':' || v_local::date, p_now,
            jsonb_build_object('s', v_s, 'period', t.digest))
    on conflict (dedupe_key) do nothing;
    if found then
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end $$;

-- notify_tick из 3а плюс сводки.
create or replace function public.notify_tick_pochta(p_now timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v jsonb := public.notify_tick(p_now);
begin
  if v ? 'off' then
    return v;
  end if;
  return v || jsonb_build_object('svodki', public.notify_svodki(p_now));
end $$;

/* ── Рассыльщик: забрать пачку и отчитаться ───────────────────── */

-- Письма, которым пора: перепроверка, отмена ненужных, остальные —
-- в «отправляется» с данными для письма. Зависшие «отправляется»
-- (рассыльщик упал) старше 10 минут возвращаются в очередь.
create or replace function public.notify_zabrat(p_limit int default 20, p_now timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  o public.notify_outbox;
  h public.homework2;
  v_email text;
  v_role text;
  v_name text;
  v_otmena text;
  v_digest text;
  v_tz text;
  v_out jsonb := '[]'::jsonb;
begin
  if not public.notify_vkl() then
    return v_out;
  end if;
  update public.notify_outbox set status = 'wait', taken_at = null
   where status = 'sending' and taken_at < p_now - interval '10 minutes';

  for o in
    select * from public.notify_outbox
     where status = 'wait' and channel = 'pochta' and send_after <= p_now
     order by send_after, id
     limit least(greatest(coalesce(p_limit, 20), 1), 100)
     for update skip locked
  loop
    v_otmena := null;
    h := null;
    select u.email, p.role::text, p.display_name into v_email, v_role, v_name
      from auth.users u left join public.profiles p on p.user_id = u.id where u.id = o.user_id;
    v_digest := null; v_tz := null;
    select coalesce(digest, 'day'), tz into v_digest, v_tz from public.notify_prefs where user_id = o.user_id;
    if o.homework_id is not null then
      select * into h from public.homework2 where id = o.homework_id;
    end if;
    if v_email is null or v_email = '' then
      v_otmena := 'нет почты';
    elsif o.event = 'digest' then
      if coalesce(v_digest, 'day') = 'off' then
        v_otmena := 'сводка выключена';
      end if;
    elsif not public.notify_kanal_mozhno(o.user_id, o.event, o.channel) then
      v_otmena := 'выключено в настройках';
    elsif o.event in ('dz_napominanie', 'dz_srok')
          and (h.id is null or h.status <> 'published'
               or exists (select 1 from public.homework2_recipients r
                           where r.homework_id = h.id and r.user_id = o.user_id and r.submitted_at is not null)) then
      v_otmena := 'ДЗ сдано или закрыто';
    elsif o.event = 'dz_napominanie' and h.due_at is not null and h.due_at <= p_now then
      v_otmena := 'дедлайн уже прошёл';
    end if;

    if v_otmena is not null then
      update public.notify_outbox set status = 'cancelled', last_error = v_otmena where id = o.id;
      perform public.notify_zhurnal(o, 'cancelled', v_otmena);
      continue;
    end if;

    update public.notify_outbox set status = 'sending', tries = tries + 1, taken_at = p_now where id = o.id;
    v_out := v_out || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'id', o.id, 'channel', o.channel, 'event', o.event, 'to', v_email, 'name', v_name, 'role', v_role,
      'tz', coalesce(v_tz, 'Europe/Moscow'),
      'payload', coalesce((select n.payload from public.notifications n where n.id = o.notification_id), o.payload),
      'homework_id', h.id, 'title', h.title, 'due_at', h.due_at,
      'uchenik_name', case when o.event = 'dz_sdano' then
        (select coalesce(ts.alias, p.display_name) from public.notifications n
           join public.profiles p on p.user_id = (n.payload ->> 'uchenik')::uuid
           left join public.tutor_students ts on ts.tutor_id = o.user_id and ts.user_id = p.user_id
          where n.id = o.notification_id) end,
      'svodka', case when o.event = 'digest' then
        public.notify_svodka(o.user_id, (o.payload ->> 's')::timestamptz) end,
      'period', o.payload ->> 'period',
      'otpiska', jsonb_build_object('u', o.user_id, 't', public.notify_podpis(o.user_id)))));
  end loop;
  return v_out;
end $$;

-- Итог отправки: sent; povtor — снова в очередь через 1, 5, 30 минут, 2 часа,
-- после пятой попытки — failed; failed — навсегда.
create or replace function public.notify_itog(p_id bigint, p_rezultat text, p_detail text default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  o public.notify_outbox;
  v_status text;
begin
  select * into o from public.notify_outbox where id = p_id and status = 'sending' for update;
  if o.id is null then
    raise exception 'not_sending' using errcode = 'check_violation';
  end if;
  if p_rezultat = 'sent' then
    v_status := 'sent';
    update public.notify_outbox set status = 'sent', sent_at = now(), last_error = null, taken_at = null where id = o.id;
  elsif p_rezultat = 'povtor' and o.tries < 5 then
    v_status := 'wait';
    update public.notify_outbox
       set status = 'wait', taken_at = null, last_error = left(p_detail, 500),
           send_after = now() + case o.tries when 1 then interval '1 minute' when 2 then interval '5 minutes'
                                             when 3 then interval '30 minutes' else interval '2 hours' end
     where id = o.id;
  elsif p_rezultat in ('povtor', 'failed') then
    v_status := 'failed';
    update public.notify_outbox set status = 'failed', taken_at = null, last_error = left(p_detail, 500) where id = o.id;
  else
    raise exception 'bad_result' using errcode = 'check_violation';
  end if;
  perform public.notify_zhurnal(o, case v_status when 'wait' then 'povtor' else v_status end, p_detail);
  return v_status;
end $$;

/* ── «Отписаться» по ссылке из письма ─────────────────────────── */

-- По ссылке из письма (через рассыльщик): подпись вместо входа. Выключает
-- письма по всем событиям роли и сводку, отменяет письма в очереди.
create or replace function public.notify_otpiska(p_user uuid, p_t text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_kanaly jsonb := '{}'::jsonb;
  e text;
begin
  if p_user is null or p_t is null or length(p_t) <> 32 or p_t <> public.notify_podpis(p_user) then
    raise exception 'bad_link' using errcode = 'check_violation';
  end if;
  for e in select unnest(public.notify_sobytiya((select role::text from public.profiles where user_id = p_user))) loop
    v_kanaly := v_kanaly || jsonb_build_object(e, jsonb_build_object('pochta', false));
  end loop;
  insert into public.notify_prefs as np (user_id, kanaly, digest)
  values (p_user, v_kanaly, 'off')
  on conflict (user_id) do update set
    kanaly = (select coalesce(jsonb_object_agg(k, coalesce(np.kanaly -> k, '{}'::jsonb) || jsonb_build_object('pochta', false)),
                              '{}'::jsonb)
                from jsonb_object_keys(np.kanaly || v_kanaly) k),
    digest = 'off', updated_at = now();
  update public.notify_outbox set status = 'cancelled', last_error = 'отписка'
   where user_id = p_user and channel = 'pochta' and status = 'wait';
  return true;
end $$;

-- Уборка: журнал отправок — 90 дней.
create or replace function public.notify_svernut()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_n int;
  v_o int;
  v_l int;
begin
  delete from public.notify_outbox
   where status in ('sent', 'failed', 'cancelled') and created_at < now() - interval '90 days';
  get diagnostics v_o = row_count;
  delete from public.notifications where visible_at < now() - interval '180 days';
  get diagnostics v_n = row_count;
  delete from public.notify_log where created_at < now() - interval '90 days';
  get diagnostics v_l = row_count;
  return jsonb_build_object('notifications', v_n, 'outbox', v_o, 'log', v_l);
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

revoke execute on function public.notify_podpis(uuid), public.notify_zhurnal(public.notify_outbox, text, text),
  public.notify_svodka(uuid, timestamptz), public.notify_svodki(timestamptz), public.notify_tick_pochta(timestamptz),
  public.notify_zabrat(int, timestamptz), public.notify_itog(bigint, text, text), public.notify_otpiska(uuid, text)
  from public, anon, authenticated;
grant execute on function public.notify_tick_pochta(timestamptz), public.notify_zabrat(int, timestamptz),
  public.notify_itog(bigint, text, text), public.notify_otpiska(uuid, text) to service_role;
