#!/usr/bin/env node
/* scripts/check-vektory.mjs — автотест движка рисунков задания №2.

   Запуск: pnpm test:vektory [randomCount]

   Движок рисунков гоняется на образцах демо-страницы и на случайных
   расположениях векторов: остриё ровно в узле сетки, стержень
   укорочен под наконечник, подписи ничего не касаются, режим без
   сетки и режим подсказки включаются только явно.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { requireSrc } from './lib/load-ts.mjs';

const randomCount = Number(process.argv[2] ?? 300);
const { checkRenderer } = requireSrc('lib/vektory/selftest');

const renderer = checkRenderer(randomCount);
console.log(`движок рисунков: ${renderer.rendered} рисунков, проблем ${renderer.problems.length}`);

const problems = [...renderer.problems];
const shown = new Map();
for (const p of problems) {
  const key = `${p.where} — ${p.what.slice(0, 100)}`;
  shown.set(key, (shown.get(key) ?? 0) + 1);
}
for (const [key, count] of [...shown].slice(0, 60)) {
  console.log(`  ${count > 1 ? `×${count} ` : ''}${key}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
