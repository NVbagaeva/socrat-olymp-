#!/usr/bin/env node
/* scripts/check-vektory.mjs — автотест движка рисунков задания №2.

   Движок рисунков гоняется на образцах демо-страницы и на случайных
   расположениях векторов: остриё ровно в узле сетки, стержень
   укорочен под наконечник, подписи ничего не касаются, режим без
   сетки и режим подсказки включаются только явно.

   Генераторы — на 1000 seed каждого прототипа: ответ целый или
   конечная десятичная дробь, независимый пересчёт сходится, рисунок
   по ограничениям, формулы собираются KaTeX строго, косинус — только
   из восьми двухзначных значений. Банк — десять разных вариантов на
   прототип. Опорные задачи повышенной сложности (косинус с тремя
   знаками) — отдельно: их значения в генераторах не встречаются.

   Страницы раздела: девятнадцать опорных задач на зафиксированных
   seed (рисунок с катетами чист), микрозадачи тренировок навыков на
   зафиксированном и случайных seed (рисунок условия без катетов,
   варианты различны, верный отвечает рисунку), сцены теории и все
   формулы текстов — KaTeX строго.

   Запуск: pnpm test:vektory [seeds]

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const seeds = Number(process.argv[2] ?? 1000);
const {
  checkRenderer,
  checkGenerators,
  checkBank,
  checkOpornyeKosinus,
  checkOpornye,
  checkMikro,
  checkStsenyITeksty,
} = requireSrc('lib/vektory/selftest');

const renderer = checkRenderer(Math.min(seeds, 300));
console.log(`движок рисунков: ${renderer.rendered} рисунков, проблем ${renderer.problems.length}`);
const gen = checkGenerators(seeds, typeset);
console.log(
  `генераторы: ${gen.prototypes} прототипов, ${gen.generated} задач, проблем ${gen.problems.length}`,
);
const bank = checkBank(typeset);
console.log(
  `банк: ${bank.prototypes} прототипов, ${bank.generated} вариантов, проблем ${bank.problems.length}`,
);

const opornye = checkOpornyeKosinus(typeset);
console.log(
  `опорные (косинус с тремя знаками): ${opornye.generated} задач, проблем ${opornye.problems.length}`,
);

const opornye19 = checkOpornye(typeset);
console.log(
  `опорные по прототипам: ${opornye19.generated} задач, проблем ${opornye19.problems.length}`,
);
const mikro = checkMikro(Math.min(seeds, 200), typeset);
console.log(
  `тренировки навыков: ${mikro.prototypes} микрозадач, ${mikro.generated} вариантов, проблем ${mikro.problems.length}`,
);
const stseny = checkStsenyITeksty(typeset);
console.log(
  `сцены теории и тексты: ${stseny.prototypes} сцен, ${stseny.generated} текстов, проблем ${stseny.problems.length}`,
);

const problems = [
  ...renderer.problems,
  ...gen.problems,
  ...bank.problems,
  ...opornye.problems,
  ...opornye19.problems,
  ...mikro.problems,
  ...stseny.problems,
];
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
