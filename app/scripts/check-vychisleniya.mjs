#!/usr/bin/env node
/* scripts/check-vychisleniya.mjs — автотест генераторов и банка №8.

   Запуск: pnpm test:vychisleniya [seedsPerLevel]

   Каждый прототип гоняется на 1000 seed на каждом уровне: ответ
   всегда целое или конечная десятичная дробь, условие и разбор
   набираются KaTeX без ошибок, разбор кончается ответом, нет NaN.
   Отдельно проверяется банк: по десять разных вариантов на прототип,
   ответы не чаще трёх раз, отпечатки разных ответов не совпадают.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const seeds = Number(process.argv[2] ?? 1000);
const { checkGenerators, checkBank, checkPrep } = requireSrc('lib/vychisleniya/selftest');

const gen = checkGenerators(seeds, typeset);
const bank = checkBank(typeset);
const prep = checkPrep(Math.min(seeds, 300), typeset);
console.log(`генераторы: ${gen.prototypes} прототипов, ${gen.generated} задач, проблем ${gen.problems.length}`);
console.log(`банк: ${bank.generated} вариантов, проблем ${bank.problems.length}`);
console.log(`подготовка: ${prep.prototypes} микро-задач, ${prep.generated} вариантов, проблем ${prep.problems.length}`);

const problems = [...gen.problems, ...bank.problems, ...prep.problems];
const shown = new Map();
for (const p of problems) {
  const key = `${p.where.split(' seed=')[0]} — ${p.what.slice(0, 80)}`;
  shown.set(key, (shown.get(key) ?? 0) + 1);
}
for (const [key, count] of [...shown].slice(0, 60)) {
  console.log(`  ${count > 1 ? `×${count} ` : ''}${key}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
