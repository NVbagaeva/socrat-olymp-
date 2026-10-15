-- Кабинет: роли, приглашения, классы, домашние задания, попытки, тренировки.
-- План и экраны — docs/kabinet-roli-dz.md.
--
-- Где живут данные. Боевая база — Supabase на своём сервере в России
-- (VDS Selectel, сессия С-1 в docs/CABINET_UX_SPEC.md), бэкапы — Yandex
-- Object Storage. Реплик, копий и CDN за рубежом нет: здесь лежат
-- персональные данные учеников, в том числе несовершеннолетних (152-ФЗ,
-- ст. 18 ч. 5 — запись и хранение на территории России).
--
-- Роли: student — ученик, tutor — репетитор, admin — администратор
-- (один на всю базу, уникальный индекс). Открытой регистрации нет:
-- пользователь появляется только по коду приглашения (триггер на
-- auth.users ниже), роль берётся из приглашения, а не из формы.
-- Исключение — самый первый пользователь базы с отметкой
-- bootstrap_admin: так один раз создаётся аккаунт администратора.
--
-- Колонка user_id — всегда владелец строки (ученик). По ней работают
-- export_my_data() и каскадное удаление аккаунта из миграции согласий:
-- новые таблицы попадают в выгрузку сами.
--
-- Писать в базу ученик может только своё и только через функции или
-- политики с can_save_progress(): ученик младше 18 до согласия родителя
-- прогресс не сохраняет.

create type public.app_role as enum ('student', 'tutor', 'admin');
create type public.attempt_outcome as enum ('right', 'hinted', 'wrong');
create type public.session_status as enum ('active', 'paused', 'finished');

/* ── Пользователи ──────────────────────────────────────────────── */

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  -- Класс школы ученика (9, 10, 11) — по желанию.
  grade smallint check (grade between 1 and 11),
  created_at timestamptz not null default now()
);
-- Администратор — только один.
create unique index profiles_one_admin on public.profiles ((true)) where role = 'admin';
comment on table public.profiles is 'Роль и имя пользователя. Почта — в auth.users.';

-- Роль текущего пользователя. security definer: политики ниже читают
-- profiles, а политика самой profiles вызывает эти функции — без
-- definer это была бы бесконечная рекурсия RLS.
create or replace function public.my_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where user_id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.my_role() = 'admin', false) $$;

/* ── Ученик ↔ репетитор ────────────────────────────────────────── */

create table public.tutor_students (
  tutor_id uuid not null references auth.users (id) on delete cascade,
  -- Ученик.
  user_id uuid not null references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  -- Репетитор перестал вести ученика: история остаётся, доступ к
  -- попыткам ученика у репетитора пропадает.
  ended_at timestamptz,
  primary key (tutor_id, user_id),
  check (tutor_id <> user_id)
);
create index tutor_students_student_idx on public.tutor_students (user_id);

-- Ученик этого репетитора (связь действует).
create or replace function public.is_my_student(p_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.tutor_students
                 where tutor_id = auth.uid() and user_id = p_student and ended_at is null)
$$;

create or replace function public.is_my_tutor(p_tutor uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.tutor_students
                 where tutor_id = p_tutor and user_id = auth.uid() and ended_at is null)
$$;

-- В связи «репетитор — ученик» роли должны быть именно такими.
create or replace function public.check_tutor_student_roles()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select role from public.profiles where user_id = new.tutor_id) is distinct from 'tutor' then
    raise exception 'not_a_tutor' using errcode = 'check_violation';
  end if;
  if (select role from public.profiles where user_id = new.user_id) is distinct from 'student' then
    raise exception 'not_a_student' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger tutor_students_roles before insert or update on public.tutor_students
  for each row execute function public.check_tutor_student_roles();

/* ── Классы и группы ───────────────────────────────────────────── */

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index classes_tutor_idx on public.classes (tutor_id) where archived_at is null;

create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index class_members_student_idx on public.class_members (user_id);

-- В класс попадает только ученик, которого ведёт репетитор класса.
create or replace function public.check_class_member()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.classes c
    join public.tutor_students ts on ts.tutor_id = c.tutor_id and ts.user_id = new.user_id and ts.ended_at is null
    where c.id = new.class_id
  ) then
    raise exception 'not_your_student: в класс можно добавить только своего ученика' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger class_members_check before insert or update on public.class_members
  for each row execute function public.check_class_member();

create or replace function public.owns_class(p_class uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.classes where id = p_class and tutor_id = auth.uid()) $$;

create or replace function public.in_class(p_class uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.class_members where class_id = p_class and user_id = auth.uid()) $$;

/* ── Приглашения ───────────────────────────────────────────────── */

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  -- sha256 кода; сам код показывается один раз при создании.
  code_hash text not null unique,
  role public.app_role not null check (role in ('student', 'tutor')),
  created_by uuid not null references auth.users (id) on delete cascade,
  -- Приглашение ученика от репетитора: ученик сразу становится его учеником…
  tutor_id uuid references auth.users (id) on delete cascade,
  -- …и, если указан, попадает в класс.
  class_id uuid references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete cascade,
  revoked_at timestamptz,
  check (role = 'student' or (tutor_id is null and class_id is null)),
  check (class_id is null or tutor_id is not null)
);
comment on table public.invitations is
  'Регистрация только по приглашению. Персональных данных приглашённого здесь нет: только роль и к кому он попадёт.';

create or replace function public.invite_hash(p_code text)
returns text
language sql immutable set search_path = ''
as $$ select encode(sha256(convert_to(upper(trim(p_code)), 'UTF8')), 'hex') $$;

-- Создать приглашение. Админ — репетитора или ученика; репетитор —
-- только своего ученика (и в свой класс). Возвращает код один раз.
create or replace function public.create_invitation(p_role public.app_role, p_class_id uuid default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_me public.app_role := public.my_role();
  v_tutor uuid;
  -- 20 символов без похожих (0/O, 1/I): диктуется голосом и не подбирается.
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
  v_code text := '';
begin
  if p_role not in ('student', 'tutor') then
    raise exception 'bad_role: пригласить можно ученика или репетитора' using errcode = 'check_violation';
  end if;
  if v_me = 'admin' then
    if p_class_id is not null then
      select tutor_id into v_tutor from public.classes where id = p_class_id;
      if v_tutor is null then raise exception 'no_class'; end if;
    end if;
  elsif v_me = 'tutor' then
    if p_role <> 'student' then
      raise exception 'forbidden: репетитор приглашает только учеников' using errcode = 'insufficient_privilege';
    end if;
    if p_class_id is not null and not public.owns_class(p_class_id) then
      raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
    end if;
    v_tutor := auth.uid();
  else
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  for i in 0..19 loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  insert into public.invitations (code_hash, role, created_by, tutor_id, class_id)
  values (public.invite_hash(v_code), p_role, auth.uid(), v_tutor, p_class_id);
  return v_code;
end $$;

create or replace function public.revoke_invitation(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.invitations set revoked_at = now()
   where id = p_id and used_at is null and revoked_at is null
     and (created_by = auth.uid() or public.is_admin());
  if not found then raise exception 'not_found'; end if;
end $$;

-- Регистрация. Сервер сайта создаёт пользователя через admin API и
-- кладёт в raw_user_meta_data код приглашения (invite_code) вместе с
-- галочками согласий (миграция 20261011120000_soglasiya.sql). Роль в
-- метаданных обязана совпасть с ролью приглашения: по ней триггер
-- согласий решает, нужен ли год рождения и согласие родителя.
create or replace function public.handle_new_user_invite()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := coalesce(nullif(trim(meta ->> 'name'), ''), split_part(new.email, '@', 1));
  v_grade smallint := nullif(meta ->> 'grade', '')::smallint;
  v_inv public.invitations;
begin
  if coalesce((meta ->> 'bootstrap_admin')::boolean, false) then
    -- Только самый первый пользователь базы.
    if exists (select 1 from public.profiles) then
      raise exception 'admin_exists: администратор создаётся один раз' using errcode = 'check_violation';
    end if;
    insert into public.profiles (user_id, role, display_name) values (new.id, 'admin', v_name);
    return new;
  end if;

  select * into v_inv from public.invitations
   where code_hash = public.invite_hash(coalesce(meta ->> 'invite_code', ''))
     and used_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then
    raise exception 'invite_required: регистрация только по действующему приглашению' using errcode = 'check_violation';
  end if;
  if (meta ->> 'role') is distinct from v_inv.role::text then
    raise exception 'role_mismatch: роль в форме не совпадает с приглашением' using errcode = 'check_violation';
  end if;

  insert into public.profiles (user_id, role, display_name, grade)
  values (new.id, v_inv.role, v_name, case when v_inv.role = 'student' then v_grade end);
  update public.invitations set used_at = now(), used_by = new.id where id = v_inv.id;
  if v_inv.tutor_id is not null then
    insert into public.tutor_students (tutor_id, user_id) values (v_inv.tutor_id, new.id);
  end if;
  if v_inv.class_id is not null then
    insert into public.class_members (class_id, user_id) values (v_inv.class_id, new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created_invite
  after insert on auth.users
  for each row execute function public.handle_new_user_invite();

/* ── Каталог банка ─────────────────────────────────────────────── */
-- Заполняется supabase/seed/kabinet_katalog.sql (pnpm build:kabinet-catalog).

create table public.ege_tasks (
  no smallint primary key check (no between 1 and 20),
  name text not null
);

create table public.bank_prototypes (
  -- «<номер>:<id в движке>»: «7:P01», «12:12Q.A».
  code text primary key check (code ~ '^[0-9]{1,2}:.+$'),
  task_no smallint not null references public.ege_tasks (no),
  title text not null,
  order_index int not null default 0,
  -- Прототип убран из банка: не предлагается в новых ДЗ, старые ссылки живы.
  retired_at timestamptz,
  unique (task_no, code)
);

/* ── Домашние задания ──────────────────────────────────────────── */

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users (id) on delete cascade,
  -- Выдано классу (список учеников — в homework_recipients на момент выдачи).
  class_id uuid references public.classes (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 120),
  note text check (length(note) <= 2000),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index homework_tutor_idx on public.homework (tutor_id, created_at desc);

create table public.homework_items (
  homework_id uuid not null references public.homework (id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  task_no smallint not null references public.ege_tasks (no),
  -- Пусто — любой прототип задания.
  prototype_code text,
  count smallint not null check (count between 1 and 50),
  primary key (homework_id, position),
  foreign key (task_no, prototype_code) references public.bank_prototypes (task_no, code)
);

create table public.homework_recipients (
  homework_id uuid not null references public.homework (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  primary key (homework_id, user_id)
);
create index homework_recipients_student_idx on public.homework_recipients (user_id);

create or replace function public.can_see_homework(p_homework uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_admin()
      or exists (select 1 from public.homework where id = p_homework and tutor_id = auth.uid())
      or exists (select 1 from public.homework_recipients where homework_id = p_homework and user_id = auth.uid())
$$;

-- Выдать ДЗ: классу и/или отдельным ученикам. p_items —
-- [{"task_no": 12, "prototype_code": "12:12Q.A" | null, "count": 5}, …].
create or replace function public.issue_homework(
  p_title text, p_note text, p_due_at timestamptz,
  p_class_id uuid, p_students uuid[], p_items jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_item jsonb;
  v_pos int := 0;
  v_student uuid;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden: ДЗ выдаёт репетитор' using errcode = 'insufficient_privilege';
  end if;
  if p_class_id is not null and not public.owns_class(p_class_id) then
    raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'no_items: в ДЗ нет задач' using errcode = 'check_violation';
  end if;
  if p_due_at is not null and p_due_at <= now() then
    raise exception 'bad_due: срок уже прошёл' using errcode = 'check_violation';
  end if;

  insert into public.homework (tutor_id, class_id, title, note, due_at)
  values (auth.uid(), p_class_id, trim(p_title), nullif(trim(p_note), ''), p_due_at)
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pos := v_pos + 1;
    if nullif(v_item ->> 'prototype_code', '') is not null and exists (
      select 1 from public.bank_prototypes
       where code = v_item ->> 'prototype_code' and retired_at is not null) then
      raise exception 'retired_prototype: %', v_item ->> 'prototype_code' using errcode = 'check_violation';
    end if;
    insert into public.homework_items (homework_id, position, task_no, prototype_code, count)
    values (v_id, v_pos, (v_item ->> 'task_no')::smallint,
            nullif(v_item ->> 'prototype_code', ''), coalesce((v_item ->> 'count')::smallint, 1));
  end loop;

  for v_student in
    select user_id from public.class_members where class_id = p_class_id
    union
    select unnest(coalesce(p_students, '{}'))
  loop
    if not public.is_my_student(v_student) then
      raise exception 'not_your_student' using errcode = 'insufficient_privilege';
    end if;
    insert into public.homework_recipients (homework_id, user_id) values (v_id, v_student)
    on conflict do nothing;
  end loop;
  if not exists (select 1 from public.homework_recipients where homework_id = v_id) then
    raise exception 'no_recipients: некому выдать' using errcode = 'check_violation';
  end if;
  return v_id;
end $$;

create or replace function public.start_homework(p_homework uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.homework_recipients set started_at = coalesce(started_at, now())
   where homework_id = p_homework and user_id = auth.uid()
$$;

create or replace function public.submit_homework(p_homework uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.homework_recipients
     set started_at = coalesce(started_at, now()), submitted_at = now()
   where homework_id = p_homework and user_id = auth.uid() and submitted_at is null
     and exists (select 1 from public.homework where id = p_homework and closed_at is null);
  if not found then raise exception 'cannot_submit: ДЗ закрыто, уже сдано или не ваше'; end if;
end $$;

/* ── Попытки ───────────────────────────────────────────────────── */

create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  task_no smallint not null references public.ege_tasks (no),
  prototype_code text references public.bank_prototypes (code),
  -- Код задачи на сайте («П12-…»): какая именно задача решалась.
  task_ref text check (length(task_ref) <= 64),
  -- В тренажёре верность пока считает браузер (по отпечатку ответа):
  -- это прогресс ученика для себя. Работы с проверкой на сервере — С-5.
  outcome public.attempt_outcome not null,
  time_ms int check (time_ms between 0 and 3600000),
  homework_id uuid references public.homework (id) on delete set null,
  session_id text,
  solved_at timestamptz not null default now()
);
create index attempts_student_idx on public.attempts (user_id, solved_at desc);
create index attempts_homework_idx on public.attempts (homework_id, user_id) where homework_id is not null;

create or replace function public.record_attempt(
  p_task_no smallint, p_prototype_code text, p_task_ref text, p_outcome public.attempt_outcome,
  p_time_ms int, p_homework_id uuid, p_session_id text)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare v_id bigint;
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'forbidden: попытки пишет ученик' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(auth.uid()) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  if p_homework_id is not null and not exists (
    select 1 from public.homework_recipients where homework_id = p_homework_id and user_id = auth.uid()) then
    raise exception 'not_your_homework' using errcode = 'insufficient_privilege';
  end if;
  insert into public.attempts (user_id, task_no, prototype_code, task_ref, outcome, time_ms, homework_id, session_id)
  values (auth.uid(), p_task_no, p_prototype_code, p_task_ref, p_outcome,
          least(greatest(p_time_ms, 0), 3600000), p_homework_id, p_session_id)
  returning id into v_id;
  return v_id;
end $$;

-- Прогресс по номерам 1–20: считается из попыток, не хранится.
create view public.task_progress with (security_invoker = true) as
select user_id, task_no,
       count(*)::int as solved,
       (count(*) filter (where outcome = 'right'))::int as right_count,
       max(solved_at) as last_at
from public.attempts
group by user_id, task_no;

/* ── Сессии тренажёра ──────────────────────────────────────────── */

create table public.trainer_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Идентификатор тренировки из браузера (lib/trainerSession).
  id text not null check (length(id) between 1 and 64),
  -- Раздел: «8», «12:linear», «3:konus».
  scope text not null check (scope ~ '^[0-9]{1,2}(:[a-z0-9-]+)*$'),
  task_no smallint not null references public.ege_tasks (no),
  status public.session_status not null default 'active',
  total smallint not null default 0 check (total >= 0),
  solved smallint not null default 0 check (solved >= 0),
  active_ms bigint not null default 0 check (active_ms >= 0),
  -- Запись тренажёра целиком (задания упакованы, ответов нет) — чтобы
  -- продолжить на другом устройстве. После завершения не нужна.
  state jsonb check (state is null or octet_length(state::text) <= 300000),
  homework_id uuid references public.homework (id) on delete set null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (user_id, id),
  check ((status = 'finished') = (finished_at is not null))
);
-- Одна незавершённая тренировка на раздел — как в браузере.
create unique index trainer_sessions_open_idx on public.trainer_sessions (user_id, scope) where status <> 'finished';

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.profiles enable row level security;
alter table public.tutor_students enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.invitations enable row level security;
alter table public.ege_tasks enable row level security;
alter table public.bank_prototypes enable row level security;
alter table public.homework enable row level security;
alter table public.homework_items enable row level security;
alter table public.homework_recipients enable row level security;
alter table public.attempts enable row level security;
alter table public.trainer_sessions enable row level security;

-- В Supabase у anon и authenticated по умолчанию все права на таблицы
-- public: снимаем и выдаём только нужное.
revoke all on public.profiles, public.tutor_students, public.classes, public.class_members,
  public.invitations, public.ege_tasks, public.bank_prototypes, public.homework,
  public.homework_items, public.homework_recipients, public.attempts, public.trainer_sessions,
  public.task_progress
  from anon, authenticated;

grant select on public.ege_tasks, public.bank_prototypes to anon, authenticated;
create policy ege_tasks_read on public.ege_tasks for select to anon, authenticated using (true);
create policy bank_prototypes_read on public.bank_prototypes for select to anon, authenticated using (true);

grant select on public.profiles to authenticated;
grant update (display_name, grade) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_my_student(user_id) or public.is_my_tutor(user_id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.tutor_students to authenticated;
grant update (ended_at) on public.tutor_students to authenticated;
create policy tutor_students_read on public.tutor_students for select to authenticated
  using (tutor_id = auth.uid() or user_id = auth.uid() or public.is_admin());
create policy tutor_students_end on public.tutor_students for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

grant select on public.classes to authenticated;
grant insert (tutor_id, name) on public.classes to authenticated;
grant update (name, archived_at) on public.classes to authenticated;
create policy classes_read on public.classes for select to authenticated
  using (tutor_id = auth.uid() or public.is_admin() or public.in_class(id));
create policy classes_insert on public.classes for insert to authenticated
  with check (tutor_id = auth.uid() and public.my_role() = 'tutor');
create policy classes_update on public.classes for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

grant select, insert, delete on public.class_members to authenticated;
create policy class_members_read on public.class_members for select to authenticated
  using (user_id = auth.uid() or public.owns_class(class_id) or public.is_admin());
create policy class_members_insert on public.class_members for insert to authenticated
  with check (public.owns_class(class_id) and public.is_my_student(user_id));
create policy class_members_delete on public.class_members for delete to authenticated
  using (public.owns_class(class_id));

-- Хеш кода не нужен никому, кроме триггера регистрации.
grant select (id, role, created_by, tutor_id, class_id, created_at, expires_at, used_at, used_by, revoked_at)
  on public.invitations to authenticated;
create policy invitations_read on public.invitations for select to authenticated
  using (created_by = auth.uid() or public.is_admin());

grant select on public.homework to authenticated;
grant update (title, note, due_at, closed_at) on public.homework to authenticated;
create policy homework_read on public.homework for select to authenticated
  using (public.can_see_homework(id));
create policy homework_update on public.homework for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

grant select on public.homework_items to authenticated;
create policy homework_items_read on public.homework_items for select to authenticated
  using (public.can_see_homework(homework_id));

grant select on public.homework_recipients to authenticated;
create policy homework_recipients_read on public.homework_recipients for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.homework h where h.id = homework_id and h.tutor_id = auth.uid()));

grant select on public.attempts, public.task_progress to authenticated;
create policy attempts_read on public.attempts for select to authenticated
  using (user_id = auth.uid() or public.is_my_student(user_id) or public.is_admin());

grant select, insert, update, delete on public.trainer_sessions to authenticated;
create policy trainer_sessions_own on public.trainer_sessions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.my_role() = 'student' and public.can_save_progress(user_id));

-- Функции: вошедшим — рабочие, служебные — никому снаружи.
revoke execute on function public.handle_new_user_invite() from public, anon, authenticated;
revoke execute on function public.check_tutor_student_roles() from public, anon, authenticated;
revoke execute on function public.check_class_member() from public, anon, authenticated;
revoke execute on function public.create_invitation(public.app_role, uuid) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.issue_homework(text, text, timestamptz, uuid, uuid[], jsonb) from public, anon;
revoke execute on function public.start_homework(uuid) from public, anon;
revoke execute on function public.submit_homework(uuid) from public, anon;
revoke execute on function public.record_attempt(smallint, text, text, public.attempt_outcome, int, uuid, text) from public, anon;
grant execute on function public.create_invitation(public.app_role, uuid) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.issue_homework(text, text, timestamptz, uuid, uuid[], jsonb) to authenticated;
grant execute on function public.start_homework(uuid) to authenticated;
grant execute on function public.submit_homework(uuid) to authenticated;
grant execute on function public.record_attempt(smallint, text, text, public.attempt_outcome, int, uuid, text) to authenticated;
