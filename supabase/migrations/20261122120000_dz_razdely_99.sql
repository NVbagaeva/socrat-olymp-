-- Разделы ДЗ (homework.sections) — номера хранения до 99, как у
-- ege_tasks.no после 20261114120000_struktura_2027.sql.
--
-- 20261113130000_dz_istochniki.sql разрешал в sections только 1–20, а
-- у раздела ЕГЭ-2027 «Наибольшее и наименьшее значение функции» номер
-- хранения 21: ДЗ по нему база бы не выдала. Существует ли раздел,
-- по-прежнему проверяет issue_homework_parts (по ege_tasks).

alter table public.homework drop constraint homework_sections_check;
alter table public.homework
  add constraint homework_sections_check
  check (sections is null or (cardinality(sections) between 1 and 99 and 0 < all (sections) and 100 > all (sections)));
