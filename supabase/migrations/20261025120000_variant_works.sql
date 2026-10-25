-- Онлайн-вариант, этап 2: работы-варианты, выданные через кабинет.
-- План и экраны — docs/variant-onlayn.md (§7), кабинет — docs/kabinet-roli-dz.md.
--
-- Репетитор выдаёт вариант или серию вариантов классу или ученикам
-- (issue_variant_work). Браузер репетитора собирает партию по коду (тот
-- же код, что у печатного листа) и присылает условия и ключ. Условия
-- лежат в variant_work_tasks — их читают получатели. Ключ (верный ответ
-- и подсказки) — в variant_work_keys: ученик его не читает никогда.
-- Проверка — только функциями базы:
--   variant_check   — тренировка: ответ сразу, при ошибке — подсказки и
--                     вторая попытка; в баллы идёт первая попытка;
--   variant_submit  — «Завершить работу»: баллы, верно/неверно и ключ
--                     возвращаются только после завершения.
-- Время контрольной считает база: deadline_at ставится при старте.
--
-- Колонка user_id — владелец строки (ученик): по ней работают
-- export_my_data() и каскадное удаление аккаунта (миграция согласий).

create type public.variant_mode as enum ('trening', 'kontrol');

/* ── Ответ ЕГЭ ─────────────────────────────────────────────────── */

-- Нормальная запись ответа: целое или конечная десятичная дробь.
-- Запятая и точка равнозначны, лишние нули отбрасываются, «−0» = «0»,
-- минус — любой из «-», «−», «–», «—». Неверная запись (дробь «1/2»,
-- буквы, пробел внутри) — null. То же, что lib/variant/online/normalize.ts:
-- одна таблица случаев проверяет обе (scripts/check-soglasiya-sql.mjs).
create or replace function public.normalize_ege_answer(p_answer text)
returns text
language plpgsql immutable set search_path = ''
as $$
declare
  v text;
  m text[];
  v_whole text;
  v_frac text;
  v_body text;
begin
  if p_answer is null then
    return null;
  end if;
  v := regexp_replace(p_answer, '^[[:space:]   ]+|[[:space:]   ]+$', '', 'g');
  v := translate(v, E'−‒–—‐‑﹣－', '--------');
  m := regexp_match(v, '^(-?)([0-9]+)(?:[.,]([0-9]+))?$');
  if m is null then
    return null;
  end if;
  v_whole := regexp_replace(m[2], '^0+([0-9])', '\1');
  v_frac := regexp_replace(coalesce(m[3], ''), '0+$', '');
  v_body := case when v_frac = '' then v_whole else v_whole || '.' || v_frac end;
  return case when m[1] = '-' and v_body <> '0' then '-' || v_body else v_body end;
end $$;

/* ── Работы ────────────────────────────────────────────────────── */

create table public.variant_works (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users (id) on delete cascade,
  -- Выдано классу (получатели — в variant_work_recipients на момент выдачи).
  class_id uuid references public.classes (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 120),
  -- Тип работы из шапки листа: ege, dz, probnik… или custom.
  kind text not null default 'ege' check (kind ~ '^[a-z]{1,20}$'),
  -- Код партии «Собрать вариант»: по нему собран и печатный лист.
  set_code text not null check (length(set_code) between 6 and 200),
  -- Вариантов в работе: 1 — один вариант, больше — серия.
  variants smallint not null check (variants between 1 and 10),
  mode public.variant_mode not null,
  timer_kind text not null default 'none' check (timer_kind in ('none', 'up', 'down')),
  timer_minutes smallint check (timer_minutes between 1 and 300),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((timer_kind = 'down') = (timer_minutes is not null))
);
create index variant_works_tutor_idx on public.variant_works (tutor_id, created_at desc);

-- Условия: что видит получатель до завершения.
create table public.variant_work_tasks (
  work_id uuid not null references public.variant_works (id) on delete cascade,
  variant smallint not null check (variant between 1 and 10),
  position smallint not null check (position between 1 and 13),
  ege_no smallint not null check (ege_no between 1 and 13),
  -- Прототип и задача генератора варианта — для статистики и аналогов.
  prototype_id text not null check (length(prototype_id) between 1 and 64),
  task_ref text not null check (length(task_ref) between 1 and 64),
  subtype text not null default '' check (length(subtype) <= 32),
  -- Первичный балл за задание (content/variantOnline/bally.ts).
  points smallint not null default 1 check (points between 0 and 10),
  statement text not null check (length(statement) between 1 and 200000),
  figure text check (length(figure) <= 400000),
  primary key (work_id, variant, position)
);

-- Ключ: верный ответ и подсказки. Ученику — никогда; только функциям.
create table public.variant_work_keys (
  work_id uuid not null,
  variant smallint not null,
  position smallint not null,
  -- Нормальная запись (normalize_ege_answer).
  answer text not null check (answer ~ '^-?[0-9]+(\.[0-9]+)?$'),
  -- Подсказки-вопросы: [{question, options, correct, comment}], HTML.
  hints jsonb not null default '[]' check (jsonb_typeof(hints) = 'array' and octet_length(hints::text) <= 200000),
  primary key (work_id, variant, position),
  foreign key (work_id, variant, position)
    references public.variant_work_tasks (work_id, variant, position) on delete cascade
);

create table public.variant_work_recipients (
  work_id uuid not null references public.variant_works (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (work_id, user_id)
);
create index variant_work_recipients_student_idx on public.variant_work_recipients (user_id);

/* ── Попытки ───────────────────────────────────────────────────── */

create table public.variant_attempts (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.variant_works (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  variant smallint not null check (variant between 1 and 10),
  started_at timestamptz not null default now(),
  -- Контрольная с обратным отсчётом: время идёт и при закрытой вкладке.
  deadline_at timestamptz,
  finished_at timestamptz,
  -- Сдано после срока работы или после конца отсчёта.
  late boolean not null default false,
  primary_score smallint,
  max_score smallint,
  seconds int check (seconds between 0 and 86400),
  -- Черновик: ответы, «вернусь позже», время по заданиям — продолжить на
  -- другом устройстве. Ключа в нём нет.
  draft jsonb not null default '{}' check (octet_length(draft::text) <= 20000)
);
-- Одна незавершённая попытка варианта у ученика.
create unique index variant_attempts_open_idx
  on public.variant_attempts (work_id, user_id, variant) where finished_at is null;
create index variant_attempts_student_idx on public.variant_attempts (user_id, started_at desc);

create table public.variant_answers (
  attempt_id uuid not null references public.variant_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position smallint not null check (position between 1 and 13),
  -- Первая попытка (в баллы) и вторая (тренировка, после подсказки).
  first_answer text check (first_answer ~ '^-?[0-9]+(\.[0-9]+)?$'),
  first_right boolean,
  second_answer text check (second_answer ~ '^-?[0-9]+(\.[0-9]+)?$'),
  second_right boolean,
  hinted boolean not null default false,
  seconds int not null default 0 check (seconds between 0 and 86400),
  primary key (attempt_id, position)
);

/* ── Кто что видит ─────────────────────────────────────────────── */

create or replace function public.owns_variant_work(p_work uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.variant_works where id = p_work and tutor_id = auth.uid()) $$;

create or replace function public.can_see_variant_work(p_work uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_admin() or public.owns_variant_work(p_work)
      or exists (select 1 from public.variant_work_recipients where work_id = p_work and user_id = auth.uid())
$$;

/* ── Выдать ────────────────────────────────────────────────────── */

-- p: {title, kind, set_code, mode, timer_kind, timer_minutes, due_at,
--     class_id, student_ids: [uuid], variants: [{variant, tasks: [{position,
--     ege_no, prototype_id, task_ref, subtype, points, statement, figure,
--     answer, hints}]}]}
create or replace function public.issue_variant_work(p jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_class uuid := nullif(p ->> 'class_id', '')::uuid;
  v_due timestamptz := nullif(p ->> 'due_at', '')::timestamptz;
  v_var jsonb;
  v_task jsonb;
  v_answer text;
  v_student uuid;
  v_count int := 0;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden: работу выдаёт репетитор' using errcode = 'insufficient_privilege';
  end if;
  if v_class is not null and not public.owns_class(v_class) then
    raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
  end if;
  if v_due is not null and v_due <= now() then
    raise exception 'bad_due: срок уже прошёл' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p -> 'variants') is distinct from 'array' or jsonb_array_length(p -> 'variants') = 0 then
    raise exception 'no_tasks: в работе нет заданий' using errcode = 'check_violation';
  end if;

  insert into public.variant_works (tutor_id, class_id, title, kind, set_code, variants, mode,
                                    timer_kind, timer_minutes, due_at)
  values (auth.uid(), v_class, trim(p ->> 'title'), coalesce(nullif(p ->> 'kind', ''), 'ege'),
          p ->> 'set_code', jsonb_array_length(p -> 'variants'),
          (p ->> 'mode')::public.variant_mode, coalesce(p ->> 'timer_kind', 'none'),
          nullif(p ->> 'timer_minutes', '')::smallint, v_due)
  returning id into v_id;

  for v_var in select * from jsonb_array_elements(p -> 'variants') loop
    if jsonb_typeof(v_var -> 'tasks') is distinct from 'array' or jsonb_array_length(v_var -> 'tasks') = 0 then
      raise exception 'no_tasks: пустой вариант' using errcode = 'check_violation';
    end if;
    for v_task in select * from jsonb_array_elements(v_var -> 'tasks') loop
      v_answer := public.normalize_ege_answer(v_task ->> 'answer');
      if v_answer is null then
        raise exception 'bad_answer: ответ не в формате ЕГЭ (№%)', v_task ->> 'ege_no' using errcode = 'check_violation';
      end if;
      insert into public.variant_work_tasks (work_id, variant, position, ege_no, prototype_id, task_ref,
                                             subtype, points, statement, figure)
      values (v_id, (v_var ->> 'variant')::smallint, (v_task ->> 'position')::smallint,
              (v_task ->> 'ege_no')::smallint, v_task ->> 'prototype_id', v_task ->> 'task_ref',
              coalesce(v_task ->> 'subtype', ''), coalesce((v_task ->> 'points')::smallint, 1),
              v_task ->> 'statement', nullif(v_task ->> 'figure', ''));
      insert into public.variant_work_keys (work_id, variant, position, answer, hints)
      values (v_id, (v_var ->> 'variant')::smallint, (v_task ->> 'position')::smallint, v_answer,
              coalesce(v_task -> 'hints', '[]'));
    end loop;
  end loop;

  for v_student in
    select user_id from public.class_members where class_id = v_class
    union
    select (jsonb_array_elements_text(coalesce(p -> 'student_ids', '[]')))::uuid
  loop
    if not public.is_my_student(v_student) then
      raise exception 'not_your_student' using errcode = 'insufficient_privilege';
    end if;
    insert into public.variant_work_recipients (work_id, user_id) values (v_id, v_student)
    on conflict do nothing;
    v_count := v_count + 1;
  end loop;
  if v_count = 0 then
    raise exception 'no_recipients: некому выдать' using errcode = 'check_violation';
  end if;
  return v_id;
end $$;

/* ── Решать ────────────────────────────────────────────────────── */

-- Начать (или продолжить) вариант работы. Возвращает попытку.
create or replace function public.variant_start(p_work uuid, p_variant smallint)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  w public.variant_works;
  v_id uuid;
begin
  select * into w from public.variant_works where id = p_work;
  if w.id is null or not exists (
    select 1 from public.variant_work_recipients where work_id = p_work and user_id = auth.uid()) then
    raise exception 'not_your_work' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(auth.uid()) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if w.closed_at is not null then
    raise exception 'work_closed: работа закрыта' using errcode = 'check_violation';
  end if;
  if p_variant < 1 or p_variant > w.variants then
    raise exception 'bad_variant' using errcode = 'check_violation';
  end if;
  select id into v_id from public.variant_attempts
   where work_id = p_work and user_id = auth.uid() and variant = p_variant and finished_at is null;
  if v_id is not null then
    return v_id;
  end if;
  insert into public.variant_attempts (work_id, user_id, variant, deadline_at)
  values (p_work, auth.uid(), p_variant,
          case when w.mode = 'kontrol' and w.timer_kind = 'down'
               then now() + make_interval(mins => w.timer_minutes) end)
  returning id into v_id;
  insert into public.variant_answers (attempt_id, user_id, position)
  select v_id, auth.uid(), position from public.variant_work_tasks
   where work_id = p_work and variant = p_variant;
  return v_id;
end $$;

-- Своя незавершённая попытка — или ошибка.
create or replace function public.my_open_attempt(p_attempt uuid)
returns public.variant_attempts
language plpgsql stable security definer set search_path = ''
as $$
declare a public.variant_attempts;
begin
  select * into a from public.variant_attempts where id = p_attempt and user_id = auth.uid();
  if a.id is null then
    raise exception 'not_your_attempt' using errcode = 'insufficient_privilege';
  end if;
  if a.finished_at is not null then
    raise exception 'already_finished: работа уже завершена' using errcode = 'check_violation';
  end if;
  return a;
end $$;

-- Тренировка: проверить ответ сразу. Неверная запись — {"verdict":"format"}
-- (попытка не тратится). Первая ошибка — подсказки и право на вторую
-- попытку; в баллы идёт первая.
create or replace function public.variant_check(p_attempt uuid, p_position smallint, p_answer text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  a public.variant_attempts := public.my_open_attempt(p_attempt);
  r public.variant_answers;
  k public.variant_work_keys;
  v_norm text := public.normalize_ege_answer(p_answer);
  v_right boolean;
begin
  if (select mode from public.variant_works where id = a.work_id) <> 'trening' then
    raise exception 'kontrol: в контрольной ответы проверяются после завершения' using errcode = 'check_violation';
  end if;
  if v_norm is null then
    return jsonb_build_object('verdict', 'format');
  end if;
  select * into r from public.variant_answers where attempt_id = p_attempt and position = p_position;
  select * into k from public.variant_work_keys
   where work_id = a.work_id and variant = a.variant and position = p_position;
  if r.attempt_id is null or k.work_id is null then
    raise exception 'bad_position' using errcode = 'check_violation';
  end if;
  v_right := v_norm = k.answer;
  if r.first_answer is null then
    update public.variant_answers set first_answer = v_norm, first_right = v_right
     where attempt_id = p_attempt and position = p_position;
    return case when v_right then jsonb_build_object('verdict', 'right')
                else jsonb_build_object('verdict', 'wrong', 'hints', k.hints) end;
  end if;
  if r.first_right is false and r.second_answer is null then
    update public.variant_answers set second_answer = v_norm, second_right = v_right, hinted = true
     where attempt_id = p_attempt and position = p_position;
    return jsonb_build_object('verdict', case when v_right then 'right' else 'wrong' end);
  end if;
  raise exception 'already_checked: попытки по заданию кончились' using errcode = 'check_violation';
end $$;

-- Контрольная: черновик (ответы, «вернусь позже», время) — без проверки.
create or replace function public.variant_save_draft(p_attempt uuid, p_draft jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare a public.variant_attempts := public.my_open_attempt(p_attempt);
begin
  update public.variant_attempts set draft = coalesce(p_draft, '{}') where id = a.id;
end $$;

-- «Завершить работу». p_answers — ответы по позициям (первые попытки
-- контрольной; в тренировке — только непроверенные), p_seconds — время
-- по позициям, p_hinted — позиции, где открывали подсказку.
-- Возвращает баллы, верно/неверно и ключ — только теперь.
create or replace function public.variant_submit(
  p_attempt uuid, p_answers jsonb, p_seconds jsonb, p_hinted int[] default '{}')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  a public.variant_attempts := public.my_open_attempt(p_attempt);
  w public.variant_works;
  v_late boolean;
  v_total int := 0;
begin
  select * into w from public.variant_works where id = a.work_id;
  -- Непроверенные ответы — первая попытка; уже проверенные не меняются.
  update public.variant_answers va
     set first_answer = coalesce(va.first_answer, public.normalize_ege_answer(p_answers ->> (va.position - 1))),
         seconds = least(greatest(coalesce((p_seconds ->> (va.position - 1))::int, va.seconds), 0), 86400),
         hinted = va.hinted or va.position = any (coalesce(p_hinted, '{}'))
   where va.attempt_id = a.id;
  update public.variant_answers va
     set first_right = (va.first_answer is not null and va.first_answer = k.answer)
    from public.variant_work_keys k
   where va.attempt_id = a.id and k.work_id = a.work_id and k.variant = a.variant
     and k.position = va.position;
  select coalesce(sum(seconds), 0) into v_total from public.variant_answers where attempt_id = a.id;
  v_late := (w.due_at is not null and now() > w.due_at)
         or (a.deadline_at is not null and now() > a.deadline_at + interval '1 minute');
  update public.variant_attempts
     set finished_at = now(), late = v_late, seconds = least(v_total, 86400),
         primary_score = (select coalesce(sum(t.points), 0) from public.variant_answers va
                            join public.variant_work_tasks t
                              on t.work_id = a.work_id and t.variant = a.variant and t.position = va.position
                           where va.attempt_id = a.id and va.first_right),
         max_score = (select coalesce(sum(points), 0) from public.variant_work_tasks
                       where work_id = a.work_id and variant = a.variant)
   where id = a.id;
  return public.variant_result(a.id);
end $$;

-- Итог завершённой попытки: баллы, по позициям ответ, верный ответ, время.
-- Ученику — своя, репетитору — его работы.
create or replace function public.variant_result(p_attempt uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare a public.variant_attempts;
begin
  select * into a from public.variant_attempts where id = p_attempt;
  if a.id is null or not (a.user_id = auth.uid() or public.owns_variant_work(a.work_id) or public.is_admin()) then
    raise exception 'not_your_attempt' using errcode = 'insufficient_privilege';
  end if;
  if a.finished_at is null then
    raise exception 'not_finished: работа ещё идёт' using errcode = 'check_violation';
  end if;
  return jsonb_build_object(
    'attempt_id', a.id, 'variant', a.variant, 'finished_at', a.finished_at, 'late', a.late,
    'primary', a.primary_score, 'max', a.max_score, 'seconds', a.seconds,
    'tasks', (select jsonb_agg(jsonb_build_object(
                'position', va.position, 'answer', va.first_answer, 'right', coalesce(va.first_right, false),
                'second', va.second_answer, 'second_right', va.second_right, 'hinted', va.hinted,
                'seconds', va.seconds, 'key', k.answer) order by va.position)
                from public.variant_answers va
                join public.variant_work_keys k
                  on k.work_id = a.work_id and k.variant = a.variant and k.position = va.position
               where va.attempt_id = a.id));
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.variant_works enable row level security;
alter table public.variant_work_tasks enable row level security;
alter table public.variant_work_keys enable row level security;
alter table public.variant_work_recipients enable row level security;
alter table public.variant_attempts enable row level security;
alter table public.variant_answers enable row level security;

revoke all on public.variant_works, public.variant_work_tasks, public.variant_work_keys,
  public.variant_work_recipients, public.variant_attempts, public.variant_answers
  from anon, authenticated;

grant select on public.variant_works to authenticated;
grant update (title, due_at, closed_at) on public.variant_works to authenticated;
create policy variant_works_read on public.variant_works for select to authenticated
  using (public.can_see_variant_work(id));
create policy variant_works_update on public.variant_works for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

grant select on public.variant_work_tasks to authenticated;
create policy variant_work_tasks_read on public.variant_work_tasks for select to authenticated
  using (public.can_see_variant_work(work_id));

-- Ключ: только репетитор своей работы (и администратор). Ученику — нет.
grant select on public.variant_work_keys to authenticated;
create policy variant_work_keys_tutor on public.variant_work_keys for select to authenticated
  using (public.owns_variant_work(work_id) or public.is_admin());

grant select on public.variant_work_recipients to authenticated;
create policy variant_work_recipients_read on public.variant_work_recipients for select to authenticated
  using (user_id = auth.uid() or public.owns_variant_work(work_id) or public.is_admin());

-- Попытки и ответы пишут только функции. Читают — свои и репетитор работы.
grant select on public.variant_attempts, public.variant_answers to authenticated;
create policy variant_attempts_read on public.variant_attempts for select to authenticated
  using (user_id = auth.uid() or public.owns_variant_work(work_id) or public.is_admin());
create policy variant_answers_read on public.variant_answers for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.variant_attempts a
     where a.id = attempt_id and public.owns_variant_work(a.work_id)));

-- Ученик не видит верный ответ своей незавершённой попытки и через
-- variant_answers: там только его ответы и first_right — а first_right в
-- тренировке он и так узнаёт сразу, в контрольной до завершения пусто.

revoke execute on function public.issue_variant_work(jsonb) from public, anon;
revoke execute on function public.variant_start(uuid, smallint) from public, anon;
revoke execute on function public.my_open_attempt(uuid) from public, anon, authenticated;
revoke execute on function public.variant_check(uuid, smallint, text) from public, anon;
revoke execute on function public.variant_save_draft(uuid, jsonb) from public, anon;
revoke execute on function public.variant_submit(uuid, jsonb, jsonb, int[]) from public, anon;
revoke execute on function public.variant_result(uuid) from public, anon;
grant execute on function public.issue_variant_work(jsonb) to authenticated;
grant execute on function public.variant_start(uuid, smallint) to authenticated;
grant execute on function public.variant_check(uuid, smallint, text) to authenticated;
grant execute on function public.variant_save_draft(uuid, jsonb) to authenticated;
grant execute on function public.variant_submit(uuid, jsonb, jsonb, int[]) to authenticated;
grant execute on function public.variant_result(uuid) to authenticated;
grant execute on function public.normalize_ege_answer(text) to anon, authenticated;
