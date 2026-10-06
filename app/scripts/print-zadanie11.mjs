#!/usr/bin/env node
/* scripts/print-zadanie11.mjs — показать задачи банка №11 текстом.

   Запуск: node scripts/print-zadanie11.mjs [код подтипа] [номер]
           node scripts/print-zadanie11.mjs --gen <код подтипа> [сколько] — новые задачи
           node scripts/print-zadanie11.mjs --gen [код подтипа] [сколько] — новые задачи
   Без аргументов — по одной задаче на подтип. Для проверки глазами:
   условие, этапы разбора, таблица и подсказки. */

import { requireSrc } from './lib/load-ts.mjs';

const { BANK, RAZMINKA } = requireSrc('lib/zadanie11/bank');
const { subtype } = requireSrc('lib/zadanie11/prototypes');

const args = process.argv.slice(2);
const novye = args[0] === '--gen';
const [id, n] = novye ? args.slice(1) : args;
let pick;
if (novye) {
  /* --gen DP-07 5 — пять новых задач подтипа (seed 0…4). */
  const { generate } = requireSrc('lib/zadanie11/gen');
  pick = Array.from({ length: Number(n ?? 3) }, (_, i) => ({
    id,
    params: generate(id, String(i)).params,
  }));
} else {
  const all = [...RAZMINKA, ...BANK];
  const items = id
    ? all.filter((x) => x.id === id)
    : all.filter((x, i) => all.findIndex((y) => y.id === x.id) === i);
  pick = n ? [items[Number(n) - 1]] : items;
}

for (const item of pick) {
  const s = subtype(item.id).solve(item.params);
  console.log(`\n═══ ${item.id} ${JSON.stringify(item.params)} → ${s.answer}`);
  console.log(s.uslovie);
  for (const e of s.etapy) {
    console.log(`  ${e.title}`);
    for (const l of e.lines) console.log(`    ${l}`);
  }
  for (const t of s.tables ?? []) {
    console.log(`  [${t.vid}]${t.title ? ' ' + t.title : ''}`);
    console.log(`  | ${t.head.join(' | ')} |`);
    for (const r of t.rows) console.log(`  | ${r.join(' | ')} |`);
  }
  for (const h of s.hints) {
    console.log(`  ? ${h.question}`);
    console.log(
      `    ${h.options.map((o, i) => (i === h.correct ? `[✓ ${o}]` : `[${o}]`)).join(' ')}`,
    );
  }
}
