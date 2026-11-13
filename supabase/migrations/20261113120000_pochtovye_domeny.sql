-- Регистрация — только с почтой российских почтовых сервисов
-- (запрет на регистрацию по иностранной почте с 7 июля 2026).
--
-- Решает база, а не форма:
--   — хук службы входа «перед созданием пользователя» отказывает
--     с 403 domain_not_allowed, сайт пишет спокойную подсказку;
--   — тот же отбор повторяет триггер на auth.users — на случай, если
--     хук выключен или пользователя создают в обход формы;
--   — смена почты на неразрешённую тоже отклоняется.
-- Уже зарегистрированных правило не касается: вход, смена и
-- восстановление пароля работают с любой почтой.
--
-- Основной список доменов — signup_domains, он же в
-- app/src/lib/auth/allowed-domains.ts (сверяет pnpm test:domeny).
-- Школьная и рабочая почта добавляется вручную: секрет SIGNUP_EXTRA
-- (домены и отдельные адреса через запятую), кнопка «Сервер: миграции»
-- переписывает signup_extra целиком (infra/lite/bin/migrate.sh).
-- Обе таблицы — в схеме auth_hooks: ни сайт, ни пользователи их не
-- видят и не меняют.

create table auth_hooks.signup_domains (
  domain text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$')
);

insert into auth_hooks.signup_domains (domain) values
  -- Яндекс
  ('yandex.ru'), ('ya.ru'), ('yandex.com'), ('yandex.by'), ('yandex.kz'), ('narod.ru'),
  -- Mail.ru (VK)
  ('mail.ru'), ('bk.ru'), ('inbox.ru'), ('list.ru'), ('internet.ru'),
  -- Рамблер
  ('rambler.ru'), ('lenta.ru'), ('autorambler.ru'), ('myrambler.ru'), ('ro.ru'),
  -- Сайт
  ('budetege.ru');

-- Добавленные вручную: домен целиком (school.example.ru) или один адрес.
create table auth_hooks.signup_extra (
  value text primary key check (value = lower(trim(value)) and value <> ''),
  kind text not null check (kind in ('domain', 'email')),
  added_at timestamptz not null default now(),
  check ((kind = 'email') = (position('@' in value) > 0))
);

revoke all on auth_hooks.signup_domains, auth_hooks.signup_extra from public;

-- Можно ли создать аккаунт (или сменить почту) на этот адрес: домен
-- из списка или добавлен вручную, либо адрес добавлен вручную.
-- Сравнение — без пробелов по краям и строчными; домен — точно:
-- поддомен (mail.yandex.ru) и похожие (mail.ru.example.com) не проходят.
create or replace function auth_hooks.email_domain_allowed(p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with e as (
    select lower(trim(coalesce(p_email, ''))) as email
  ), d as (
    select email, split_part(email, '@', 2) as domain
    from e
    where email ~ '^[^@[:space:]]+@[^@[:space:]]+$'
  )
  select coalesce((
    select exists (select 1 from auth_hooks.signup_domains s where s.domain = d.domain)
        or exists (select 1 from auth_hooks.signup_extra x
                    where (x.kind = 'domain' and x.value = d.domain)
                       or (x.kind = 'email' and x.value = d.email))
    from d
  ), false)
$$;

revoke execute on function auth_hooks.email_domain_allowed(text) from public, anon, authenticated;
grant execute on function auth_hooks.email_domain_allowed(text) to supabase_auth_admin;

-- Хук: то же, что в миграции пробного входа, плюс отбор по домену —
-- раньше приглашения: иностранной почте не помогает и приглашение.
create or replace function auth_hooks.before_user_created(event jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user jsonb := coalesce(event -> 'user', '{}'::jsonb);
  v_meta jsonb := coalesce(v_user -> 'user_metadata', v_user -> 'raw_user_meta_data', '{}'::jsonb);
  v_email text := lower(trim(coalesce(v_user ->> 'email', '')));
  v_code text := coalesce(v_meta ->> 'invite_code', '');
  v_ip inet;
  v_invited boolean;
begin
  if v_email <> '' and not auth_hooks.email_domain_allowed(v_email) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'domain_not_allowed'));
  end if;

  v_invited := v_code <> '' and exists (
    select 1 from public.invitations
     where code_hash = public.invite_hash(v_code)
       and used_at is null and revoked_at is null and expires_at > now());
  if v_email = '' or not (v_invited or public.email_allowed(v_email)) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'invite_only'));
  end if;

  begin
    v_ip := nullif(event -> 'metadata' ->> 'ip_address', '')::inet;
  exception when others then
    v_ip := null;
  end;
  delete from auth_hooks.signup_ips where seen_at < now() - interval '1 day';
  if v_ip is not null then
    insert into auth_hooks.signup_ips (email, ip) values (v_email, v_ip)
    on conflict (email) do update set ip = excluded.ip, seen_at = now();
  end if;
  return '{}'::jsonb;
end $$;

revoke execute on function auth_hooks.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function auth_hooks.before_user_created(jsonb) to supabase_auth_admin;

-- Триггер: новый аккаунт и смена почты. Срабатывает только когда почта
-- задаётся или меняется — вход, пароль, подтверждение и прочие
-- обновления строки пользователя с иностранной почтой проходят.
-- email_change — новая почта, которую служба входа хранит до
-- подтверждения: отказ приходит сразу, письмо не уходит.
create or replace function auth_hooks.guard_email_domain()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.email is distinct from old.email then
    if not auth_hooks.email_domain_allowed(new.email) then
      raise exception 'domain_not_allowed: регистрация и смена почты — только на адрес российского почтового сервиса'
        using errcode = 'check_violation';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.email_change is distinct from old.email_change
     and coalesce(new.email_change, '') <> ''
     and not auth_hooks.email_domain_allowed(new.email_change) then
    raise exception 'domain_not_allowed: смена почты — только на адрес российского почтового сервиса'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

revoke execute on function auth_hooks.guard_email_domain() from public, anon, authenticated;

create trigger auth_users_email_domain
  before insert or update of email, email_change on auth.users
  for each row execute function auth_hooks.guard_email_domain();
