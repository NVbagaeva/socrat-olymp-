-- Устный счёт: рейтинговые тренировки, ники и общий рейтинг.
-- Раздел — app/src/lib/ustnyySchet и /ustnyy-schet/ на сайте.
--
-- В рейтинг попадает только то, что проверил сервер:
--   - примеры рейтинговой тренировки создаёт база (ustnyy_vydat): правила
--     подбора чисел — те же, что у генераторов форматов на сайте
--     (lib/ustnyySchet/formaty.ts), сверка — по одной таблице диапазонов
--     (formatyCases.json, тест ustnyy-schet.test.sql);
--   - верные ответы лежат в ustnyy_items, которую клиент не читает вовсе:
--     ответ на пример уходит ученику только в ответе ustnyy_answer, после
--     того как он ответил;
--   - время считает сервер: старт, каждый ответ и финиш — по now();
--     ответ позже срока (+2 с на сеть) не засчитывается, слишком быстрые
--     результаты (в среднем меньше 0,3 с на пример) отбрасываются;
--   - прямой insert и update в таблицы тренировок запрещён: писать можно
--     только через функции security definer, как в homework_check;
--   - рейтинговых стартов — не больше 30 в час.
--
-- В рейтинге — только ник (ustnyy_profiles), никогда display_name и
-- почта. Ник по умолчанию случайный («Быстрый Енот 27»), свой — после
-- проверки длины и фильтра слов; администратор может сбросить ник.
-- Показ в общем рейтинге выключается учеником в любой момент. Участвуют
-- только ученики с нужными согласиями (can_save_progress). В рейтинге
-- класса одноклассники видят ники, репетитор класса — ещё и имена.
--
-- Колонка user_id — владелец строки: по ней работают export_my_data()
-- и каскадное удаление аккаунта (миграция согласий). Выгрузка не отдаёт
-- ответы на примеры, на которые ученик ещё не ответил.

/* ── Форматы ───────────────────────────────────────────────────── */

create table public.ustnyy_formats (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  tip text not null check (tip in ('vremya', 'seriya')),
  sek int check (sek between 10 and 600),
  n int check (n between 5 and 100),
  check ((tip = 'vremya') = (sek is not null) and (tip = 'seriya') = (n is not null))
);
comment on table public.ustnyy_formats is
  'Рейтинговые форматы устного счёта. Сайт: lib/ustnyySchet/formaty.ts.';

insert into public.ustnyy_formats (id, tip, sek, n) values
  ('tablica-1m', 'vremya', 60, null),
  ('slozh-vych-100-1m', 'vremya', 60, null),
  ('umn-del-2x1-2m', 'vremya', 120, null),
  ('kvadraty-20', 'seriya', null, 20),
  ('miks-ege-3m', 'vremya', 180, null),
  ('vyzov-dnya', 'seriya', null, 20);

/* ── Ники ──────────────────────────────────────────────────────── */

create table public.ustnyy_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 3 and 24),
  nick_auto boolean not null default true,
  -- Показывать в общем рейтинге: по умолчанию да, с автоматическим ником.
  pokazyvat boolean not null default true,
  updated_at timestamptz not null default now()
);
create unique index ustnyy_profiles_nick_idx on public.ustnyy_profiles (lower(nick));
comment on table public.ustnyy_profiles is
  'Ник и показ в рейтинге устного счёта. Ник отдельно от display_name: в рейтинге видно только его.';

-- Корни слов, которых не должно быть в нике. Таблицу читают только функции.
create table public.ustnyy_bad_words (root text primary key check (root = lower(root)));
comment on table public.ustnyy_bad_words is
  'Фильтр ников устного счёта: подстроки после приведения похожих букв и цифр.';
insert into public.ustnyy_bad_words (root) values
  ('хуй'), ('хуе'), ('хуя'), ('хую'), ('хуи'), ('пизд'), ('ебат'), ('ебан'), ('ебал'), ('ебло'),
  ('ебну'), ('ебуч'), ('ёб'), ('бля'), ('сука'), ('суки'), ('мудак'), ('мудил'), ('пидор'), ('пидар'),
  ('педик'), ('гандон'), ('залуп'), ('дроч'), ('шлюх'), ('говн'), ('жопа'), ('шалав'), ('нацист'),
  ('гитлер'), ('fuck'), ('shit'), ('bitch'), ('cunt'), ('dick'), ('porn'), ('nazi'), ('hitler'), ('admin'),
  ('админ'), ('модератор');

/* ── Тренировки и примеры ──────────────────────────────────────── */

create table public.ustnyy_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  format text not null references public.ustnyy_formats (id),
  seed bigint not null,
  -- День «Вызова дня» (по Москве); у остальных форматов — день старта.
  den date not null,
  started_at timestamptz not null default now(),
  -- Срок «на время»; у серии — предел 30 минут.
  deadline timestamptz not null,
  finished_at timestamptz,
  status text not null default 'active' check (status in ('active', 'finished', 'abandoned')),
  verno int not null default 0 check (verno >= 0),
  vsego int not null default 0 check (vsego >= verno),
  net_ms int,
  score_ms int,
  valid boolean not null default false,
  reason text,
  check ((status = 'active') = (finished_at is null))
);
create index ustnyy_sessions_user_idx on public.ustnyy_sessions (user_id, started_at);
create index ustnyy_sessions_rating_idx on public.ustnyy_sessions (format, finished_at) where valid;
create unique index ustnyy_sessions_active_idx on public.ustnyy_sessions (user_id) where status = 'active';
comment on table public.ustnyy_sessions is
  'Рейтинговые тренировки устного счёта: итог считает ustnyy_finish по времени сервера.';

create table public.ustnyy_items (
  session_id uuid not null references public.ustnyy_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pos smallint not null check (pos between 1 and 1000),
  priyom text not null,
  d text[] not null,
  v text,
  -- Ключ «без повторов» в одной тренировке.
  klyuch text not null,
  otvet text not null,
  issued_at timestamptz not null default now(),
  answered_at timestamptz,
  given text,
  verno boolean,
  primary key (session_id, pos)
);
comment on table public.ustnyy_items is
  'Примеры рейтинговых тренировок с верными ответами. Клиент таблицу не читает.';

/* ── Случайные числа и генераторы форматов ─────────────────────── */

-- Целое от lo до hi: из md5 зерна, номера примера и «соли». Повторяемо:
-- одно зерно — одни примеры (так у «Вызова дня» они у всех одинаковые).
create or replace function public.ustnyy_rnd(p_seed bigint, p_pos int, p_k int, p_lo int, p_hi int)
returns int
language sql immutable set search_path = ''
as $$
  select p_lo + (('x' || substr(md5(p_seed::text || ':' || p_pos || ':' || p_k), 1, 7))::bit(28)::int
                 % (p_hi - p_lo + 1))
$$;

-- Нормальная запись числа ответа — та же, что у проверки ответа.
create or replace function public.ustnyy_norm(p numeric)
returns text
language sql immutable set search_path = ''
as $$ select public.normalize_ege_answer(p::text) $$;

-- Пример формата. Правила подбора — как у генераторов сайта
-- (lib/ustnyySchet/formaty.ts): priyom, d и v собирают пример на сайте
-- (priyom(...).iz(d, 2, v)) — для показа и разбора.
create or replace function public.ustnyy_gen(
  p_format text, p_seed bigint, p_pos int, p_k int,
  out priyom text, out d text[], out v text, out otvet text)
language plpgsql stable set search_path = ''
as $$
declare
  f text := p_format;
  s int := p_k * 100;
  a int; b int; k int; x int; n int; t int; m int; lo int; hi int;
  p text;
  pul int[];
  vid text;
  da text; db text;
begin
  -- «Вызов дня» — по очереди примеры всех пяти форматов.
  if f = 'vyzov-dnya' then
    f := (array['tablica-1m', 'slozh-vych-100-1m', 'umn-del-2x1-2m', 'kvadraty-20', 'miks-ege-3m'])
         [((p_pos - 1) % 5) + 1];
  end if;
  v := null;

  if f = 'tablica-1m' then
    a := public.ustnyy_rnd(p_seed, p_pos, s + 1, 2, 9);
    b := public.ustnyy_rnd(p_seed, p_pos, s + 2, 2, 9);
    priyom := 'tablica'; d := array[a::text, b::text]; otvet := (a * b)::text;

  elsif f = 'slozh-vych-100-1m' then
    priyom := 'po-razryadam';
    if public.ustnyy_rnd(p_seed, p_pos, s, 0, 1) = 0 then
      a := public.ustnyy_rnd(p_seed, p_pos, s + 1, 11, 89);
      b := least(public.ustnyy_rnd(p_seed, p_pos, s + 2, 11, greatest(11, 100 - a)), 100 - a);
      d := array[a::text, b::text]; v := '+'; otvet := (a + b)::text;
    else
      a := public.ustnyy_rnd(p_seed, p_pos, s + 1, 21, 100);
      b := public.ustnyy_rnd(p_seed, p_pos, s + 2, 11, a - 1);
      d := array[a::text, b::text]; v := '-'; otvet := (a - b)::text;
    end if;

  elsif f = 'umn-del-2x1-2m' then
    k := public.ustnyy_rnd(p_seed, p_pos, s + 1, 2, 9);
    x := public.ustnyy_rnd(p_seed, p_pos, s + 2, 12, 99);
    if x % 10 = 0 then x := x + 1; end if;
    if public.ustnyy_rnd(p_seed, p_pos, s + 3, 0, 1) = 0 then
      priyom := 'razlozhenie'; d := array[x::text, k::text]; otvet := (x * k)::text;
    else
      priyom := 'delenie-po-chastyam'; d := array[(x * k)::text, k::text]; otvet := x::text;
    end if;

  elsif f = 'kvadraty-20' then
    -- Пул: 11–30, на 5 до 95, 41–59, 91–109 без 100 (formaty.ts, KVADRATY_PUL).
    pul := array(select distinct g from (
             select generate_series(11, 30) as g
             union select unnest(array[35, 45, 55, 65, 75, 85, 95])
             union select generate_series(41, 59)
             union select g2 from generate_series(91, 109) g2 where g2 <> 100) q order by g);
    n := pul[public.ustnyy_rnd(p_seed, p_pos, s + 1, 1, array_length(pul, 1))];
    otvet := (n * n)::text;
    if n between 11 and 30 then
      priyom := 'kvadraty-11-30'; d := array[n::text];
    elsif n % 10 = 5 then
      priyom := 'kvadrat-na-5'; d := array[((n - 5) / 10)::text];
    elsif n between 41 and 59 then
      priyom := 'kvadrat-okolo-50'; d := array[(n - 50)::text];
    else
      priyom := 'kvadrat-okolo-kruglyh'; d := array['100', (n - 100)::text];
    end if;

  elsif f = 'miks-ege-3m' then
    t := public.ustnyy_rnd(p_seed, p_pos, s, 0, 4);
    if t <= 1 then
      b := (array[2, 4, 5, 8, 20, 25])[public.ustnyy_rnd(p_seed, p_pos, s + 1, 1, 6)];
      a := public.ustnyy_rnd(p_seed, p_pos, s + 2, 1, b - 1);
      k := 3;
      while gcd(a, b) <> 1 loop
        a := public.ustnyy_rnd(p_seed, p_pos, s + k, 1, b - 1);
        k := k + 1;
      end loop;
      priyom := 'doli-procenty'; d := array[a::text, b::text];
      if t = 0 then
        v := 'fd'; otvet := public.ustnyy_norm(a::numeric / b);
      else
        v := 'fp'; otvet := public.ustnyy_norm(a::numeric * 100 / b);
      end if;
    elsif t = 2 then
      if public.ustnyy_rnd(p_seed, p_pos, s + 1, 1, 2) = 1 then
        p := (array['10', '50', '25', '20'])[public.ustnyy_rnd(p_seed, p_pos, s + 2, 1, 4)];
      else
        p := (array['15', '5', '30', '40', '60', '75'])[public.ustnyy_rnd(p_seed, p_pos, s + 2, 1, 6)];
      end if;
      m := 100 / gcd(p::int, 100);
      lo := greatest(1, ceil(40.0 / m)::int);
      hi := greatest(2, floor(1000.0 / m)::int);
      n := m * public.ustnyy_rnd(p_seed, p_pos, s + 3, lo, hi);
      if n = 100 then n := n + m; end if;
      priyom := 'procent-ot-chisla'; d := array[p, n::text];
      otvet := public.ustnyy_norm(n::numeric * p::int / 100);
    elsif t = 3 then
      vid := (array['pm', 'mm', 'raz', 'pn'])[public.ustnyy_rnd(p_seed, p_pos, s + 1, 1, 4)];
      a := public.ustnyy_rnd(p_seed, p_pos, s + 2, 3, 50);
      b := public.ustnyy_rnd(p_seed, p_pos, s + 3, 3, 50);
      if vid in ('raz', 'pn') then
        k := 4;
        while b = a loop
          b := public.ustnyy_rnd(p_seed, p_pos, s + k, 3, 50);
          k := k + 1;
        end loop;
        if b < a then x := a; a := b; b := x; end if;
      end if;
      priyom := 'otricatelnye'; d := array[a::text, b::text]; v := vid;
      otvet := (case vid when 'pm' then -a + b when 'mm' then -a - b else a - b end)::text;
    else
      da := '0.' || public.ustnyy_rnd(p_seed, p_pos, s + 1, 1, 9);
      if public.ustnyy_rnd(p_seed, p_pos, s + 2, 0, 1) = 0 then
        db := '0.' || public.ustnyy_rnd(p_seed, p_pos, s + 3, 2, 9);
      else
        db := public.ustnyy_rnd(p_seed, p_pos, s + 3, 2, 9)::text;
      end if;
      priyom := 'desyatichnye-umnozhenie'; d := array[da, db];
      otvet := public.ustnyy_norm(da::numeric * db::numeric);
    end if;
  else
    raise exception 'bad_format: нет формата %', p_format using errcode = 'check_violation';
  end if;
end $$;

-- Выдать пример номер p_pos тренировке: без повторов в одной тренировке.
create or replace function public.ustnyy_vydat(p_session uuid, p_pos int)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  ses public.ustnyy_sessions;
  g record;
  kl text;
  k int := 0;
begin
  select * into ses from public.ustnyy_sessions where id = p_session;
  loop
    select * into g from public.ustnyy_gen(ses.format, ses.seed, p_pos, k);
    kl := g.priyom || ':' || array_to_string(g.d, ',') || ':' || coalesce(g.v, '');
    exit when k >= 40 or not exists (
      select 1 from public.ustnyy_items where session_id = p_session and klyuch = kl);
    k := k + 1;
  end loop;
  insert into public.ustnyy_items (session_id, user_id, pos, priyom, d, v, klyuch, otvet)
  values (p_session, ses.user_id, p_pos, g.priyom, g.d, g.v, kl, g.otvet)
  on conflict do nothing;
  return jsonb_build_object('pos', p_pos, 'priyom', g.priyom, 'd', to_jsonb(g.d), 'v', g.v);
end $$;

/* ── Ник ───────────────────────────────────────────────────────── */

create or replace function public.ustnyy_sluchaynyy_nik()
returns text
language plpgsql volatile set search_path = ''
as $$
declare
  prilag text[] := array['Быстрый', 'Смелый', 'Умный', 'Ловкий', 'Весёлый', 'Точный', 'Хитрый',
    'Зоркий', 'Бодрый', 'Мудрый', 'Звёздный', 'Солнечный', 'Тихий', 'Яркий', 'Шустрый', 'Добрый'];
  zveri text[] := array['Енот', 'Ёж', 'Барсук', 'Лис', 'Волк', 'Кот', 'Филин', 'Сокол', 'Дельфин',
    'Тигр', 'Пингвин', 'Бобёр', 'Хомяк', 'Заяц', 'Орёл', 'Кит', 'Медведь', 'Олень', 'Слон', 'Жираф'];
  nik text;
  i int := 0;
begin
  loop
    nik := prilag[1 + floor(random() * array_length(prilag, 1))::int] || ' '
        || zveri[1 + floor(random() * array_length(zveri, 1))::int] || ' '
        || (10 + floor(random() * (case when i < 20 then 90 else 9990 end))::int)::text;
    exit when not exists (select 1 from public.ustnyy_profiles where lower(nick) = lower(nik));
    i := i + 1;
  end loop;
  return nik;
end $$;

-- Строка ника ученика: есть — вернуть, нет — создать со случайным ником.
create or replace function public.ustnyy_profil(p_user uuid)
returns public.ustnyy_profiles
language plpgsql set search_path = ''
as $$
declare r public.ustnyy_profiles;
begin
  select * into r from public.ustnyy_profiles where user_id = p_user;
  if r.user_id is null then
    insert into public.ustnyy_profiles (user_id, nick) values (p_user, public.ustnyy_sluchaynyy_nik())
    on conflict (user_id) do nothing;
    select * into r from public.ustnyy_profiles where user_id = p_user;
  end if;
  return r;
end $$;

-- Ник подходит? null — да, иначе код причины.
create or replace function public.ustnyy_proverit_nik(p_nick text)
returns text
language plpgsql stable set search_path = ''
as $$
declare
  s text := regexp_replace(btrim(coalesce(p_nick, '')), '\s+', ' ', 'g');
  plosko text;
begin
  if char_length(s) < 3 then return 'too_short'; end if;
  if char_length(s) > 20 then return 'too_long'; end if;
  if s !~ '^[А-Яа-яЁёA-Za-z0-9 _-]+$' then return 'bad_chars'; end if;
  if s !~ '[А-Яа-яЁёA-Za-z]' then return 'no_letters'; end if;
  -- Похожие латинские буквы и цифры — в русские, пробелы и знаки — прочь.
  plosko := translate(lower(s), 'aeopcxykmtbh0134678@', 'аеорсхукмтвноизчбтва');
  plosko := regexp_replace(plosko, '[^а-яёa-z]', '', 'g');
  if exists (select 1 from public.ustnyy_bad_words w
             where position(w.root in plosko) > 0 or position(w.root in lower(s)) > 0) then
    return 'bad_word';
  end if;
  return null;
end $$;

/* ── Рейтинговая тренировка: старт, ответ, финиш ───────────────── */

create or replace function public.ustnyy_den_msk(p timestamptz)
returns date
language sql stable set search_path = ''
as $$ select (p at time zone 'Europe/Moscow')::date $$;

-- Старт: проверка роли и согласий, предел стартов, новая тренировка и
-- два первых примера. Незаконченная прежняя тренировка закрывается.
create or replace function public.ustnyy_start(p_format text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  f public.ustnyy_formats;
  v_den date := public.ustnyy_den_msk(now());
  v_seed bigint;
  ses public.ustnyy_sessions;
  prof public.ustnyy_profiles;
begin
  if v_uid is null or public.my_role() is distinct from 'student' then
    raise exception 'forbidden: рейтинговая тренировка — для учеников' using errcode = 'insufficient_privilege';
  end if;
  if not public.can_save_progress(v_uid) then
    raise exception 'progress_not_allowed: ждём согласия родителя' using errcode = 'insufficient_privilege';
  end if;
  select * into f from public.ustnyy_formats where id = p_format;
  if f.id is null then
    raise exception 'bad_format: нет формата' using errcode = 'check_violation';
  end if;
  -- Старты одного ученика — по очереди: иначе параллельные обходили бы предел.
  perform 1 from public.profiles where user_id = v_uid for update;
  if (select count(*) from public.ustnyy_sessions
       where user_id = v_uid and started_at > now() - interval '1 hour') >= 30 then
    raise exception 'too_many_starts: не больше 30 рейтинговых тренировок в час'
      using errcode = 'check_violation';
  end if;
  if f.id = 'vyzov-dnya' and exists (
       select 1 from public.ustnyy_sessions
        where user_id = v_uid and format = 'vyzov-dnya' and den = v_den) then
    raise exception 'vyzov_uzhe: вызов дня — одна попытка в день' using errcode = 'check_violation';
  end if;

  update public.ustnyy_sessions
     set status = 'abandoned', finished_at = now(), valid = false, reason = 'abandoned'
   where user_id = v_uid and status = 'active';

  prof := public.ustnyy_profil(v_uid);
  v_seed := case when f.id = 'vyzov-dnya'
                 then ('x' || substr(md5('vyzov-dnya:' || v_den::text), 1, 12))::bit(48)::bigint
                 else floor(random() * 1e15)::bigint end;
  insert into public.ustnyy_sessions (user_id, format, seed, den, deadline)
  values (v_uid, f.id, v_seed, v_den,
          now() + case when f.tip = 'vremya' then make_interval(secs => f.sek)
                       else interval '30 minutes' end)
  returning * into ses;

  return jsonb_build_object(
    'session', ses.id,
    'format', f.id,
    'tip', f.tip,
    'sek', f.sek,
    'n', f.n,
    'nick', prof.nick,
    'server_now', floor(extract(epoch from now()) * 1000),
    'deadline', floor(extract(epoch from ses.deadline) * 1000),
    'items', jsonb_build_array(public.ustnyy_vydat(ses.id, 1), public.ustnyy_vydat(ses.id, 2)));
end $$;

-- Ответ на пример: проверка, запись, следующий пример (буфер на два
-- вперёд). Верный ответ уходит только после ответа ученика. Неверная
-- запись числа — не попытка ({"kind":"format"}). Позже срока —
-- {"kind":"late"}, не засчитывается.
create or replace function public.ustnyy_answer(p_session uuid, p_pos int, p_answer text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  ses public.ustnyy_sessions;
  f public.ustnyy_formats;
  it public.ustnyy_items;
  v_norm text;
  v_verno boolean;
  v_next jsonb := null;
begin
  select * into ses from public.ustnyy_sessions where id = p_session for update;
  if ses.id is null or ses.user_id is distinct from v_uid then
    raise exception 'not_your_session: чужая тренировка' using errcode = 'insufficient_privilege';
  end if;
  if ses.status <> 'active' then
    raise exception 'session_closed: тренировка закончена' using errcode = 'check_violation';
  end if;
  select * into f from public.ustnyy_formats where id = ses.format;
  if now() > ses.deadline + interval '2 seconds' then
    return jsonb_build_object('kind', 'late');
  end if;
  -- Отвечать — по порядку: следующий неотвеченный пример.
  if p_pos is distinct from ses.vsego + 1 then
    raise exception 'bad_pos: ждём ответ на пример %', ses.vsego + 1 using errcode = 'check_violation';
  end if;
  select * into it from public.ustnyy_items where session_id = p_session and pos = p_pos for update;
  if it.pos is null then
    raise exception 'bad_pos: нет такого примера' using errcode = 'check_violation';
  end if;
  v_norm := public.normalize_ege_answer(p_answer);
  if v_norm is null then
    return jsonb_build_object('kind', 'format');
  end if;
  v_verno := v_norm = it.otvet;
  update public.ustnyy_items
     set answered_at = now(), given = v_norm, verno = v_verno
   where session_id = p_session and pos = p_pos;
  update public.ustnyy_sessions
     set vsego = vsego + 1, verno = verno + (case when v_verno then 1 else 0 end)
   where id = p_session;
  if f.tip = 'vremya' or p_pos + 2 <= f.n then
    v_next := public.ustnyy_vydat(p_session, p_pos + 2);
  end if;
  return jsonb_build_object(
    'kind', 'answer',
    'verno', v_verno,
    'otvet', it.otvet,
    'next', v_next,
    'done', f.tip = 'seriya' and p_pos >= f.n);
end $$;

-- Ключи сортировки рейтинга: меньше — выше.
--   на время: больше верных, при равенстве — точнее, потом — раньше;
--   серия:    меньше итоговое время (+5 с за ошибку), потом — раньше.
create or replace function public.ustnyy_klyuch(p_tip text, p_verno int, p_vsego int, p_score int)
returns numeric[]
language sql immutable set search_path = ''
as $$
  select case when p_tip = 'vremya'
              then array[-p_verno::numeric, -(p_verno::numeric / greatest(p_vsego, 1))]
              else array[p_score::numeric, 0::numeric] end
$$;

-- Лучшие результаты участников формата с даты p_from (по одному на
-- ученика). p_kto — кого брать (null — всех).
create or replace function public.ustnyy_luchshie(p_format text, p_from timestamptz, p_den date, p_kto uuid[])
returns table (user_id uuid, verno int, vsego int, net_ms int, score_ms int, finished_at timestamptz, klyuch numeric[])
language sql stable set search_path = ''
as $$
  select distinct on (s.user_id)
         s.user_id, s.verno, s.vsego, s.net_ms, s.score_ms, s.finished_at,
         public.ustnyy_klyuch(f.tip, s.verno, s.vsego, s.score_ms)
    from public.ustnyy_sessions s
    join public.ustnyy_formats f on f.id = s.format
   where s.format = p_format and s.valid and s.status = 'finished'
     and s.finished_at >= p_from
     and (p_den is null or s.den = p_den)
     and (p_kto is null or s.user_id = any (p_kto))
   order by s.user_id, public.ustnyy_klyuch(f.tip, s.verno, s.vsego, s.score_ms), s.finished_at
$$;

-- Финиш: итог по времени сервера. Невозможные результаты отбрасываются:
-- в среднем меньше 0,3 с на пример, серия не до конца, точность ниже 80 %.
create or replace function public.ustnyy_finish(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  ses public.ustnyy_sessions;
  f public.ustnyy_formats;
  v_last timestamptz;
  v_span int;
  v_net int;
  v_score int;
  v_reason text := null;
  v_late int;
  v_prezhniy record;
  v_mesto bigint := null;
begin
  select * into ses from public.ustnyy_sessions where id = p_session for update;
  if ses.id is null or ses.user_id is distinct from v_uid then
    raise exception 'not_your_session: чужая тренировка' using errcode = 'insufficient_privilege';
  end if;
  if ses.status <> 'active' then
    raise exception 'session_closed: тренировка закончена' using errcode = 'check_violation';
  end if;
  select * into f from public.ustnyy_formats where id = ses.format;
  select max(answered_at) into v_last from public.ustnyy_items where session_id = p_session;
  v_span := coalesce(floor(extract(epoch from (v_last - ses.started_at)) * 1000)::int, 0);
  select count(*) into v_late from public.ustnyy_items
   where session_id = p_session and answered_at > ses.deadline + interval '2 seconds';

  if f.tip = 'vremya' then
    v_net := f.sek * 1000;
  else
    v_net := v_span;
  end if;
  v_score := v_net + 5000 * (ses.vsego - ses.verno);

  if ses.vsego = 0 then
    v_reason := 'empty';
  elsif v_late > 0 then
    v_reason := 'late';
  elsif v_span < 300 * ses.vsego then
    v_reason := 'too_fast';
  elsif f.tip = 'seriya' and ses.vsego < f.n then
    v_reason := 'incomplete';
  elsif ses.verno * 5 < ses.vsego * 4 then
    v_reason := 'accuracy';
  end if;

  -- Лучший прежний результат — до записи этого.
  select * into v_prezhniy from public.ustnyy_luchshie(ses.format, '-infinity', null, array[v_uid]);

  update public.ustnyy_sessions
     set status = 'finished', finished_at = now(), net_ms = v_net, score_ms = v_score,
         valid = v_reason is null, reason = v_reason
   where id = p_session
   returning * into ses;

  if ses.valid then
    select r.mesto into v_mesto
      from public.ustnyy_reyting_spisok(ses.format, '-infinity', null, null, v_uid) r
     where r.user_id = v_uid;
  end if;

  return jsonb_build_object(
    'valid', ses.valid,
    'reason', ses.reason,
    'verno', ses.verno,
    'vsego', ses.vsego,
    'net_ms', ses.net_ms,
    'score_ms', ses.score_ms,
    'mesto', v_mesto,
    'rekord', ses.valid and (v_prezhniy.user_id is null
               or public.ustnyy_klyuch(f.tip, ses.verno, ses.vsego, ses.score_ms) < v_prezhniy.klyuch),
    'prezhniy', case when v_prezhniy.user_id is null then null else jsonb_build_object(
                  'verno', v_prezhniy.verno, 'vsego', v_prezhniy.vsego,
                  'net_ms', v_prezhniy.net_ms, 'score_ms', v_prezhniy.score_ms) end);
end $$;

/* ── Рейтинг ───────────────────────────────────────────────────── */

-- Места: участники — ученики с согласиями, показ включён (p_vse — для
-- рейтинга класса у репетитора: все ученики класса). Вошедший (p_ya)
-- считается всегда — своё место видно, даже если он скрыт.
create or replace function public.ustnyy_reyting_spisok(
  p_format text, p_from timestamptz, p_den date, p_kto uuid[], p_ya uuid, p_vse boolean default false)
returns table (mesto bigint, user_id uuid, verno int, vsego int, net_ms int, score_ms int, finished_at timestamptz)
language sql stable set search_path = ''
as $$
  select row_number() over (order by b.klyuch, b.finished_at) as mesto,
         b.user_id, b.verno, b.vsego, b.net_ms, b.score_ms, b.finished_at
    from public.ustnyy_luchshie(p_format, p_from, p_den, p_kto) b
    join public.profiles pr on pr.user_id = b.user_id and pr.role = 'student'
    left join public.ustnyy_profiles up on up.user_id = b.user_id
   where public.can_save_progress(b.user_id)
     and (p_vse or b.user_id = p_ya or coalesce(up.pokazyvat, true))
$$;

-- Таблица рейтинга: топ-100 и своё место. p_period: den, nedelya, vse.
-- p_class — рейтинг класса: ученику класса — ники одноклассников,
-- репетитору класса — ещё и имена учеников.
create or replace function public.ustnyy_reyting(p_format text, p_period text, p_class uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  f public.ustnyy_formats;
  v_from timestamptz;
  v_den date := null;
  v_kto uuid[] := null;
  v_uchitel boolean := false;
  v_rows jsonb;
  v_ya jsonb;
  v_vsego bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  select * into f from public.ustnyy_formats where id = p_format;
  if f.id is null then
    raise exception 'bad_format: нет формата' using errcode = 'check_violation';
  end if;
  v_from := case p_period
    when 'den' then date_trunc('day', now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow'
    when 'nedelya' then date_trunc('week', now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow'
    when 'vse' then '-infinity'::timestamptz
    else null end;
  if v_from is null then
    raise exception 'bad_period: den, nedelya или vse' using errcode = 'check_violation';
  end if;
  if f.id = 'vyzov-dnya' and p_period = 'den' then
    v_den := public.ustnyy_den_msk(now());
  end if;
  if p_class is not null then
    v_uchitel := public.owns_class(p_class) or public.is_admin();
    if not (v_uchitel or public.in_class(p_class)) then
      raise exception 'not_your_class: чужой класс' using errcode = 'insufficient_privilege';
    end if;
    v_kto := array(select cm.user_id from public.class_members cm where cm.class_id = p_class);
  end if;

  -- Таблица — без скрытых (кроме рейтинга класса у репетитора).
  select coalesce(jsonb_agg(jsonb_build_object(
           'mesto', r.mesto,
           'nick', up.nick,
           'verno', r.verno, 'vsego', r.vsego, 'net_ms', r.net_ms, 'score_ms', r.score_ms,
           'at', floor(extract(epoch from r.finished_at) * 1000),
           'ya', r.user_id = v_uid)
           || case when v_uchitel then jsonb_build_object('imya', pr.display_name) else '{}'::jsonb end
           order by r.mesto) filter (where r.mesto <= 100), '[]'::jsonb),
         count(*)
    into v_rows, v_vsego
    from public.ustnyy_reyting_spisok(f.id, v_from, v_den, v_kto, null, v_uchitel) r
    left join public.ustnyy_profiles up on up.user_id = r.user_id
    left join public.profiles pr on pr.user_id = r.user_id;

  -- Своё место — всегда, даже если ученик скрыт или не в первой сотне.
  select jsonb_build_object(
           'mesto', r.mesto, 'nick', up.nick, 'verno', r.verno, 'vsego', r.vsego,
           'net_ms', r.net_ms, 'score_ms', r.score_ms,
           'pokazyvat', coalesce(up.pokazyvat, true))
    into v_ya
    from public.ustnyy_reyting_spisok(f.id, v_from, v_den, v_kto, v_uid, v_uchitel) r
    left join public.ustnyy_profiles up on up.user_id = r.user_id
   where r.user_id = v_uid;

  return jsonb_build_object('format', f.id, 'tip', f.tip, 'rows', v_rows, 'ya', v_ya, 'vsego', v_vsego);
end $$;

/* ── Ник и показ: функции для ученика и администратора ─────────── */

create or replace function public.ustnyy_moy_profil()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare r public.ustnyy_profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  r := public.ustnyy_profil(auth.uid());
  return jsonb_build_object('nick', r.nick, 'auto', r.nick_auto, 'pokazyvat', r.pokazyvat,
    'mozhno', public.my_role() = 'student' and public.can_save_progress(auth.uid()));
end $$;

-- Свой ник. Ошибка — ответ {"error": код}, а не исключение.
create or replace function public.ustnyy_set_nick(p_nick text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s text := regexp_replace(btrim(coalesce(p_nick, '')), '\s+', ' ', 'g');
  v_err text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  perform public.ustnyy_profil(auth.uid());
  v_err := public.ustnyy_proverit_nik(s);
  if v_err is not null then
    return jsonb_build_object('error', v_err);
  end if;
  if exists (select 1 from public.ustnyy_profiles
              where lower(nick) = lower(s) and user_id <> auth.uid()) then
    return jsonb_build_object('error', 'taken');
  end if;
  update public.ustnyy_profiles set nick = s, nick_auto = false, updated_at = now()
   where user_id = auth.uid();
  return jsonb_build_object('nick', s);
end $$;

create or replace function public.ustnyy_random_nick()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare s text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  perform public.ustnyy_profil(auth.uid());
  s := public.ustnyy_sluchaynyy_nik();
  update public.ustnyy_profiles set nick = s, nick_auto = true, updated_at = now()
   where user_id = auth.uid();
  return jsonb_build_object('nick', s);
end $$;

create or replace function public.ustnyy_set_pokazyvat(p_pokazyvat boolean)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;
  perform public.ustnyy_profil(auth.uid());
  update public.ustnyy_profiles set pokazyvat = coalesce(p_pokazyvat, true), updated_at = now()
   where user_id = auth.uid();
  return jsonb_build_object('pokazyvat', coalesce(p_pokazyvat, true));
end $$;

-- Администратор сбрасывает ник ученика на случайный.
create or replace function public.ustnyy_admin_reset_nick(p_user uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare s text;
begin
  if not public.is_admin() then
    raise exception 'forbidden: только администратор' using errcode = 'insufficient_privilege';
  end if;
  perform public.ustnyy_profil(p_user);
  s := public.ustnyy_sluchaynyy_nik();
  update public.ustnyy_profiles set nick = s, nick_auto = true, updated_at = now()
   where user_id = p_user;
  return jsonb_build_object('nick', s);
end $$;

-- Личные рейтинговые результаты: лучший по каждому формату и число попыток.
create or replace function public.ustnyy_moi_rezultaty()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'format', f.id,
           'popytok', (select count(*) from public.ustnyy_sessions s
                        where s.user_id = auth.uid() and s.format = f.id and s.status = 'finished'),
           'luchshiy', (select jsonb_build_object('verno', b.verno, 'vsego', b.vsego,
                                'net_ms', b.net_ms, 'score_ms', b.score_ms,
                                'at', floor(extract(epoch from b.finished_at) * 1000))
                          from public.ustnyy_luchshie(f.id, '-infinity', null, array[auth.uid()]) b))
           order by f.id), '[]'::jsonb)
    from public.ustnyy_formats f
$$;

/* ── Выгрузка данных: без ответов на нерешённые примеры ────────── */

-- То же, что в миграции ДЗ, плюс одно правило: из ustnyy_items уходят
-- только примеры, на которые ученик уже ответил (иначе выгрузка
-- подсказывала бы ответы идущей рейтинговой тренировки).
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
      'select coalesce(jsonb_agg(to_jsonb(x) - ''token_hash'' - ''alias''), ''[]''::jsonb) from public.%I x where x.user_id = $1%s',
      t.table_name,
      case when t.table_name = 'ustnyy_items' then ' and x.answered_at is not null' else '' end)
      into v_rows using v_uid;
    v_result := v_result || jsonb_build_object(t.table_name, v_rows);
  end loop;
  return v_result;
end $$;

/* ── Права ─────────────────────────────────────────────────────── */

alter table public.ustnyy_formats enable row level security;
alter table public.ustnyy_profiles enable row level security;
alter table public.ustnyy_bad_words enable row level security;
alter table public.ustnyy_sessions enable row level security;
alter table public.ustnyy_items enable row level security;

revoke all on public.ustnyy_formats, public.ustnyy_profiles, public.ustnyy_bad_words,
  public.ustnyy_sessions, public.ustnyy_items from anon, authenticated;

-- Форматы — справочник для вошедших.
grant select on public.ustnyy_formats to authenticated;
create policy ustnyy_formats_read on public.ustnyy_formats for select to authenticated using (true);

-- Свой ник и свои тренировки — только читать. Писать — функции.
grant select on public.ustnyy_profiles to authenticated;
create policy ustnyy_profiles_own on public.ustnyy_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
grant select on public.ustnyy_sessions to authenticated;
create policy ustnyy_sessions_own on public.ustnyy_sessions for select to authenticated
  using (user_id = auth.uid());
-- ustnyy_items и ustnyy_bad_words: ни прав, ни правил — только функции.

-- Функции для вошедших.
revoke execute on function
  public.ustnyy_start(text),
  public.ustnyy_answer(uuid, int, text),
  public.ustnyy_finish(uuid),
  public.ustnyy_reyting(text, text, uuid),
  public.ustnyy_moy_profil(),
  public.ustnyy_set_nick(text),
  public.ustnyy_random_nick(),
  public.ustnyy_set_pokazyvat(boolean),
  public.ustnyy_admin_reset_nick(uuid),
  public.ustnyy_moi_rezultaty(),
  public.export_my_data()
  from public, anon;
grant execute on function
  public.ustnyy_start(text),
  public.ustnyy_answer(uuid, int, text),
  public.ustnyy_finish(uuid),
  public.ustnyy_reyting(text, text, uuid),
  public.ustnyy_moy_profil(),
  public.ustnyy_set_nick(text),
  public.ustnyy_random_nick(),
  public.ustnyy_set_pokazyvat(boolean),
  public.ustnyy_admin_reset_nick(uuid),
  public.ustnyy_moi_rezultaty(),
  public.export_my_data()
  to authenticated;

-- Служебные — никому из ролей запросов: их зовут функции выше.
revoke execute on function
  public.ustnyy_rnd(bigint, int, int, int, int),
  public.ustnyy_norm(numeric),
  public.ustnyy_gen(text, bigint, int, int),
  public.ustnyy_vydat(uuid, int),
  public.ustnyy_sluchaynyy_nik(),
  public.ustnyy_profil(uuid),
  public.ustnyy_proverit_nik(text),
  public.ustnyy_den_msk(timestamptz),
  public.ustnyy_klyuch(text, int, int, int),
  public.ustnyy_luchshie(text, timestamptz, date, uuid[]),
  public.ustnyy_reyting_spisok(text, timestamptz, date, uuid[], uuid, boolean)
  from public, anon, authenticated;
