-- Открытая регистрация: «*» в списке приглашённых — регистрация для всех.
--
-- Список allowed_emails (секрет GitHub ALLOWED_EMAILS → кнопка «Сервер:
-- миграции») понимает теперь одно особое значение: «*». С ним
-- public.email_allowed пропускает любой адрес, и регистрироваться может
-- каждый — без приглашения. Отбор по почтовому домену (миграция
-- 20261113120000_pochtovye_domeny.sql) остаётся: хук проверяет домен
-- раньше списка, триггер на auth.users — всегда.
--
-- Закрыть регистрацию снова — вернуть в секрет список адресов и нажать
-- ту же кнопку. Секрета нет или он пуст — закрыто, как раньше.
create or replace function public.email_allowed(p_email text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_allowed text;
  v_candidate text := lower(trim(coalesce(p_email, '')));
begin
  if v_candidate = '' then
    return false;
  end if;
  select decrypted_secret into v_allowed
  from vault.decrypted_secrets
  where name = 'allowed_emails'
  limit 1;
  if v_allowed is null then
    return false;
  end if;
  if trim(v_allowed) = '*' then
    return true;
  end if;
  return v_candidate = any (
    select lower(trim(item)) from unnest(string_to_array(v_allowed, ',')) as item
  );
end $$;

revoke execute on function public.email_allowed(text) from public, anon, authenticated;
