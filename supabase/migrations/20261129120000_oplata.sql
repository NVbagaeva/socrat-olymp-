-- Оплата тарифов через Robokassa (docs/oplata-robokassa.md).
--
-- Цену считает база, а не браузер: таблица tarif_tseny заполняется из
-- app/src/lib/tarify/config.ts (supabase/seed/tarify.sql, pnpm
-- build:tarify-sql) и обновляется при каждом «Сервер: миграции».
--
--   oplata_sozdat  — человек (через сервис oplata, со своим входом)
--                    заводит заказ: тариф по своей роли, срок, согласие
--                    с офертой. Номер заказа — InvId для Robokassa.
--   oplata_zachest — сервис oplata (service_role) после проверки подписи
--                    уведомления Result URL: заказ оплачен, доступ выдан.
--                    Повтор уведомления ничего не меняет.
--   moy_dostup     — действующий платный доступ человека.
--
-- Заказы хранятся и после удаления аккаунта (user_id → null): это учёт
-- полученных денег, а не данные о занятиях.

create table public.tarif_tseny (
  tarif text not null check (tarif in ('uchenik', 'repetitor')),
  srok text not null check (srok in ('d30', 'ege')),
  -- С какой даты (по Москве) действует цена.
  s date not null,
  tsena numeric(10, 2) not null check (tsena > 0),
  primary key (tarif, srok, s)
);

-- Сроки тарифа: дней у «30 дней», последний день и конец продаж «До ЕГЭ».
create table public.tarif_sroki (
  id boolean primary key default true check (id),
  dney int not null check (dney > 0),
  do_ege date not null,
  do_ege_konets_prodazh date not null
);

alter table public.tarif_tseny enable row level security;
alter table public.tarif_sroki enable row level security;
revoke all on public.tarif_tseny, public.tarif_sroki from public, anon, authenticated;

create table public.oplata_zakazy (
  -- InvId Robokassa: целое число, уникальное в магазине.
  inv_id bigint generated always as identity (start with 1001) primary key,
  -- Без внешнего ключа: каскад удалил бы учёт оплат; при удалении
  -- аккаунта ссылку обнуляет триггер oplata_zabyt.
  user_id uuid,
  tarif text not null check (tarif in ('uchenik', 'repetitor')),
  srok text not null check (srok in ('d30', 'ege')),
  summa numeric(10, 2) not null check (summa > 0),
  opisanie text not null,
  -- Редакция документов, с которой человек согласился, нажимая «Оплатить».
  oferta_redakciya date,
  status text not null default 'novyy' check (status in ('novyy', 'oplachen')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  dostup_s timestamptz,
  dostup_do timestamptz,
  check ((status = 'oplachen') = (paid_at is not null and dostup_s is not null and dostup_do is not null))
);
create index oplata_zakazy_user on public.oplata_zakazy (user_id, created_at desc);

alter table public.oplata_zakazy enable row level security;
revoke all on public.oplata_zakazy from public, anon, authenticated;
grant select on public.oplata_zakazy to authenticated;
create policy oplata_zakazy_svoi on public.oplata_zakazy
  for select to authenticated using (user_id = auth.uid());
revoke all on sequence public.oplata_zakazy_inv_id_seq from public, anon, authenticated;

-- Удалили аккаунт — заказ остаётся, но ни к кому не привязан.
create or replace function public.oplata_zabyt()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.oplata_zakazy set user_id = null where user_id = old.id;
  return old;
end $$;
revoke execute on function public.oplata_zabyt() from public, anon, authenticated;
create trigger oplata_zabyt after delete on auth.users
  for each row execute function public.oplata_zabyt();

/* ── Цена ──────────────────────────────────────────────────────── */

-- Дата по Москве.
create or replace function public.oplata_segodnya(p_at timestamptz default now())
returns date language sql stable set search_path = ''
as $$ select (p_at at time zone 'Europe/Moscow')::date $$;
revoke execute on function public.oplata_segodnya(timestamptz) from public, anon;
grant execute on function public.oplata_segodnya(timestamptz) to authenticated, service_role;

-- Цена тарифа на срок; null — срок не продаётся (или цены не загружены).
create or replace function public.oplata_tsena(p_tarif text, p_srok text, p_data date default null)
returns numeric
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_data date := coalesce(p_data, public.oplata_segodnya());
begin
  if p_srok = 'ege' and v_data >= (select do_ege_konets_prodazh from public.tarif_sroki) then
    return null;
  end if;
  return (select tsena from public.tarif_tseny
           where tarif = p_tarif and srok = p_srok and s <= v_data
           order by s desc limit 1);
end $$;

revoke execute on function public.oplata_tsena(text, text, date) from public, anon;
grant execute on function public.oplata_tsena(text, text, date) to authenticated, service_role;

/* ── Заказ ─────────────────────────────────────────────────────── */

create or replace function public.oplata_sozdat(p_tarif text, p_srok text, p_oferta boolean)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role := public.my_role();
  v_summa numeric;
  v_sroki public.tarif_sroki;
  v_opisanie text;
  v_inv bigint;
begin
  if v_uid is null then
    raise exception 'forbidden: оплатить можно после входа' using errcode = 'insufficient_privilege';
  end if;
  -- Тариф — по роли аккаунта: ученик берёт «Ученик», учитель — «Учитель».
  if p_tarif is distinct from (case v_role when 'student' then 'uchenik' when 'tutor' then 'repetitor' end) then
    raise exception 'wrong_tarif: этот тариф не для вашей роли' using errcode = 'check_violation';
  end if;
  if p_srok is null or p_srok not in ('d30', 'ege') then
    raise exception 'wrong_srok: нет такого срока' using errcode = 'check_violation';
  end if;
  if p_oferta is not true then
    raise exception 'oferta: нужно принять условия оферты' using errcode = 'check_violation';
  end if;
  -- Не больше 20 заказов в час: кнопку жмут, а не перебирают.
  perform 1 from public.profiles where user_id = v_uid for update;
  if (select count(*) from public.oplata_zakazy
       where user_id = v_uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too_many: слишком много попыток, попробуйте через час' using errcode = 'check_violation';
  end if;

  v_summa := public.oplata_tsena(p_tarif, p_srok);
  if v_summa is null then
    raise exception 'ne_prodaetsya: этот срок сейчас не продаётся' using errcode = 'check_violation';
  end if;
  select * into v_sroki from public.tarif_sroki;
  v_opisanie := format('Будет на ЕГЭ: тариф «%s», %s',
    case p_tarif when 'uchenik' then 'Ученик' else 'Учитель' end,
    case p_srok when 'd30' then v_sroki.dney || ' дней'
      else 'до ' || to_char(v_sroki.do_ege, 'DD.MM.YYYY') end);

  insert into public.oplata_zakazy (user_id, tarif, srok, summa, opisanie, oferta_redakciya)
  values (v_uid, p_tarif, p_srok, v_summa, v_opisanie, public.current_documents_version())
  returning inv_id into v_inv;

  return jsonb_build_object(
    'inv_id', v_inv,
    'summa', to_char(v_summa, 'FM999999990.00'),
    'opisanie', v_opisanie,
    'email', (select email from auth.users where id = v_uid));
end $$;

revoke execute on function public.oplata_sozdat(text, text, boolean) from public, anon;
grant execute on function public.oplata_sozdat(text, text, boolean) to authenticated;

/* ── Оплата пришла ─────────────────────────────────────────────── */

-- Вызывает только сервис oplata, проверив подпись Robokassa Паролем №2.
-- Ответ: {"itog": "oplachen"} — доступ выдан сейчас, {"itog": "uzhe"} —
-- повтор уведомления. Ошибки: net_zakaza, summa (сумма не совпала).
create or replace function public.oplata_zachest(p_inv_id bigint, p_summa numeric)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  z public.oplata_zakazy;
  v_sroki public.tarif_sroki;
  v_s timestamptz;
  v_do timestamptz;
begin
  select * into z from public.oplata_zakazy where inv_id = p_inv_id for update;
  if z.inv_id is null then
    raise exception 'net_zakaza: заказа % нет', p_inv_id using errcode = 'no_data_found';
  end if;
  if p_summa is distinct from z.summa then
    raise exception 'summa: заказ %, ждали %, пришло %', p_inv_id, z.summa, p_summa
      using errcode = 'check_violation';
  end if;
  if z.status = 'oplachen' then
    return jsonb_build_object('itog', 'uzhe', 'dostup_do', z.dostup_do);
  end if;

  select * into v_sroki from public.tarif_sroki;
  -- Новый срок продолжает действующий доступ того же тарифа, а не
  -- сгорает вместе с ним.
  if z.user_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('oplata:' || z.user_id::text, 0));
  end if;
  v_s := greatest(now(), coalesce((
    select max(dostup_do) from public.oplata_zakazy
     where user_id = z.user_id and tarif = z.tarif and status = 'oplachen'), now()));
  if z.srok = 'd30' then
    v_do := v_s + make_interval(days => v_sroki.dney);
  else
    -- «До ЕГЭ» — до конца последнего дня по Москве.
    v_do := greatest(v_s, ((v_sroki.do_ege + 1)::timestamp at time zone 'Europe/Moscow'));
  end if;

  update public.oplata_zakazy
     set status = 'oplachen', paid_at = now(), dostup_s = v_s, dostup_do = v_do
   where inv_id = z.inv_id;
  return jsonb_build_object('itog', 'oplachen', 'dostup_do', v_do);
end $$;

revoke execute on function public.oplata_zachest(bigint, numeric) from public, anon, authenticated;
grant execute on function public.oplata_zachest(bigint, numeric) to service_role;

/* ── Действующий доступ ────────────────────────────────────────── */

-- Самый поздний действующий платный доступ: {"tarif": "uchenik", "do": …}
-- или null — платного доступа сейчас нет.
create or replace function public.moy_dostup()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('tarif', tarif, 'do', dostup_do)
    from public.oplata_zakazy
   where user_id = auth.uid() and status = 'oplachen'
     and dostup_s <= now() and dostup_do > now()
   order by (tarif = 'repetitor') desc, dostup_do desc
   limit 1
$$;

revoke execute on function public.moy_dostup() from public, anon;
grant execute on function public.moy_dostup() to authenticated;
