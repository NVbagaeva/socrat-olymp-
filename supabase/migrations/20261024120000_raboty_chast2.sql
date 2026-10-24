-- Работы-варианты с частью 2: выдача варианта, ответы, фото решений,
-- автопроверка, проверка учителем по критериям, история баллов,
-- уведомления. План и экраны — docs/chast2-onlayn.md.
--
-- Опирается на миграцию кабинета (20261015120000_kabinet.sql): роли,
-- is_my_student, owns_class, can_save_progress. Писать можно только
-- через функции ниже (security definer, роль проверяется в функции);
-- прямой записи в таблицы у anon и authenticated нет.
--
-- Фото решений — персональные данные ученика: файлы лежат в приватном
-- бакете Yandex Object Storage (Россия), в базе — только ключ объекта.
-- Сами файлы кладёт и отдаёт по временной подписанной ссылке сервис
-- загрузки (infra/lite/uploads) — под service_role, после проверки
-- права функцией can_read_photo. Публичных ссылок нет.
--
-- Ключи ответов (variant_keys) — без чтения для anon и authenticated:
-- верные ответы не покидают сервер до проверки. Таблицу заполняет
-- сборка при развёртывании (pnpm build:variant-keys), в git ключей нет.

/* ── Баллы и шкала: те же числа, что в content/variantOnline ─────── */

-- Максимальные баллы по заданиям. Сверяется с bally.ts (pnpm test:chast2).
create table public.max_bally (
  task_no smallint primary key check (task_no between 1 and 20),
  max smallint not null check (max between 1 and 4)
);
insert into public.max_bally (task_no, max) values
  (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
  (11, 1), (12, 1), (13, 1), (14, 2), (15, 3), (16, 2), (17, 2), (18, 3), (19, 4), (20, 4);

-- Примерная шкала перевода (shkala.ts): первичный 0…33 → тестовый.
create table public.shkala (
  pervichnyy smallint primary key check (pervichnyy between 0 and 33),
  testovyy smallint not null check (testovyy between 0 and 100)
);
insert into public.shkala (pervichnyy, testovyy)
select i - 1, v from unnest(array[
  0, 6, 11, 16, 21, 26, 33, 39, 45, 50, 56, 62, 68, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91,
  93, 94, 95, 96, 97, 98, 99, 100, 100, 100]) with ordinality as t(v, i);

/* ── Выданные варианты ─────────────────────────────────────────── */

create type public.part2_mode as enum ('teacher', 'self');
create type public.submission_status as enum ('draft', 'submitted', 'checking', 'checked', 'returned');
create type public.auto_check as enum ('sovpadaet', 'ne-sovpadaet', 'uchitel');

create table public.variant_works (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 120),
  note text check (length(note) <= 2000),
  -- Код набора на сайте («PV-07» — вариант повышенной сложности 7) и версия.
  variant_code text not null check (variant_code ~ '^[A-Z0-9-]{2,40}$'),
  versiya smallint not null check (versiya between 1 and 10),
  -- Часть 2: проверяет учитель по фото или ученик сам по критериям.
  part2_mode public.part2_mode not null default 'teacher',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index variant_works_tutor_idx on public.variant_works (tutor_id, created_at desc);

create table public.variant_work_recipients (
  work_id uuid not null references public.variant_works (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  -- Продление срока для этого ученика (вручную учителем).
  due_override timestamptz,
  primary key (work_id, user_id)
);
create index variant_work_recipients_student_idx on public.variant_work_recipients (user_id);

-- Верные ответы версии: часть 1 — запись бланка («-2.25»), часть 2 —
-- поле автопроверки (lib/chast2/sravnenie.ts, тип Pole) по пунктам.
create table public.variant_keys (
  variant_code text not null,
  versiya smallint not null,
  task_no smallint not null references public.ege_tasks (no),
  punkt text not null default '',
  pole jsonb not null,
  primary key (variant_code, versiya, task_no, punkt)
);

/* ── Работа ученика ────────────────────────────────────────────── */

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.variant_works (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.submission_status not null default 'draft',
  submitted_at timestamptz,
  checked_at timestamptz,
  checked_by uuid, -- кто (без ссылки: удаление учителя историю не трогает)
  general_comment text check (length(general_comment) <= 4000),
  unique (work_id, user_id)
);
create index submissions_status_idx on public.submissions (work_id, status);

-- Ответ ученика по заданию и пункту. Поле auto пишет сервис проверки
-- (он один знает ключи части 2): ученику оно не доступно для записи.
create table public.submission_answers (
  submission_id uuid not null references public.submissions (id) on delete cascade,
  task_no smallint not null references public.ege_tasks (no),
  punkt text not null default '',
  -- Ученик: строка (число, выражение), массив строк (корни, серии),
  -- {"kuski": […]} (промежутки), "da"/"net".
  vvod jsonb not null check (octet_length(vvod::text) <= 4000),
  auto public.auto_check,
  updated_at timestamptz not null default now(),
  primary key (submission_id, task_no, punkt)
);

-- Фото решения: файл в бакете, здесь — ключ и порядок.
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  task_no smallint not null check (task_no between 14 and 20),
  position smallint not null check (position between 1 and 6),
  object_key text not null unique check (object_key ~ '^raboty/[0-9a-f-]{36}/[0-9]{2}/[0-9a-f-]{36}\.jpg$'),
  bytes int not null check (bytes between 1 and 3000000),
  width smallint not null check (width between 1 and 4000),
  height smallint not null check (height between 1 and 4000),
  created_at timestamptz not null default now(),
  -- Срок хранения (по умолчанию — конец учебного года); после — удаление
  -- файла сервисом и строки здесь. Баллы и комментарии остаются.
  expires_at timestamptz not null
);
create unique index photos_position_idx on public.photos (submission_id, task_no, position);

-- Пометки учителя на фото — отдельный слой (векторы), оригинал не трогается.
create table public.photo_marks (
  photo_id uuid primary key references public.photos (id) on delete cascade,
  -- {"v":1,"items":[{"t":"pen","pts":[[x,y],…]},{"t":"ok","x":…,"y":…},{"t":"no",…},{"t":"text","x":…,"y":…,"s":"…"}]}
  layer jsonb not null check (octet_length(layer::text) <= 200000),
  updated_by uuid, -- кто (без ссылки: удаление учителя историю не трогает)
  updated_at timestamptz not null default now()
);

-- Балл по заданию. Часть 1 — автоматически при сдаче (manual — правка
-- учителя), часть 2 — учитель по критериям.
create table public.grades (
  submission_id uuid not null references public.submissions (id) on delete cascade,
  task_no smallint not null references public.max_bally (task_no),
  ball smallint not null check (ball >= 0),
  -- Строка критериев (номер сверху, с нуля) и вариант «ИЛИ» в ней.
  kriteriy smallint check (kriteriy between 0 and 9),
  kriteriy_ili smallint check (kriteriy_ili between 0 and 9),
  -- Нет ни ответа, ни фото: 0 «не приступал» (учитель может изменить).
  ne_pristupal boolean not null default false,
  -- Часть 1: учитель засчитал или снял балл вручную — видно ученику.
  vruchnuyu boolean not null default false,
  -- Вернуто на доработку: ученик может заменить ответ и фото задания.
  na_dorabotke boolean not null default false,
  comment text check (length(comment) <= 2000),
  updated_by uuid, -- кто (без ссылки: удаление учителя историю не трогает)
  updated_at timestamptz not null default now(),
  primary key (submission_id, task_no)
);

-- Балл не больше максимума задания.
create or replace function public.check_grade_max()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_max smallint;
begin
  select max into v_max from public.max_bally where task_no = new.task_no;
  if new.ball > v_max then
    raise exception 'ball_over_max: за №% не больше % балл.', new.task_no, v_max using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger grades_max before insert or update on public.grades
  for each row execute function public.check_grade_max();

-- История баллов: кто, когда, было → стало и почему.
create table public.grade_history (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  task_no smallint,
  old_ball smallint,
  new_ball smallint,
  -- 'auto' (сдача), 'grade' (учитель), 'part1' (ручная правка части 1),
  -- 'reopen' (повторное открытие), 'finish' (проверка завершена), 'return' (доработка).
  reason text not null check (reason in ('auto', 'grade', 'part1', 'reopen', 'finish', 'return')),
  changed_by uuid, -- кто (без ссылки: удаление учителя историю не трогает)
  changed_at timestamptz not null default now()
);
create index grade_history_sub_idx on public.grade_history (submission_id, changed_at);

create or replace function public.log_grade()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.ball is not distinct from old.ball
     and new.vruchnuyu = old.vruchnuyu then
    return new;
  end if;
  insert into public.grade_history (submission_id, task_no, old_ball, new_ball, reason, changed_by)
  values (new.submission_id, new.task_no,
          case when tg_op = 'UPDATE' then old.ball end, new.ball,
          coalesce(nullif(current_setting('budetege.grade_reason', true), ''), 'grade'),
          auth.uid());
  return new;
end $$;
create trigger grades_log after insert or update on public.grades
  for each row execute function public.log_grade();

/* ── Уведомления в кабинете ────────────────────────────────────── */

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'work_issued', 'work_checked', 'work_regraded', 'task_returned', 'work_submitted'
  kind text not null check (length(kind) <= 40),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

/* ── Кто что видит ─────────────────────────────────────────────── */

create or replace function public.owns_work(p_work uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.variant_works where id = p_work and tutor_id = auth.uid()) $$;

create or replace function public.can_see_work(p_work uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_admin() or public.owns_work(p_work)
      or exists (select 1 from public.variant_work_recipients where work_id = p_work and user_id = auth.uid())
$$;

-- Проверяющий работы: учитель, выдавший её, и только пока ведёт ученика.
create or replace function public.checks_submission(p_sub uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.submissions s join public.variant_works w on w.id = s.work_id
     where s.id = p_sub and w.tutor_id = auth.uid() and public.is_my_student(s.user_id))
$$;

create or replace function public.own_submission(p_sub uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.submissions where id = p_sub and user_id = auth.uid()) $$;

-- Право на фото для сервиса загрузки (он работает под service_role и
-- передаёт пользователя из проверенного JWT): ученик — свои, учитель —
-- работ, которые проверяет. Администратор фото не видит.
create or replace function public.can_read_photo(p_photo uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.photos p
      join public.submissions s on s.id = p.submission_id
      join public.variant_works w on w.id = s.work_id
     where p.id = p_photo
       and (s.user_id = p_user
            or (w.tutor_id = p_user and exists (
                  select 1 from public.tutor_students ts
                   where ts.tutor_id = p_user and ts.user_id = s.user_id and ts.ended_at is null))))
$$;

/* ── Сроки ─────────────────────────────────────────────────────── */

-- Срок сдачи для ученика: продление или срок работы; null — без срока.
create or replace function public.work_deadline(p_work uuid, p_user uuid)
returns timestamptz
language sql stable security definer set search_path = ''
as $$
  select coalesce(r.due_override, w.due_at)
    from public.variant_works w
    left join public.variant_work_recipients r on r.work_id = w.id and r.user_id = p_user
   where w.id = p_work
$$;

-- Конец учебного года (31 августа) после даты — срок хранения фото по умолчанию.
create or replace function public.konets_uchebnogo_goda(p_at timestamptz)
returns timestamptz
language sql immutable
as $$
  select make_timestamptz(
    extract(year from p_at)::int + case when extract(month from p_at) >= 9 then 1 else 0 end,
    8, 31, 23, 59, 59, 'Europe/Moscow')
$$;

/* ── Функции: учитель выдаёт ───────────────────────────────────── */

create or replace function public.issue_variant_work(
  p_title text, p_note text, p_due_at timestamptz, p_class_id uuid, p_students uuid[],
  p_variant_code text, p_versiya smallint, p_part2_mode public.part2_mode)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_student uuid;
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'forbidden: вариант выдаёт репетитор' using errcode = 'insufficient_privilege';
  end if;
  if p_class_id is not null and not public.owns_class(p_class_id) then
    raise exception 'forbidden: чужой класс' using errcode = 'insufficient_privilege';
  end if;
  if p_due_at is not null and p_due_at <= now() then
    raise exception 'bad_due: срок уже прошёл' using errcode = 'check_violation';
  end if;
  insert into public.variant_works (tutor_id, class_id, title, note, variant_code, versiya, part2_mode, due_at)
  values (auth.uid(), p_class_id, trim(p_title), nullif(trim(p_note), ''), p_variant_code, p_versiya,
          coalesce(p_part2_mode, 'teacher'), p_due_at)
  returning id into v_id;
  for v_student in
    select user_id from public.class_members where class_id = p_class_id
    union
    select unnest(coalesce(p_students, '{}'))
  loop
    if not public.is_my_student(v_student) then
      raise exception 'not_your_student' using errcode = 'insufficient_privilege';
    end if;
    insert into public.variant_work_recipients (work_id, user_id) values (v_id, v_student)
    on conflict do nothing;
    insert into public.notifications (user_id, kind, payload)
    values (v_student, 'work_issued', jsonb_build_object('work_id', v_id, 'title', trim(p_title)));
  end loop;
  if not exists (select 1 from public.variant_work_recipients where work_id = v_id) then
    raise exception 'no_recipients: некому выдать' using errcode = 'check_violation';
  end if;
  return v_id;
end $$;

-- Продлить срок: всем (p_user null) или одному ученику.
create or replace function public.extend_work(p_work uuid, p_until timestamptz, p_user uuid default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.owns_work(p_work) then
    raise exception 'forbidden: чужая работа' using errcode = 'insufficient_privilege';
  end if;
  if p_until <= now() then
    raise exception 'bad_due: срок уже прошёл' using errcode = 'check_violation';
  end if;
  if p_user is null then
    update public.variant_works set due_at = p_until where id = p_work;
  else
    update public.variant_work_recipients set due_override = p_until
     where work_id = p_work and user_id = p_user;
    if not found then raise exception 'not_recipient'; end if;
  end if;
end $$;

/* ── Функции: ученик решает ────────────────────────────────────── */

-- Работа ученика (создаётся при первом ответе).
create or replace function public.my_submission(p_work uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if public.my_role() is distinct from 'student'
     or not exists (select 1 from public.variant_work_recipients where work_id = p_work and user_id = auth.uid()) then
    raise exception 'not_your_work' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(auth.uid()) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  insert into public.submissions (work_id, user_id) values (p_work, auth.uid())
  on conflict (work_id, user_id) do nothing;
  select id into v_id from public.submissions where work_id = p_work and user_id = auth.uid();
  return v_id;
end $$;

-- Можно ли сейчас менять задание: черновик до срока или задание на доработке.
create or replace function public.can_edit_task(p_sub uuid, p_task smallint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.submissions s
     where s.id = p_sub and s.user_id = auth.uid()
       and (
         (s.status = 'draft'
           and coalesce(public.work_deadline(s.work_id, s.user_id) > now(), true)
           and exists (select 1 from public.variant_works w where w.id = s.work_id and w.closed_at is null))
         or (s.status = 'returned' and exists (
               select 1 from public.grades g
                where g.submission_id = s.id and g.task_no = p_task and g.na_dorabotke))))
$$;

create or replace function public.save_answer(p_work uuid, p_task smallint, p_punkt text, p_vvod jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_sub uuid := public.my_submission(p_work);
begin
  if not public.can_edit_task(v_sub, p_task) then
    raise exception 'closed: срок прошёл или работа сдана' using errcode = 'insufficient_privilege';
  end if;
  insert into public.submission_answers (submission_id, task_no, punkt, vvod)
  values (v_sub, p_task, coalesce(p_punkt, ''), p_vvod)
  on conflict (submission_id, task_no, punkt)
  do update set vvod = excluded.vvod, auto = null, updated_at = now();
end $$;

-- Запись бланка части 1 → число для сравнения; null — записано не по правилам.
create or replace function public.ege_chislo(p text)
returns numeric
language sql immutable
as $$
  select case
    when p is null then null
    when replace(replace(replace(trim(p), '−', '-'), '–', '-'), ',', '.') ~ '^-?[0-9]+(\.[0-9]+)?$'
      then trim_scale(replace(replace(replace(trim(p), '−', '-'), '–', '-'), ',', '.')::numeric)
  end
$$;

-- Сдать работу: часть 1 проверяется сразу, задания части 2 без ответа и
-- без фото получают 0 «не приступал». Повторная сдача после доработки —
-- только снимает отметку «на доработке».
create or replace function public.submit_work(p_work uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_sub uuid := public.my_submission(p_work);
  v_status public.submission_status;
  v_w public.variant_works;
begin
  select status into v_status from public.submissions where id = v_sub;
  select * into v_w from public.variant_works where id = p_work;
  if v_status = 'returned' then
    perform set_config('budetege.grade_reason', 'return', true);
    update public.grades set na_dorabotke = false where submission_id = v_sub and na_dorabotke;
    update public.submissions set status = 'submitted', submitted_at = now() where id = v_sub;
  elsif v_status = 'draft' then
    if not coalesce(public.work_deadline(p_work, auth.uid()) > now(), true) or v_w.closed_at is not null then
      raise exception 'closed: срок сдачи прошёл' using errcode = 'insufficient_privilege';
    end if;
    update public.submissions set status = 'submitted', submitted_at = now() where id = v_sub;
    perform set_config('budetege.grade_reason', 'auto', true);
    -- Часть 1: ответ совпал с ключом по значению — балл задания.
    insert into public.grades (submission_id, task_no, ball)
    select v_sub, k.task_no,
           case when public.ege_chislo(a.vvod #>> '{}') = public.ege_chislo(k.pole #>> '{}')
                then m.max else 0 end
      from public.variant_keys k
      join public.max_bally m on m.task_no = k.task_no
      left join public.submission_answers a
        on a.submission_id = v_sub and a.task_no = k.task_no and a.punkt = ''
     where k.variant_code = v_w.variant_code and k.versiya = v_w.versiya and k.task_no <= 13;
    -- Часть 2 при проверке учителем: нет ни ответа, ни фото — 0 «не приступал».
    if v_w.part2_mode = 'teacher' then
      insert into public.grades (submission_id, task_no, ball, ne_pristupal)
      select v_sub, t.no, 0, true
        from generate_series(14, 20) as t(no)
       where not exists (select 1 from public.submission_answers a where a.submission_id = v_sub and a.task_no = t.no)
         and not exists (select 1 from public.photos p where p.submission_id = v_sub and p.task_no = t.no);
    end if;
  else
    raise exception 'already_submitted: работа уже сдана' using errcode = 'check_violation';
  end if;
  insert into public.notifications (user_id, kind, payload)
  values (v_w.tutor_id, 'work_submitted', jsonb_build_object('work_id', p_work, 'submission_id', v_sub));
end $$;

/* ── Функции: учитель проверяет ────────────────────────────────── */

create or replace function public.require_checker(p_sub uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.checks_submission(p_sub) then
    raise exception 'forbidden: это не ваша работа на проверку' using errcode = 'insufficient_privilege';
  end if;
end $$;

-- Взять работу в проверку (сданную) или открыть проверенную снова.
create or replace function public.start_check(p_sub uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_status public.submission_status;
begin
  perform public.require_checker(p_sub);
  select status into v_status from public.submissions where id = p_sub;
  if v_status = 'checked' then
    insert into public.grade_history (submission_id, reason, changed_by) values (p_sub, 'reopen', auth.uid());
  elsif v_status not in ('submitted', 'checking') then
    raise exception 'not_submitted: работа ещё не сдана' using errcode = 'check_violation';
  end if;
  update public.submissions set status = 'checking' where id = p_sub;
end $$;

-- Балл за задание 14–20 (кнопка 0…макс. или строка критериев).
create or replace function public.set_grade(
  p_sub uuid, p_task smallint, p_ball smallint, p_kriteriy smallint, p_ili smallint, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_checker(p_sub);
  if p_task not between 14 and 20 then
    raise exception 'part2_only: балл части 1 — через override_part1' using errcode = 'check_violation';
  end if;
  if (select status from public.submissions where id = p_sub) <> 'checking' then
    raise exception 'not_checking: сначала откройте проверку' using errcode = 'check_violation';
  end if;
  perform set_config('budetege.grade_reason', 'grade', true);
  insert into public.grades (submission_id, task_no, ball, kriteriy, kriteriy_ili, comment, updated_by, updated_at)
  values (p_sub, p_task, p_ball, p_kriteriy, p_ili, nullif(trim(p_comment), ''), auth.uid(), now())
  on conflict (submission_id, task_no) do update
    set ball = excluded.ball, kriteriy = excluded.kriteriy, kriteriy_ili = excluded.kriteriy_ili,
        comment = excluded.comment, ne_pristupal = false, updated_by = auth.uid(), updated_at = now();
end $$;

-- Часть 1: засчитать или снять балл вручную (другая допустимая форма ответа).
create or replace function public.override_part1(p_sub uuid, p_task smallint, p_right boolean, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_checker(p_sub);
  if p_task not between 1 and 13 then
    raise exception 'part1_only' using errcode = 'check_violation';
  end if;
  if (select status from public.submissions where id = p_sub) <> 'checking' then
    raise exception 'not_checking: сначала откройте проверку' using errcode = 'check_violation';
  end if;
  perform set_config('budetege.grade_reason', 'part1', true);
  insert into public.grades (submission_id, task_no, ball, vruchnuyu, comment, updated_by)
  values (p_sub, p_task, case when p_right then 1 else 0 end, true, nullif(trim(p_comment), ''), auth.uid())
  on conflict (submission_id, task_no) do update
    set ball = excluded.ball, vruchnuyu = true, comment = excluded.comment,
        updated_by = auth.uid(), updated_at = now();
end $$;

-- Вернуть задание на доработку.
create or replace function public.return_task(p_sub uuid, p_task smallint, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid;
begin
  perform public.require_checker(p_sub);
  perform set_config('budetege.grade_reason', 'return', true);
  insert into public.grades (submission_id, task_no, ball, na_dorabotke, comment, updated_by)
  values (p_sub, p_task, 0, true, nullif(trim(p_comment), ''), auth.uid())
  on conflict (submission_id, task_no) do update
    set na_dorabotke = true, comment = excluded.comment, updated_by = auth.uid(), updated_at = now();
  update public.submissions set status = 'returned' where id = p_sub returning user_id into v_user;
  insert into public.notifications (user_id, kind, payload)
  values (v_user, 'task_returned', jsonb_build_object('submission_id', p_sub, 'task_no', p_task));
end $$;

-- Завершить проверку: только когда оценены все задания 14–20.
create or replace function public.finish_check(p_sub uuid, p_comment text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_left text;
  v_user uuid;
  v_reopened boolean;
begin
  perform public.require_checker(p_sub);
  if (select status from public.submissions where id = p_sub) <> 'checking' then
    raise exception 'not_checking: сначала откройте проверку' using errcode = 'check_violation';
  end if;
  select string_agg('№' || t.no, ', ' order by t.no) into v_left
    from generate_series(14, 20) as t(no)
   where not exists (select 1 from public.grades g where g.submission_id = p_sub and g.task_no = t.no and not g.na_dorabotke);
  if v_left is not null then
    raise exception 'not_graded: не оценены %', v_left using errcode = 'check_violation';
  end if;
  v_reopened := exists (select 1 from public.grade_history where submission_id = p_sub and reason = 'reopen');
  update public.submissions
     set status = 'checked', checked_at = now(), checked_by = auth.uid(),
         general_comment = coalesce(nullif(trim(p_comment), ''), general_comment)
   where id = p_sub
  returning user_id into v_user;
  insert into public.grade_history (submission_id, reason, changed_by) values (p_sub, 'finish', auth.uid());
  insert into public.notifications (user_id, kind, payload)
  values (v_user, case when v_reopened then 'work_regraded' else 'work_checked' end,
          jsonb_build_object('submission_id', p_sub) || public.submission_score_json(p_sub));
end $$;

-- Пометки учителя на фото.
create or replace function public.save_photo_marks(p_photo uuid, p_layer jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_sub uuid;
begin
  select submission_id into v_sub from public.photos where id = p_photo;
  perform public.require_checker(v_sub);
  insert into public.photo_marks (photo_id, layer, updated_by) values (p_photo, p_layer, auth.uid())
  on conflict (photo_id) do update set layer = excluded.layer, updated_by = auth.uid(), updated_at = now();
end $$;

/* ── Баллы работы — считаются, не хранятся ─────────────────────── */

create or replace function public.submission_score_json(p_sub uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with g as (
    select coalesce(sum(ball) filter (where task_no <= 13), 0)::int as p1,
           coalesce(sum(ball) filter (where task_no >= 14), 0)::int as p2,
           count(*) filter (where task_no >= 14 and not na_dorabotke)::int as graded2
      from public.grades where submission_id = p_sub
  )
  select jsonb_build_object(
    'part1', g.p1, 'part2', g.p2, 'total', g.p1 + g.p2,
    'max1', 13, 'max2', 20, 'max', 33,
    'ungraded2', 7 - g.graded2,
    -- Тестовый балл — только у проверенной работы (часть 2 — учителем).
    'test', case when s.status = 'checked' then (select testovyy from public.shkala where pervichnyy = g.p1 + g.p2) end)
  from g, public.submissions s where s.id = p_sub
$$;

create view public.submission_scores with (security_invoker = true) as
select s.id as submission_id, s.work_id, s.user_id, s.status,
       public.submission_score_json(s.id) as score
  from public.submissions s;

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.max_bally enable row level security;
alter table public.shkala enable row level security;
alter table public.variant_works enable row level security;
alter table public.variant_work_recipients enable row level security;
alter table public.variant_keys enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.photos enable row level security;
alter table public.photo_marks enable row level security;
alter table public.grades enable row level security;
alter table public.grade_history enable row level security;
alter table public.notifications enable row level security;

revoke all on public.max_bally, public.shkala, public.variant_works, public.variant_work_recipients,
  public.variant_keys, public.submissions, public.submission_answers, public.photos,
  public.photo_marks, public.grades, public.grade_history, public.notifications,
  public.submission_scores
  from anon, authenticated;

grant select on public.max_bally, public.shkala to anon, authenticated;
create policy max_bally_read on public.max_bally for select to anon, authenticated using (true);
create policy shkala_read on public.shkala for select to anon, authenticated using (true);

-- Ключи ответов: только сервер (service_role), политик для людей нет.

grant select on public.variant_works to authenticated;
grant update (title, note, closed_at) on public.variant_works to authenticated;
create policy variant_works_read on public.variant_works for select to authenticated
  using (public.can_see_work(id));
create policy variant_works_update on public.variant_works for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

grant select on public.variant_work_recipients to authenticated;
create policy variant_work_recipients_read on public.variant_work_recipients for select to authenticated
  using (user_id = auth.uid() or public.owns_work(work_id) or public.is_admin());

grant select on public.submissions to authenticated;
create policy submissions_read on public.submissions for select to authenticated
  using (user_id = auth.uid() or public.checks_submission(id));

grant select on public.submission_answers to authenticated;
create policy submission_answers_read on public.submission_answers for select to authenticated
  using (public.own_submission(submission_id) or public.checks_submission(submission_id));

-- Фото: метаданные — ученику свои, учителю — проверяемых работ. Файл —
-- только по подписанной ссылке сервиса загрузки.
grant select (id, submission_id, task_no, position, bytes, width, height, created_at, expires_at)
  on public.photos to authenticated;
create policy photos_read on public.photos for select to authenticated
  using (public.own_submission(submission_id) or public.checks_submission(submission_id));

-- Пометки ученик видит только у проверенной работы.
grant select on public.photo_marks to authenticated;
create policy photo_marks_read on public.photo_marks for select to authenticated
  using (exists (
    select 1 from public.photos p join public.submissions s on s.id = p.submission_id
     where p.id = photo_id
       and (public.checks_submission(s.id) or (s.user_id = auth.uid() and s.status = 'checked'))));

-- Баллы: учитель — всегда; ученик — часть 1 после сдачи, часть 2 — после проверки.
grant select on public.grades to authenticated;
create policy grades_read on public.grades for select to authenticated
  using (public.checks_submission(submission_id) or exists (
    select 1 from public.submissions s
     where s.id = submission_id and s.user_id = auth.uid()
       and (s.status = 'checked' or task_no <= 13 or na_dorabotke)));

grant select on public.grade_history to authenticated;
create policy grade_history_read on public.grade_history for select to authenticated
  using (public.checks_submission(submission_id) or exists (
    select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid() and s.status = 'checked'));

grant select, update (read_at) on public.notifications to authenticated;
create policy notifications_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_mark on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.submission_scores to authenticated;

-- Функции этой миграции: снаружи (public, anon) — ничего; рабочие —
-- вошедшим; право на файл фото — только сервису.
do $$
declare f text;
begin
  foreach f in array array[
    'issue_variant_work(text,text,timestamptz,uuid,uuid[],text,smallint,public.part2_mode)',
    'extend_work(uuid,timestamptz,uuid)', 'my_submission(uuid)', 'save_answer(uuid,smallint,text,jsonb)',
    'submit_work(uuid)', 'start_check(uuid)', 'set_grade(uuid,smallint,smallint,smallint,smallint,text)',
    'override_part1(uuid,smallint,boolean,text)', 'return_task(uuid,smallint,text)',
    'finish_check(uuid,text)', 'save_photo_marks(uuid,jsonb)', 'submission_score_json(uuid)',
    'can_edit_task(uuid,smallint)', 'ege_chislo(text)', 'konets_uchebnogo_goda(timestamptz)',
    'owns_work(uuid)', 'can_see_work(uuid)', 'checks_submission(uuid)', 'own_submission(uuid)',
    'work_deadline(uuid,uuid)', 'require_checker(uuid)', 'can_read_photo(uuid,uuid)',
    'check_grade_max()', 'log_grade()']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
  end loop;
  foreach f in array array[
    'issue_variant_work(text,text,timestamptz,uuid,uuid[],text,smallint,public.part2_mode)',
    'extend_work(uuid,timestamptz,uuid)', 'my_submission(uuid)', 'save_answer(uuid,smallint,text,jsonb)',
    'submit_work(uuid)', 'start_check(uuid)', 'set_grade(uuid,smallint,smallint,smallint,smallint,text)',
    'override_part1(uuid,smallint,boolean,text)', 'return_task(uuid,smallint,text)',
    'finish_check(uuid,text)', 'save_photo_marks(uuid,jsonb)', 'submission_score_json(uuid)',
    'can_edit_task(uuid,smallint)', 'ege_chislo(text)', 'konets_uchebnogo_goda(timestamptz)']
  loop
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  -- Функции, которые зовут политики и сервис, вошедшим тоже нужны.
  foreach f in array array['owns_work(uuid)', 'can_see_work(uuid)', 'checks_submission(uuid)',
                           'own_submission(uuid)', 'work_deadline(uuid,uuid)', 'require_checker(uuid)']
  loop
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke execute on function public.check_grade_max() from authenticated;
revoke execute on function public.log_grade() from authenticated;
-- Право на файл фото проверяет только сервис загрузки.
revoke execute on function public.can_read_photo(uuid, uuid) from authenticated;
grant execute on function public.can_read_photo(uuid, uuid) to service_role;
grant select, insert, update, delete on public.photos, public.variant_keys, public.submission_answers
  to service_role;
