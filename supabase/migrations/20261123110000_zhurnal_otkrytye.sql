-- Журнал решения задач: незаконченная задача (исход ещё пустой) ломала
-- свёртку по дням — «верно» получалось NULL, и база отвергала всю пачку
-- записей. Браузер присылает такие задачи, когда ученик уходит с задачи
-- на середине. Миграция 20261122120000_zhurnal.sql уже применена, поэтому
-- правка — здесь. Проверка — supabase/tests/zhurnal-prava.test.sql.

create or replace function public.zhurnal_dni_vklad(z public.zhurnal_zadachi, p_sign int)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_solved int := case when z.outcome in ('right', 'hinted', 'wrong', 'revealed') then 1 else 0 end;
  v_right int := case when z.outcome = 'right' then 1 else 0 end;
begin
  insert into public.zhurnal_dni as d (user_id, day, task_no, kind, solved, "right", active_ms, total_ms)
  values (z.user_id, (coalesce(z.closed_at, z.started_at) at time zone 'Europe/Moscow')::date,
          z.task_no, z.kind, p_sign * v_solved, p_sign * v_right,
          p_sign * z.active_ms, p_sign * z.total_ms)
  on conflict (user_id, day, task_no, kind) do update
    set solved = d.solved + excluded.solved,
        "right" = d."right" + excluded."right",
        active_ms = d.active_ms + excluded.active_ms,
        total_ms = d.total_ms + excluded.total_ms;
end $$;
revoke execute on function public.zhurnal_dni_vklad(public.zhurnal_zadachi, int) from public, anon, authenticated;
