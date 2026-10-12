#!/usr/bin/env node
/* scripts/check-uravneniya.mjs — автотест задания №7 «Простейшие уравнения».

   Запуск: pnpm test:uravneniya

   Проверки — в lib/zadanie7/selftest.ts:
     — пересчёт корней подстановкой и независимым численным поиском;
     — ОДЗ и посторонние корни;
     — распределение ответов аналогов (не меньше 12 разных из 20, ни
       один не чаще двух раз), отпечатки уравнений, свежесть файла;
     — разметка формул: KaTeX в строгом режиме, «чистота» («1x», «x^1»,
       «+ −», «−(−», лишние скобки, точка вместо запятой).
   Здесь же — формулы обычным текстом и сырой TeX вне $…$ (те же
   признаки, что у pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie7/selftest');

const { problems, solved, statistika } = checkBank(typeset);

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

statistika.forEach((s) => console.log(s));
console.log(`Задач проверено: ${solved.length}.`);

if (problems.length > 0) {
  console.error(`\nПроблем: ${problems.length}`);
  for (const p of problems.slice(0, 200)) {
    console.error(`  ${p.where}: ${p.what}`);
  }
  if (problems.length > 200) {
    console.error(`  … и ещё ${problems.length - 200}`);
  }
  process.exit(1);
}
console.log('Банк задания №7 в порядке.');
