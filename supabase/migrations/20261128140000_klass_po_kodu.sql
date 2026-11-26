-- Класс по коду — до вступления (миграция 20261111120000_dz.sql, join_class).
--
-- Ученик видит, к кому вступает: название класса и имя учителя, и только
-- потом подтверждает вступление (сайт: components/dz/KabinetDz.tsx). Те же
-- проверки, что у join_class: только ученик с правом сохранять прогресс;
-- неверный код — попытка в class_join_tries, общий с join_class предел
-- 10 неверных кодов в час, поэтому подбирать коды здесь не легче.

create or replace function public.klass_po_kodu(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''),
                                      E'[-[:space:]   ‐‑‒–—−]+', '', 'g'));
  c public.classes;
begin
  if v_uid is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden: вступить в класс может ученик' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from public.profiles where user_id = v_uid for update;
  if (select count(*) from public.class_join_tries
       where user_id = v_uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_tries: слишком много неверных кодов, попробуйте через час'
      using errcode = 'check_violation';
  end if;

  select * into c from public.classes
   where join_code = v_code and join_open and archived_at is null;
  if c.id is null then
    insert into public.class_join_tries (user_id) values (v_uid);
    return jsonb_build_object('error', 'bad_code');
  end if;
  return jsonb_build_object(
    'class_name', c.name,
    'tutor_name', (select display_name from public.profiles where user_id = c.tutor_id),
    'uzhe', exists (select 1 from public.class_members where class_id = c.id and user_id = v_uid));
end $$;

revoke execute on function public.klass_po_kodu(text) from public, anon;
grant execute on function public.klass_po_kodu(text) to authenticated;
