#!/usr/bin/env node
/* scripts/check-proizvodnaya.mjs — автотест задания №9 «Производная и
   первообразная».

   Движок графиков: волны из узлов на целой сетке — производная
   непрерывна в узлах (C¹), экстремумы f и нули f′ только там, где
   задумано, пересечение оси поперёк, внутри сегмента нет выбросов;
   подписи рисунка не пересекаются друг с другом и с кривой; на рисунке
   ученика нет пунктиров, треугольников, дуг и подписей «?».

   Генераторы — на seed каждого прототипа: ответ целый или конечная
   десятичная дробь; ответ, заложенный в прототип, совпадает с ответом,
   который заново считается по узлам рисунка и запросу (выборка знаков,
   пересечения оси, интеграл); рисунок читаем во всех режимах; решение
   этапами с «Ответом»; в подсказке у каждого вопроса ровно один верный
   вариант и у каждого неверного — объяснение; все формулы $…$ собираются
   KaTeX строго, вне формул нет сырого TeX и «плоской» математики.

   Банк: десять разных вариантов на прототип. Опорные задачи: шесть блоков
   по десять микрозадач, у каждой ответ, разбор, подсказка, рисунок без построений.

   Запуск: pnpm test:proizvodnaya [seeds]
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { findPlainMath, findRawTex } from './lib/math-markup.mjs';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });
/* Вне формул — ни сырого TeX, ни математики обычным текстом. */
const textCheck = (text) => [
  ...findRawTex(text).map((f) => `сырой TeX ${f.match}`),
  ...findPlainMath(text).map((f) => `плоская математика ${f.rule} «${f.match}»`),
];

const seeds = Number(process.argv[2] ?? 200);
const { checkEngine, checkGenerators, checkBank, checkPrep } = requireSrc(
  'lib/proizvodnaya/selftest',
);

const engine = checkEngine(Math.min(seeds * 2, 400));
console.log(`движок графиков: ${engine.generated} рисунков, проблем ${engine.problems.length}`);

const gen = checkGenerators(seeds, typeset, textCheck);
console.log(
  `генераторы: ${gen.prototypes} прототипов, ${gen.generated} задач, проблем ${gen.problems.length}`,
);
const slow = Object.entries(gen.ms ?? {}).filter(([, ms]) => ms > 400);
if (slow.length > 0) {
  console.log(
    `  медленные прототипы (мс на задачу): ${slow.map(([id, ms]) => `${id}=${ms}`).join(', ')}`,
  );
}

let bankProblems = [];
try {
  const { BANK } = requireSrc('lib/proizvodnaya/bank');
  const bank = checkBank(BANK, typeset, textCheck);
  console.log(
    `банк: ${bank.prototypes} прототипов, ${bank.generated} вариантов, проблем ${bank.problems.length}`,
  );
  bankProblems = bank.problems;
} catch (e) {
  if (e && e.code === 'MODULE_NOT_FOUND') {
    console.log('банк: файла lib/proizvodnaya/bank.ts ещё нет — пропущен');
  } else {
    throw e;
  }
}

const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks');
const { generatePrep } = requireSrc('lib/proizvodnaya/prep/generate');
const prep = checkPrep(Math.min(seeds, 40), PREP_BLOCKS, generatePrep, typeset, textCheck);
console.log(
  `опорные задачи: ${prep.prototypes} блоков, ${prep.generated} задач, проблем ${prep.problems.length}`,
);

const problems = [...engine.problems, ...gen.problems, ...bankProblems, ...prep.problems];
const shown = new Map();
for (const p of problems) {
  const key = `${p.where.replace(/#\d+/g, '#N')} — ${p.what.slice(0, 110)}`;
  shown.set(key, (shown.get(key) ?? 0) + 1);
}
for (const [key, count] of [...shown].slice(0, 80)) {
  console.log(`  ${count > 1 ? `×${count} ` : ''}${key}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
