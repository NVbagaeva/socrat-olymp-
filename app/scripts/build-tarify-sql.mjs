#!/usr/bin/env node
/* Цены тарифов для базы — supabase/seed/tarify.sql из
   src/lib/tarify/config.ts (docs/oplata-robokassa.md).

   Цену заказа считает база (oplata_sozdat), а не браузер, поэтому цены
   и сроки из config.ts переносятся в таблицы tarif_tseny и tarif_sroki.
   Файл применяется при каждом «Сервер: миграции», как каталог банка.

     pnpm build:tarify-sql   — пересобрать файл;
     pnpm test:tarify-sql    — проверить, что файл совпадает с config.ts. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const CHECK = process.argv.includes('--check');
const SQL_FILE = path.join(APP, '..', 'supabase/seed/tarify.sql');

const { PLATNYE, PERIOD_DNEY, DO_EGE, DO_EGE_KONETS_PRODAZH } = requireSrc('lib/tarify/config.ts');

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const rows = [];
for (const [tarif, t] of Object.entries(PLATNYE)) {
  if (!Number.isInteger(t.tsena30) || t.tsena30 <= 0) throw new Error(`${tarif}: цена за 30 дней`);
  /* «30 дней» — одна цена с начала продаж: самая ранняя ступень «До ЕГЭ». */
  rows.push([tarif, 'd30', t.doEge[0]?.s ?? '2026-01-01', t.tsena30]);
  for (const st of t.doEge) {
    if (!DATA.test(st.s) || !Number.isInteger(st.tsena) || st.tsena <= 0) {
      throw new Error(`${tarif}: ступень ${JSON.stringify(st)}`);
    }
    rows.push([tarif, 'ege', st.s, st.tsena]);
  }
}
for (const d of [DO_EGE.data, DO_EGE_KONETS_PRODAZH]) {
  if (!DATA.test(d)) throw new Error(`дата ${d}`);
}

const sql = `-- Цены и сроки тарифов. Файл собран: pnpm build:tarify-sql — не править руками.
-- Источник — app/src/lib/tarify/config.ts. Применяется после миграции
-- 20261129120000_oplata.sql при каждом «Сервер: миграции».
begin;
delete from public.tarif_tseny;
insert into public.tarif_tseny (tarif, srok, s, tsena) values
${rows.map(([t, s, d, c]) => `  ('${t}', '${s}', '${d}', ${c})`).join(',\n')};
insert into public.tarif_sroki (id, dney, do_ege, do_ege_konets_prodazh)
values (true, ${PERIOD_DNEY}, '${DO_EGE.data}', '${DO_EGE_KONETS_PRODAZH}')
on conflict (id) do update set dney = excluded.dney, do_ege = excluded.do_ege,
  do_ege_konets_prodazh = excluded.do_ege_konets_prodazh;
commit;
`;

if (CHECK) {
  const est = fs.existsSync(SQL_FILE) ? fs.readFileSync(SQL_FILE, 'utf8') : '';
  if (est !== sql) {
    console.error(
      'supabase/seed/tarify.sql не совпадает с lib/tarify/config.ts — запустите pnpm build:tarify-sql',
    );
    process.exit(1);
  }
  console.log(`tarify.sql совпадает с config.ts: ${rows.length} цен`);
} else {
  fs.writeFileSync(SQL_FILE, sql);
  console.log(`Записан ${path.relative(path.join(APP, '..'), SQL_FILE)}: ${rows.length} цен`);
}
