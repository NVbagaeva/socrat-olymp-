#!/usr/bin/env node
/* scripts/check-sluchainye-velichiny.mjs — автотест задания №6
   «Случайные величины и распределения».

   Запуск: pnpm test:sluchainye-velichiny

   Проверки — в lib/zadanie6/selftest.ts:
     — пересчёт ответов решателем и независимо, по параметрам;
     — суммы вероятностей (распределения, ветви дерева, билеты);
     — распределение ответов аналогов (не меньше 20 разных из 50, ни
       один не чаще трёх раз), свежесть файла аналогов;
     — уникальность наборов чисел;
     — доля сюжетных задач: 20 из 50, по две на тему;
     — разметка формул (KaTeX строго, «чистота», тысячи, запятая);
     — рисунки: раскладка диаграмм Эйлера и деревьев.
   Здесь же — формулы обычным текстом и сырой TeX вне $…$ (те же
   признаки, что у pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie6/selftest');

const { problems, solved, statistika } = checkBank(typeset);

for (const { where, u, s } of solved) {
  for (const text of vseTeksty(u, s)) {
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where,
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»`,
      });
    }
  }
}

/* Проверка проверки: диаграмма с подписями друг на друге и дерево с
   подписью на ветке обязаны дать замечания. */
{
  const { problemyEilera, EILER } = requireSrc('components/probability/eilerRaskladka');
  const { problemyDereva } = requireSrc('lib/zadanie6/selftest');
  const { raskladkaDereva } = requireSrc('components/probability/derevoRaskladka');
  const box = (x, y) => ({ x, y, halfW: 8, halfH: 6 });
  const plohaya = {
    w: EILER.w,
    h: EILER.h,
    s: box(16, 17),
    tochki: [
      { cx: 100, cy: 80, znachenie: box(100, 70) },
      { cx: 104, cy: 82, znachenie: box(104, 72) },
    ],
  };
  if (problemyEilera(plohaya).length === 0) {
    problems.push({
      where: 'самопроверка',
      what: 'наложение подписей на диаграмме Эйлера не поймано',
    });
  }
  const r = raskladkaDereva({
    branches: [
      { id: 'a', parent: null, label: '', p: 0.5 },
      { id: 'b', parent: null, label: '', p: 0.5 },
    ],
  });
  const naVetke = {
    ...r,
    metki: r.metki.map((m) => ({
      ...m,
      x: (r.otrezki[0].x1 + r.otrezki[0].x2) / 2,
      anchor: 'start',
    })),
  };
  if (problemyDereva(naVetke).length === 0) {
    problems.push({ where: 'самопроверка', what: 'подпись на ветке дерева не поймана' });
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
console.log('Банк задания №6 в порядке.');
