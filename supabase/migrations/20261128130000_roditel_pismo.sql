-- Письмо родителю ученика младше 18 (миграция 20261011120000_soglasiya.sql).
--
-- Токен и подтверждение были, отправителя не было. Теперь:
--   • roditel_zabrat — рассыльщику (infra/lite/notifier): кому пора
--     отправить письмо; выдаёт новый одноразовый токен (в базе — только
--     его sha256) и отмечает letter_sent_at;
--   • roditel_itog — итог отправки: временный сбой — повтор через 5 минут;
--   • roditel_pismo_snova — ученику, кнопка «Отправить ещё раз»: не чаще
--     раза в 10 минут и не больше 5 писем в сутки;
--   • confirm_parent_consent — ссылка из письма действует 14 дней.
-- Ученики, которые уже ждут родителя, получат письмо при первом проходе
-- рассыльщика после миграции.

alter table public.parent_consents
  -- Письмо нужно отправить не раньше этого времени; null — не нужно.
  add column pismo_nuzhno_s timestamptz default now(),
  -- Сколько писем ушло за день pisem_den (по Москве): предел 5.
  add column pisem_n smallint not null default 0,
  add column pisem_den date;
update public.parent_consents set pismo_nuzhno_s = null where confirmed_at is not null;

create or replace function public.roditel_zabrat(p_limit int default 20)
returns table (user_id uuid, parent_email text, imya text, token text)
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  v_token text;
  v_den date := (now() at time zone 'Europe/Moscow')::date;
begin
  for r in
    select pc.user_id, pc.parent_email, p.display_name
      from public.parent_consents pc
      join public.profiles p on p.user_id = pc.user_id
     where pc.confirmed_at is null
       and pc.pismo_nuzhno_s is not null and pc.pismo_nuzhno_s <= now()
       and not (pc.pisem_den = v_den and pc.pisem_n >= 5)
     order by pc.pismo_nuzhno_s
     limit greatest(1, least(coalesce(p_limit, 20), 100))
     for update of pc skip locked
  loop
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    update public.parent_consents pc
       set token_hash = encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
           letter_sent_at = now(),
           pismo_nuzhno_s = null,
           pisem_n = case when pc.pisem_den = v_den then pc.pisem_n + 1 else 1 end,
           pisem_den = v_den
     where pc.user_id = r.user_id;
    user_id := r.user_id;
    parent_email := r.parent_email;
    imya := r.display_name;
    token := v_token;
    return next;
  end loop;
end $$;

create or replace function public.roditel_itog(p_user uuid, p_povtor boolean)
returns void
language sql security definer set search_path = ''
as $$
  update public.parent_consents
     set pismo_nuzhno_s = case when p_povtor then now() + interval '5 minutes' end
   where user_id = p_user and confirmed_at is null
$$;

-- Кнопка ученика «Отправить письмо ещё раз».
create or replace function public.roditel_pismo_snova()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v public.parent_consents;
  v_den date := (now() at time zone 'Europe/Moscow')::date;
begin
  select * into v from public.parent_consents where user_id = v_uid for update;
  if not found then
    raise exception 'no_parent_consent: согласие родителя не нужно' using errcode = 'check_violation';
  end if;
  if v.confirmed_at is not null then
    raise exception 'already_confirmed: родитель уже подтвердил' using errcode = 'check_violation';
  end if;
  if v.pismo_nuzhno_s is not null then
    return jsonb_build_object('ok', true, 'uzhe', true);
  end if;
  if v.letter_sent_at is not null and v.letter_sent_at > now() - interval '10 minutes' then
    raise exception 'too_soon: письмо можно отправить ещё раз через 10 минут' using errcode = 'check_violation';
  end if;
  if v.pisem_den = v_den and v.pisem_n >= 5 then
    raise exception 'too_many: сегодня уже 5 писем, попробуйте завтра' using errcode = 'check_violation';
  end if;
  update public.parent_consents set pismo_nuzhno_s = now() where user_id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

-- Ссылка из письма: та же, что раньше, но не старше 14 дней.
create or replace function public.confirm_parent_consent(p_token text, p_ip inet)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.parent_consents;
  v_email text;
begin
  select * into v_row from public.parent_consents
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
     and letter_sent_at > now() - interval '14 days'
   for update;
  if not found then
    raise exception 'bad_token: ссылка устарела — попросите ученика отправить письмо ещё раз';
  end if;
  select email into v_email from auth.users where id = v_row.user_id;
  update public.parent_consents
     set confirmed_at = now(), confirm_ip = p_ip, token_hash = null, pismo_nuzhno_s = null
   where user_id = v_row.user_id;
  insert into public.consents (user_id, email, kind, version, ip, parent_email)
  values (v_row.user_id, v_email, 'soglasie_roditelya', public.current_documents_version(), p_ip, v_row.parent_email);
  return v_row.user_id;
end $$;

revoke execute on function public.roditel_zabrat(int), public.roditel_itog(uuid, boolean),
  public.roditel_pismo_snova(), public.confirm_parent_consent(text, inet)
  from public, anon, authenticated;
grant execute on function public.roditel_zabrat(int), public.roditel_itog(uuid, boolean),
  public.confirm_parent_consent(text, inet) to service_role;
grant execute on function public.roditel_pismo_snova() to authenticated;
