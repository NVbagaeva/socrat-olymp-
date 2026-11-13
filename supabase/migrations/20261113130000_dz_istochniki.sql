-- ДЗ из трёх источников: карточки, опорные задачи, тренажёр.
-- Контракт — docs/kabinet-dz-istochniki.md.
--
-- Домашнее задание теперь — список пунктов (homework_parts) по порядку.
-- Пункт — то, что репетитор положил в ДЗ: набор карточек, опорная
-- задача (или блок), задача тренажёра или правило «тип × количество».
-- Внутри пункта — единицы, на которые отвечает ученик: прежние
-- homework_tasks (карточка, задача). У набора карточек их несколько, у
-- правила тренажёра — по количеству, у задачи — одна. Ключ, проверка
-- ответа и ход решения остаются прежними (homework_keys,
-- homework_check, homework_answers), добавлены виды ответа:
--   number — число по правилам бланка ЕГЭ (задачи, карточка «вычисление»);
--   choice — номер варианта (опорные №8 «плюс / минус»);
--   verno  — «верно / неверно» (карточка-утверждение): da / net;
--   self   — самооценка «Знаю / Повторить» (карточка-формула): ответа нет,
--            отметку ставит homework_mark и видит репетитор.
-- У карточек с проверкой одна попытка, оборот открывается сразу после
-- ответа; настройка попыток ДЗ действует на задачи.
--
-- ДЗ этапа 3 (20261111120000_dz.sql) переносятся здесь же: каждая
-- позиция ДЗ становится пунктом тренажёра, задачи, ключи и ход решения
-- не трогаются.
--
-- Проверка ответа — одна функция check_ege_answer; ту же логику
-- повторяют lib/otvet/proverkaDz.ts и заглушка проверок сайта, все три
-- сверяются таблицей app/src/lib/otvet/proverkaDzCases.json.
--
-- Ученики репетитора решают выданное ДЗ бесплатно, при любом тарифе:
-- функции ниже проверяют только «получатель ли», а не тариф.

/* ── Проверка ответа ───────────────────────────────────────────── */

-- Ответ ученика против верного (нормальная запись). Возвращает
--   {kind: 'format'}                 — неверная запись, попытка не тратится;
--   {kind: 'fractionRight', decimal} — дробь с верным значением, попытка не тратится;
--   {kind: 'right' | 'wrong', norm}  — попытка; norm — нормальная запись
--                                      введённого (у дроби — null).
create or replace function public.check_ege_answer(p_input text, p_answer text)
returns jsonb
language plpgsql immutable set search_path = ''
as $$
declare
  -- Пробелы по краям — как в normalize_ege_answer и lib/otvet.
  v_sp constant text := E'[[:space:]   ]';
  v_raw text;
  v text;
  m text[];
  v_q numeric;
  v_norm text;
begin
  v_raw := regexp_replace(coalesce(p_input, ''), '^' || v_sp || '+|' || v_sp || '+$', '', 'g');
  if char_length(v_raw) > 100 then
    return jsonb_build_object('kind', 'format');
  end if;
  -- Минусы всех видов — «-», дробная черта «∕» и «÷» — «/».
  v := translate(v_raw, E'−‒–—‐‑﹣－∕÷', '--------//');
  m := regexp_match(v, '^(-?)' || v_sp || '*([0-9]+(?:[.,][0-9]+)?)' || v_sp || '*/'
                       || v_sp || '*([0-9]+(?:[.,][0-9]+)?)$');
  if m is not null then
    -- Обыкновенная дробь p/q: сверка по значению, точно (p = ответ · q).
    v_q := replace(m[3], ',', '.')::numeric;
    if v_q = 0 then
      return jsonb_build_object('kind', 'format');
    end if;
    if (case when m[1] = '-' then -1 else 1 end) * replace(m[2], ',', '.')::numeric
       = p_answer::numeric * v_q then
      return jsonb_build_object('kind', 'fractionRight', 'decimal', p_answer);
    end if;
    return jsonb_build_object('kind', 'wrong', 'norm', null);
  end if;
  v_norm := public.normalize_ege_answer(v_raw);
  if v_norm is null then
    return jsonb_build_object('kind', 'format');
  end if;
  return jsonb_build_object('kind', case when v_norm = p_answer then 'right' else 'wrong' end,
                            'norm', v_norm);
end $$;

/* ── Настройки ДЗ ──────────────────────────────────────────────── */

alter table public.homework
  -- «Без подсказок»: ни пошаговых подсказок, ни «Запомни», ни примера.
  -- Разбор после ответа — по solutions_when, этот переключатель его не трогает.
  add column no_hints boolean not null default false,
  -- Разделы ДЗ (номера заданий ЕГЭ) по порядку пунктов. Пусто — ДЗ
  -- пробного кабинета (homework_items). task_no остаётся первым разделом.
  add column sections smallint[]
    check (sections is null or (cardinality(sections) between 1 and 20 and 0 < all (sections) and 21 > all (sections)));

/* ── Пункты ДЗ ─────────────────────────────────────────────────── */

create table public.homework_parts (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  position smallint not null check (position between 1 and 60),
  -- Откуда пункт: карточки, опорные задачи, тренажёр.
  source text not null check (source in ('kartochki', 'opornye', 'trenazher')),
  task_no smallint not null references public.ege_tasks (no),
  -- Что выбрано: «8.A×3», «7:P05|F012», «7:kvadratnye», «8:stepeni-korni|P8-1-03».
  ref text not null check (char_length(ref) between 1 and 200),
  -- Название пункта, набранное KaTeX: «Квадратные уравнения», тип задачи.
  title_html text not null check (char_length(title_html) between 1 and 4000),
  -- Правило, по которому собран пункт: {kind, count, seed} у тренажёра,
  -- {cards: [...]} у карточек, {block, tasks, seed} у опорных. Зерно
  -- зафиксировано при выдаче: ученик и печать видят один набор.
  rule jsonb not null default '{}'
    check (jsonb_typeof(rule) = 'object' and octet_length(rule::text) <= 20000),
  -- У каждого ученика свои аналоги (homework_tasks.student_id).
  per_student boolean not null default false,
  -- Комментарий репетитора к пункту.
  comment text check (char_length(comment) <= 1000),
  unique (homework_id, position),
  unique (id, homework_id)
);
create index homework_parts_homework_idx on public.homework_parts (homework_id, position);

/* ── Единицы пункта: задачи и карточки ─────────────────────────── */

alter table public.homework_tasks
  add column part_id uuid,
  add column answer_kind text not null default 'number'
    check (answer_kind in ('number', 'choice', 'verno', 'self')),
  -- Что ещё видит ученик: подсказки, варианты выбора, оборот карточки
  -- для самооценки, чертёж. Ответа здесь нет никогда.
  add column view jsonb not null default '{}'
    check (jsonb_typeof(view) = 'object' and octet_length(view::text) <= 400000);
-- Позиция — порядок у ученика по всему ДЗ: карточек в наборе бывает много.
alter table public.homework_tasks drop constraint homework_tasks_position_check;
alter table public.homework_tasks add constraint homework_tasks_position_check
  check (position between 1 and 3000);
alter table public.homework_tasks drop constraint homework_tasks_kind_check;
alter table public.homework_tasks add constraint homework_tasks_kind_check
  check (char_length(kind) between 1 and 64);

alter table public.homework_keys drop constraint homework_keys_answer_check;
alter table public.homework_keys add constraint homework_keys_answer_check
  check (answer ~ '^-?[0-9]+(\.[0-9]+)?$' or answer in ('da', 'net'));
alter table public.homework_keys drop constraint homework_keys_ref_check;
alter table public.homework_keys add constraint homework_keys_ref_check
  check (char_length(ref) between 1 and 200);

-- Отметки самооценки: known — «Знаю», repeat — «Повторить».
alter table public.homework_answers drop constraint homework_answers_state_check;
alter table public.homework_answers add constraint homework_answers_state_check
  check (state in ('open', 'right', 'wrong', 'revealed', 'known', 'repeat'));

/* ── Перенос ДЗ этапа 3 ────────────────────────────────────────── */

-- Каждая позиция ДЗ — пункт тренажёра. У индивидуального ДЗ позиция k
-- у всех учеников — один пункт (по аналогу каждому). Название — тип
-- задачи, если он у всех одинаковый, иначе «Задача k». Строки, которые
-- уже в пунктах, не трогаются: повторный запуск ничего не меняет.
do $$
declare
  h record;
  p record;
  v_part uuid;
  v_title text;
begin
  for h in
    select hw.id, hw.task_no, hw.individual from public.homework hw
     where exists (select 1 from public.homework_tasks t where t.homework_id = hw.id and t.part_id is null)
  loop
    for p in
      select t.position, array_agg(distinct t.kind) as kinds
        from public.homework_tasks t
       where t.homework_id = h.id and t.part_id is null
       group by t.position order by t.position
    loop
      if cardinality(p.kinds) = 1 then
        select coalesce(bp.title, p.kinds[1]) into v_title
          from (select 1) x
          left join public.bank_prototypes bp on bp.code = h.task_no::text || ':' || p.kinds[1];
      else
        v_title := 'Задача ' || p.position;
      end if;
      insert into public.homework_parts (homework_id, position, source, task_no, ref, title_html, rule, per_student)
      values (h.id, p.position, 'trenazher', coalesce(h.task_no, 8),
              case when cardinality(p.kinds) = 1 then h.task_no::text || ':' || p.kinds[1]
                   else 'etap3:' || p.position end,
              v_title, jsonb_build_object('etap3', true), h.individual)
      on conflict (homework_id, position) do update set position = excluded.position
      returning id into v_part;
      update public.homework_tasks set part_id = v_part
       where homework_id = h.id and position = p.position and part_id is null;
    end loop;
    update public.homework set sections = array[coalesce(task_no, 8)] where id = h.id and sections is null;
  end loop;
end $$;

alter table public.homework_tasks alter column part_id set not null;
alter table public.homework_tasks add constraint homework_tasks_part_fkey
  foreign key (part_id, homework_id) references public.homework_parts (id, homework_id) on delete cascade;
create index homework_tasks_part_idx on public.homework_tasks (part_id);

/* ── Выдать ────────────────────────────────────────────────────── */

-- p: {title, note, due_at, class_id, students: [uuid],
--     attempts_limit, solutions_when, show_memo, show_example, no_hints,
--     origin, parent_id,
--     parts: [{source, task_no, ref, title_html, rule, per_student, comment,
--              tasks: [{student_id | null, kind, ref, answer_kind,
--                       question_html, view, answer, razbor, source}]}]}
-- Пункты идут по порядку массива. Задачи пункта per_student — у каждого
-- получателя свои (student_id обязателен, у каждого должны быть), у
-- остальных — общие (student_id = null). Ответ: number и choice — в
-- нормальной записи ЕГЭ, verno — da / net, self — нет ответа и ключа.
-- Предел — 60 на ученика: задача — одна, набор карточек — один пункт.
create or replace function public.issue_homework_parts(p jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_class uuid := nullif(p ->> 'class_id', '')::uuid;
  v_due timestamptz := nullif(p ->> 'due_at', '')::timestamptz;
  v_limit smallint := nullif(p ->> 'attempts_limit', '')::smallint;
  v_when text := coalesce(nullif(p ->> 'solutions_when', ''), 'after_submit');
  v_origin text := coalesce(nullif(p ->> 'origin', ''), 'kabinet');
  v_parent uuid := nullif(p ->> 'parent_id', '')::uuid;
  v_no_hints boolean := coalesce((p ->> 'no_hints')::boolean, false);
  v_parts jsonb := p -> 'parts';
  v_students uuid[];
  v_student uuid;
  v_part jsonb;
  v_part_id uuid;
  v_part_pos int := 0;
  v_source text;
  v_task_no smallint;
  v_per boolean;
  v_task jsonb;
  v_task_id uuid;
  v_kind text;
  v_ak text;
  v_answer text;
  v_view jsonb;
  v_sections smallint[] := '{}';
  -- Счётчик позиций: общие задачи и задачи каждого ученика.
  v_pos jsonb := '{}';
  v_key text;
  v_n int;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden: ДЗ выдаёт репетитор' using errcode = 'insufficient_privilege';
  end if;
  if v_class is not null and not public.owns_class(v_class) then
    raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
  end if;
  if v_due is not null and v_due <= now() then
    raise exception 'bad_due: срок уже прошёл' using errcode = 'check_violation';
  end if;
  if (v_limit is not null and v_limit not in (1, 2))
     or v_when not in ('instant', 'after_submit', 'after_due')
     or v_origin not in ('kabinet', 'generator', 'opornye', 'trenazher', 'oshibki') then
    raise exception 'bad_settings: попытки 1, 2 или без ограничения; решения instant, after_submit или after_due'
      using errcode = 'check_violation';
  end if;
  if v_when = 'after_due' and v_due is null then
    raise exception 'bad_due: решения «после срока» — нужен срок' using errcode = 'check_violation';
  end if;
  if v_parent is not null and not public.owns_homework(v_parent) then
    raise exception 'bad_parent: работа над ошибками — только по своему ДЗ' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(v_parts) is distinct from 'array' or jsonb_array_length(v_parts) = 0 then
    raise exception 'no_tasks: в ДЗ нет пунктов' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(v_parts) > 60 then
    raise exception 'too_many_tasks: не больше 60 пунктов' using errcode = 'check_violation';
  end if;

  -- Получатели — как в issue_homework_tasks.
  if jsonb_typeof(p -> 'students') = 'array' then
    select coalesce(array_agg(distinct s::uuid), '{}') into v_students
      from jsonb_array_elements_text(p -> 'students') s;
  else
    v_students := '{}';
  end if;
  if cardinality(v_students) = 0 and v_class is not null then
    select coalesce(array_agg(m.user_id), '{}') into v_students
      from public.class_members m
     where m.class_id = v_class and public.is_my_student(m.user_id);
  else
    foreach v_student in array v_students loop
      if not public.is_my_student(v_student) then
        raise exception 'not_your_student' using errcode = 'insufficient_privilege';
      end if;
      if v_class is not null and not exists (
        select 1 from public.class_members where class_id = v_class and user_id = v_student) then
        raise exception 'not_in_class: ученик не в этом классе' using errcode = 'check_violation';
      end if;
    end loop;
  end if;
  if cardinality(v_students) = 0 then
    raise exception 'no_recipients: некому выдать' using errcode = 'check_violation';
  end if;

  -- Номера заданий — до записи (у ДЗ первый номер — task_no).
  if exists (select 1 from jsonb_array_elements(v_parts) pt
              where not exists (select 1 from public.ege_tasks e
                                 where e.no::text = pt ->> 'task_no')) then
    raise exception 'bad_task_no: нет такого задания ЕГЭ' using errcode = 'check_violation';
  end if;

  -- Разделы и предел 60 на ученика — до записи.
  foreach v_student in array v_students loop
    select coalesce(sum(case when pt ->> 'source' = 'kartochki' then 1
                             else (select count(*) from jsonb_array_elements(pt -> 'tasks') t
                                    where nullif(t ->> 'student_id', '') is null
                                       or (t ->> 'student_id')::uuid = v_student) end), 0)
      into v_n from jsonb_array_elements(v_parts) pt;
    if v_n > 60 then
      raise exception 'too_many_tasks: не больше 60 задач на ученика (набор карточек — одна)'
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into public.homework (tutor_id, class_id, title, note, due_at, task_no, attempts_limit,
                               solutions_when, show_memo, show_example, no_hints, individual,
                               origin, parent_id)
  values (auth.uid(), v_class, trim(p ->> 'title'), nullif(trim(p ->> 'note'), ''), v_due,
          nullif(v_parts -> 0 ->> 'task_no', '')::smallint, v_limit, v_when,
          not v_no_hints and coalesce((p ->> 'show_memo')::boolean, false),
          not v_no_hints and coalesce((p ->> 'show_example')::boolean, false),
          v_no_hints,
          exists (select 1 from jsonb_array_elements(v_parts) pt where coalesce((pt ->> 'per_student')::boolean, false)),
          v_origin, v_parent)
  returning id into v_id;

  insert into public.homework_recipients (homework_id, user_id)
  select v_id, unnest(v_students);

  for v_part in select * from jsonb_array_elements(v_parts) loop
    v_part_pos := v_part_pos + 1;
    v_source := v_part ->> 'source';
    v_task_no := nullif(v_part ->> 'task_no', '')::smallint;
    v_per := coalesce((v_part ->> 'per_student')::boolean, false);
    if v_source is null or v_source not in ('kartochki', 'opornye', 'trenazher') then
      raise exception 'bad_source: пункт % — карточки, опорные или тренажёр', v_part_pos
        using errcode = 'check_violation';
    end if;
    if v_task_no is null or not exists (select 1 from public.ege_tasks where no = v_task_no) then
      raise exception 'bad_task_no: нет такого задания ЕГЭ (пункт %)', v_part_pos using errcode = 'check_violation';
    end if;
    if v_source = 'kartochki' and v_per then
      raise exception 'bad_part: карточки — одни на всех (пункт %)', v_part_pos using errcode = 'check_violation';
    end if;
    if jsonb_typeof(v_part -> 'tasks') is distinct from 'array' or jsonb_array_length(v_part -> 'tasks') = 0 then
      raise exception 'no_tasks: в пункте % нет задач', v_part_pos using errcode = 'check_violation';
    end if;
    if not (v_task_no = any (v_sections)) then
      v_sections := v_sections || v_task_no;
    end if;

    insert into public.homework_parts (homework_id, position, source, task_no, ref, title_html, rule,
                                       per_student, comment)
    values (v_id, v_part_pos, v_source, v_task_no, v_part ->> 'ref', v_part ->> 'title_html',
            coalesce(v_part -> 'rule', '{}'), v_per, nullif(trim(v_part ->> 'comment'), ''))
    returning id into v_part_id;

    for v_task in select * from jsonb_array_elements(v_part -> 'tasks') loop
      v_student := nullif(v_task ->> 'student_id', '')::uuid;
      v_kind := v_task ->> 'kind';
      v_ak := coalesce(nullif(v_task ->> 'answer_kind', ''), 'number');
      v_answer := v_task ->> 'answer';
      v_view := coalesce(v_task -> 'view', '{}');
      if v_per then
        if v_student is null or not (v_student = any (v_students)) then
          raise exception 'bad_task_student: у задачи «каждому свои» нет получателя (пункт %)', v_part_pos
            using errcode = 'check_violation';
        end if;
      elsif v_student is not null then
        raise exception 'bad_task_student: в общем пункте задачи без ученика (пункт %)', v_part_pos
          using errcode = 'check_violation';
      end if;
      -- Карточки — по своим видам ответа, задачи — число или выбор.
      if (v_source = 'kartochki' and v_ak not in ('number', 'verno', 'self'))
         or (v_source <> 'kartochki' and v_ak not in ('number', 'choice')) then
        raise exception 'bad_answer_kind: % в пункте %', v_ak, v_part_pos using errcode = 'check_violation';
      end if;
      if v_source = 'trenazher' and not exists (
        select 1 from public.bank_prototypes
         where task_no = v_task_no and code = v_task_no::text || ':' || v_kind and retired_at is null) then
        raise exception 'bad_kind: нет прототипа % в задании %', v_kind, v_task_no using errcode = 'check_violation';
      end if;
      if v_ak = 'self' then
        if v_answer is not null then
          raise exception 'bad_answer: у карточки-самооценки нет ответа (пункт %)', v_part_pos
            using errcode = 'check_violation';
        end if;
      elsif v_ak = 'verno' then
        if v_answer is null or v_answer not in ('da', 'net') then
          raise exception 'bad_answer: «верно / неверно» — da или net (пункт %)', v_part_pos
            using errcode = 'check_violation';
        end if;
      elsif v_answer is null or public.normalize_ege_answer(v_answer) is distinct from v_answer then
        raise exception 'bad_answer: ответ не в нормальной записи ЕГЭ (пункт %)', v_part_pos
          using errcode = 'check_violation';
      end if;
      if v_ak <> 'self' and jsonb_typeof(v_task -> 'razbor') is distinct from 'object' then
        raise exception 'bad_razbor: нет решения (пункт %)', v_part_pos using errcode = 'check_violation';
      end if;
      -- «Без подсказок»: подсказок в ДЗ нет совсем, и ученику их не прочесть.
      if v_no_hints then
        v_view := v_view - 'hints' - 'podskazka';
      end if;

      v_key := coalesce(v_student::text, '-');
      v_n := coalesce((v_pos ->> v_key)::int, 0) + 1;
      v_pos := v_pos || jsonb_build_object(v_key, v_n);

      insert into public.homework_tasks (homework_id, part_id, student_id, position, kind, answer_kind,
                                         question_html, view)
      values (v_id, v_part_id, v_student, v_n, v_kind, v_ak, v_task ->> 'question_html', v_view)
      returning id into v_task_id;
      if v_ak <> 'self' then
        insert into public.homework_keys (task_id, homework_id, ref, answer, razbor, source)
        values (v_task_id, v_id, v_task ->> 'ref', v_answer, v_task -> 'razbor',
                nullif(trim(v_task ->> 'source'), ''));
      end if;
    end loop;

  end loop;

  -- У каждого получателя есть что делать. В пункте «каждому свои» у
  -- ученика может не оказаться задач (работа над ошибками без ошибок
  -- в этом типе), но во всём ДЗ — хотя бы одна.
  if exists (
    select 1 from unnest(v_students) s
     where not exists (select 1 from public.homework_tasks
                        where homework_id = v_id and (student_id is null or student_id = s))) then
    raise exception 'no_tasks: у ученика нет задач в ДЗ' using errcode = 'check_violation';
  end if;

  update public.homework set sections = v_sections where id = v_id;
  return v_id;
end $$;

-- Прежняя выдача (сайт этапа 3, пока новый не выложен): то же ДЗ, каждая
-- задача — пункт тренажёра. Проверки — прежние.
create or replace function public.issue_homework_tasks(p jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_task_no smallint := nullif(p ->> 'task_no', '')::smallint;
  v_individual boolean := coalesce((p ->> 'individual')::boolean, false);
  v_tasks jsonb := p -> 'tasks';
  v_parts jsonb;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden: ДЗ выдаёт репетитор' using errcode = 'insufficient_privilege';
  end if;
  if v_task_no is null or not exists (select 1 from public.ege_tasks where no = v_task_no) then
    raise exception 'bad_task_no: нет такого задания ЕГЭ' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(v_tasks) is distinct from 'array' or jsonb_array_length(v_tasks) = 0 then
    raise exception 'no_tasks: в ДЗ нет задач' using errcode = 'check_violation';
  end if;
  if exists (select 1 from jsonb_array_elements(v_tasks) t
              group by t ->> 'student_id' having count(*) > 60) then
    raise exception 'too_many_tasks: не больше 60 задач на ученика' using errcode = 'check_violation';
  end if;
  if exists (select 1 from jsonb_array_elements(v_tasks) t
              where coalesce((t ->> 'position')::int, 0) not between 1 and 60) then
    raise exception 'bad_position: позиция задачи 1–60' using errcode = 'check_violation';
  end if;
  if exists (select 1 from jsonb_array_elements(v_tasks) t
              group by t ->> 'student_id', t ->> 'position' having count(*) > 1) then
    raise exception 'duplicate key value violates unique constraint "homework_tasks_position_idx": две задачи на одной позиции' using errcode = 'unique_violation';
  end if;
  if exists (select 1 from jsonb_array_elements(v_tasks) t
              where v_individual is distinct from (nullif(t ->> 'student_id', '') is not null)) then
    raise exception 'bad_task_student: % задачи', case when v_individual then 'у индивидуальной задачи нет получателя' else 'в общем ДЗ' end
      using errcode = 'check_violation';
  end if;
  -- Позиция k — пункт: у индивидуального ДЗ — задачи k всех учеников.
  select jsonb_agg(jsonb_build_object(
           'source', 'trenazher', 'task_no', v_task_no,
           'ref', v_task_no::text || ':' || (g.tasks -> 0 ->> 'kind'),
           'title_html', coalesce((select bp.title from public.bank_prototypes bp
                                    where bp.code = v_task_no::text || ':' || (g.tasks -> 0 ->> 'kind')),
                                  g.tasks -> 0 ->> 'kind'),
           'per_student', v_individual,
           'comment', g.tasks -> 0 ->> 'comment',
           'tasks', g.tasks) order by g.pos)
    into v_parts
    from (select (t ->> 'position')::int as pos, jsonb_agg(t) as tasks
            from jsonb_array_elements(v_tasks) t group by 1) g;
  return public.issue_homework_parts(p - 'tasks' - 'task_no' - 'individual'
                                     || jsonb_build_object('parts', v_parts));
end $$;

/* ── Решать ────────────────────────────────────────────────────── */

-- Проверить ответ (docs/kabinet-dz-istochniki.md, «Проверка ответа»).
-- Ответ — как ввёл ученик. Как прежде:
--   {kind: 'closed', state} | {kind: 'format'} | {kind: 'fractionRight', decimal}
--   | {kind: 'right' | 'wrong', state, attempts, left, solution}.
-- Карточка: одна попытка, оборот (solution) — сразу после ответа.
create or replace function public.homework_check(p_task uuid, p_answer text, p_seconds int default 0)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework_tasks;
  h public.homework;
  r public.homework_recipients;
  k public.homework_keys;
  a public.homework_answers;
  v_card boolean;
  v_limit smallint;
  v_raw text;
  v_res jsonb;
  v_norm text;
  v_right boolean;
begin
  select * into t from public.homework_tasks where id = p_task;
  select * into r from public.homework_recipients
   where homework_id = t.homework_id and user_id = v_uid
   for update;
  if v_uid is null or t.id is null or r.user_id is null
     or (t.student_id is not null and t.student_id <> v_uid) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if t.answer_kind = 'self' then
    raise exception 'not_checkable: карточку отмечают «Знаю» или «Повторить»' using errcode = 'check_violation';
  end if;
  select * into h from public.homework where id = t.homework_id;
  if h.closed_at is not null then
    raise exception 'homework_closed: ДЗ закрыто репетитором' using errcode = 'check_violation';
  end if;
  if r.submitted_at is not null then
    raise exception 'already_submitted: ДЗ уже сдано' using errcode = 'check_violation';
  end if;
  if h.solutions_when = 'after_due' and h.due_at < now() then
    raise exception 'due_passed: срок прошёл, решения уже открыты' using errcode = 'check_violation';
  end if;
  update public.homework_recipients set started_at = now()
   where homework_id = t.homework_id and user_id = v_uid and started_at is null;

  insert into public.homework_answers (task_id, homework_id, user_id)
  values (t.id, t.homework_id, v_uid)
  on conflict do nothing;
  select * into a from public.homework_answers where task_id = t.id and user_id = v_uid for update;
  if a.state <> 'open' then
    return jsonb_build_object('kind', 'closed', 'state', a.state);
  end if;
  select * into k from public.homework_keys where task_id = t.id;
  v_card := exists (select 1 from public.homework_parts where id = t.part_id and source = 'kartochki');
  v_limit := case when v_card then 1 else h.attempts_limit end;

  v_raw := regexp_replace(coalesce(p_answer, ''), E'^[[:space:]   ]+|[[:space:]   ]+$', '', 'g');
  if t.answer_kind = 'verno' then
    if v_raw not in ('da', 'net') then
      return jsonb_build_object('kind', 'format');
    end if;
    v_norm := v_raw;
    v_right := v_raw = k.answer;
  elsif t.answer_kind = 'choice' then
    v_norm := public.normalize_ege_answer(v_raw);
    if v_norm is null or char_length(v_raw) > 100 then
      return jsonb_build_object('kind', 'format');
    end if;
    v_right := v_norm = k.answer;
  else
    v_res := public.check_ege_answer(v_raw, k.answer);
    if v_res ->> 'kind' in ('format', 'fractionRight') then
      return v_res;
    end if;
    v_norm := v_res ->> 'norm';
    v_right := v_res ->> 'kind' = 'right';
  end if;

  update public.homework_answers
     set attempts = attempts + 1,
         entries = case when jsonb_array_length(entries) < 20
                        then entries || jsonb_build_array(jsonb_build_object(
                               'a', left(v_raw, 40), 'n', v_norm, 'ok', v_right, 'at', now()))
                        else entries end,
         seconds = least(seconds + least(greatest(coalesce(p_seconds, 0), 0), 3600), 604800),
         state = case when v_right then 'right'
                      when v_limit is not null and attempts + 1 >= v_limit then 'wrong'
                      else 'open' end,
         updated_at = now()
   where task_id = t.id and user_id = v_uid
  returning * into a;

  return jsonb_build_object(
    'kind', case when v_right then 'right' else 'wrong' end,
    'state', a.state,
    'attempts', a.attempts,
    'left', case when v_limit is null then null else greatest(v_limit - a.attempts, 0) end,
    'solution', case when v_card or public.homework_solution_ready(h.solutions_when, h.due_at, r.submitted_at,
                                                                   h.closed_at, a.state)
                     then k.razbor end);
end $$;

-- Отметка карточки-самооценки: known («Знаю») или repeat («Повторить»).
-- Менять можно, пока ДЗ не сдано и не закрыто.
create or replace function public.homework_mark(p_task uuid, p_mark text, p_seconds int default 0)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework_tasks;
  h public.homework;
  r public.homework_recipients;
begin
  select * into t from public.homework_tasks where id = p_task;
  select * into r from public.homework_recipients
   where homework_id = t.homework_id and user_id = v_uid
   for update;
  if v_uid is null or t.id is null or r.user_id is null
     or (t.student_id is not null and t.student_id <> v_uid) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if t.answer_kind <> 'self' then
    raise exception 'not_self: отметка — только у карточки-самооценки' using errcode = 'check_violation';
  end if;
  if p_mark is null or p_mark not in ('known', 'repeat') then
    raise exception 'bad_mark: known или repeat' using errcode = 'check_violation';
  end if;
  select * into h from public.homework where id = t.homework_id;
  if h.closed_at is not null then
    raise exception 'homework_closed: ДЗ закрыто репетитором' using errcode = 'check_violation';
  end if;
  if r.submitted_at is not null then
    raise exception 'already_submitted: ДЗ уже сдано' using errcode = 'check_violation';
  end if;
  update public.homework_recipients set started_at = now()
   where homework_id = t.homework_id and user_id = v_uid and started_at is null;
  insert into public.homework_answers (task_id, homework_id, user_id, state, attempts, seconds)
  values (t.id, t.homework_id, v_uid, p_mark, 1, least(greatest(coalesce(p_seconds, 0), 0), 3600))
  on conflict (task_id, user_id) do update
     set state = p_mark,
         attempts = public.homework_answers.attempts + 1,
         seconds = least(public.homework_answers.seconds + least(greatest(coalesce(p_seconds, 0), 0), 3600), 604800),
         updated_at = now();
  return p_mark;
end $$;

-- «Показать решение» — не у карточек: у них оборот открывает ответ.
create or replace function public.homework_reveal(p_task uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework_tasks;
  h public.homework;
  r public.homework_recipients;
  a public.homework_answers;
begin
  select * into t from public.homework_tasks where id = p_task;
  select * into r from public.homework_recipients
   where homework_id = t.homework_id and user_id = v_uid
   for update;
  if v_uid is null or t.id is null or r.user_id is null
     or (t.student_id is not null and t.student_id <> v_uid) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.homework_parts where id = t.part_id and source = 'kartochki') then
    raise exception 'not_allowed: у карточки решение открывает ответ' using errcode = 'check_violation';
  end if;
  select * into h from public.homework where id = t.homework_id;
  if h.solutions_when = 'after_due' and h.due_at < now() then
    raise exception 'due_passed: срок прошёл, решения уже открыты' using errcode = 'check_violation';
  end if;
  if h.solutions_when <> 'instant' or h.closed_at is not null or r.submitted_at is not null then
    raise exception 'not_allowed: решение сейчас не показывается' using errcode = 'check_violation';
  end if;
  insert into public.homework_answers (task_id, homework_id, user_id)
  values (t.id, t.homework_id, v_uid)
  on conflict do nothing;
  select * into a from public.homework_answers where task_id = t.id and user_id = v_uid for update;
  if a.state <> 'open' then
    raise exception 'not_allowed: задача уже закрыта' using errcode = 'check_violation';
  end if;
  update public.homework_answers set state = 'revealed', updated_at = now()
   where task_id = t.id and user_id = v_uid;
  update public.homework_recipients set started_at = now()
   where homework_id = t.homework_id and user_id = v_uid and started_at is null;
  return (select razbor from public.homework_keys where task_id = t.id);
end $$;

-- Решение и ответ: репетитору — всегда; получателю — когда уже можно,
-- у карточки — сразу после ответа.
create or replace function public.homework_solution(p_task uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  t public.homework_tasks;
  h public.homework;
  r public.homework_recipients;
  k public.homework_keys;
  v_state text;
begin
  select * into t from public.homework_tasks where id = p_task;
  select * into h from public.homework where id = t.homework_id;
  select * into k from public.homework_keys where task_id = t.id;
  if t.id is null or v_uid is null then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  if k.task_id is null then
    raise exception 'not_checkable: у карточки-самооценки нет ответа' using errcode = 'check_violation';
  end if;
  if h.tutor_id = v_uid or public.is_admin() then
    return jsonb_build_object('razbor', k.razbor, 'answer', k.answer);
  end if;
  select * into r from public.homework_recipients where homework_id = t.homework_id and user_id = v_uid;
  if r.user_id is null or (t.student_id is not null and t.student_id <> v_uid) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  select state into v_state from public.homework_answers where task_id = t.id and user_id = v_uid;
  if not (
    (coalesce(v_state, 'open') <> 'open'
     and exists (select 1 from public.homework_parts where id = t.part_id and source = 'kartochki'))
    or public.homework_solution_ready(h.solutions_when, h.due_at, r.submitted_at, h.closed_at, v_state)) then
    raise exception 'not_yet: решение пока закрыто' using errcode = 'check_violation';
  end if;
  return jsonb_build_object('razbor', k.razbor, 'answer', k.answer);
end $$;

/* ── Черновик и шаблоны ────────────────────────────────────────── */

-- Черновик ДЗ репетитора: один, живёт, пока репетитор не выдаст или не
-- очистит. Состав — правила, как в шаблоне (lib/dz/sostav.ts), без
-- готовых задач: задачи собираются при выдаче.
create table public.homework_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  body jsonb not null check (jsonb_typeof(body) = 'object' and octet_length(body::text) <= 200000),
  updated_at timestamptz not null default now()
);
comment on table public.homework_drafts is 'Черновик ДЗ репетитора: состав и настройки, пока не выдано.';

-- Шаблоны ДЗ репетитора: состав (правила) и настройки, без срока и
-- получателей. Только свои.
create table public.homework_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  body jsonb not null check (jsonb_typeof(body) = 'object' and octet_length(body::text) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index homework_templates_user_idx on public.homework_templates (user_id, updated_at desc);
comment on table public.homework_templates is 'Шаблоны ДЗ репетитора: состав и настройки.';

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.homework_parts enable row level security;
alter table public.homework_drafts enable row level security;
alter table public.homework_templates enable row level security;

revoke all on public.homework_parts, public.homework_drafts, public.homework_templates
  from anon, authenticated;

-- Пункты: репетитор ДЗ и администратор — все, получатель — все пункты
-- своего ДЗ (что в пункте лично ему — решают homework_tasks).
-- Репетитор меняет только комментарий.
grant select on public.homework_parts to authenticated;
grant update (comment) on public.homework_parts to authenticated;
create policy homework_parts_read on public.homework_parts for select to authenticated
  using (public.is_admin() or public.owns_homework(homework_id) or public.is_homework_recipient(homework_id));
create policy homework_parts_comment on public.homework_parts for update to authenticated
  using (public.owns_homework(homework_id)) with check (public.owns_homework(homework_id));

-- Черновик и шаблоны — только свои и только у репетитора.
grant select, insert, update, delete on public.homework_drafts to authenticated;
create policy homework_drafts_own on public.homework_drafts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.my_role() = 'tutor');

grant select, insert, update, delete on public.homework_templates to authenticated;
create policy homework_templates_own on public.homework_templates for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.my_role() = 'tutor');

revoke execute on function public.check_ege_answer(text, text) from public, anon;
revoke execute on function public.issue_homework_parts(jsonb) from public, anon;
revoke execute on function public.issue_homework_tasks(jsonb) from public, anon;
revoke execute on function public.homework_check(uuid, text, int) from public, anon;
revoke execute on function public.homework_mark(uuid, text, int) from public, anon;
revoke execute on function public.homework_reveal(uuid) from public, anon;
revoke execute on function public.homework_solution(uuid) from public, anon;
grant execute on function public.check_ege_answer(text, text) to authenticated;
grant execute on function public.issue_homework_parts(jsonb) to authenticated;
grant execute on function public.issue_homework_tasks(jsonb) to authenticated;
grant execute on function public.homework_check(uuid, text, int) to authenticated;
grant execute on function public.homework_mark(uuid, text, int) to authenticated;
grant execute on function public.homework_reveal(uuid) to authenticated;
grant execute on function public.homework_solution(uuid) to authenticated;
