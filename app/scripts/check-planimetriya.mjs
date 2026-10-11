#!/usr/bin/env node
/* scripts/check-planimetriya.mjs — автотест движка планиметрических
   чертежей (задание №1).

   Образцы: сцена каждого прототипа (1–49 — Блок 1 ФИПИ, дальше —
   дополнительные) на числах первой задачи во всех режимах: лист
   ученика, каждый шаг подсказки, лист учителя.

   Стресс-тест: N случайных генераций (по умолчанию 1000) — случайные
   числа условия, поворот, отражение и переименование букв. На каждом
   рисунке: подписи не касаются линий, кривых и друг друга (проверка
   заново по линиям из отчёта движка), фигура не вырождена, отмеченные
   углы не меньше порога схематичного рисунка, на листе ученика нет
   подсказок, построений и чисел, ответ не читается с рисунка.

   Запуск: pnpm test:planimetriya [N]
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { requireSrc } from './lib/load-ts.mjs';

const n = Number(process.argv[2] ?? 1000);
const { checkObraztsy, checkStress } = requireSrc('lib/planimetriya/selftest');

const obr = checkObraztsy();
console.log(`образцы: ${obr.risunkov} рисунков, проблем ${obr.problems.length}`);
const st = checkStress(n);
console.log(`стресс-тест: ${n} генераций, ${st.risunkov} рисунков, проблем ${st.problems.length}`);

const vse = [...obr.problems, ...st.problems];
if (vse.length > 0) {
  for (const p of vse.slice(0, 200)) console.log(`  ✗ ${p}`);
  if (vse.length > 200) console.log(`  … и ещё ${vse.length - 200}`);
  process.exit(1);
}
console.log('ок');
