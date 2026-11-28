-- Вторая часть онлайн-варианта в журнале ученика.
--
-- Задания 14–20 (номера хранения; на ЕГЭ-2027 — 13–19) ученик решает на
-- бумаге: на сайте он вписывает ответ по пунктам, сверяет его, открывает
-- решение с критериями и сам ставит себе балл. До сих пор в журнал
-- попадала только часть 1, и учитель не видел, как ученик справился со
-- второй. Теперь у варианта — список заданий части 2 (самопроверка):
--
--   chast2: [{no, shablon, otvet, verno, sverka, reshenie, ball, max}]
--     no       — номер хранения 14–20;
--     shablon  — шаблон задачи (по нему тот же вариант собирается снова);
--     otvet    — ответ ученика по пунктам (TeX, до 300 знаков);
--     verno    — верный ответ «а) …; б) …» (до 300 знаков);
--     sverka   — итог «Сверить ответ»: sovpadaet, ne-sovpadaet, uchitel
--                (сверяет учитель) или нет;
--     reshenie — ученик открыл решение и критерии;
--     ball     — балл самопроверки по критериям, нет — ещё не оценил;
--     max      — максимум за задание.
--
-- Проверку учителем по фото добавит этап 1в (хранилище фото, решение В-4).

alter table public.varianty_resheniya
  add column chast2 jsonb
    check (chast2 is null or (jsonb_typeof(chast2) = 'array' and jsonb_array_length(chast2) <= 10
                              and octet_length(chast2::text) <= 12000));

-- Часть 2 из браузера ученика — в проверенном виде: лишние поля
-- отбрасываются, строки обрезаются, балл — в пределах максимума.
-- Неверная запись — null (часть 2 не пишется, вариант — пишется).
create or replace function public.zhurnal_chast2(p jsonb)
returns jsonb
language sql immutable set search_path = ''
as $$
  select case when jsonb_typeof(p) <> 'array' or jsonb_array_length(p) = 0 or jsonb_array_length(p) > 10
              then null
              else (
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'no', (e ->> 'no')::int,
             'shablon', left(e ->> 'shablon', 80),
             'otvet', left(e ->> 'otvet', 300),
             'verno', left(e ->> 'verno', 300),
             'sverka', case when e ->> 'sverka' in ('sovpadaet', 'ne-sovpadaet', 'uchitel') then e ->> 'sverka' end,
             'reshenie', case when jsonb_typeof(e -> 'reshenie') = 'boolean' then (e ->> 'reshenie')::boolean end,
             'ball', case when (e ->> 'ball') ~ '^[0-9]$' and (e ->> 'ball')::int <= (e ->> 'max')::int
                          then (e ->> 'ball')::int end,
             'max', (e ->> 'max')::int))
           order by (e ->> 'no')::int)
      from jsonb_array_elements(p) e
     where jsonb_typeof(e) = 'object'
       and (e ->> 'no') ~ '^[0-9]{1,2}$' and (e ->> 'no')::int between 1 and 99
       and (e ->> 'max') ~ '^[1-9]$')
         end
$$;
revoke execute on function public.zhurnal_chast2(jsonb) from public, anon, authenticated;

-- Запись: как в 20261122120000_zhurnal.sql, плюс chast2 у варианта.
create or replace function public.zhurnal_push(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  z jsonb;
  a jsonb;
  v jsonb;
  v_task_no int;
  v_saved int := 0;
  v_skipped int := 0;
  v_recent int;
begin
  if v_uid is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed' using errcode = 'insufficient_privilege';
  end if;
  if public.kabinet_flag('zhurnal') is distinct from 'true'::jsonb then
    return jsonb_build_object('off', true);
  end if;
  if jsonb_typeof(coalesce(p -> 'zadachi', '[]')) <> 'array'
     or jsonb_typeof(coalesce(p -> 'varianty', '[]')) <> 'array'
     or jsonb_array_length(coalesce(p -> 'zadachi', '[]')) > 50
     or jsonb_array_length(coalesce(p -> 'varianty', '[]')) > 10 then
    raise exception 'too_big' using errcode = 'check_violation';
  end if;
  -- Не больше 600 строк за 10 минут: живой ученик столько не решит.
  select count(*) into v_recent from public.zhurnal_zadachi
   where user_id = v_uid and updated_at > now() - interval '10 minutes';
  if v_recent > 600 then
    raise exception 'too_many' using errcode = 'check_violation';
  end if;

  for z in select * from jsonb_array_elements(coalesce(p -> 'zadachi', '[]')) loop
    v_task_no := (z ->> 'task_no')::int;
    if not public.zhurnal_razdel_ok(v_task_no) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    if jsonb_array_length(coalesce(z -> 'popytki', '[]')) > 20 then
      raise exception 'too_big' using errcode = 'check_violation';
    end if;
    insert into public.zhurnal_zadachi as t (
      user_id, id, task_no, kind, task_ref, gen_hash, uslovie_tex, risunok, level, place, place_ref,
      outcome, answer_key, attempts_n, hint_steps, hint_wrong, shown_fact, shown_solution,
      skipped, active_ms, total_ms, started_at, closed_at)
    values (
      v_uid, (z ->> 'id')::uuid, v_task_no, z ->> 'kind', z ->> 'task_ref', z ->> 'gen_hash',
      z ->> 'uslovie_tex', z ->> 'risunok', (z ->> 'level')::smallint, z ->> 'place', z ->> 'place_ref',
      z ->> 'outcome',
      case when z ->> 'outcome' is null then null else z ->> 'answer_key' end,
      coalesce((z ->> 'attempts_n')::smallint, 0), coalesce((z ->> 'hint_steps')::smallint, 0),
      coalesce((select array_agg(x::smallint) from jsonb_array_elements_text(z -> 'hint_wrong') x), '{}'),
      coalesce((z ->> 'shown_fact')::boolean, false), coalesce((z ->> 'shown_solution')::boolean, false),
      coalesce((z ->> 'skipped')::boolean, false),
      least(coalesce((z ->> 'active_ms')::int, 0), coalesce((z ->> 'total_ms')::int, 0)),
      coalesce((z ->> 'total_ms')::int, 0),
      public.zhurnal_vremya(z ->> 'started_at'),
      case when z ->> 'closed_at' is null then null else public.zhurnal_vremya(z ->> 'closed_at') end)
    on conflict (user_id, id) do update set
      outcome = coalesce(t.outcome, excluded.outcome),
      answer_key = coalesce(t.answer_key, excluded.answer_key),
      attempts_n = greatest(t.attempts_n, excluded.attempts_n),
      hint_steps = greatest(t.hint_steps, excluded.hint_steps),
      hint_wrong = (select coalesce(array_agg(distinct s order by s), '{}')
                      from unnest(t.hint_wrong || excluded.hint_wrong) s),
      shown_fact = t.shown_fact or excluded.shown_fact,
      shown_solution = t.shown_solution or excluded.shown_solution,
      skipped = t.skipped or excluded.skipped,
      active_ms = greatest(t.active_ms, excluded.active_ms),
      total_ms = greatest(t.total_ms, excluded.total_ms),
      closed_at = coalesce(t.closed_at, excluded.closed_at),
      updated_at = now()
    -- Раздел, тип и задачу повтор не меняет.
    where t.task_no = excluded.task_no and t.task_ref = excluded.task_ref;

    for a in select * from jsonb_array_elements(coalesce(z -> 'popytki', '[]')) loop
      insert into public.zhurnal_popytki (user_id, zadacha_id, n, answer, ok, vid, at)
      values (v_uid, (z ->> 'id')::uuid, (a ->> 'n')::smallint, left(coalesce(a ->> 'answer', ''), 40),
              coalesce((a ->> 'ok')::boolean, false), coalesce(a ->> 'vid', 'answer'),
              public.zhurnal_vremya(a ->> 'at'))
      on conflict do nothing;
    end loop;
    v_saved := v_saved + 1;
  end loop;

  for v in select * from jsonb_array_elements(coalesce(p -> 'varianty', '[]')) loop
    insert into public.varianty_resheniya as r (
      user_id, id, source, set_code, variant_no, title, started_at, finished_at,
      primary_score, max_score, test_score, active_ms, total_ms, chast2)
    values (
      v_uid, (v ->> 'id')::uuid, v ->> 'source', v ->> 'set_code', (v ->> 'variant_no')::smallint,
      v ->> 'title', public.zhurnal_vremya(v ->> 'started_at'),
      case when v ->> 'finished_at' is null then null else public.zhurnal_vremya(v ->> 'finished_at') end,
      (v ->> 'primary_score')::smallint, (v ->> 'max_score')::smallint, (v ->> 'test_score')::smallint,
      coalesce((v ->> 'active_ms')::int, 0), coalesce((v ->> 'total_ms')::int, 0),
      public.zhurnal_chast2(v -> 'chast2'))
    on conflict (user_id, id) do update set
      finished_at = coalesce(r.finished_at, excluded.finished_at),
      primary_score = coalesce(r.primary_score, excluded.primary_score),
      max_score = coalesce(r.max_score, excluded.max_score),
      test_score = coalesce(r.test_score, excluded.test_score),
      active_ms = greatest(r.active_ms, excluded.active_ms),
      total_ms = greatest(r.total_ms, excluded.total_ms),
      -- Самопроверку части 2 ученик ставит после итогов части 1 и может
      -- поправить: последняя присланная — верная.
      chast2 = coalesce(excluded.chast2, r.chast2)
    where r.set_code = excluded.set_code;
    v_saved := v_saved + 1;
  end loop;

  return jsonb_build_object('saved', v_saved, 'skipped', v_skipped);
end $$;

-- Вариант для экранов: как в 20261122120000_zhurnal.sql, плюс chast2.
create or replace function public.zhurnal_variant(p_user uuid, p_id uuid, p_min date, p_teacher boolean)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', r.id, 'source', r.source, 'title', r.title, 'set_code', r.set_code,
    'variant_no', r.variant_no, 'started_at', r.started_at, 'finished_at', r.finished_at,
    'primary_score', r.primary_score, 'max_score', r.max_score, 'test_score', r.test_score,
    'active_ms', r.active_ms, 'total_ms', r.total_ms, 'chast2', r.chast2,
    'zadachi', coalesce((
      select jsonb_agg(public.zhurnal_json(z, p_teacher, true) order by z.started_at)
        from public.zhurnal_zadachi z
       where z.user_id = p_user and z.place = 'variant' and z.place_ref = r.id::text), '[]'::jsonb)))
    from public.varianty_resheniya r
   where r.user_id = p_user and r.id = p_id
     and (p_min is null or (r.started_at at time zone 'Europe/Moscow')::date >= p_min)
$$;
