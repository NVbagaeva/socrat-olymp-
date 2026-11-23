-- Новая выдача ДЗ, PR 2б: рабочая копия мастера выдачи.
--
-- Задачи и ключи черновика учитель напрямую не читает (только функциями),
-- а dz2_save заменяет их целиком. Чтобы черновик можно было открыть и
-- доделать, мастер хранит в нём свою рабочую копию — корзину с готовыми
-- задачами опорных и настройки. Видит её только учитель (RLS homework2:
-- свои строки). «Повторить ДЗ» копирует и её.

alter table public.homework2
  add column chernovik jsonb
    check (chernovik is null or (jsonb_typeof(chernovik) = 'object' and octet_length(chernovik::text) <= 1000000));

-- Сохранить рабочую копию черновика или шаблона.
create or replace function public.dz2_chernovik(p_id uuid, p jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text) > 1000000 then
    raise exception 'too_big' using errcode = 'check_violation';
  end if;
  update public.homework2 set chernovik = p
   where id = p_id and tutor_id = auth.uid() and status in ('draft', 'template');
  if not found then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
end $$;

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
                                solutions_when, individual, kontrol, copied_from, chernovik)
  values (auth.uid(), p_status, h.title, h.note, h.after_due, h.hints_allowed, h.attempts_limit, h.solutions_when,
          h.individual, h.kontrol, h.id, h.chernovik)
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


revoke execute on function public.dz2_chernovik(uuid, jsonb) from public, anon;
grant execute on function public.dz2_chernovik(uuid, jsonb) to authenticated;
