-- Условие задачи в журнале: только вёрстка набора, без активного содержимого.
--
-- uslovie_tex присылает браузер ученика (zhurnal_push), а учитель видит
-- его в «Прогрессе» вставкой HTML. Сайт чистит его перед показом
-- (app/src/lib/zhurnal/pokaz.ts → sanitizeHtml); база — вторая линия:
-- условие со скриптом, рамкой, картинкой, ссылкой, обработчиком on…=,
-- javascript: или url() не хранится — вместо него null, и учитель видит
-- обычную заглушку «условие не сохранено». Запись ученика при этом не
-- отклоняется: иначе очередь журнала в его браузере застряла бы.

create or replace function public.zhurnal_uslovie_opasno(p text)
returns boolean
language sql immutable set search_path = ''
as $$
  select p ~* ('<\s*/?\s*(script|iframe|frame|object|embed|link|style|meta|base|form|img|image|video|audio|source|input|button|a)[\s/>]'
               || '|\mon[a-z]+\s*='
               || '|javascript\s*:'
               || '|url\s*\('
               || '|expression\s*\(')
$$;

create or replace function public.zhurnal_uslovie_chist()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.uslovie_tex is not null and public.zhurnal_uslovie_opasno(new.uslovie_tex) then
    new.uslovie_tex := null;
  end if;
  return new;
end $$;

create trigger zhurnal_zadachi_uslovie
  before insert or update of uslovie_tex on public.zhurnal_zadachi
  for each row execute function public.zhurnal_uslovie_chist();

-- То, что уже записано.
update public.zhurnal_zadachi set uslovie_tex = null
 where uslovie_tex is not null and public.zhurnal_uslovie_opasno(uslovie_tex);

revoke execute on function public.zhurnal_uslovie_opasno(text), public.zhurnal_uslovie_chist()
  from public, anon, authenticated;
