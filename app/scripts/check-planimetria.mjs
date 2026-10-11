#!/usr/bin/env node
/* scripts/check-planimetria.mjs — автотест задания №1 «Планиметрия».

   Движок чертежей:
   — образцы: сцена каждого прототипа на числах первой задачи во всех
     режимах (лист ученика, каждый шаг подсказки, лист учителя);
   — стресс-тест: N случайных генераций (по умолчанию 1000) — случайные
     числа условия, поворот, отражение и переименование букв. На каждом
     рисунке подписи не касаются линий, кривых и друг друга (проверка
     заново по линиям из отчёта движка), выноски не проходят через
     чужие подписи, фигура не вырождена, отмеченные углы не меньше
     порога схематичного рисунка, на листе ученика нет подсказок,
     построений и чисел, ответ не читается с рисунка;
   — живые чертежи: случайные перетаскивания вершин, каждое принятое
     положение рисуется чисто, величины выполняют свойство карточки.

   Источники: в файлах №1 нет имён авторов и названий сторонних
   источников (список слов — только локально, в _sources/zadanie-1/).

   Запуск: pnpm test:planimetria [N]
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { execFileSync } from 'node:child_process';
import { requireSrc } from './lib/load-ts.mjs';
import { proveritZapret } from './lib/istochniki-1.mjs';

const n = Number(process.argv[2] ?? 1000);
const { checkObraztsy, checkStress, checkZhivye } = requireSrc('lib/planimetriya/selftest');

const obr = checkObraztsy();
console.log(`образцы: ${obr.risunkov} рисунков, проблем ${obr.problems.length}`);
const st = checkStress(n);
console.log(`стресс-тест: ${n} генераций, ${st.risunkov} рисунков, проблем ${st.problems.length}`);
const zh = checkZhivye(300);
console.log(`живые чертежи: ${zh.risunkov} положений, проблем ${zh.problems.length}`);

const zapret = proveritZapret();
if (zapret === null) {
  console.log('источники: _sources/zadanie-1 нет на этой машине — проверка слов пропущена');
} else {
  console.log(`источники: имён авторов и названий в файлах №1 — ${zapret.length}`);
}

/* Ни одного файла сторонних источников в git: _sources/ — только локально. */
const vGit = execFileSync('git', ['ls-files', '--', '../_sources', '_sources'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);
console.log(`файлов из _sources/ в git: ${vGit.length}`);

const vse = [
  ...vGit.map((f) => `в git попал файл источника: ${f}`),
  ...obr.problems,
  ...st.problems,
  ...zh.problems,
  ...(zapret ?? []).map((z) => `упоминание источника: ${z}`),
];
if (vse.length > 0) {
  for (const p of vse.slice(0, 200)) console.log(`  ✗ ${p}`);
  if (vse.length > 200) console.log(`  … и ещё ${vse.length - 200}`);
  process.exit(1);
}
console.log('ок');
