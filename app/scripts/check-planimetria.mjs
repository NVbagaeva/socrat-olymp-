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

   Банк: 214 задач Блока 1 и по двадцать аналогов на прототип — ответ
   ЕГЭ (целое или конечная дробь), сходится с измерением на фигуре и с
   решением по шагам; все формулы набираются KaTeX строго; в формулах
   нет «1x», «+ −», «−(−» и лишних скобок; отпечатки задач (числа
   условия и конфигурация, поворот и отражение не в счёт) не
   повторяются; у аналогов не меньше 12 различных ответов и ни один не
   встречается больше двух раз (исключения — с причиной, в отчёт);
   файл аналогов совпадает с подбором заново.

   Теория (справочник): рисунки карточек и фактов чисты, «Пример» —
   задача открытого банка своего прототипа, у каждого прототипа есть
   карточка, формулы и тексты набираются KaTeX строго; каждая формула
   проверена численно на 200 случайных фигурах с точностью 1e-9.

   Источники: в файлах №1 нет имён авторов и названий сторонних
   источников (список слов — только локально, в _sources/zadanie-1/);
   тексты теории не совпадают с текстами источников больше чем на
   восемь слов подряд (тексты источников — тоже только локально).

   Запуск: pnpm test:planimetria [N]
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { proveritPereskaz, proveritZapret } from './lib/istochniki-1.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const n = Number(process.argv[2] ?? 1000);
const { checkBank } = requireSrc('lib/planimetriya/bank/selftest');
const { checkObraztsy, checkStress, checkZhivye } = requireSrc('lib/planimetriya/selftest');

const obr = checkObraztsy();
console.log(`образцы: ${obr.risunkov} рисунков, проблем ${obr.problems.length}`);
const st = checkStress(n);
console.log(`стресс-тест: ${n} генераций, ${st.risunkov} рисунков, проблем ${st.problems.length}`);
const zh = checkZhivye(300);
console.log(`живые чертежи: ${zh.risunkov} положений, проблем ${zh.problems.length}`);

const bank = checkBank(typeset);
console.log(
  `банк: ${bank.zadach} задач (214 ФИПИ, образцы и аналоги), проблем ${bank.problems.length}`,
);
for (const i of bank.isklucheniya) console.log(`  исключение: прототип ${i.proto} — ${i.prichina}`);

const { checkTeoriya, tekstyTeorii } = requireSrc('lib/planimetriya/teoriya-selftest');
const { proveritFormuly } = requireSrc('lib/planimetriya/teoriya-proverka');
const teor = checkTeoriya(typeset);
console.log(
  `теория: ${teor.kartochek} карточек, ${teor.faktov} фактов, проблем ${teor.problems.length}`,
);
const form = proveritFormuly(200, 1e-9);
console.log(
  `формулы: ${form.formul} формул на ${form.figur} случайных фигурах, расхождений ${form.problems.length}`,
);
for (const b of form.bezProverki) console.log(`  определение, без проверки: ${b}`);
const pereskaz = proveritPereskaz(tekstyTeorii(), 8);
if (pereskaz === null) {
  console.log('пересказ: текстов источников нет на этой машине — сверка пропущена');
} else {
  console.log(`пересказ: совпадений с источниками длиннее 8 слов — ${pereskaz.length}`);
}

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
  ...bank.problems,
  ...teor.problems,
  ...form.problems,
  ...(pereskaz ?? []).map((x) => `совпадение с источником: ${x}`),
  ...(zapret ?? []).map((z) => `упоминание источника: ${z}`),
];
if (vse.length > 0) {
  for (const p of vse.slice(0, 200)) console.log(`  ✗ ${p}`);
  if (vse.length > 200) console.log(`  … и ещё ${vse.length - 200}`);
  process.exit(1);
}
console.log('ок');
