-- Уведомления, этап 3г (docs/kabinet-uvedomleniya.md): web push. Своим
-- флагом и последним (В-5): строки очереди для push пишутся, только когда
-- в kabinet_flags.uvedomleniya_kanaly есть "push".
--
-- В push — только тип события и ссылка (В-5): без названия ДЗ, имён и
-- текста. Сервисы push (Google, Apple, Mozilla, Microsoft) за рубежом.
--
-- Подписка — адрес сервиса push и ключи шифрования браузера, без названия
-- браузера и устройства. Адрес — только известных сервисов push: иначе
-- вошедший мог бы заставить сервер ходить по любому адресу. Сервис ответил
-- «подписки нет» (404/410) — подписка удаляется.
--
-- Ключи VAPID создаёт рассыльщик при первом запуске и кладёт в базу
-- (vault): они переживают переустановку контейнеров и попадают в копию,
-- а открытый ключ сайт берёт функцией push_klyuch — переменных сборки
-- не нужно.

create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 20 and 1000),
  -- Открытый ключ браузера (65 байт) и секрет (16 байт), base64url.
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{86,88}={0,2}$'),
  auth text not null check (auth ~ '^[A-Za-z0-9_-]{21,24}={0,2}$'),
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fails int not null default 0 check (fails between 0 and 1000)
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

-- Адрес подписки — только известных сервисов push.
create or replace function public.push_adres_mozhno(p_endpoint text)
returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(p_endpoint ~ ('^https://('
    || 'fcm\.googleapis\.com'
    || '|updates\.push\.services\.mozilla\.com'
    || '|push\.services\.mozilla\.com'
    || '|web\.push\.apple\.com'
    || '|[a-z0-9-]+\.push\.apple\.com'
    || '|[a-z0-9-]+\.notify\.windows\.com'
    || ')/[A-Za-z0-9_~:%./?=&+-]+$'), false)
$$;

-- Push включён флагом каналов.
create or replace function public.push_vkl()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.notify_vkl()
     and 'push' = any (select jsonb_array_elements_text(coalesce(
           (select value from public.kabinet_flags where key = 'uvedomleniya_kanaly'), '[]'::jsonb)))
$$;

/* ── Ключи VAPID ───────────────────────────────────────────────── */

-- Открытый ключ для браузера (applicationServerKey). null — рассыльщик ещё
-- не создал ключи или push выключен.
create or replace function public.push_klyuch()
returns text
language sql stable security definer set search_path = ''
as $$
  select case when public.push_vkl() then
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public') end
$$;

-- Для рассыльщика: оба ключа или null.
create or replace function public.push_vapid()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when pub is null or priv is null then null
              else jsonb_build_object('public', pub, 'private', priv) end
    from (select (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public') as pub,
                 (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private') as priv) k
$$;

-- Рассыльщик создал ключи — сохранить, если их ещё нет; вернуть те, что в базе.
create or replace function public.push_vapid_sohranit(p_public text, p_private text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if p_public !~ '^[A-Za-z0-9_-]{86,88}$' or p_private !~ '^[A-Za-z0-9_-]{42,44}$' then
    raise exception 'bad_key' using errcode = 'check_violation';
  end if;
  if public.push_vapid() is null then
    delete from vault.secrets where name in ('vapid_public', 'vapid_private');
    insert into vault.secrets (name, secret) values ('vapid_public', p_public), ('vapid_private', p_private);
  end if;
  return public.push_vapid();
end $$;

/* ── Подписка вошедшего ────────────────────────────────────────── */

-- Включить push в этом браузере. Тот же адрес у другого аккаунта (вошли
-- другим аккаунтом в том же браузере) переходит к вошедшему. Не больше 10
-- подписок у человека: лишние — самые старые. Возвращает число подписок.
create or replace function public.push_podpisat(p_endpoint text, p_p256dh text, p_auth text)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  if not public.push_vkl() then
    raise exception 'push_off' using errcode = 'check_violation';
  end if;
  if not public.push_adres_mozhno(p_endpoint) then
    raise exception 'bad_endpoint' using errcode = 'check_violation';
  end if;
  insert into public.push_subscriptions as s (user_id, endpoint, p256dh, auth)
  values (v_uid, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = v_uid, p256dh = excluded.p256dh, auth = excluded.auth,
        created_at = case when s.user_id = v_uid then s.created_at else now() end, fails = 0;
  delete from public.push_subscriptions
   where user_id = v_uid
     and id not in (select id from public.push_subscriptions where user_id = v_uid
                     order by created_at desc, id desc limit 10);
  select count(*) into v_n from public.push_subscriptions where user_id = v_uid;
  return v_n;
end $$;

-- Выключить push в этом браузере (только свою подписку).
create or replace function public.push_otpisat(p_endpoint text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
  return found;
end $$;

-- Сколько у вошедшего подписок (для экрана настроек).
create or replace function public.moi_push()
returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int from public.push_subscriptions where user_id = auth.uid()
$$;

/* ── Очередь: push только тем, у кого есть подписка ────────────── */

-- Как в 3а, плюс: строку push не ставим, если у человека нет ни одной
-- подписки (иначе очередь копила бы отменённые строки у всех).
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
    continue when v_channel = 'push'
                  and not exists (select 1 from public.push_subscriptions s where s.user_id = p_user);
    continue when not public.notify_kanal_mozhno(p_user, p_event, v_channel);
    v_after := public.notify_tikho(p_user, p_visible);
    continue when p_srok is not null and v_after >= p_srok;
    insert into public.notify_outbox (notification_id, user_id, channel, event, homework_id, dedupe_key, send_after)
    values (v_id, p_user, v_channel, p_event, p_hw, p_dedupe || ':' || v_channel, v_after)
    on conflict (dedupe_key) do nothing;
  end loop;
  return true;
end $$;

/* ── Рассыльщик ────────────────────────────────────────────────── */

-- Пачка push к отправке — те же перепроверки, что у писем. В строке —
-- событие, ДЗ (для ссылки), важность и подписки человека. Названия ДЗ и
-- имён нет (В-5).
create or replace function public.notify_zabrat_push(p_limit int default 20, p_now timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  o public.notify_outbox;
  h public.homework2;
  v_otmena text;
  v_subs jsonb;
  v_payload jsonb;
  v_out jsonb := '[]'::jsonb;
begin
  if not public.push_vkl() then
    return v_out;
  end if;
  update public.notify_outbox set status = 'wait', taken_at = null
   where channel = 'push' and status = 'sending' and taken_at < p_now - interval '10 minutes';

  for o in
    select * from public.notify_outbox
     where status = 'wait' and channel = 'push' and send_after <= p_now
     order by send_after, id
     limit least(greatest(coalesce(p_limit, 20), 1), 100)
     for update skip locked
  loop
    v_otmena := null;
    h := null;
    if o.homework_id is not null then
      select * into h from public.homework2 where id = o.homework_id;
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)
                              order by s.id), '[]'::jsonb)
      into v_subs from public.push_subscriptions s where s.user_id = o.user_id;
    if jsonb_array_length(v_subs) = 0 then
      v_otmena := 'нет подписки';
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

    select n.payload into v_payload from public.notifications n where n.id = o.notification_id;
    update public.notify_outbox set status = 'sending', tries = tries + 1, taken_at = p_now where id = o.id;
    v_out := v_out || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'id', o.id, 'channel', 'push', 'event', o.event, 'homework_id', h.id,
      -- Только признаки для заголовка: «за 3 часа» и «можно с опозданием».
      'za', v_payload -> 'za', 'pozdno', v_payload -> 'pozdno',
      -- Срок жизни push у сервиса: напоминание — до дедлайна, остальное — сутки.
      'ttl', case when o.event = 'dz_napominanie' and h.due_at is not null
                  then greatest(60, least(86400, extract(epoch from h.due_at - p_now)::int))
                  else 86400 end,
      'subs', v_subs)));
  end loop;
  return v_out;
end $$;

-- Ответ сервиса push по одной подписке: ok — доставлено; gone — подписки
-- больше нет (404/410), удалить; иначе — счётчик сбоев.
create or replace function public.push_rezultat(p_endpoint text, p_ok boolean, p_gone boolean default false)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_gone then
    delete from public.push_subscriptions where endpoint = p_endpoint;
  elsif p_ok then
    update public.push_subscriptions set last_ok_at = now(), fails = 0 where endpoint = p_endpoint;
  else
    update public.push_subscriptions set fails = least(fails + 1, 1000) where endpoint = p_endpoint;
  end if;
end $$;

-- Уборка: подписка, которая полгода ни разу не принимала push и всё это
-- время отказывала, — удаляется (сервис мог её забыть, не сказав).
create or replace function public.notify_svernut()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_n int;
  v_o int;
  v_l int;
  v_p int;
begin
  delete from public.notify_outbox
   where status in ('sent', 'failed', 'cancelled') and created_at < now() - interval '90 days';
  get diagnostics v_o = row_count;
  delete from public.notifications where visible_at < now() - interval '180 days';
  get diagnostics v_n = row_count;
  delete from public.notify_log where created_at < now() - interval '90 days';
  get diagnostics v_l = row_count;
  delete from public.push_subscriptions
   where fails >= 10 and coalesce(last_ok_at, created_at) < now() - interval '180 days';
  get diagnostics v_p = row_count;
  return jsonb_build_object('notifications', v_n, 'outbox', v_o, 'log', v_l, 'push', v_p);
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

revoke execute on function public.push_adres_mozhno(text), public.push_vkl(), public.push_klyuch(),
  public.push_vapid(), public.push_vapid_sohranit(text, text), public.push_podpisat(text, text, text),
  public.push_otpisat(text), public.moi_push(), public.notify_zabrat_push(int, timestamptz),
  public.push_rezultat(text, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.push_klyuch(), public.push_podpisat(text, text, text),
  public.push_otpisat(text), public.moi_push() to authenticated;
grant execute on function public.push_vapid(), public.push_vapid_sohranit(text, text),
  public.notify_zabrat_push(int, timestamptz), public.push_rezultat(text, boolean, boolean) to service_role;
