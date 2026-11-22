-- Кабинет v2, этап 1: журнал решения задач и прогресс для учителя.
-- План — docs/plans/cabinet-v2.md (§3.1), контракт — docs/kabinet-zhurnal.md.
--
-- Где бы ученик ни решал задачу (тренажёр, опорные, карточки, вариант,
-- ДЗ), браузер присылает строку журнала: раздел, тип, id задачи (по нему
-- собирается та же задача — те же числа и чертёж), каждую попытку с
-- ответом как есть, подсказки и время. Пишет только ученик и только
-- функцией zhurnal_push. Учитель читает только функциями uchitel_*:
-- каждая сначала проверяет, что ученик — его, и отдаёт записи только с
-- дня связи «учитель — ученик» (решение В-3). Прямого select на журнал у
-- учителя нет.
--
-- Колонка user_id — владелец строки (ученик): по ней работают
-- export_my_data() и каскадное удаление аккаунта.

/* ── Флаги базы ────────────────────────────────────────────────── */

-- Флаги этапов. Меняет только сервер (bin/migrate.sh по Variables
-- репозитория): сайт, собранный со старым флагом, в выключенный
-- журнал не запишет.
create table public.kabinet_flags (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.kabinet_flags enable row level security;
create policy kabinet_flags_read on public.kabinet_flags for select to authenticated using (true);
revoke all on public.kabinet_flags from anon, authenticated;
grant select on public.kabinet_flags to authenticated;

insert into public.kabinet_flags (key, value) values
  ('zhurnal', 'false'),
  -- Номера хранения разделов. №6 («Случайные величины») вне ЕГЭ-2027 и
  -- в журнал не подключается никогда (zhurnal_razdel_ok).
  ('zhurnal_razdely', '[5, 8]');

create or replace function public.kabinet_flag(p_key text)
returns jsonb
language sql stable security definer set search_path = ''
as $$ select value from public.kabinet_flags where key = p_key $$;

-- Раздел пишется в журнал: в списке флага и не скрыт структурой экзамена.
create or replace function public.zhurnal_razdel_ok(p_task_no int)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_task_no <> 6
     and coalesce(public.kabinet_flag('zhurnal_razdely') @> to_jsonb(p_task_no), false)
$$;

/* ── Связь «учитель — ученик»: дата начала при повторной связи ─── */

-- Ученик ушёл и вернулся (join_class снимает ended_at): история между
-- уходом и возвращением учителю не принадлежит, связь начинается заново.
create or replace function public.tutor_students_relink()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.ended_at is not null and new.ended_at is null then
    new.linked_at := now();
  end if;
  return new;
end $$;
create trigger tutor_students_relink before update on public.tutor_students
  for each row execute function public.tutor_students_relink();

-- С какого дня (по Москве) учитель видит журнал ученика. null — не видит:
-- не его ученик или связь закончилась.
create or replace function public.vidit_s(p_student uuid)
returns date
language sql stable security definer set search_path = ''
as $$
  select (linked_at at time zone 'Europe/Moscow')::date
    from public.tutor_students
   where tutor_id = auth.uid() and user_id = p_student and ended_at is null
     and public.my_role() = 'tutor'
$$;

/* ── Таблицы журнала ───────────────────────────────────────────── */

-- Одна строка — одна задача, которую ученик открыл: решил, ошибся,
-- открыл решение, пропустил или ушёл.
create table public.zhurnal_zadachi (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Ставит браузер: повторная отправка дополняет строку, а не плодит дубль.
  id uuid not null,
  task_no smallint not null references public.ege_tasks (no),
  -- Тип/прототип: «8.A».
  kind text not null check (length(kind) between 1 and 40),
  -- Задача: «прототип|seed|уровень» или «прототип:вариант» банка.
  task_ref text not null check (length(task_ref) between 1 and 160),
  -- Отпечаток генератора прототипа: не совпал — задача показывается по uslovie_tex.
  gen_hash text check (length(gen_hash) <= 16),
  uslovie_tex text check (length(uslovie_tex) <= 2000),
  -- Картинка к задаче банка: путь файла сайта («/zadaniya/5/…»).
  risunok text check (risunok ~ '^/[A-Za-z0-9_./-]{1,200}$'),
  -- Сложность: 1 — базовая, 2 — повышенная, 3 — высокая; null — неизвестно.
  level smallint check (level between 1 and 3),
  place text not null check (place in ('trenazher', 'opornye', 'kartochki', 'variant', 'povyshennye', 'dz')),
  -- Тренировка, блок опорных, вариант или ДЗ.
  place_ref text check (length(place_ref) <= 64),
  -- null — задача ещё открыта.
  outcome text check (outcome in ('right', 'hinted', 'wrong', 'revealed', 'skipped', 'left')),
  -- Исход проверила база (ДЗ, выданный вариант), а не браузер.
  verified boolean not null default false,
  -- Верный ответ: в журнал попадает только после закрытия задачи.
  answer_key text check (length(answer_key) <= 40),
  attempts_n smallint not null default 0 check (attempts_n between 0 and 99),
  hint_steps smallint not null default 0 check (hint_steps between 0 and 20),
  -- Номера шагов подсказки, на которых была неверная кнопка.
  hint_wrong smallint[] not null default '{}' check (cardinality(hint_wrong) <= 20),
  shown_fact boolean not null default false,
  shown_solution boolean not null default false,
  skipped boolean not null default false,
  -- Активное время: вкладка видна и было действие не дольше 2 минут назад.
  active_ms int not null default 0 check (active_ms between 0 and 14400000),
  total_ms int not null default 0 check (total_ms between 0 and 86400000),
  started_at timestamptz not null,
  closed_at timestamptz,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index zhurnal_zadachi_time_idx on public.zhurnal_zadachi (user_id, started_at desc);
create index zhurnal_zadachi_place_idx on public.zhurnal_zadachi (user_id, place, place_ref);
create index zhurnal_zadachi_kind_idx on public.zhurnal_zadachi (kind, outcome) where outcome = 'right';

-- Каждая попытка ответа.
create table public.zhurnal_popytki (
  user_id uuid not null,
  zadacha_id uuid not null,
  n smallint not null check (n between 1 and 20),
  -- Ответ как есть (решение В-1).
  answer text not null check (length(answer) <= 40),
  ok boolean not null,
  -- answer — засчитанная попытка; format — неверная запись, fraction —
  -- верное значение обыкновенной дробью: попытка не тратится.
  vid text not null default 'answer' check (vid in ('answer', 'format', 'fraction')),
  at timestamptz not null,
  primary key (user_id, zadacha_id, n),
  foreign key (user_id, zadacha_id) references public.zhurnal_zadachi (user_id, id) on delete cascade
);
-- export_my_data берёт таблицы со ссылкой на auth.users: связь и здесь.
alter table public.zhurnal_popytki
  add constraint zhurnal_popytki_user_fk foreign key (user_id) references auth.users (id) on delete cascade;

-- Вариант, решённый целиком: свой «Собрать вариант», серия, «Варианты
-- повышенной сложности», выданная работа.
create table public.varianty_resheniya (
  user_id uuid not null references auth.users (id) on delete cascade,
  id uuid not null,
  source text not null check (source in ('sobrat', 'seriya', 'povyshennye', 'rabota')),
  set_code text not null check (length(set_code) between 1 and 200),
  variant_no smallint check (variant_no between 1 and 99),
  title text check (length(title) <= 120),
  started_at timestamptz not null,
  finished_at timestamptz,
  primary_score smallint check (primary_score between 0 and 99),
  max_score smallint check (max_score between 0 and 99),
  test_score smallint check (test_score between 0 and 100),
  active_ms int not null default 0 check (active_ms between 0 and 86400000),
  total_ms int not null default 0 check (total_ms between 0 and 86400000),
  variant_attempt_id uuid references public.variant_attempts (id) on delete set null,
  received_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index varianty_resheniya_time_idx on public.varianty_resheniya (user_id, started_at desc);

-- Свёртка по дням (по Москве): тепловая карта, активность и календарь
-- читаются отсюда. Пополняется триггером; подробные записи старше срока
-- хранения удаляются (zhurnal_svernut), свёртка остаётся.
create table public.zhurnal_dni (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  task_no smallint not null,
  kind text not null,
  -- Закрыто задач с ответом или открытым решением (без «пропустил»/«ушёл»).
  solved int not null default 0,
  "right" int not null default 0,
  active_ms bigint not null default 0,
  total_ms bigint not null default 0,
  primary key (user_id, day, task_no, kind)
);

alter table public.zhurnal_zadachi enable row level security;
alter table public.zhurnal_popytki enable row level security;
alter table public.varianty_resheniya enable row level security;
alter table public.zhurnal_dni enable row level security;
-- Ученик читает своё. Пишет только функцией, учитель — только функциями.
create policy zhurnal_zadachi_own on public.zhurnal_zadachi for select to authenticated
  using (user_id = auth.uid());
create policy zhurnal_popytki_own on public.zhurnal_popytki for select to authenticated
  using (user_id = auth.uid());
create policy varianty_resheniya_own on public.varianty_resheniya for select to authenticated
  using (user_id = auth.uid());
create policy zhurnal_dni_own on public.zhurnal_dni for select to authenticated
  using (user_id = auth.uid());
revoke all on public.zhurnal_zadachi, public.zhurnal_popytki, public.varianty_resheniya,
  public.zhurnal_dni from anon, authenticated;
grant select on public.zhurnal_zadachi, public.zhurnal_popytki, public.varianty_resheniya,
  public.zhurnal_dni to authenticated;

/* ── Свёртка по дням ───────────────────────────────────────────── */

create or replace function public.zhurnal_dni_vklad(z public.zhurnal_zadachi, p_sign int)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_solved int := case when z.outcome in ('right', 'hinted', 'wrong', 'revealed') then 1 else 0 end;
begin
  insert into public.zhurnal_dni as d (user_id, day, task_no, kind, solved, "right", active_ms, total_ms)
  values (z.user_id, (coalesce(z.closed_at, z.started_at) at time zone 'Europe/Moscow')::date,
          z.task_no, z.kind, p_sign * v_solved, p_sign * (z.outcome = 'right')::int,
          p_sign * z.active_ms, p_sign * z.total_ms)
  on conflict (user_id, day, task_no, kind) do update
    set solved = d.solved + excluded.solved,
        "right" = d."right" + excluded."right",
        active_ms = d.active_ms + excluded.active_ms,
        total_ms = d.total_ms + excluded.total_ms;
end $$;

create or replace function public.zhurnal_dni_trigger()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    perform public.zhurnal_dni_vklad(old, -1);
  end if;
  perform public.zhurnal_dni_vklad(new, 1);
  return null;
end $$;
create trigger zhurnal_zadachi_dni after insert or update on public.zhurnal_zadachi
  for each row execute function public.zhurnal_dni_trigger();
-- Удаление подробных записей по сроку свёртку не трогает: триггера на
-- delete нет. Аккаунт удаляется — свёртка уходит каскадом.

/* ── Запись ────────────────────────────────────────────────────── */

-- Время из браузера: не позже сервера (+5 минут на расхождение часов) и
-- не раньше чем за 7 дней. Иначе — время сервера.
create or replace function public.zhurnal_vremya(p text)
returns timestamptz
language plpgsql stable set search_path = ''
as $$
declare
  v timestamptz;
begin
  begin
    v := p::timestamptz;
  exception when others then
    return now();
  end;
  if v is null or v > now() + interval '5 minutes' or v < now() - interval '7 days' then
    return now();
  end if;
  return v;
end $$;

-- Пачка записей из браузера:
--   {"zadachi": [{id, task_no, kind, task_ref, gen_hash, uslovie_tex, risunok, level,
--                 place, place_ref, outcome, answer_key, attempts_n, hint_steps,
--                 hint_wrong, shown_fact, shown_solution, skipped, active_ms,
--                 total_ms, started_at, closed_at,
--                 popytki: [{n, answer, ok, vid, at}]}],
--    "varianty": [{id, source, set_code, variant_no, title, started_at,
--                  finished_at, primary_score, max_score, test_score,
--                  active_ms, total_ms}]}
-- Ответ: {"saved": N, "skipped": M}; журнал выключен — {"off": true}.
-- Повтор той же задачи дополняет строку: счётчики — наибольшее, отметки
-- «открыто» — или, закрытая задача не открывается снова.
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
      primary_score, max_score, test_score, active_ms, total_ms)
    values (
      v_uid, (v ->> 'id')::uuid, v ->> 'source', v ->> 'set_code', (v ->> 'variant_no')::smallint,
      v ->> 'title', public.zhurnal_vremya(v ->> 'started_at'),
      case when v ->> 'finished_at' is null then null else public.zhurnal_vremya(v ->> 'finished_at') end,
      (v ->> 'primary_score')::smallint, (v ->> 'max_score')::smallint, (v ->> 'test_score')::smallint,
      coalesce((v ->> 'active_ms')::int, 0), coalesce((v ->> 'total_ms')::int, 0))
    on conflict (user_id, id) do update set
      finished_at = coalesce(r.finished_at, excluded.finished_at),
      primary_score = coalesce(r.primary_score, excluded.primary_score),
      max_score = coalesce(r.max_score, excluded.max_score),
      test_score = coalesce(r.test_score, excluded.test_score),
      active_ms = greatest(r.active_ms, excluded.active_ms),
      total_ms = greatest(r.total_ms, excluded.total_ms)
    where r.set_code = excluded.set_code;
    v_saved := v_saved + 1;
  end loop;

  return jsonb_build_object('saved', v_saved, 'skipped', v_skipped);
end $$;

/* ── Чтение: общие части ───────────────────────────────────────── */

-- «Очень быстро» (решение В-7): верно с первой попытки, без подсказок и
-- решения, задача повышенной сложности или выше, активное время меньше
-- 8 с или меньше 15 % медианы этого типа. Только для учителя.
create or replace function public.zhurnal_bystro(z public.zhurnal_zadachi)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select z.outcome = 'right' and z.attempts_n <= 1 and z.hint_steps = 0
     and not z.shown_solution and not z.shown_fact and coalesce(z.level, 1) >= 2
     and (z.active_ms < 8000
          or z.active_ms < 0.15 * coalesce((
               select percentile_cont(0.5) within group (order by m.active_ms)
                 from (select active_ms from public.zhurnal_zadachi
                        where kind = z.kind and outcome = 'right'
                        order by received_at desc limit 500) m
               having count(*) >= 10), 0))
$$;

-- Задача журнала в виде для экранов. p_dlya_uchitelya — с пометкой «очень быстро».
create or replace function public.zhurnal_json(z public.zhurnal_zadachi, p_dlya_uchitelya boolean,
                                               p_popytki boolean)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', z.id, 'task_no', z.task_no, 'kind', z.kind, 'task_ref', z.task_ref,
    'gen_hash', z.gen_hash, 'level', z.level, 'place', z.place, 'place_ref', z.place_ref,
    'outcome', z.outcome, 'verified', z.verified, 'answer_key', z.answer_key,
    'attempts_n', z.attempts_n, 'hint_steps', z.hint_steps, 'hint_wrong', to_jsonb(z.hint_wrong),
    'shown_fact', z.shown_fact, 'shown_solution', z.shown_solution, 'skipped', z.skipped,
    'active_ms', z.active_ms, 'total_ms', z.total_ms, 'started_at', z.started_at,
    'closed_at', z.closed_at,
    'uslovie_tex', case when p_popytki then z.uslovie_tex end,
    'risunok', case when p_popytki then z.risunok end,
    'last_answer', (select answer from public.zhurnal_popytki p
                     where p.user_id = z.user_id and p.zadacha_id = z.id order by n desc limit 1),
    'bystro', case when p_dlya_uchitelya and public.zhurnal_bystro(z) then true end,
    'popytki', case when p_popytki then coalesce((
        select jsonb_agg(jsonb_build_object('n', p.n, 'answer', p.answer, 'ok', p.ok,
                                            'vid', p.vid, 'at', p.at) order by p.n)
          from public.zhurnal_popytki p
         where p.user_id = z.user_id and p.zadacha_id = z.id), '[]'::jsonb) end))
$$;

-- Сводка за период. p_min — с какого дня учителю видно (null — всё).
create or replace function public.zhurnal_svodka(p_user uuid, p_from date, p_to date,
                                                 p_task_no int, p_min date)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with d as (
    select * from public.zhurnal_dni
     where user_id = p_user and day between greatest(p_from, coalesce(p_min, p_from)) and p_to
       and (p_task_no is null or task_no = p_task_no)
  ), v as (
    select * from public.varianty_resheniya
     where user_id = p_user and finished_at is not null
       and (finished_at at time zone 'Europe/Moscow')::date
           between greatest(p_from, coalesce(p_min, p_from)) and p_to
  )
  select jsonb_build_object(
    'active_ms', coalesce((select sum(active_ms) from d), 0),
    'total_ms', coalesce((select sum(total_ms) from d), 0),
    'solved', coalesce((select sum(solved) from d), 0),
    'right', coalesce((select sum("right") from d), 0),
    'po_zadaniyam', coalesce((
      select jsonb_agg(jsonb_build_object('task_no', task_no, 'solved', s, 'right', r, 'active_ms', a)
                       order by task_no)
        from (select task_no, sum(solved) s, sum("right") r, sum(active_ms) a from d group by task_no) q),
      '[]'::jsonb),
    'dni', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'solved', s, 'active_ms', a) order by day)
        from (select day, sum(solved) s, sum(active_ms) a from d group by day) q), '[]'::jsonb),
    -- Пять самых слабых типов: от трёх решённых задач, по точности.
    'slabye', coalesce((
      select jsonb_agg(jsonb_build_object('task_no', task_no, 'kind', kind, 'solved', s, 'right', r)
                       order by r::numeric / s, s desc)
        from (select task_no, kind, sum(solved) s, sum("right") r from d
               group by task_no, kind having sum(solved) >= 3
               order by sum("right")::numeric / sum(solved), sum(solved) desc limit 5) q), '[]'::jsonb),
    'varianty', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', id, 'source', source, 'title', title, 'set_code', set_code,
               'variant_no', variant_no, 'finished_at', finished_at,
               'primary_score', primary_score, 'max_score', max_score,
               'test_score', test_score, 'active_ms', active_ms, 'total_ms', total_ms))
               order by finished_at)
        from v), '[]'::jsonb))
$$;

-- Лента: задачи по времени, новые сверху, страницами по 50.
create or replace function public.zhurnal_lenta(p_user uuid, p_from date, p_to date, p_task_no int,
                                                p_min date, p_before timestamptz, p_teacher boolean)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(public.zhurnal_json(z, p_teacher, false) order by z.started_at desc), '[]')
    from (select * from public.zhurnal_zadachi
           where user_id = p_user
             and (started_at at time zone 'Europe/Moscow')::date
                 between greatest(p_from, coalesce(p_min, p_from)) and p_to
             and (p_task_no is null or task_no = p_task_no)
             and (p_before is null or started_at < p_before)
           order by started_at desc limit 50) z
$$;

-- Вариант целиком: строка варианта и его задачи с попытками.
create or replace function public.zhurnal_variant(p_user uuid, p_id uuid, p_min date, p_teacher boolean)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', r.id, 'source', r.source, 'title', r.title, 'set_code', r.set_code,
    'variant_no', r.variant_no, 'started_at', r.started_at, 'finished_at', r.finished_at,
    'primary_score', r.primary_score, 'max_score', r.max_score, 'test_score', r.test_score,
    'active_ms', r.active_ms, 'total_ms', r.total_ms,
    'zadachi', coalesce((
      select jsonb_agg(public.zhurnal_json(z, p_teacher, true) order by z.started_at)
        from public.zhurnal_zadachi z
       where z.user_id = p_user and z.place = 'variant' and z.place_ref = r.id::text), '[]'::jsonb)))
    from public.varianty_resheniya r
   where r.user_id = p_user and r.id = p_id
     and (p_min is null or (r.started_at at time zone 'Europe/Moscow')::date >= p_min)
$$;

revoke execute on function public.zhurnal_dni_vklad(public.zhurnal_zadachi, int),
  public.zhurnal_bystro(public.zhurnal_zadachi),
  public.zhurnal_json(public.zhurnal_zadachi, boolean, boolean),
  public.zhurnal_svodka(uuid, date, date, int, date),
  public.zhurnal_lenta(uuid, date, date, int, date, timestamptz, boolean),
  public.zhurnal_variant(uuid, uuid, date, boolean),
  public.vidit_s(uuid),
  public.tutor_students_relink(),
  public.zhurnal_dni_trigger()
  from public, anon, authenticated;

/* ── Учитель ───────────────────────────────────────────────────── */

-- Ученик учителя и день, с которого видно; иначе — отказ.
create or replace function public.uchitel_dostup(p_student uuid)
returns date
language plpgsql stable security definer set search_path = ''
as $$
declare
  v date := public.vidit_s(p_student);
begin
  if v is null then
    raise exception 'not_your_student' using errcode = 'insufficient_privilege';
  end if;
  return v;
end $$;
revoke execute on function public.uchitel_dostup(uuid) from public, anon, authenticated;

-- Класс: ученики, тепловая карта «ученик × задание», активность за
-- неделю, когда заходил в последний раз, кто не начал текущее ДЗ.
create or replace function public.uchitel_klass(p_class uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Moscow')::date;
begin
  if public.my_role() is distinct from 'tutor' or not public.owns_class(p_class) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return (
    with st as (
      select m.user_id, public.vidit_s(m.user_id) as s,
             coalesce(ms.alias, p.display_name) as name
        from public.class_members m
        join public.profiles p on p.user_id = m.user_id
        left join public.tutor_students ms on ms.tutor_id = auth.uid() and ms.user_id = m.user_id
       where m.class_id = p_class
    ), vis as (select * from st where s is not null)
    select jsonb_build_object(
      'class', (select jsonb_build_object('id', id, 'name', name) from public.classes where id = p_class),
      'ucheniki', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'id', vis.user_id, 'name', vis.name, 's', vis.s,
                 'last_day', (select max(day) from public.zhurnal_dni d
                               where d.user_id = vis.user_id and d.day >= vis.s),
                 'nedelya', (select jsonb_build_object('solved', coalesce(sum(solved), 0),
                                                       'active_ms', coalesce(sum(active_ms), 0),
                                                       'dni', count(distinct day))
                               from public.zhurnal_dni d
                              where d.user_id = vis.user_id and d.day >= greatest(vis.s, v_today - 6)),
                 'ne_nachal_dz', (select jsonb_agg(jsonb_build_object('id', h.id, 'title', h.title,
                                                                      'due_at', h.due_at))
                                    from public.homework h
                                    join public.homework_recipients r on r.homework_id = h.id
                                   where h.tutor_id = auth.uid() and h.closed_at is null
                                     and (h.due_at is null or h.due_at > now())
                                     and r.user_id = vis.user_id and r.started_at is null
                                     and r.submitted_at is null)))
                 order by vis.name)
          from vis), '[]'::jsonb),
      'karta', coalesce((
        select jsonb_agg(jsonb_build_object('id', user_id, 'task_no', task_no, 'solved', s,
                                            'right', r, 'active_ms', a))
          from (select d.user_id, d.task_no, sum(d.solved) s, sum(d."right") r, sum(d.active_ms) a
                  from public.zhurnal_dni d join vis on vis.user_id = d.user_id
                 where d.day between greatest(p_from, vis.s) and p_to
                 group by d.user_id, d.task_no) q), '[]'::jsonb),
      -- Ученики класса, чей журнал учителю не виден (связь закончилась).
      'skryto', (select count(*) from st where s is null))
  );
end $$;

create or replace function public.uchitel_uchenik(p_student uuid, p_from date, p_to date,
                                                  p_task_no int default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min date := public.uchitel_dostup(p_student);
begin
  return jsonb_build_object(
    'id', p_student,
    'name', (select coalesce(ts.alias, p.display_name) from public.profiles p
               left join public.tutor_students ts on ts.tutor_id = auth.uid() and ts.user_id = p.user_id
              where p.user_id = p_student),
    's', v_min,
    'progress_allowed', public.can_save_progress(p_student),
    'svodka', public.zhurnal_svodka(p_student, p_from, p_to, p_task_no, v_min));
end $$;

create or replace function public.uchitel_lenta(p_student uuid, p_from date, p_to date,
                                                p_task_no int default null,
                                                p_before timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min date := public.uchitel_dostup(p_student);
begin
  return public.zhurnal_lenta(p_student, p_from, p_to, p_task_no, v_min, p_before, true);
end $$;

create or replace function public.uchitel_zadacha(p_student uuid, p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min date := public.uchitel_dostup(p_student);
  v jsonb;
begin
  select public.zhurnal_json(z, true, true) into v
    from public.zhurnal_zadachi z
   where z.user_id = p_student and z.id = p_id
     and (z.started_at at time zone 'Europe/Moscow')::date >= v_min;
  if v is null then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  return v;
end $$;

create or replace function public.uchitel_variant(p_student uuid, p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min date := public.uchitel_dostup(p_student);
  v jsonb := public.zhurnal_variant(p_student, p_id, v_min, true);
begin
  if v is null then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  return v;
end $$;

/* ── Ученик: своя статистика, без пометок для учителя ──────────── */

create or replace function public.moya_statistika(p_from date, p_to date, p_task_no int default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return public.zhurnal_svodka(auth.uid(), p_from, p_to, p_task_no, null);
end $$;

create or replace function public.moya_lenta(p_from date, p_to date, p_task_no int default null,
                                             p_before timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return public.zhurnal_lenta(auth.uid(), p_from, p_to, p_task_no, null, p_before, false);
end $$;

create or replace function public.moy_variant(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return public.zhurnal_variant(auth.uid(), p_id, null, false);
end $$;

/* ── Срок хранения (решение В-2) ───────────────────────────────── */

-- Подробные записи хранятся до конца следующего учебного года: решённое
-- в 2026/27 удаляется 1 сентября 2028. Свёртка по дням остаётся.
-- Вызывается каждую ночь (bin/backup.sh, после копии) — только сервером.
create or replace function public.zhurnal_svernut()
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Moscow')::date;
  -- Начало текущего учебного года (1 сентября).
  v_god date := make_date(extract(year from v_today)::int - case when extract(month from v_today) < 9 then 1 else 0 end, 9, 1);
  v_granica timestamptz := (v_god - interval '1 year') at time zone 'Europe/Moscow';
  v_n int;
begin
  delete from public.zhurnal_zadachi where started_at < v_granica;
  get diagnostics v_n = row_count;
  delete from public.varianty_resheniya where started_at < v_granica;
  return v_n;
end $$;
revoke execute on function public.zhurnal_svernut() from public, anon, authenticated;

-- Удаление по сроку не должно снимать вклад из свёртки: триггер свёртки
-- срабатывает только на insert и update (см. выше).

grant execute on function public.zhurnal_push(jsonb),
  public.uchitel_klass(uuid, date, date),
  public.uchitel_uchenik(uuid, date, date, int),
  public.uchitel_lenta(uuid, date, date, int, timestamptz),
  public.uchitel_zadacha(uuid, uuid),
  public.uchitel_variant(uuid, uuid),
  public.moya_statistika(date, date, int),
  public.moya_lenta(date, date, int, timestamptz),
  public.moy_variant(uuid),
  public.kabinet_flag(text)
  to authenticated;
revoke execute on function public.zhurnal_push(jsonb),
  public.uchitel_klass(uuid, date, date),
  public.uchitel_uchenik(uuid, date, date, int),
  public.uchitel_lenta(uuid, date, date, int, timestamptz),
  public.uchitel_zadacha(uuid, uuid),
  public.uchitel_variant(uuid, uuid),
  public.moya_statistika(date, date, int),
  public.moya_lenta(date, date, int, timestamptz),
  public.moy_variant(uuid),
  public.kabinet_flag(text),
  public.zhurnal_razdel_ok(int),
  public.zhurnal_vremya(text)
  from public, anon;
