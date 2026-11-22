-- Журнал решения задач (docs/plans/cabinet-v2.md, этап 1а).
--
-- Что и как делал ученик — где бы он ни решал: тренажёр, опорные задачи,
-- карточки, варианты, домашнее задание. Одна показанная задача — строка
-- task_runs, каждое действие с ней — строка task_events. Условие, каким
-- его видел ученик, лежит снимком в task_snapshots: генератор со
-- временем меняется, а учителю нужна та же задача.
--
-- Пишет только функция journal_push (пачка из браузера, повтор пачки
-- ничего не меняет). Читают: ученик — своё, репетитор — своих учеников,
-- пока связь действует (is_my_student), администратор — всё.
--
-- В тренажёре верность ответа считает браузер ученика: журнал — рассказ
-- устройства, а не проверка. Оценки берутся из ДЗ и работ кабинета, где
-- ответ проверяет база.

/* ── Снимки условий ────────────────────────────────────────────── */

create table public.task_snapshots (
  -- sha256 от условия, чертежа и ответа: одинаковые задачи — одна строка.
  hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
  task_no smallint not null references public.ege_tasks (no),
  kind text check (length(kind) <= 64),
  statement_html text not null check (length(statement_html) between 1 and 200000),
  figure text check (length(figure) <= 400000),
  -- Верный ответ. Ученику колонка закрыта правами (как alias): в ДЗ
  -- ответ до срока знать нельзя.
  answer text check (length(answer) <= 200),
  created_at timestamptz not null default now()
);

/* ── Результаты вариантов ──────────────────────────────────────── */

create table public.work_results (
  -- Идентификатор даёт браузер: повтор отправки не создаёт вторую строку.
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('sobrat', 'seriya', 'povyshennye', 'ezhemesyachnye', 'kabinet')),
  code text check (length(code) <= 120),
  variant smallint check (variant between 1 and 99),
  mode text check (mode in ('trening', 'kontrol')),
  title text check (length(title) <= 200),
  started_at timestamptz not null,
  finished_at timestamptz,
  primary_score smallint check (primary_score between 0 and 100),
  max_score smallint check (max_score between 0 and 100),
  test_score smallint check (test_score between 0 and 100),
  total_ms int not null default 0 check (total_ms between 0 and 86400000),
  active_ms int not null default 0 check (active_ms between 0 and 86400000),
  homework_id uuid references public.homework (id) on delete set null,
  created_at timestamptz not null default now(),
  check (active_ms <= total_ms)
);
create index work_results_user_idx on public.work_results (user_id, started_at desc);

/* ── Задачи ────────────────────────────────────────────────────── */

create table public.task_runs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('trainer', 'opornye', 'cards', 'variant', 'homework')),
  task_no smallint not null references public.ege_tasks (no),
  -- Тип или прототип («8.A», метод №5).
  kind text check (length(kind) <= 64),
  -- Ссылка, по которой сайт строит ту же задачу («8.A|42|1», «прототип:3»).
  task_ref text check (length(task_ref) <= 200),
  gen_version text check (length(gen_version) <= 40),
  snapshot_hash text references public.task_snapshots (hash),
  session_id text check (length(session_id) <= 120),
  work_id uuid references public.work_results (id) on delete cascade,
  homework_id uuid references public.homework (id) on delete set null,
  position smallint check (position between 1 and 200),
  started_at timestamptz not null,
  closed_at timestamptz,
  outcome text not null default 'open'
    check (outcome in ('open', 'right', 'hinted', 'wrong', 'revealed', 'skipped')),
  -- Итоги считает база из событий.
  attempts smallint not null default 0,
  first_right boolean,
  last_answer text check (length(last_answer) <= 200),
  hint_steps smallint not null default 0,
  hint_miss_step smallint,
  property_shown boolean not null default false,
  solution_shown boolean not null default false,
  -- Время: общее — от показа до закрытия; активное — вкладка видна и
  -- были действия (пауза после двух минут бездействия).
  total_ms int not null default 0 check (total_ms between 0 and 21600000),
  active_ms int not null default 0 check (active_ms between 0 and 21600000),
  updated_at timestamptz not null default now(),
  check (active_ms <= total_ms)
);
create index task_runs_user_idx on public.task_runs (user_id, started_at desc);
create index task_runs_user_task_idx on public.task_runs (user_id, task_no, started_at desc);
create index task_runs_work_idx on public.task_runs (work_id) where work_id is not null;
create index task_runs_homework_idx on public.task_runs (homework_id, user_id) where homework_id is not null;
create index task_runs_snapshot_idx on public.task_runs (snapshot_hash) where snapshot_hash is not null;

create table public.task_events (
  run_id uuid not null references public.task_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  seq smallint not null check (seq between 1 and 500),
  type text not null check (type in ('attempt', 'hint_open', 'hint_step', 'hint_miss',
                                     'property', 'solution', 'skip', 'similar')),
  -- Ответ как введён.
  answer text check (length(answer) <= 200),
  ok boolean,
  -- Шаг подсказки (вопрос, на котором ошибка, — в hint_miss).
  step smallint check (step between 0 and 99),
  at timestamptz not null,
  -- Активное время задачи к этому действию.
  active_ms int not null default 0 check (active_ms between 0 and 21600000),
  primary key (run_id, seq)
);
create index task_events_user_idx on public.task_events (user_id, at desc);

/* ── Итог за день ──────────────────────────────────────────────── */

create table public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- День по Москве.
  day date not null,
  task_no smallint not null references public.ege_tasks (no),
  runs int not null default 0,
  closed int not null default 0,
  right_count int not null default 0,
  active_ms bigint not null default 0,
  total_ms bigint not null default 0,
  primary key (user_id, day, task_no)
);

create or replace function public.journal_day(p timestamptz)
returns date
language sql stable set search_path = ''
as $$ select (p at time zone 'Europe/Moscow')::date $$;

-- Пересчёт итогов дня по одному заданию из task_runs.
create or replace function public.journal_recount_day(p_user uuid, p_day date, p_task_no smallint)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.activity_days (user_id, day, task_no, runs, closed, right_count, active_ms, total_ms)
  select p_user, p_day, p_task_no, count(*),
         count(*) filter (where r.outcome <> 'open'),
         count(*) filter (where r.outcome in ('right', 'hinted')),
         coalesce(sum(r.active_ms), 0), coalesce(sum(r.total_ms), 0)
    from public.task_runs r
   where r.user_id = p_user and r.task_no = p_task_no
     and public.journal_day(r.started_at) = p_day
  having count(*) > 0
  on conflict (user_id, day, task_no) do update
    set runs = excluded.runs, closed = excluded.closed, right_count = excluded.right_count,
        active_ms = excluded.active_ms, total_ms = excluded.total_ms
$$;

/* ── Приём пачки из браузера ───────────────────────────────────── */

-- Время из браузера: не из будущего (часы устройства могут спешить на
-- пять минут) и не старше 60 дней (очередь без сети столько не живёт).
create or replace function public.journal_time(p text)
returns timestamptz
language plpgsql stable set search_path = ''
as $$
declare v timestamptz;
begin
  begin
    v := p::timestamptz;
  exception when others then
    raise exception 'bad_time: время записано неверно' using errcode = 'check_violation';
  end;
  if v is null then return null; end if;
  if v > now() + interval '5 minutes' then v := now(); end if;
  if v < now() - interval '60 days' then
    raise exception 'too_old: запись старше 60 дней' using errcode = 'check_violation';
  end if;
  return v;
end $$;

-- p = { "works": [ { id, kind, code, variant, mode, title, started_at,
--                    finished_at, primary, max, test, total_ms, active_ms,
--                    homework_id } ],
--       "runs":  [ { id, source, task_no, kind, ref, gen, session, work_id,
--                    homework_id, position, started_at, closed_at, outcome,
--                    total_ms, active_ms,
--                    snapshot: { statement, figure, answer },
--                    events: [ { seq, type, answer, ok, step, at, active_ms } ] } ] }
-- Ответ: { "runs": N, "events": N, "works": N } — сколько принято.
create or replace function public.journal_push(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  w jsonb;
  r jsonb;
  e jsonb;
  s jsonb;
  v_id uuid;
  v_owner uuid;
  v_closed timestamptz;
  v_hw uuid;
  v_work uuid;
  v_task_no smallint;
  v_started timestamptz;
  v_end timestamptz;
  v_total int;
  v_active int;
  v_span bigint;
  v_hash text;
  v_outcome text;
  v_runs int := 0;
  v_events int := 0;
  v_works int := 0;
  v_n int;
  v_today int;
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'forbidden: журнал пишет ученик' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(coalesce(p -> 'runs', '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p -> 'works', '[]'::jsonb)) <> 'array' then
    raise exception 'bad_batch: пачка записана неверно' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(coalesce(p -> 'runs', '[]'::jsonb)) > 50
     or jsonb_array_length(coalesce(p -> 'works', '[]'::jsonb)) > 10 then
    raise exception 'too_many: в пачке не больше 50 задач и 10 работ' using errcode = 'check_violation';
  end if;

  -- Предел на день: защита от скрипта. Один пишущий на ученика.
  perform 1 from public.profiles where user_id = v_uid for update;
  select count(*) into v_today from public.task_runs
   where user_id = v_uid and started_at > now() - interval '1 day';
  if v_today > 3000 then
    raise exception 'too_many_today: слишком много задач за сутки' using errcode = 'check_violation';
  end if;

  /* Работы (варианты). */
  for w in select * from jsonb_array_elements(coalesce(p -> 'works', '[]'::jsonb)) loop
    v_id := (w ->> 'id')::uuid;
    select user_id into v_owner from public.work_results where id = v_id;
    if v_owner is not null and v_owner <> v_uid then
      raise exception 'not_yours: чужая работа' using errcode = 'insufficient_privilege';
    end if;
    v_hw := nullif(w ->> 'homework_id', '')::uuid;
    if v_hw is not null and not exists (
      select 1 from public.homework_recipients where homework_id = v_hw and user_id = v_uid) then
      raise exception 'not_your_homework' using errcode = 'insufficient_privilege';
    end if;
    v_started := public.journal_time(w ->> 'started_at');
    v_end := public.journal_time(w ->> 'finished_at');
    v_span := (extract(epoch from (coalesce(v_end, now()) - v_started)) * 1000)::bigint + 5000;
    v_total := least(greatest(coalesce((w ->> 'total_ms')::bigint, 0), 0), greatest(v_span, 0), 86400000)::int;
    v_active := least(greatest(coalesce((w ->> 'active_ms')::bigint, 0), 0), v_total)::int;
    insert into public.work_results as t (id, user_id, kind, code, variant, mode, title, started_at,
      finished_at, primary_score, max_score, test_score, total_ms, active_ms, homework_id)
    values (v_id, v_uid, w ->> 'kind', w ->> 'code', (w ->> 'variant')::smallint, w ->> 'mode',
      left(w ->> 'title', 200), v_started, v_end, (w ->> 'primary')::smallint, (w ->> 'max')::smallint,
      (w ->> 'test')::smallint, v_total, v_active, v_hw)
    on conflict (id) do update
      set finished_at = excluded.finished_at, primary_score = excluded.primary_score,
          max_score = excluded.max_score, test_score = excluded.test_score,
          total_ms = excluded.total_ms, active_ms = excluded.active_ms
      -- Законченную работу повтор не меняет.
      where t.finished_at is null;
    v_works := v_works + 1;
  end loop;

  /* Задачи и события. */
  for r in select * from jsonb_array_elements(coalesce(p -> 'runs', '[]'::jsonb)) loop
    v_id := (r ->> 'id')::uuid;
    v_owner := null;
    v_closed := null;
    select user_id, closed_at into v_owner, v_closed from public.task_runs where id = v_id;
    if v_owner is not null and v_owner <> v_uid then
      raise exception 'not_yours: чужая задача' using errcode = 'insufficient_privilege';
    end if;

    if v_owner is null then
      v_task_no := (r ->> 'task_no')::smallint;
      if not exists (select 1 from public.ege_tasks where no = v_task_no) then
        raise exception 'bad_task_no: нет такого задания' using errcode = 'check_violation';
      end if;
      v_hw := nullif(r ->> 'homework_id', '')::uuid;
      if v_hw is not null and not exists (
        select 1 from public.homework_recipients where homework_id = v_hw and user_id = v_uid) then
        raise exception 'not_your_homework' using errcode = 'insufficient_privilege';
      end if;
      v_work := nullif(r ->> 'work_id', '')::uuid;
      if v_work is not null and not exists (
        select 1 from public.work_results where id = v_work and user_id = v_uid) then
        raise exception 'not_your_work: работа не найдена' using errcode = 'insufficient_privilege';
      end if;

      -- Снимок условия: одинаковые задачи хранятся один раз.
      v_hash := null;
      s := r -> 'snapshot';
      if jsonb_typeof(s) = 'object' and coalesce(s ->> 'statement', '') <> '' then
        v_hash := encode(sha256(convert_to(
          v_task_no::text || E'\n' || (s ->> 'statement') || E'\n' || coalesce(s ->> 'figure', '')
          || E'\n' || coalesce(s ->> 'answer', ''), 'UTF8')), 'hex');
        insert into public.task_snapshots (hash, task_no, kind, statement_html, figure, answer)
        values (v_hash, v_task_no, left(r ->> 'kind', 64), s ->> 'statement',
                nullif(s ->> 'figure', ''), nullif(s ->> 'answer', ''))
        on conflict (hash) do nothing;
      end if;

      insert into public.task_runs (id, user_id, source, task_no, kind, task_ref, gen_version,
        snapshot_hash, session_id, work_id, homework_id, position, started_at)
      values (v_id, v_uid, r ->> 'source', v_task_no, left(r ->> 'kind', 64), r ->> 'ref', r ->> 'gen',
        v_hash, r ->> 'session', v_work, v_hw, (r ->> 'position')::smallint,
        public.journal_time(r ->> 'started_at'));
      v_runs := v_runs + 1;
    end if;

    -- Закрытую задачу повтор не меняет: ни события, ни итог.
    if v_closed is not null then
      continue;
    end if;

    if jsonb_typeof(coalesce(r -> 'events', '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(r -> 'events', '[]'::jsonb)) > 200 then
      raise exception 'too_many_events: не больше 200 действий на задачу в пачке' using errcode = 'check_violation';
    end if;
    for e in select * from jsonb_array_elements(coalesce(r -> 'events', '[]'::jsonb)) loop
      insert into public.task_events (run_id, user_id, seq, type, answer, ok, step, at, active_ms)
      values (v_id, v_uid, (e ->> 'seq')::smallint, e ->> 'type', left(e ->> 'answer', 200),
        (e ->> 'ok')::boolean, (e ->> 'step')::smallint, public.journal_time(e ->> 'at'),
        least(greatest(coalesce((e ->> 'active_ms')::bigint, 0), 0), 21600000)::int)
      on conflict (run_id, seq) do nothing;
      get diagnostics v_n = row_count;
      v_events := v_events + v_n;
    end loop;

    -- Итоги — из событий, время — из браузера, но в разумных границах:
    -- общее не больше промежутка от показа до закрытия, активное не
    -- больше общего.
    select started_at into v_started from public.task_runs where id = v_id;
    v_end := public.journal_time(r ->> 'closed_at');
    v_outcome := coalesce(nullif(r ->> 'outcome', ''), 'open');
    if v_end is null then v_outcome := 'open'; end if;
    if v_end is not null and v_outcome = 'open' then
      raise exception 'bad_outcome: у закрытой задачи нужен исход' using errcode = 'check_violation';
    end if;
    v_span := (extract(epoch from (coalesce(v_end, now()) - v_started)) * 1000)::bigint + 5000;
    v_total := least(greatest(coalesce((r ->> 'total_ms')::bigint, 0), 0), greatest(v_span, 0), 21600000)::int;
    v_active := least(greatest(coalesce((r ->> 'active_ms')::bigint, 0), 0), v_total)::int;

    update public.task_runs t
       set closed_at = v_end, outcome = v_outcome, total_ms = v_total, active_ms = v_active,
           updated_at = now(),
           attempts = q.attempts, first_right = q.first_right, last_answer = q.last_answer,
           hint_steps = q.hint_steps, hint_miss_step = q.hint_miss_step,
           property_shown = q.property_shown, solution_shown = q.solution_shown
      from (
        select count(*) filter (where ev.type = 'attempt')::smallint as attempts,
               (array_agg(ev.ok order by ev.seq) filter (where ev.type = 'attempt'))[1] as first_right,
               (array_agg(ev.answer order by ev.seq desc) filter (where ev.type = 'attempt'))[1] as last_answer,
               (count(distinct ev.step) filter (where ev.type = 'hint_step')
                 + case when bool_or(ev.type = 'hint_open')
                             and count(*) filter (where ev.type = 'hint_step') = 0 then 1 else 0 end
               )::smallint as hint_steps,
               (min(ev.step) filter (where ev.type = 'hint_miss'))::smallint as hint_miss_step,
               coalesce(bool_or(ev.type = 'property'), false) as property_shown,
               coalesce(bool_or(ev.type = 'solution'), false) as solution_shown
          from public.task_events ev where ev.run_id = v_id
      ) q
     where t.id = v_id;

    select task_no into v_task_no from public.task_runs where id = v_id;
    perform public.journal_recount_day(v_uid, public.journal_day(v_started), v_task_no);
  end loop;

  return jsonb_build_object('runs', v_runs, 'events', v_events, 'works', v_works);
end $$;

/* ── Своя статистика ученика ───────────────────────────────────── */

-- Без пометок для учителя: только свои числа.
create or replace function public.my_summary(p_from date, p_to date)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'active_ms', coalesce((select sum(active_ms) from public.activity_days
                            where user_id = auth.uid() and day between p_from and p_to), 0),
    'solved', coalesce((select sum(right_count) from public.activity_days
                         where user_id = auth.uid() and day between p_from and p_to), 0),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('task_no', t.task_no, 'closed', t.closed, 'right', t.right_count,
                                          'active_ms', t.active_ms) order by t.task_no)
        from (select task_no, sum(closed) as closed, sum(right_count) as right_count,
                     sum(active_ms) as active_ms
                from public.activity_days
               where user_id = auth.uid() and day between p_from and p_to
               group by task_no) t), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'closed', d.closed, 'active_ms', d.active_ms)
                       order by d.day)
        from (select day, sum(closed) as closed, sum(active_ms) as active_ms
                from public.activity_days
               where user_id = auth.uid() and day between p_from and p_to
               group by day) d), '[]'::jsonb),
    'works', coalesce((
      select jsonb_agg(jsonb_build_object('id', w.id, 'kind', w.kind, 'title', w.title,
               'finished_at', w.finished_at, 'primary', w.primary_score, 'max', w.max_score,
               'test', w.test_score, 'active_ms', w.active_ms) order by w.finished_at)
        from public.work_results w
       where w.user_id = auth.uid() and w.finished_at is not null
         and public.journal_day(w.finished_at) between p_from and p_to), '[]'::jsonb))
$$;

/* ── Свёртка старых событий ────────────────────────────────────── */

-- Подробные действия живут 12 месяцев; итоги по задаче остаются в
-- task_runs. Вызывает сервер по расписанию (этап 3), снаружи закрыта.
create or replace function public.journal_fold()
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare v bigint;
begin
  delete from public.task_events where at < now() - interval '12 months';
  get diagnostics v = row_count;
  return v;
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.task_snapshots enable row level security;
alter table public.work_results enable row level security;
alter table public.task_runs enable row level security;
alter table public.task_events enable row level security;
alter table public.activity_days enable row level security;

-- На своём сервере у anon и authenticated по умолчанию все права на
-- новые таблицы: снимаем и выдаём только чтение.
revoke all on public.task_snapshots, public.work_results, public.task_runs,
  public.task_events, public.activity_days
  from anon, authenticated;

grant select on public.work_results, public.task_runs, public.task_events, public.activity_days
  to authenticated;
-- Снимок — без ответа: ответ отдают только функции репетитора.
grant select (hash, task_no, kind, statement_html, figure, created_at)
  on public.task_snapshots to authenticated;

create policy work_results_read on public.work_results for select to authenticated
  using (user_id = auth.uid() or public.is_my_student(user_id) or public.is_admin());
create policy task_runs_read on public.task_runs for select to authenticated
  using (user_id = auth.uid() or public.is_my_student(user_id) or public.is_admin());
create policy task_events_read on public.task_events for select to authenticated
  using (user_id = auth.uid() or public.is_my_student(user_id) or public.is_admin());
create policy activity_days_read on public.activity_days for select to authenticated
  using (user_id = auth.uid() or public.is_my_student(user_id) or public.is_admin());
-- Снимок виден тому, кому видна хотя бы одна задача с ним (правила
-- task_runs применяются внутри подзапроса).
create policy task_snapshots_read on public.task_snapshots for select to authenticated
  using (exists (select 1 from public.task_runs r where r.snapshot_hash = hash));

revoke execute on function public.journal_day(timestamptz) from public, anon, authenticated;
revoke execute on function public.journal_time(text) from public, anon, authenticated;
revoke execute on function public.journal_recount_day(uuid, date, smallint) from public, anon, authenticated;
revoke execute on function public.journal_fold() from public, anon, authenticated;
revoke execute on function public.journal_push(jsonb) from public, anon;
revoke execute on function public.my_summary(date, date) from public, anon;
grant execute on function public.journal_push(jsonb) to authenticated;
grant execute on function public.my_summary(date, date) to authenticated;
grant execute on function public.journal_fold() to service_role;
