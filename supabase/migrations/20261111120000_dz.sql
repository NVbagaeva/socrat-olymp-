-- Этап 3: кабинет репетитора и домашние задания №8.
-- Контракт — docs/kabinet-dz-8.md.
--
-- Классы получают код для вступления (join_class): ученик вступает сам,
-- репетитор может выключить приём или сменить код. Репетитор может
-- переименовать ученика для себя (tutor_students.alias) — ученик этого
-- имени не видит.
--
-- Домашнее задание теперь хранит готовые задачи: условие (то, что видит
-- ученик) — в homework_tasks, ключ (ответ, разбор, откуда задача) — в
-- homework_keys, ученик ключ не читает никогда. Ход решения —
-- homework_answers. Ответ проверяет только база (homework_check), так же
-- как онлайн-вариант (миграция 20261025120000_variant_works.sql).
-- Прежние homework_items и attempts остаются для пробного кабинета.
--
-- Колонка user_id — владелец строки (ученик): по ней работают
-- export_my_data() и каскадное удаление аккаунта (миграция согласий).

/* ── Классы: код для вступления ────────────────────────────────── */

alter table public.classes
  -- 6 знаков без похожих (0/O, 1/I/L): диктуется голосом и с доски.
  add column join_code text check (join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$'),
  -- Приём по коду: репетитор выключает, когда набор закончен.
  add column join_open boolean not null default true;
alter table public.classes add constraint classes_join_code_key unique (join_code);

-- Свободный код класса. Знак — из случайных байт без перекоса: байты
-- 248–255 отбрасываются (31 × 8 = 248), байты версии и варианта UUID
-- (6 и 8) не берутся. Занятый код — пробуем снова.
create or replace function public.new_class_code()
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_byte int;
  v_code text;
begin
  for attempt in 1..50 loop
    v_code := '';
    while char_length(v_code) < 6 loop
      v_bytes := uuid_send(gen_random_uuid());
      for i in 0..15 loop
        continue when i in (6, 8);
        v_byte := get_byte(v_bytes, i);
        if v_byte < 248 and char_length(v_code) < 6 then
          v_code := v_code || substr(v_alphabet, v_byte % 31 + 1, 1);
        end if;
      end loop;
    end loop;
    if not exists (select 1 from public.classes where join_code = v_code) then
      return v_code;
    end if;
  end loop;
  raise exception 'no_free_code: не нашёлся свободный код класса';
end $$;

-- Уже созданные классы получают код сейчас.
do $$
declare c record;
begin
  for c in select id from public.classes where join_code is null loop
    update public.classes set join_code = public.new_class_code() where id = c.id;
  end loop;
end $$;
alter table public.classes alter column join_code set not null;

-- Код ставит база при создании класса; браузер его не присылает.
create or replace function public.set_class_join_code()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.join_code is null then
    new.join_code := public.new_class_code();
  end if;
  return new;
end $$;
create trigger classes_join_code before insert on public.classes
  for each row execute function public.set_class_join_code();

-- Новый код взамен старого: старый перестаёт работать сразу.
create or replace function public.rotate_class_code(p_class uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_code text;
begin
  if not public.owns_class(p_class) then
    raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
  end if;
  v_code := public.new_class_code();
  update public.classes set join_code = v_code where id = p_class;
  return v_code;
end $$;

/* ── Вступить в класс по коду ──────────────────────────────────── */

-- Неудачные попытки вступить: не больше 10 за час, дальше too_many_tries.
-- Читают и пишут только функции.
create table public.class_join_tries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index class_join_tries_user_idx on public.class_join_tries (user_id, at);
comment on table public.class_join_tries is
  'Неудачные попытки вступить в класс по коду: защита от подбора кода.';

-- Ученик вступает в класс: код без пробелов и дефисов, регистр не важен.
-- Связывает с репетитором класса (снимает ended_at) и добавляет в класс;
-- повторное вступление ничего не ломает.
--
-- Неверный код — не исключение, а ответ {"error": "bad_code"}: исключение
-- откатило бы и запись о неудачной попытке, и предел попыток не работал
-- бы. Код не найден, приём выключен, класс в архиве — один и тот же ответ.
create or replace function public.join_class(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  -- Пробелы и дефисы (любые) — не часть кода: «k7m-p2q» = «K7MP2Q».
  v_code text := upper(regexp_replace(coalesce(p_code, ''),
                                      E'[-[:space:]   ‐‑‒–—−]+', '', 'g'));
  c public.classes;
begin
  if v_uid is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden: вступить в класс может ученик' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  -- Попытки одного ученика — по очереди: иначе параллельные запросы
  -- обходили бы предел.
  perform 1 from public.profiles where user_id = v_uid for update;
  delete from public.class_join_tries where user_id = v_uid and at < now() - interval '1 day';
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

  insert into public.tutor_students (tutor_id, user_id) values (c.tutor_id, v_uid)
  on conflict (tutor_id, user_id) do update set ended_at = null;
  insert into public.class_members (class_id, user_id) values (c.id, v_uid)
  on conflict do nothing;
  return jsonb_build_object(
    'class_id', c.id, 'class_name', c.name,
    'tutor_name', (select display_name from public.profiles where user_id = c.tutor_id));
end $$;

/* ── Ученик под своим именем у репетитора ──────────────────────── */

alter table public.tutor_students
  -- Как репетитор называет ученика у себя («Петя, 11 Б»). Ученик не видит.
  add column alias text check (alias is null or (char_length(alias) <= 60 and char_length(trim(alias)) >= 1));

-- Связи «репетитор — ученик» читают обе стороны, а имя для себя —
-- только репетитор. Колонку от строки в PostgreSQL не спрятать, поэтому
-- таблица читается по колонкам без alias, а репетитор читает alias через
-- my_students. Менять alias — правом на колонку и прежним правилом
-- tutor_students_end (только свои строки репетитора).
revoke select on public.tutor_students from authenticated;
grant select (tutor_id, user_id, linked_at, ended_at) on public.tutor_students to authenticated;
grant update (alias) on public.tutor_students to authenticated;

-- Мои ученики — для репетитора: с именем для себя. Права владельца
-- представления, строки — только свои (tutor_id = auth.uid()); ученик
-- здесь не видит ничего.
create view public.my_students with (security_barrier = true) as
select user_id, alias, linked_at, ended_at
from public.tutor_students
where tutor_id = auth.uid();
comment on view public.my_students is
  'Ученики вошедшего репетитора с именем для себя (alias). Ученику — пусто.';

-- Выгрузка данных ученика: то же, что в миграции согласий, но без имени,
-- которое дал ему репетитор (alias — запись репетитора, видит только он).
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
  v_rows jsonb;
  t record;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select jsonb_build_object(
           'exported_at', now(),
           'account', jsonb_build_object(
             'id', u.id, 'email', u.email, 'created_at', u.created_at,
             'name', u.raw_user_meta_data ->> 'name', 'role', u.raw_user_meta_data ->> 'role'),
           'consents', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'kind', c.kind, 'version', c.version, 'accepted_at', c.accepted_at,
                      'ip', host(c.ip), 'parent_email', c.parent_email) order by c.accepted_at)
             from public.consents c where c.user_id = v_uid), '[]'::jsonb))
    into v_result
    from auth.users u where u.id = v_uid;

  for t in
    select distinct tc.table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
      and ccu.table_schema = 'auth' and ccu.table_name = 'users' and kcu.column_name = 'user_id'
    order by tc.table_name
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(x) - ''token_hash'' - ''alias''), ''[]''::jsonb) from public.%I x where x.user_id = $1',
      t.table_name)
      into v_rows using v_uid;
    v_result := v_result || jsonb_build_object(t.table_name, v_rows);
  end loop;
  return v_result;
end $$;

/* ── Домашнее задание: настройки ───────────────────────────────── */

alter table public.homework
  -- Номер задания ЕГЭ (8). Пусто — ДЗ пробного кабинета (homework_items).
  add column task_no smallint references public.ege_tasks (no),
  -- Попыток на задачу: 1, 2 или без ограничения (null).
  add column attempts_limit smallint check (attempts_limit in (1, 2)),
  -- Когда ученик видит решение: сразу после ответа, после сдачи, после срока.
  add column solutions_when text not null default 'after_submit'
    check (solutions_when in ('instant', 'after_submit', 'after_due')),
  add column show_memo boolean not null default false,
  add column show_example boolean not null default false,
  -- У каждого ученика свои задачи (homework_tasks.student_id).
  add column individual boolean not null default false,
  -- Откуда выдано.
  add column origin text not null default 'kabinet'
    check (origin in ('kabinet', 'generator', 'opornye', 'trenazher', 'oshibki')),
  -- «Работа над ошибками» по какому ДЗ.
  add column parent_id uuid references public.homework (id) on delete set null;
create index homework_parent_idx on public.homework (parent_id) where parent_id is not null;

/* ── Домашнее задание: задачи, ключи, ход решения ──────────────── */

-- Задачи ДЗ — то, что видит ученик. Хранятся готовыми: лист ученика и
-- лист учителя печатаются из тех же строк.
create table public.homework_tasks (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  -- null — задача для всех получателей, иначе — индивидуальная.
  student_id uuid references auth.users (id) on delete cascade,
  position smallint not null check (position between 1 and 60),
  -- Прототип: «8.A».
  kind text not null check (char_length(kind) between 1 and 16),
  -- Условие, набранное KaTeX при выдаче.
  question_html text not null check (char_length(question_html) between 1 and 200000),
  -- Комментарий репетитора к задаче.
  comment text check (char_length(comment) <= 1000),
  unique (id, homework_id),
  -- Индивидуальная задача — только получателю этого ДЗ.
  foreign key (homework_id, student_id)
    references public.homework_recipients (homework_id, user_id) on delete cascade
);
create unique index homework_tasks_position_idx on public.homework_tasks
  (homework_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid), position);
create index homework_tasks_student_idx on public.homework_tasks (student_id) where student_id is not null;

-- Ключ: ответ, разбор, откуда задача. Ученику — никогда; только функциям
-- и репетитору ДЗ.
create table public.homework_keys (
  task_id uuid primary key,
  homework_id uuid not null,
  -- «прототип|seed|уровень»: по нему задача узнаётся в статистике.
  ref text not null check (char_length(ref) between 1 and 64),
  -- Нормальная запись (normalize_ege_answer).
  answer text not null check (answer ~ '^-?[0-9]+(\.[0-9]+)?$'),
  -- Решение по шагам (RazborHtml).
  razbor jsonb not null check (jsonb_typeof(razbor) = 'object' and octet_length(razbor::text) <= 400000),
  -- «банк 8.A №3» / «новая».
  source text check (char_length(source) <= 80),
  foreign key (task_id, homework_id) references public.homework_tasks (id, homework_id) on delete cascade
);
create index homework_keys_homework_idx on public.homework_keys (homework_id);

-- Ход решения ученика по задаче. Пишет только homework_check и
-- homework_reveal.
create table public.homework_answers (
  task_id uuid not null,
  homework_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- open — решается; right — верно; wrong — попытки кончились;
  -- revealed — открыл решение («Показать решение»).
  state text not null default 'open' check (state in ('open', 'right', 'wrong', 'revealed')),
  -- Засчитанные попытки (неверная запись и дробь с верным значением — нет).
  attempts int not null default 0 check (attempts >= 0),
  -- Что вводил: [{a: как ввёл, n: нормальная запись или null, ok, at}],
  -- не больше 20 первых.
  entries jsonb not null default '[]'
    check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 20),
  seconds int not null default 0 check (seconds between 0 and 604800),
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id),
  foreign key (task_id, homework_id) references public.homework_tasks (id, homework_id) on delete cascade,
  foreign key (homework_id, user_id)
    references public.homework_recipients (homework_id, user_id) on delete cascade
);
create index homework_answers_homework_idx on public.homework_answers (homework_id, user_id);
create index homework_answers_student_idx on public.homework_answers (user_id);

/* ── Кто что видит ─────────────────────────────────────────────── */

create or replace function public.owns_homework(p_homework uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.homework where id = p_homework and tutor_id = auth.uid()) $$;

create or replace function public.is_homework_recipient(p_homework uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.homework_recipients where homework_id = p_homework and user_id = auth.uid())
$$;

-- Можно ли получателю видеть решение (docs/kabinet-dz-8.md, «Когда
-- ученик видит решение»): instant — задача закрыта; after_submit — ДЗ
-- сдано или репетитор закрыл приём; after_due — срок прошёл.
-- Служебная: зовут функции ниже.
create or replace function public.homework_solution_ready(
  p_when text, p_due timestamptz, p_submitted timestamptz, p_closed timestamptz, p_state text)
returns boolean
language sql stable set search_path = ''
as $$
  select case p_when
           when 'instant' then coalesce(p_state in ('right', 'wrong', 'revealed'), false)
           when 'after_submit' then p_submitted is not null or p_closed is not null
           when 'after_due' then p_due is not null and p_due < now()
           else false
         end
$$;

/* ── Выдать ────────────────────────────────────────────────────── */

-- p: {title, note, due_at, class_id, students: [uuid], task_no,
--     attempts_limit, solutions_when, show_memo, show_example, individual,
--     origin, parent_id,
--     tasks: [{student_id | null, position, kind, ref, question_html,
--              answer, razbor, source, comment}]}
-- Ученики не указаны, а класс указан — всем ученикам класса, которых
-- репетитор ведёт сейчас. ДЗ, получатели, задачи и ключи — одной
-- транзакцией.
create or replace function public.issue_homework_tasks(p jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_class uuid := nullif(p ->> 'class_id', '')::uuid;
  v_due timestamptz := nullif(p ->> 'due_at', '')::timestamptz;
  v_task_no smallint := nullif(p ->> 'task_no', '')::smallint;
  v_limit smallint := nullif(p ->> 'attempts_limit', '')::smallint;
  v_when text := coalesce(nullif(p ->> 'solutions_when', ''), 'after_submit');
  v_individual boolean := coalesce((p ->> 'individual')::boolean, false);
  v_origin text := coalesce(nullif(p ->> 'origin', ''), 'kabinet');
  v_parent uuid := nullif(p ->> 'parent_id', '')::uuid;
  v_tasks jsonb := p -> 'tasks';
  v_students uuid[];
  v_student uuid;
  v_task jsonb;
  v_task_id uuid;
  v_answer text;
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
  if v_task_no is null or not exists (select 1 from public.ege_tasks where no = v_task_no) then
    raise exception 'bad_task_no: нет такого задания ЕГЭ' using errcode = 'check_violation';
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
  if jsonb_typeof(v_tasks) is distinct from 'array' or jsonb_array_length(v_tasks) = 0 then
    raise exception 'no_tasks: в ДЗ нет задач' using errcode = 'check_violation';
  end if;

  -- Получатели.
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

  -- Не больше 60 задач на ученика.
  if exists (select 1 from jsonb_array_elements(v_tasks) t
              group by t ->> 'student_id' having count(*) > 60) then
    raise exception 'too_many_tasks: не больше 60 задач на ученика' using errcode = 'check_violation';
  end if;

  insert into public.homework (tutor_id, class_id, title, note, due_at, task_no, attempts_limit,
                               solutions_when, show_memo, show_example, individual, origin, parent_id)
  values (auth.uid(), v_class, trim(p ->> 'title'), nullif(trim(p ->> 'note'), ''), v_due, v_task_no, v_limit,
          v_when, coalesce((p ->> 'show_memo')::boolean, false), coalesce((p ->> 'show_example')::boolean, false),
          v_individual, v_origin, v_parent)
  returning id into v_id;

  insert into public.homework_recipients (homework_id, user_id)
  select v_id, unnest(v_students);

  for v_task in select * from jsonb_array_elements(v_tasks) loop
    v_student := nullif(v_task ->> 'student_id', '')::uuid;
    if v_individual then
      if v_student is null or not (v_student = any (v_students)) then
        raise exception 'bad_task_student: у индивидуальной задачи нет получателя (позиция %)', v_task ->> 'position'
          using errcode = 'check_violation';
      end if;
    elsif v_student is not null then
      raise exception 'bad_task_student: в общем ДЗ задачи без ученика (позиция %)', v_task ->> 'position'
        using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.bank_prototypes
                    where task_no = v_task_no and code = v_task_no::text || ':' || (v_task ->> 'kind')
                      and retired_at is null) then
      raise exception 'bad_kind: нет прототипа % в задании %', v_task ->> 'kind', v_task_no
        using errcode = 'check_violation';
    end if;
    v_answer := v_task ->> 'answer';
    if v_answer is null or public.normalize_ege_answer(v_answer) is distinct from v_answer then
      raise exception 'bad_answer: ответ не в нормальной записи ЕГЭ (позиция %)', v_task ->> 'position'
        using errcode = 'check_violation';
    end if;
    if jsonb_typeof(v_task -> 'razbor') is distinct from 'object' then
      raise exception 'bad_razbor: нет решения (позиция %)', v_task ->> 'position' using errcode = 'check_violation';
    end if;

    insert into public.homework_tasks (homework_id, student_id, position, kind, question_html, comment)
    values (v_id, v_student, (v_task ->> 'position')::smallint, v_task ->> 'kind', v_task ->> 'question_html',
            nullif(trim(v_task ->> 'comment'), ''))
    returning id into v_task_id;
    insert into public.homework_keys (task_id, homework_id, ref, answer, razbor, source)
    values (v_task_id, v_id, v_task ->> 'ref', v_answer, v_task -> 'razbor', nullif(trim(v_task ->> 'source'), ''));
  end loop;

  if v_individual and exists (
    select 1 from unnest(v_students) s
     where not exists (select 1 from public.homework_tasks where homework_id = v_id and student_id = s)) then
    raise exception 'no_tasks: у ученика нет задач в индивидуальном ДЗ' using errcode = 'check_violation';
  end if;
  return v_id;
end $$;

/* ── Решать ────────────────────────────────────────────────────── */

-- Проверить ответ (docs/kabinet-dz-8.md, «Проверка ответа»). Ответ — как
-- ввёл ученик. Возвращает:
--   {kind: 'closed', state}                     — задача уже закрыта;
--   {kind: 'format'}                            — неверная запись, попытка не тратится;
--   {kind: 'fractionRight', decimal}            — дробь с верным значением, попытка не тратится;
--   {kind: 'right' | 'wrong', state, attempts, left, solution}
--                                               — попытка засчитана; left — сколько
--                                                 осталось (null — без ограничения),
--                                                 solution — разбор, если его уже можно
--                                                 показать, иначе null.
create or replace function public.homework_check(p_task uuid, p_answer text, p_seconds int default 0)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  -- Пробелы по краям и минусы — как в normalize_ege_answer и lib/otvet.
  v_sp constant text := E'[[:space:]   ]';
  t public.homework_tasks;
  h public.homework;
  r public.homework_recipients;
  k public.homework_keys;
  a public.homework_answers;
  v_raw text;
  v text;
  m text[];
  v_q numeric;
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
  select * into h from public.homework where id = t.homework_id;
  if h.closed_at is not null then
    raise exception 'homework_closed: ДЗ закрыто репетитором' using errcode = 'check_violation';
  end if;
  if r.submitted_at is not null then
    raise exception 'already_submitted: ДЗ уже сдано' using errcode = 'check_violation';
  end if;
  -- Решения «после срока» уже открыты — после срока не отвечают. В
  -- остальных ДЗ ответ после срока принимается (сдано с опозданием).
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

  v_raw := regexp_replace(coalesce(p_answer, ''), '^' || v_sp || '+|' || v_sp || '+$', '', 'g');
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
    if (case when m[1] = '-' then -1 else 1 end) * replace(m[2], ',', '.')::numeric = k.answer::numeric * v_q then
      return jsonb_build_object('kind', 'fractionRight', 'decimal', k.answer);
    end if;
    v_norm := null;
    v_right := false;
  else
    v_norm := public.normalize_ege_answer(p_answer);
    if v_norm is null then
      return jsonb_build_object('kind', 'format');
    end if;
    v_right := v_norm = k.answer;
  end if;

  update public.homework_answers
     set attempts = attempts + 1,
         entries = case when jsonb_array_length(entries) < 20
                        then entries || jsonb_build_array(jsonb_build_object(
                               'a', left(v_raw, 40), 'n', v_norm, 'ok', v_right, 'at', now()))
                        else entries end,
         seconds = least(seconds + least(greatest(coalesce(p_seconds, 0), 0), 3600), 604800),
         state = case when v_right then 'right'
                      when h.attempts_limit is not null and attempts + 1 >= h.attempts_limit then 'wrong'
                      else 'open' end,
         updated_at = now()
   where task_id = t.id and user_id = v_uid
  returning * into a;

  return jsonb_build_object(
    'kind', case when v_right then 'right' else 'wrong' end,
    'state', a.state,
    'attempts', a.attempts,
    'left', case when h.attempts_limit is null then null else greatest(h.attempts_limit - a.attempts, 0) end,
    'solution', case when public.homework_solution_ready(h.solutions_when, h.due_at, r.submitted_at,
                                                          h.closed_at, a.state)
                     then k.razbor end);
end $$;

-- «Показать решение»: только при solutions_when = 'instant', пока задача
-- не закрыта и ДЗ не сдано и не закрыто. Задача закрывается (revealed).
-- В ДЗ с решениями после срока, когда срок прошёл, — due_passed, как и
-- у homework_check.
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

-- Решение и ответ задачи: {razbor, answer}. Репетитору ДЗ (и
-- администратору) — всегда, получателю — когда уже можно, иначе not_yet.
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
  if h.tutor_id = v_uid or public.is_admin() then
    return jsonb_build_object('razbor', k.razbor, 'answer', k.answer);
  end if;
  select * into r from public.homework_recipients where homework_id = t.homework_id and user_id = v_uid;
  if r.user_id is null or (t.student_id is not null and t.student_id <> v_uid) then
    raise exception 'not_your_task' using errcode = 'insufficient_privilege';
  end if;
  select state into v_state from public.homework_answers where task_id = t.id and user_id = v_uid;
  if not public.homework_solution_ready(h.solutions_when, h.due_at, r.submitted_at, h.closed_at, v_state) then
    raise exception 'not_yet: решение пока закрыто' using errcode = 'check_violation';
  end if;
  return jsonb_build_object('razbor', k.razbor, 'answer', k.answer);
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.class_join_tries enable row level security;
alter table public.homework_tasks enable row level security;
alter table public.homework_keys enable row level security;
alter table public.homework_answers enable row level security;

-- На своём сервере у anon и authenticated по умолчанию все права на новые
-- таблицы и представления public: снимаем и выдаём только нужное.
revoke all on public.class_join_tries, public.homework_tasks, public.homework_keys,
  public.homework_answers, public.my_students
  from anon, authenticated;

-- Классы: репетитор сам включает и выключает приём по коду. Сам код
-- меняет только rotate_class_code.
grant update (join_open) on public.classes to authenticated;

-- Мои ученики с именем для себя — репетитору.
grant select on public.my_students to authenticated;

-- Попытки вступить — только функции: правил нет, прав нет.

-- Задачи: репетитор ДЗ и администратор — все; получатель — общие и свои
-- индивидуальные. Репетитор меняет только комментарий.
grant select on public.homework_tasks to authenticated;
grant update (comment) on public.homework_tasks to authenticated;
create policy homework_tasks_read on public.homework_tasks for select to authenticated
  using (public.is_admin() or public.owns_homework(homework_id)
         or ((student_id is null or student_id = auth.uid()) and public.is_homework_recipient(homework_id)));
create policy homework_tasks_comment on public.homework_tasks for update to authenticated
  using (public.owns_homework(homework_id)) with check (public.owns_homework(homework_id));

-- Ключ: только репетитор ДЗ и администратор. Ученику — нет.
grant select on public.homework_keys to authenticated;
create policy homework_keys_tutor on public.homework_keys for select to authenticated
  using (public.owns_homework(homework_id) or public.is_admin());

-- Ход решения пишут только функции. Читают — свой и репетитор ДЗ.
grant select on public.homework_answers to authenticated;
create policy homework_answers_read on public.homework_answers for select to authenticated
  using (user_id = auth.uid() or public.owns_homework(homework_id) or public.is_admin());

-- Функции: вошедшим — рабочие, служебные — никому снаружи. Анониму — ни
-- одной (как в миграции 20261110120000_probnyy_vhod.sql).
revoke execute on function public.new_class_code() from public, anon, authenticated;
revoke execute on function public.set_class_join_code() from public, anon, authenticated;
revoke execute on function public.homework_solution_ready(text, timestamptz, timestamptz, timestamptz, text)
  from public, anon, authenticated;
revoke execute on function public.owns_homework(uuid) from public, anon;
revoke execute on function public.is_homework_recipient(uuid) from public, anon;
revoke execute on function public.rotate_class_code(uuid) from public, anon;
revoke execute on function public.join_class(text) from public, anon;
revoke execute on function public.issue_homework_tasks(jsonb) from public, anon;
revoke execute on function public.homework_check(uuid, text, int) from public, anon;
revoke execute on function public.homework_reveal(uuid) from public, anon;
revoke execute on function public.homework_solution(uuid) from public, anon;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.owns_homework(uuid) to authenticated;
grant execute on function public.is_homework_recipient(uuid) to authenticated;
grant execute on function public.rotate_class_code(uuid) to authenticated;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.issue_homework_tasks(jsonb) to authenticated;
grant execute on function public.homework_check(uuid, text, int) to authenticated;
grant execute on function public.homework_reveal(uuid) to authenticated;
grant execute on function public.homework_solution(uuid) to authenticated;
grant execute on function public.export_my_data() to authenticated;
