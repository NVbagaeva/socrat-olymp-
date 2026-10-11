#!/usr/bin/env node
/* scripts/check-prikladnye.mjs — автотест задания №10
   «Задачи с прикладным (физическим) содержанием».

   Запуск: pnpm test:prikladnye

   Проверки — в lib/zadanie10/selftest.ts: пересчёт ответов ФИПИ и
   аналогов, отпечатки, распределение ответов, диапазоны величин,
   KaTeX в строгом режиме, «чистота» формул (нет «1x», «+ −», «−(−»,
   лишних скобок), подписи этапов и подсказки. Здесь же — формулы
   обычным текстом и сырой TeX вне $…$ (те же признаки, что у
   pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie10/selftest');
const { PROTOTYPES } = requireSrc('lib/zadanie10/prototypes');
const { ISKLYUCHENIYA } = requireSrc('lib/zadanie10/bank/analogi');

const { problems, solved } = checkBank(typeset);

for (const { where, item, s } of solved) {
  for (const text of [item.text, ...vseTeksty(s)]) {
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where,
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»`,
      });
    }
  }
}

const fipi = solved.filter((x) => x.item.source === 'fipi').length;
const analogi = solved.filter((x) => x.item.source === 'analog').length;
console.log(`Прототипов: ${PROTOTYPES.length}; задач ФИПИ: ${fipi}; аналогов: ${analogi}.`);
console.log(`Исключения по разнообразию ответов: ${Object.keys(ISKLYUCHENIYA).join(', ')}.`);

if (problems.length > 0) {
  console.error(`Проблем: ${problems.length}`);
  for (const p of problems.slice(0, 200)) {
    console.error(`  ${p.where}: ${p.what}`);
  }
  process.exit(1);
}
console.log('Задание №10: все проверки пройдены.');
