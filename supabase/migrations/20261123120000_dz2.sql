-- Кабинет v2, этап 2: новая выдача домашних заданий.
-- План — docs/plans/cabinet-v2.md (§3.2), контракт — docs/kabinet-dz2.md.
--
-- ДЗ собирается из элементов разных разделов (корзина «В домашку»):
-- опорные задачи, тренажёр с целью («решить N» или «K верных подряд»),
-- карточки, вариант (выданная работа, при желании с таймером), задачи
-- второй части (откроются с PR 1в — фото), глава теории («прочитано»).
--
-- Жизнь ДЗ: черновик (draft) → публикация (published; publish_at в
-- будущем — отложенная) → закрыто (closed). Шаблон (template) — черновик,
-- который не публикуется, а копируется. «Повторить ДЗ» — копия в черновик.
--
-- Задачи и ключи собирает браузер учителя тем же генератором, что и
-- тренажёр («индивидуальные числа» — свой набор каждому ученику). Ключ
-- ученик не читает никогда; ответ проверяет база (dz2_check), и каждая
-- проверка пишется в журнал решения задач (этап 1) с verified = true.
--
-- Ученик и учитель работают только через функции: прямого доступа к
-- таблицам у ученика нет, учитель читает свои строки.
--
-- Колонка user_id — владелец строки (ученик): по ней работают
-- export_my_data() и каскадное удаление аккаунта.

insert into public.kabinet_flags (key, value) values
  ('dz_novye', 'false'),
  -- Номера хранения разделов, из которых собирается ДЗ. №6 — никогда.
  ('dz_novye_razdely', '[5, 8]')
on conflict (key) do nothing;

create or replace function public.dz2_razdel_ok(p_task_no int)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_task_no <> 6
     and coalesce(public.kabinet_flag('dz_novye_razdely') @> to_jsonb(p_task_no), false)
$$;

/* ── Таблицы ───────────────────────────────────────────────────── */

create table public.homework2 (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  note text check (length(note) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'template', 'published', 'closed')),
  -- Отложенная публикация: до этого времени ученики ДЗ не видят.
  publish_at timestamptz,
  -- Дедлайн в UTC; показывается в часовом поясе пользователя.
  due_at timestamptz,
  -- После дедлайна: можно сдать с пометкой «с опозданием» или ДЗ закрыто.
  after_due text not null default 'late_ok' check (after_due in ('late_ok', 'closed')),
  hints_allowed boolean not null default true,
  -- Попытки на задачу: 1, 2, 3 или без ограничения (В-9).
  attempts_limit smallint check (attempts_limit in (1, 2, 3)),
  -- Когда показывать решения: сразу (после закрытия задачи), после дедлайна, никогда.
  solutions_when text not null default 'instant' check (solutions_when in ('instant', 'after_due', 'never')),
  -- Индивидуальные числа: у каждого ученика свои задачи.
  individual boolean not null default false,
  -- Контрольная: «Запомни» и разобранный пример выключены, подсказок нет.
  kontrol boolean not null default false,
  copied_from uuid references public.homework2 (id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  edited_at timestamptz,
  closed_at timestamptz,
  check (status <> 'published' or published_at is not null),
  check (due_at is null or publish_at is null or due_at > publish_at),
  check (not kontrol or not hints_allowed)
);
create index homework2_tutor_idx on public.homework2 (tutor_id, created_at desc);

-- Кому: классы и отдельные ученики. При публикации раскрываются в получателей.
create table public.homework2_targets (
  homework_id uuid not null references public.homework2 (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  student_id uuid references auth.users (id) on delete cascade,
  check ((class_id is null) <> (student_id is null))
);
create unique index homework2_targets_uniq on public.homework2_targets
  (homework_id, coalesce(class_id, student_id));

create table public.homework2_items (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework2 (id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  kind text not null check (kind in ('opornye', 'trenazher', 'kartochki', 'variant', 'chast2', 'teoriya')),
  -- Номер хранения раздела.
  task_no smallint not null references public.ege_tasks (no),
  title text not null check (length(trim(title)) between 1 and 160),
  -- Что именно: блок и задачи опорных, типы тренажёра, набор карточек,
  -- код партии варианта, глава теории — для показа и для «Повторить ДЗ».
  spec jsonb not null default '{}' check (jsonb_typeof(spec) = 'object' and octet_length(spec::text) <= 20000),
  -- Цель: all — все задачи элемента; count — решить N; streak — K верных подряд.
  goal_kind text not null default 'all' check (goal_kind in ('all', 'count', 'streak')),
  goal_n smallint check (goal_n between 1 and 60),
  -- Вариант: выданная работа (issue_variant_work).
  variant_work_id uuid references public.variant_works (id) on delete set null,
  unique (homework_id, position),
  unique (id, homework_id),
  check ((goal_kind = 'all') = (goal_n is null)),
  check (goal_kind = 'all' or kind = 'trenazher'),
  check (kind = 'variant' or variant_work_id is null)
);

create table public.homework2_recipients (
  homework_id uuid not null references public.homework2 (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  -- Сдано после дедлайна.
  late boolean not null default false,
  -- «Вернуть на доработку»: сдача снимается, комментарий — ученику.
  returned_at timestamptz,
  return_comment text check (length(return_comment) <= 2000),
  -- Комментарий учителя ученику по ДЗ.
  comment text check (length(comment) <= 2000),
  comment_at timestamptz,
  primary key (homework_id, user_id)
);
create index homework2_recipients_student_idx on public.homework2_recipients (user_id);

-- Задачи — то, что видит ученик. student_id null — для всех.
create table public.homework2_tasks (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null,
  item_id uuid not null,
  student_id uuid references auth.users (id) on delete cascade,
  position smallint not null check (position between 1 and 60),
  -- Тип/прототип.
  kind text not null check (length(kind) between 1 and 40),
  -- Задача: «прототип|seed|уровень», «прототип:вариант», «микротип@seed».
  task_ref text not null check (length(task_ref) between 1 and 160),
  question_html text not null check (length(question_html) between 1 and 200000),
  -- Картинка задачи банка: путь файла сайта.
  risunok text check (risunok ~ '^/[A-Za-z0-9_./-]{1,200}$'),
  level smallint check (level between 1 and 3),
  foreign key (item_id, homework_id) references public.homework2_items (id, homework_id) on delete cascade
);
create unique index homework2_tasks_pos_idx on public.homework2_tasks
  (item_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid), position);
create index homework2_tasks_hw_idx on public.homework2_tasks (homework_id);

-- Ключ: ответ в нормальной записи и разбор шагами. Ученику — никогда.
create table public.homework2_keys (
  task_id uuid primary key references public.homework2_tasks (id) on delete cascade,
  answer text not null check (answer ~ '^-?[0-9]+(\.[0-9]+)?$'),
  -- {shagi: [{chto, tex}], ...} — шаг n отдаёт подсказка dz2_hint.
  razbor jsonb check (razbor is null or (jsonb_typeof(razbor) = 'object' and octet_length(razbor::text) <= 400000))
);

-- Ход решения задачи учеником. Пишут только функции.
create table public.homework2_answers (
  task_id uuid not null references public.homework2_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  homework_id uuid not null,
  state text not null default 'open' check (state in ('open', 'right', 'wrong', 'revealed')),
  attempts smallint not null default 0 check (attempts between 0 and 99),
  -- [{a: как ввёл, ok, vid, at}] — не больше 20.
  entries jsonb not null default '[]' check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 20),
  hint_steps smallint not null default 0 check (hint_steps between 0 and 20),
  seconds int not null default 0 check (seconds between 0 and 604800),
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id),
  foreign key (homework_id, user_id) references public.homework2_recipients (homework_id, user_id) on delete cascade
);
create index homework2_answers_hw_idx on public.homework2_answers (homework_id, user_id);

-- Прогресс по элементу без задач на сервере: карточки, теория.
create table public.homework2_marks (
  item_id uuid not null references public.homework2_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  homework_id uuid not null,
  -- Карточки: сколько пройдено; теория: прочитано.
  done smallint not null default 0 check (done between 0 and 500),
  completed_at timestamptz,
  primary key (item_id, user_id),
  foreign key (homework_id, user_id) references public.homework2_recipients (homework_id, user_id) on delete cascade
);

-- События для уведомлений (этап 3): опубликовано, изменено, сдано,
-- возвращено, комментарий. Рассылки пока нет — журнал копится.
create table public.homework2_events (
  id bigint generated always as identity primary key,
  homework_id uuid not null references public.homework2 (id) on delete cascade,
  -- Кому событие: ученик или учитель.
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null check (event in ('published', 'edited', 'submitted', 'returned', 'commented')),
  created_at timestamptz not null default now()
);
create index homework2_events_user_idx on public.homework2_events (user_id, created_at desc);

/* ── Права: только функции; учитель читает свои строки ─────────── */

alter table public.homework2 enable row level security;
alter table public.homework2_targets enable row level security;
alter table public.homework2_items enable row level security;
alter table public.homework2_recipients enable row level security;
alter table public.homework2_tasks enable row level security;
alter table public.homework2_keys enable row level security;
alter table public.homework2_answers enable row level security;
alter table public.homework2_marks enable row level security;
alter table public.homework2_events enable row level security;

revoke all on public.homework2, public.homework2_targets, public.homework2_items,
  public.homework2_recipients, public.homework2_tasks, public.homework2_keys,
  public.homework2_answers, public.homework2_marks, public.homework2_events
  from anon, authenticated;

create policy homework2_own on public.homework2 for select to authenticated using (tutor_id = auth.uid());
create policy homework2_items_own on public.homework2_items for select to authenticated
  using (exists (select 1 from public.homework2 h where h.id = homework_id and h.tutor_id = auth.uid()));
create policy homework2_targets_own on public.homework2_targets for select to authenticated
  using (exists (select 1 from public.homework2 h where h.id = homework_id and h.tutor_id = auth.uid()));
grant select on public.homework2, public.homework2_items, public.homework2_targets to authenticated;
-- Ключи, задачи, ответы и получатели — только функциями (учителю — dz2_itogi).

/* ── Общие части ───────────────────────────────────────────────── */

create or replace function public.dz2_owns(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.homework2 where id = p_id and tutor_id = auth.uid()) $$;

-- Опубликовано и видно ученику: опубликовано или закрыто, время публикации наступило.
create or replace function public.dz2_vidno(h public.homework2)
returns boolean
language sql stable set search_path = ''
as $$ select h.status in ('published', 'closed') and coalesce(h.publish_at, h.published_at) <= now() $$;

-- Можно ли ученику видеть решение задачи.
create or replace function public.dz2_reshenie_mozhno(h public.homework2, p_state text)
returns boolean
language sql stable set search_path = ''
as $$
  select case h.solutions_when
           when 'instant' then coalesce(p_state in ('right', 'wrong', 'revealed'), false)
           when 'after_due' then h.due_at is not null and h.due_at < now()
           else false
         end
$$;

-- Ответ ученика против ключа — те же правила, что homework_check (№8):
--   {kind: 'format'}                 неверная запись, попытка не тратится;
--   {kind: 'fractionRight', decimal} дробь с верным значением, попытка не тратится;
--   {kind: 'right' | 'wrong', norm}.
create or replace function public.dz2_sverit(p_answer text, p_key text)
returns jsonb
language plpgsql immutable set search_path = ''
as $$
declare
  v_sp constant text := E'[[:space:]   ]';
  v_raw text := regexp_replace(coalesce(p_answer, ''), '^' || v_sp || '+|' || v_sp || '+$', '', 'g');
  v text;
  m text[];
  v_q numeric;
  v_norm text;
begin
  if char_length(v_raw) > 100 then
    return jsonb_build_object('kind', 'format');
  end if;
  v := translate(v_raw, E'−‒–—‐‑﹣－∕÷', '--------//');
  m := regexp_match(v, '^(-?)' || v_sp || '*([0-9]+(?:[.,][0-9]+)?)' || v_sp || '*/'
                       || v_sp || '*([0-9]+(?:[.,][0-9]+)?)$');
  if m is not null then
    v_q := replace(m[3], ',', '.')::numeric;
    if v_q = 0 then
      return jsonb_build_object('kind', 'format');
    end if;
    if (case when m[1] = '-' then -1 else 1 end) * replace(m[2], ',', '.')::numeric = p_key::numeric * v_q then
      return jsonb_build_object('kind', 'fractionRight', 'decimal', p_key);
    end if;
    return jsonb_build_object('kind', 'wrong', 'norm', null);
  end if;
  v_norm := public.normalize_ege_answer(p_answer);
  if v_norm is null then
    return jsonb_build_object('kind', 'format');
  end if;
  return jsonb_build_object('kind', case when v_norm = p_key then 'right' else 'wrong' end, 'norm', v_norm);
end $$;

/* ── Учитель: черновик, шаблон, публикация ─────────────────────── */

-- Сохранить черновик или шаблон (новый — без id). Элементы, задачи и
-- ключи черновика заменяются целиком.
-- p: {id?, status: 'draft'|'template', title, note, publish_at, due_at,
--     after_due, hints_allowed, attempts_limit, solutions_when, individual,
--     kontrol, copied_from,
--     targets: [{class_id} | {student_id}],
--     items: [{position, kind, task_no, title, spec, goal_kind, goal_n,
--              variant_work_id,
--              tasks: [{student_id?, position, kind, task_ref, question_html,
--                       risunok, level, answer, razbor}]}]}
create or replace function public.dz2_save(p jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_status text := coalesce(nullif(p ->> 'status', ''), 'draft');
  v_kontrol boolean := coalesce((p ->> 'kontrol')::boolean, false);
  v_hints boolean := coalesce((p ->> 'hints_allowed')::boolean, true) and not v_kontrol;
  v_old public.homework2;
  it jsonb;
  t jsonb;
  tg jsonb;
  v_item uuid;
  v_task uuid;
  v_answer text;
  v_ntasks int := 0;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if public.kabinet_flag('dz_novye') is distinct from 'true'::jsonb then
    raise exception 'dz2_off: новая выдача ДЗ выключена' using errcode = 'check_violation';
  end if;
  if v_status not in ('draft', 'template') then
    raise exception 'bad_settings: сохраняется черновик или шаблон' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(coalesce(p -> 'items', '[]')) <> 'array' or jsonb_array_length(coalesce(p -> 'items', '[]')) > 30
     or jsonb_typeof(coalesce(p -> 'targets', '[]')) <> 'array' or jsonb_array_length(coalesce(p -> 'targets', '[]')) > 100 then
    raise exception 'too_big' using errcode = 'check_violation';
  end if;

  if v_id is not null then
    select * into v_old from public.homework2 where id = v_id for update;
    if v_old.id is null or v_old.tutor_id <> auth.uid() then
      raise exception 'forbidden' using errcode = 'insufficient_privilege';
    end if;
    if v_old.status not in ('draft', 'template') then
      raise exception 'not_draft: опубликованное ДЗ меняется функцией dz2_edit' using errcode = 'check_violation';
    end if;
    update public.homework2 set
      status = v_status, title = trim(p ->> 'title'), note = nullif(trim(p ->> 'note'), ''),
      publish_at = nullif(p ->> 'publish_at', '')::timestamptz, due_at = nullif(p ->> 'due_at', '')::timestamptz,
      after_due = coalesce(nullif(p ->> 'after_due', ''), 'late_ok'), hints_allowed = v_hints,
      attempts_limit = nullif(p ->> 'attempts_limit', '')::smallint,
      solutions_when = coalesce(nullif(p ->> 'solutions_when', ''), 'instant'),
      individual = coalesce((p ->> 'individual')::boolean, false), kontrol = v_kontrol
    where id = v_id;
    delete from public.homework2_items where homework_id = v_id;
    delete from public.homework2_targets where homework_id = v_id;
  else
    insert into public.homework2 (tutor_id, status, title, note, publish_at, due_at, after_due, hints_allowed,
                                  attempts_limit, solutions_when, individual, kontrol, copied_from)
    values (auth.uid(), v_status, trim(p ->> 'title'), nullif(trim(p ->> 'note'), ''),
            nullif(p ->> 'publish_at', '')::timestamptz, nullif(p ->> 'due_at', '')::timestamptz,
            coalesce(nullif(p ->> 'after_due', ''), 'late_ok'), v_hints,
            nullif(p ->> 'attempts_limit', '')::smallint, coalesce(nullif(p ->> 'solutions_when', ''), 'instant'),
            coalesce((p ->> 'individual')::boolean, false), v_kontrol,
            case when public.dz2_owns(nullif(p ->> 'copied_from', '')::uuid)
                 then nullif(p ->> 'copied_from', '')::uuid end)
    returning id into v_id;
  end if;

  for tg in select * from jsonb_array_elements(coalesce(p -> 'targets', '[]')) loop
    if tg ? 'class_id' then
      if not public.owns_class((tg ->> 'class_id')::uuid) then
        raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
      end if;
      insert into public.homework2_targets (homework_id, class_id) values (v_id, (tg ->> 'class_id')::uuid)
      on conflict do nothing;
    else
      if not public.is_my_student((tg ->> 'student_id')::uuid) then
        raise exception 'not_your_student' using errcode = 'insufficient_privilege';
      end if;
      insert into public.homework2_targets (homework_id, student_id) values (v_id, (tg ->> 'student_id')::uuid)
      on conflict do nothing;
    end if;
  end loop;

  for it in select * from jsonb_array_elements(coalesce(p -> 'items', '[]')) loop
    if not public.dz2_razdel_ok((it ->> 'task_no')::int) then
      raise exception 'bad_task_no: раздел % не подключён к ДЗ', it ->> 'task_no' using errcode = 'check_violation';
    end if;
    if it ->> 'kind' = 'variant' and not exists (
      select 1 from public.variant_works where id = nullif(it ->> 'variant_work_id', '')::uuid and tutor_id = auth.uid()) then
      raise exception 'bad_variant: вариант не выдан этим учителем' using errcode = 'check_violation';
    end if;
    insert into public.homework2_items (homework_id, position, kind, task_no, title, spec, goal_kind, goal_n,
                                        variant_work_id)
    values (v_id, (it ->> 'position')::smallint, it ->> 'kind', (it ->> 'task_no')::smallint, trim(it ->> 'title'),
            coalesce(it -> 'spec', '{}'), coalesce(nullif(it ->> 'goal_kind', ''), 'all'),
            nullif(it ->> 'goal_n', '')::smallint,
            case when it ->> 'kind' = 'variant' then nullif(it ->> 'variant_work_id', '')::uuid end)
    returning id into v_item;
    if jsonb_array_length(coalesce(it -> 'tasks', '[]')) > 600 then
      raise exception 'too_many_tasks' using errcode = 'check_violation';
    end if;
    for t in select * from jsonb_array_elements(coalesce(it -> 'tasks', '[]')) loop
      v_answer := t ->> 'answer';
      if v_answer is null or public.normalize_ege_answer(v_answer) is distinct from v_answer then
        raise exception 'bad_answer: ответ не в нормальной записи ЕГЭ (элемент %, задача %)',
          it ->> 'position', t ->> 'position' using errcode = 'check_violation';
      end if;
      if nullif(t ->> 'student_id', '') is not null and not public.is_my_student((t ->> 'student_id')::uuid) then
        raise exception 'not_your_student' using errcode = 'insufficient_privilege';
      end if;
      insert into public.homework2_tasks (homework_id, item_id, student_id, position, kind, task_ref, question_html,
                                          risunok, level)
      values (v_id, v_item, nullif(t ->> 'student_id', '')::uuid, (t ->> 'position')::smallint, t ->> 'kind',
              t ->> 'task_ref', t ->> 'question_html', t ->> 'risunok', (t ->> 'level')::smallint)
      returning id into v_task;
      insert into public.homework2_keys (task_id, answer, razbor)
      values (v_task, v_answer, case when jsonb_typeof(t -> 'razbor') = 'object' then t -> 'razbor' end);
      v_ntasks := v_ntasks + 1;
    end loop;
  end loop;
  if v_ntasks > 3000 then
    raise exception 'too_many_tasks' using errcode = 'check_violation';
  end if;
  return v_id;
end $$;

-- Опубликовать черновик: проверки, получатели из целей, задачи у всех.
-- Отложенная публикация — publish_at в будущем: ученики увидят ДЗ тогда.
create or replace function public.dz2_publish(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  h public.homework2;
  v_students uuid[];
  it public.homework2_items;
  s uuid;
begin
  select * into h from public.homework2 where id = p_id for update;
  if h.id is null or h.tutor_id <> auth.uid() or public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if public.kabinet_flag('dz_novye') is distinct from 'true'::jsonb then
    raise exception 'dz2_off: новая выдача ДЗ выключена' using errcode = 'check_violation';
  end if;
  if h.status <> 'draft' then
    raise exception 'not_draft: публикуется только черновик' using errcode = 'check_violation';
  end if;
  if h.due_at is not null and h.due_at <= greatest(now(), coalesce(h.publish_at, now())) then
    raise exception 'bad_due: дедлайн раньше публикации' using errcode = 'check_violation';
  end if;
  if h.solutions_when = 'after_due' and h.due_at is null then
    raise exception 'bad_due: решения «после дедлайна» — нужен дедлайн' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.homework2_items where homework_id = p_id) then
    raise exception 'no_items: в ДЗ нет заданий' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.homework2_items where homework_id = p_id and kind = 'chast2') then
    raise exception 'chast2_not_ready: задания второй части с фото появятся позже' using errcode = 'check_violation';
  end if;

  -- Получатели: ученики целевых классов, которых учитель ведёт сейчас, и отдельные ученики.
  select coalesce(array_agg(distinct u), '{}') into v_students from (
    select m.user_id as u
      from public.homework2_targets t join public.class_members m on m.class_id = t.class_id
     where t.homework_id = p_id and t.class_id is not null and public.is_my_student(m.user_id)
    union
    select t.student_id from public.homework2_targets t
     where t.homework_id = p_id and t.student_id is not null and public.is_my_student(t.student_id)) q;
  if cardinality(v_students) = 0 then
    raise exception 'no_recipients: некому выдать' using errcode = 'check_violation';
  end if;

  -- Задачи: у элементов с задачами — общие или у каждого ученика свои.
  for it in select * from public.homework2_items where homework_id = p_id and kind in ('opornye', 'trenazher') loop
    if h.individual then
      foreach s in array v_students loop
        if not exists (select 1 from public.homework2_tasks where item_id = it.id and student_id = s) then
          raise exception 'no_tasks: у ученика нет своих задач в элементе %', it.position using errcode = 'check_violation';
        end if;
      end loop;
    elsif not exists (select 1 from public.homework2_tasks where item_id = it.id and student_id is null) then
      raise exception 'no_tasks: в элементе % нет задач', it.position using errcode = 'check_violation';
    end if;
    if it.goal_kind <> 'all' and it.goal_n > (
         select count(*) from public.homework2_tasks where item_id = it.id
          and student_id is not distinct from (case when h.individual then v_students[1] end)) then
      raise exception 'bad_goal: цель больше запаса задач (элемент %)', it.position using errcode = 'check_violation';
    end if;
  end loop;

  insert into public.homework2_recipients (homework_id, user_id)
  select p_id, unnest(v_students) on conflict do nothing;
  update public.homework2 set status = 'published', published_at = now() where id = p_id;
  insert into public.homework2_events (homework_id, user_id, event)
  select p_id, unnest(v_students), 'published';
  return jsonb_build_object('id', p_id, 'recipients', cardinality(v_students));
end $$;

-- Копия ДЗ или шаблона в новый черновик («Повторить ДЗ для другого
-- класса», «ДЗ из шаблона»). Цели не копируются. Общие задачи копируются,
-- индивидуальные — нет: их браузер учителя соберёт заново для новых учеников.
create or replace function public.dz2_copy(p_id uuid, p_status text default 'draft')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  h public.homework2;
  v_new uuid;
  it public.homework2_items;
  v_item uuid;
begin
  select * into h from public.homework2 where id = p_id;
  if h.id is null or h.tutor_id <> auth.uid() or public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if p_status not in ('draft', 'template') then
    raise exception 'bad_settings' using errcode = 'check_violation';
  end if;
  insert into public.homework2 (tutor_id, status, title, note, after_due, hints_allowed, attempts_limit,
                                solutions_when, individual, kontrol, copied_from)
  values (auth.uid(), p_status, h.title, h.note, h.after_due, h.hints_allowed, h.attempts_limit, h.solutions_when,
          h.individual, h.kontrol, h.id)
  returning id into v_new;
  for it in select * from public.homework2_items where homework_id = p_id order by position loop
    insert into public.homework2_items (homework_id, position, kind, task_no, title, spec, goal_kind, goal_n,
                                        variant_work_id)
    values (v_new, it.position, it.kind, it.task_no, it.title, it.spec, it.goal_kind, it.goal_n, it.variant_work_id)
    returning id into v_item;
    with src as (
      select t.*, k.answer, k.razbor from public.homework2_tasks t join public.homework2_keys k on k.task_id = t.id
       where t.item_id = it.id and t.student_id is null
    ), ins as (
      insert into public.homework2_tasks (homework_id, item_id, position, kind, task_ref, question_html, risunok, level)
      select v_new, v_item, position, kind, task_ref, question_html, risunok, level from src
      returning id, position
    )
    insert into public.homework2_keys (task_id, answer, razbor)
    select ins.id, src.answer, src.razbor from ins join src on src.position = ins.position;
  end loop;
  return v_new;
end $$;

-- Изменить опубликованное ДЗ: текст, дедлайн, правила после дедлайна,
-- закрыть или открыть приём. Ученикам — событие «изменено».
-- p: {title?, note?, due_at?, after_due?, closed?: bool}
create or replace function public.dz2_edit(p_id uuid, p jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  h public.homework2;
  v_due timestamptz;
begin
  select * into h from public.homework2 where id = p_id for update;
  if h.id is null or h.tutor_id <> auth.uid() then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if h.status not in ('published', 'closed') then
    raise exception 'not_published' using errcode = 'check_violation';
  end if;
  v_due := case when p ? 'due_at' then nullif(p ->> 'due_at', '')::timestamptz else h.due_at end;
  if p ? 'due_at' and v_due is not null and v_due <= now() then
    raise exception 'bad_due: дедлайн уже прошёл' using errcode = 'check_violation';
  end if;
  update public.homework2 set
    title = coalesce(nullif(trim(p ->> 'title'), ''), title),
    note = case when p ? 'note' then nullif(trim(p ->> 'note'), '') else note end,
    due_at = v_due,
    after_due = coalesce(nullif(p ->> 'after_due', ''), after_due),
    status = case when (p ->> 'closed')::boolean is true then 'closed'
                  when (p ->> 'closed')::boolean is false then 'published' else status end,
    closed_at = case when (p ->> 'closed')::boolean is true then now()
                     when (p ->> 'closed')::boolean is false then null else closed_at end,
    edited_at = now()
  where id = p_id;
  insert into public.homework2_events (homework_id, user_id, event)
  select p_id, user_id, 'edited' from public.homework2_recipients where homework_id = p_id;
end $$;

-- Удалить черновик или шаблон. Опубликованное ДЗ не удаляется — закрывается.
create or replace function public.dz2_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.homework2
   where id = p_id and tutor_id = auth.uid() and status in ('draft', 'template');
  if not found then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
end $$;

/* ── Ученик: решать ДЗ ─────────────────────────────────────────── */

-- Строка получателя и ДЗ для ученика; иначе отказ.
create or replace function public.dz2_moe(p_id uuid)
returns public.homework2
language plpgsql stable security definer set search_path = ''
as $$
declare
  h public.homework2;
begin
  select h2.* into h from public.homework2 h2
    join public.homework2_recipients r on r.homework_id = h2.id and r.user_id = auth.uid()
   where h2.id = p_id;
  if h.id is null or not public.dz2_vidno(h) then
    raise exception 'not_your_homework' using errcode = 'insufficient_privilege';
  end if;
  return h;
end $$;

-- Можно ли сейчас решать: ДЗ не закрыто, не сдано, дедлайн не закрыл приём.
create or replace function public.dz2_mozhno_reshat(h public.homework2, r public.homework2_recipients)
returns text
language sql stable set search_path = ''
as $$
  select case
    when h.status = 'closed' then 'homework_closed'
    when r.submitted_at is not null then 'already_submitted'
    when h.due_at is not null and h.due_at < now() and h.after_due = 'closed' then 'due_passed'
    else null end
$$;

-- Прогресс ученика по элементу: {done, need, completed}.
create or replace function public.dz2_progress(p_item uuid, p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  it public.homework2_items;
  h public.homework2;
  v_total int;
  v_done int;
  v_streak int := 0;
  v_best int := 0;
  a record;
begin
  select * into it from public.homework2_items where id = p_item;
  select * into h from public.homework2 where id = it.homework_id;
  if it.kind in ('kartochki', 'teoriya') then
    return (select jsonb_build_object('done', coalesce(max(done), 0),
                                      'need', case when it.kind = 'teoriya' then 1
                                                   else coalesce((it.spec ->> 'kartochek')::int, 1) end,
                                      'completed', bool_or(completed_at is not null) is true)
              from public.homework2_marks where item_id = p_item and user_id = p_user);
  end if;
  if it.kind = 'variant' then
    return jsonb_build_object('done', (select count(*) from public.variant_attempts
                                        where work_id = it.variant_work_id and user_id = p_user
                                          and finished_at is not null),
                              'need', 1,
                              'completed', exists (select 1 from public.variant_attempts
                                                    where work_id = it.variant_work_id and user_id = p_user
                                                      and finished_at is not null));
  end if;
  if it.kind = 'chast2' then
    return jsonb_build_object('done', 0, 'need', 1, 'completed', false);
  end if;
  select count(*) into v_total from public.homework2_tasks t
   where t.item_id = p_item and (t.student_id is null or t.student_id = p_user)
     and (not h.individual or t.student_id = p_user);
  select count(*) into v_done from public.homework2_answers a2 join public.homework2_tasks t on t.id = a2.task_id
   where t.item_id = p_item and a2.user_id = p_user and a2.state <> 'open';
  if it.goal_kind = 'streak' then
    for a in select a2.state from public.homework2_answers a2 join public.homework2_tasks t on t.id = a2.task_id
              where t.item_id = p_item and a2.user_id = p_user and a2.state <> 'open'
              order by a2.updated_at loop
      v_streak := case when a.state = 'right' then v_streak + 1 else 0 end;
      v_best := greatest(v_best, v_streak);
    end loop;
    return jsonb_build_object('done', v_streak, 'need', it.goal_n, 'completed', v_best >= it.goal_n,
                              'closed', v_done, 'total', v_total);
  end if;
  return jsonb_build_object('done', v_done, 'need', coalesce(it.goal_n, v_total),
                            'completed', v_done >= coalesce(it.goal_n, v_total) and v_total > 0);
end $$;

-- Статус ученика по ДЗ: not_started, in_progress, submitted, late,
-- missed (дедлайн прошёл, не сдано), returned (на доработке).
create or replace function public.dz2_status(h public.homework2, r public.homework2_recipients)
returns text
language sql stable set search_path = ''
as $$
  select case
    when r.submitted_at is not null then case when r.late then 'late' else 'submitted' end
    when r.returned_at is not null then 'returned'
    when h.due_at is not null and h.due_at < now() then 'missed'
    when r.started_at is not null then 'in_progress'
    else 'not_started' end
$$;

-- «Мои домашки»: всё опубликованное ученику, с прогрессом.
create or replace function public.dz2_moi()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'id', h.id, 'title', h.title, 'due_at', h.due_at, 'after_due', h.after_due,
             'kontrol', h.kontrol, 'published_at', coalesce(h.publish_at, h.published_at),
             'status', public.dz2_status(h, r), 'submitted_at', r.submitted_at,
             'tutor_name', (select display_name from public.profiles where user_id = h.tutor_id),
             'items', (select count(*) from public.homework2_items where homework_id = h.id),
             'items_done', (select count(*) from public.homework2_items i
                             where i.homework_id = h.id
                               and (public.dz2_progress(i.id, auth.uid()) ->> 'completed')::boolean)))
           order by h.due_at nulls last, h.published_at desc)
      from public.homework2 h join public.homework2_recipients r on r.homework_id = h.id and r.user_id = auth.uid()
     where public.dz2_vidno(h)), '[]'::jsonb);
end $$;

-- Открыть ДЗ: элементы, задачи (без ключей), свой ход решения.
create or replace function public.dz2_open(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  h public.homework2 := public.dz2_moe(p_id);
  r public.homework2_recipients;
begin
  select * into r from public.homework2_recipients where homework_id = p_id and user_id = auth.uid();
  return jsonb_strip_nulls(jsonb_build_object(
    'id', h.id, 'title', h.title, 'note', h.note, 'due_at', h.due_at, 'after_due', h.after_due,
    'hints_allowed', h.hints_allowed, 'attempts_limit', h.attempts_limit, 'solutions_when', h.solutions_when,
    'kontrol', h.kontrol, 'status', public.dz2_status(h, r), 'zakryto', public.dz2_mozhno_reshat(h, r),
    'return_comment', r.return_comment, 'comment', r.comment,
    'items', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', i.id, 'position', i.position, 'kind', i.kind, 'task_no', i.task_no, 'title', i.title,
               'spec', i.spec, 'goal_kind', i.goal_kind, 'goal_n', i.goal_n, 'variant_work_id', i.variant_work_id,
               'progress', public.dz2_progress(i.id, auth.uid()),
               'tasks', (select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                                  'id', t.id, 'position', t.position, 'kind', t.kind, 'task_ref', t.task_ref,
                                  'question_html', t.question_html, 'risunok', t.risunok,
                                  'state', coalesce(a.state, 'open'), 'attempts', coalesce(a.attempts, 0),
                                  'hint_steps', coalesce(a.hint_steps, 0),
                                  'answers', a.entries,
                                  'solution', case when public.dz2_reshenie_mozhno(h, a.state)
                                                   then (select jsonb_build_object('answer', k.answer, 'razbor', k.razbor)
                                                           from public.homework2_keys k where k.task_id = t.id) end))
                                order by t.position)
                           from public.homework2_tasks t
                           left join public.homework2_answers a on a.task_id = t.id and a.user_id = auth.uid()
                          where t.item_id = i.id
                            and (case when h.individual then t.student_id = auth.uid() else t.student_id is null end))))
             order by i.position)
        from public.homework2_items i where i.homework_id = p_id), '[]'::jsonb)));
end $$;

-- Журнал решения задач (этап 1): проверка в ДЗ — запись с verified = true.
create or replace function public.dz2_v_zhurnal(t public.homework2_tasks, a public.homework2_answers,
                                                p_item_task_no int)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.kabinet_flag('zhurnal') is distinct from 'true'::jsonb or not public.zhurnal_razdel_ok(p_item_task_no) then
    return;
  end if;
  insert into public.zhurnal_zadachi as z (user_id, id, task_no, kind, task_ref, level, place, place_ref, outcome,
                                           verified, attempts_n, hint_steps, active_ms, total_ms, started_at, closed_at)
  values (a.user_id, t.id, p_item_task_no, t.kind, t.task_ref, t.level, 'dz', t.homework_id::text,
          case a.state when 'open' then null
                       when 'right' then case when a.attempts > 1 then 'wrong'
                                              when a.hint_steps > 0 then 'hinted' else 'right' end
                       else a.state end,
          true, a.attempts, a.hint_steps, least(a.seconds, 14400) * 1000, least(a.seconds, 86400) * 1000,
          now() - make_interval(secs => a.seconds), case when a.state <> 'open' then now() end)
  on conflict (user_id, id) do update set
    outcome = coalesce(z.outcome, excluded.outcome), attempts_n = excluded.attempts_n,
    hint_steps = excluded.hint_steps, active_ms = greatest(z.active_ms, excluded.active_ms),
    total_ms = greatest(z.total_ms, excluded.total_ms), closed_at = coalesce(z.closed_at, excluded.closed_at),
    updated_at = now();
end $$;

-- Проверить ответ. Возвращает:
--   {kind: 'closed', state} | {kind: 'format'} | {kind: 'fractionRight', decimal}
--   {kind: 'right'|'wrong', state, attempts, left, solution}
create or replace function public.dz2_check(p_task uuid, p_answer text, p_seconds int default 0)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework2_tasks;
  h public.homework2;
  r public.homework2_recipients;
  k public.homework2_keys;
  a public.homework2_answers;
  v_res jsonb;
  v_right boolean;
  v_why text;
  v_task_no int;
begin
  select * into t from public.homework2_tasks where id = p_task;
  select * into h from public.homework2 where id = t.homework_id;
  select * into r from public.homework2_recipients where homework_id = t.homework_id and user_id = v_uid for update;
  if v_uid is null or t.id is null or r.user_id is null or not public.dz2_vidno(h)
     or (case when h.individual then t.student_id is distinct from v_uid else t.student_id is not null end) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed' using errcode = 'insufficient_privilege';
  end if;
  v_why := public.dz2_mozhno_reshat(h, r);
  if v_why is not null then
    raise exception '%', v_why using errcode = 'check_violation';
  end if;
  update public.homework2_recipients set started_at = coalesce(started_at, now())
   where homework_id = t.homework_id and user_id = v_uid;
  insert into public.homework2_answers (task_id, user_id, homework_id) values (t.id, v_uid, t.homework_id)
  on conflict do nothing;
  select * into a from public.homework2_answers where task_id = t.id and user_id = v_uid for update;
  if a.state <> 'open' then
    return jsonb_build_object('kind', 'closed', 'state', a.state);
  end if;
  select * into k from public.homework2_keys where task_id = t.id;
  v_res := public.dz2_sverit(p_answer, k.answer);
  if v_res ->> 'kind' in ('format', 'fractionRight') then
    update public.homework2_answers
       set entries = case when jsonb_array_length(entries) < 20 then entries || jsonb_build_array(jsonb_build_object(
                            'a', left(coalesce(p_answer, ''), 40), 'ok', false,
                            'vid', case when v_res ->> 'kind' = 'format' then 'format' else 'fraction' end, 'at', now()))
                          else entries end,
           updated_at = now()
     where task_id = t.id and user_id = v_uid;
    return v_res;
  end if;
  v_right := v_res ->> 'kind' = 'right';
  update public.homework2_answers
     set attempts = attempts + 1,
         entries = case when jsonb_array_length(entries) < 20 then entries || jsonb_build_array(jsonb_build_object(
                          'a', left(coalesce(p_answer, ''), 40), 'ok', v_right, 'vid', 'answer', 'at', now()))
                        else entries end,
         seconds = least(seconds + least(greatest(coalesce(p_seconds, 0), 0), 3600), 604800),
         state = case when v_right then 'right'
                      when h.attempts_limit is not null and attempts + 1 >= h.attempts_limit then 'wrong'
                      else 'open' end,
         updated_at = now()
   where task_id = t.id and user_id = v_uid
  returning * into a;
  select task_no into v_task_no from public.homework2_items where id = t.item_id;
  perform public.dz2_v_zhurnal(t, a, v_task_no);
  return jsonb_build_object(
    'kind', case when v_right then 'right' else 'wrong' end, 'state', a.state, 'attempts', a.attempts,
    'left', case when h.attempts_limit is null then null else greatest(h.attempts_limit - a.attempts, 0) end,
    'solution', case when public.dz2_reshenie_mozhno(h, a.state)
                     then jsonb_build_object('answer', k.answer, 'razbor', k.razbor) end);
end $$;

-- Подсказка: шаг n разбора (n с 1), если подсказки разрешены. Шаг считается.
create or replace function public.dz2_hint(p_task uuid, p_step int)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework2_tasks;
  h public.homework2;
  r public.homework2_recipients;
  v_shag jsonb;
  v_why text;
begin
  select * into t from public.homework2_tasks where id = p_task;
  select * into h from public.homework2 where id = t.homework_id;
  select * into r from public.homework2_recipients where homework_id = t.homework_id and user_id = v_uid;
  if v_uid is null or t.id is null or r.user_id is null or not public.dz2_vidno(h)
     or (case when h.individual then t.student_id is distinct from v_uid else t.student_id is not null end) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not h.hints_allowed then
    raise exception 'not_allowed: подсказки в этом ДЗ выключены' using errcode = 'check_violation';
  end if;
  v_why := public.dz2_mozhno_reshat(h, r);
  if v_why is not null then
    raise exception '%', v_why using errcode = 'check_violation';
  end if;
  if p_step < 1 or p_step > 20 then
    raise exception 'bad_step' using errcode = 'check_violation';
  end if;
  select (k.razbor -> 'shagi') -> (p_step - 1) into v_shag from public.homework2_keys k where k.task_id = t.id;
  if v_shag is null then
    return jsonb_build_object('step', null);
  end if;
  insert into public.homework2_answers (task_id, user_id, homework_id) values (t.id, v_uid, t.homework_id)
  on conflict do nothing;
  update public.homework2_answers set hint_steps = greatest(hint_steps, p_step), updated_at = now()
   where task_id = t.id and user_id = v_uid and state = 'open';
  update public.homework2_recipients set started_at = coalesce(started_at, now())
   where homework_id = t.homework_id and user_id = v_uid;
  return jsonb_build_object('step', v_shag);
end $$;

-- Карточки и теория: отметить, сколько пройдено / «прочитано».
create or replace function public.dz2_mark(p_item uuid, p_done int)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  it public.homework2_items;
  h public.homework2;
  r public.homework2_recipients;
  v_need int;
  v_why text;
begin
  select * into it from public.homework2_items where id = p_item;
  select * into h from public.homework2 where id = it.homework_id;
  select * into r from public.homework2_recipients where homework_id = it.homework_id and user_id = v_uid;
  if v_uid is null or it.id is null or r.user_id is null or not public.dz2_vidno(h)
     or it.kind not in ('kartochki', 'teoriya') then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed' using errcode = 'insufficient_privilege';
  end if;
  v_why := public.dz2_mozhno_reshat(h, r);
  if v_why is not null then
    raise exception '%', v_why using errcode = 'check_violation';
  end if;
  v_need := case when it.kind = 'teoriya' then 1 else coalesce((it.spec ->> 'kartochek')::int, 1) end;
  insert into public.homework2_marks as m (item_id, user_id, homework_id, done, completed_at)
  values (p_item, v_uid, it.homework_id, least(greatest(p_done, 0), 500),
          case when p_done >= v_need then now() end)
  on conflict (item_id, user_id) do update set
    done = greatest(m.done, excluded.done), completed_at = coalesce(m.completed_at, excluded.completed_at);
  update public.homework2_recipients set started_at = coalesce(started_at, now())
   where homework_id = it.homework_id and user_id = v_uid;
  return public.dz2_progress(p_item, v_uid);
end $$;

-- «Сдать». После дедлайна при late_ok — с пометкой «с опозданием».
create or replace function public.dz2_submit(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  h public.homework2 := public.dz2_moe(p_id);
  r public.homework2_recipients;
  v_why text;
  v_late boolean;
begin
  select * into r from public.homework2_recipients where homework_id = p_id and user_id = auth.uid() for update;
  v_why := public.dz2_mozhno_reshat(h, r);
  if v_why is not null then
    raise exception '%', v_why using errcode = 'check_violation';
  end if;
  v_late := h.due_at is not null and h.due_at < now();
  update public.homework2_recipients
     set submitted_at = now(), late = v_late, started_at = coalesce(started_at, now())
   where homework_id = p_id and user_id = auth.uid();
  insert into public.homework2_events (homework_id, user_id, event) values (p_id, h.tutor_id, 'submitted');
  return jsonb_build_object('status', case when v_late then 'late' else 'submitted' end);
end $$;

/* ── Учитель: итоги, возврат, комментарий ──────────────────────── */

-- Итоги ДЗ: ученики × элементы со статусами и прогрессом.
create or replace function public.dz2_itogi(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  h public.homework2;
begin
  select * into h from public.homework2 where id = p_id;
  if h.id is null or h.tutor_id <> auth.uid() then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'id', h.id, 'title', h.title, 'status', h.status, 'due_at', h.due_at, 'publish_at', h.publish_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'position', i.position, 'kind', i.kind,
                                                           'task_no', i.task_no, 'title', i.title,
                                                           'goal_kind', i.goal_kind, 'goal_n', i.goal_n)
                                         order by i.position)
                         from public.homework2_items i where i.homework_id = p_id), '[]'::jsonb),
    'ucheniki', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', r.user_id,
               'name', (select coalesce(ts.alias, p.display_name) from public.profiles p
                          left join public.tutor_students ts on ts.tutor_id = auth.uid() and ts.user_id = p.user_id
                         where p.user_id = r.user_id),
               'status', public.dz2_status(h, r), 'submitted_at', r.submitted_at, 'returned_at', r.returned_at,
               'comment', r.comment,
               'seconds', (select coalesce(sum(seconds), 0) from public.homework2_answers
                            where homework_id = p_id and user_id = r.user_id),
               'progress', (select jsonb_object_agg(i.id, public.dz2_progress(i.id, r.user_id))
                              from public.homework2_items i where i.homework_id = p_id)))
             order by r.assigned_at, r.user_id)
        from public.homework2_recipients r where r.homework_id = p_id), '[]'::jsonb));
end $$;

-- Ответы ученика по ДЗ: задача, ответы, верный ответ, время, подсказки.
create or replace function public.dz2_otvety(p_id uuid, p_student uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  h public.homework2;
begin
  select * into h from public.homework2 where id = p_id;
  if h.id is null or h.tutor_id <> auth.uid()
     or not exists (select 1 from public.homework2_recipients where homework_id = p_id and user_id = p_student) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'id', t.id, 'item_id', t.item_id, 'position', t.position, 'kind', t.kind, 'task_ref', t.task_ref,
             'question_html', t.question_html, 'risunok', t.risunok, 'answer_key', k.answer,
             'state', coalesce(a.state, 'open'), 'attempts', coalesce(a.attempts, 0),
             'hint_steps', coalesce(a.hint_steps, 0), 'seconds', coalesce(a.seconds, 0), 'answers', a.entries))
           order by i.position, t.position)
      from public.homework2_tasks t
      join public.homework2_items i on i.id = t.item_id
      join public.homework2_keys k on k.task_id = t.id
      left join public.homework2_answers a on a.task_id = t.id and a.user_id = p_student
     where t.homework_id = p_id
       and (case when h.individual then t.student_id = p_student else t.student_id is null end)), '[]'::jsonb);
end $$;

-- «Вернуть на доработку»: сдача снимается, ученику — комментарий и событие.
create or replace function public.dz2_vernut(p_id uuid, p_student uuid, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.dz2_owns(p_id) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  update public.homework2_recipients
     set submitted_at = null, late = false, returned_at = now(), return_comment = nullif(trim(p_comment), '')
   where homework_id = p_id and user_id = p_student and submitted_at is not null;
  if not found then
    raise exception 'not_submitted: ученик ещё не сдал' using errcode = 'check_violation';
  end if;
  insert into public.homework2_events (homework_id, user_id, event) values (p_id, p_student, 'returned');
end $$;

create or replace function public.dz2_comment(p_id uuid, p_student uuid, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.dz2_owns(p_id) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  update public.homework2_recipients set comment = nullif(trim(p_comment), ''), comment_at = now()
   where homework_id = p_id and user_id = p_student;
  if not found then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  insert into public.homework2_events (homework_id, user_id, event) values (p_id, p_student, 'commented');
end $$;

-- Список ДЗ учителя: черновики, шаблоны, выданные — со счётом «сдали N из M».
create or replace function public.dz2_spisok()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'id', h.id, 'title', h.title, 'status', h.status, 'publish_at', h.publish_at, 'due_at', h.due_at,
             'created_at', h.created_at,
             'items', (select count(*) from public.homework2_items where homework_id = h.id),
             'recipients', (select count(*) from public.homework2_recipients where homework_id = h.id),
             'submitted', (select count(*) from public.homework2_recipients
                            where homework_id = h.id and submitted_at is not null)))
           order by h.created_at desc)
      from public.homework2 h where h.tutor_id = auth.uid()), '[]'::jsonb);
end $$;

/* ── Права на функции ──────────────────────────────────────────── */

revoke execute on function public.dz2_razdel_ok(int), public.dz2_owns(uuid), public.dz2_vidno(public.homework2),
  public.dz2_reshenie_mozhno(public.homework2, text), public.dz2_sverit(text, text), public.dz2_moe(uuid),
  public.dz2_mozhno_reshat(public.homework2, public.homework2_recipients), public.dz2_progress(uuid, uuid),
  public.dz2_status(public.homework2, public.homework2_recipients),
  public.dz2_v_zhurnal(public.homework2_tasks, public.homework2_answers, int)
  from public, anon, authenticated;

revoke execute on function public.dz2_save(jsonb), public.dz2_publish(uuid), public.dz2_copy(uuid, text),
  public.dz2_edit(uuid, jsonb), public.dz2_delete(uuid), public.dz2_moi(), public.dz2_open(uuid),
  public.dz2_check(uuid, text, int), public.dz2_hint(uuid, int), public.dz2_mark(uuid, int), public.dz2_submit(uuid),
  public.dz2_itogi(uuid), public.dz2_otvety(uuid, uuid), public.dz2_vernut(uuid, uuid, text),
  public.dz2_comment(uuid, uuid, text), public.dz2_spisok()
  from public, anon;
grant execute on function public.dz2_save(jsonb), public.dz2_publish(uuid), public.dz2_copy(uuid, text),
  public.dz2_edit(uuid, jsonb), public.dz2_delete(uuid), public.dz2_moi(), public.dz2_open(uuid),
  public.dz2_check(uuid, text, int), public.dz2_hint(uuid, int), public.dz2_mark(uuid, int), public.dz2_submit(uuid),
  public.dz2_itogi(uuid), public.dz2_otvety(uuid, uuid), public.dz2_vernut(uuid, uuid, text),
  public.dz2_comment(uuid, uuid, text), public.dz2_spisok()
  to authenticated;
