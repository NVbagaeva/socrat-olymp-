-- Цены и сроки тарифов. Файл собран: pnpm build:tarify-sql — не править руками.
-- Источник — app/src/lib/tarify/config.ts. Применяется после миграции
-- 20261129120000_oplata.sql при каждом «Сервер: миграции».
begin;
delete from public.tarif_tseny;
insert into public.tarif_tseny (tarif, srok, s, tsena) values
  ('uchenik', 'd30', '2026-01-01', 390),
  ('uchenik', 'ege', '2026-01-01', 1990),
  ('uchenik', 'ege', '2027-02-01', 1590),
  ('uchenik', 'ege', '2027-03-01', 1290),
  ('uchenik', 'ege', '2027-04-01', 990),
  ('uchenik', 'ege', '2027-05-01', 690),
  ('repetitor', 'd30', '2026-01-01', 890),
  ('repetitor', 'ege', '2026-01-01', 4990),
  ('repetitor', 'ege', '2027-02-01', 3990),
  ('repetitor', 'ege', '2027-03-01', 2990),
  ('repetitor', 'ege', '2027-04-01', 2290),
  ('repetitor', 'ege', '2027-05-01', 1590);
insert into public.tarif_sroki (id, dney, do_ege, do_ege_konets_prodazh)
values (true, 30, '2027-06-30', '2027-06-01')
on conflict (id) do update set dney = excluded.dney, do_ege = excluded.do_ege,
  do_ege_konets_prodazh = excluded.do_ege_konets_prodazh;
commit;
