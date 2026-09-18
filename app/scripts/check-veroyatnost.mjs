#!/usr/bin/env node
/* scripts/check-veroyatnost.mjs — автотест банка заданий №4 и №5.

   Запуск: pnpm test:veroyatnost

   Прогоняет все варианты всех прототипов и печатает семь чисел:
   сколько прототипов и вариантов, откуда они взяты, где ответ по
   формуле разошёлся с ответом перебором исходов, где последний шаг
   разбора не равен ответу, где ответ не пишется в клетки ЕГЭ, какие
   варианты из источников не прошли проверку и есть ли повторы.

   Ненулевой код возврата — банк не сходится.

   Сама проверка живёт в src/lib/veroyatnost/selftest.ts: здесь
   только запуск. TypeScript переводится в CommonJS во временную
   папку и вызывается — так же, как в автотесте задания №3.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

/** TypeScript из зависимостей проекта, а если их нет — из системного. */
function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    const global = createRequire('/opt/node22/lib/node_modules/typescript/package.json');
    return global('typescript');
  }
}

const ts = loadTypeScript();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(full);
    }
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'veroyatnost-'));
const src = path.join(root, 'src', 'lib');

/* Банк тянет за собой разбор ответа из lib/answer.ts и источник
   случайных чисел генератора из lib/zadanie3/podhod.ts — переводим
   их вместе с папкой раздела. */
for (const file of [
  ...walk(path.join(src, 'veroyatnost')),
  path.join(src, 'answer.ts'),
  path.join(src, 'zadanie3', 'podhod.ts'),
]) {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const target = path.join(out, path.relative(src, file).replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, js);
}

const { checkBank, checkPrep, checkLabirint, checkModel } = require0(
  path.join(out, 'veroyatnost', 'selftest.js'),
);
const { BANK_4, BANK_5, KONSPEKT_4, PODGOTOVKA_4, PODGOTOVKA_5 } = require0(
  path.join(out, 'veroyatnost', 'index.js'),
);

/* Прототипы конспекта проверяются вместе с банком: их сгенерированные
   варианты обязаны сходиться так же, как варианты задачника. */
const report = checkBank([...BANK_4, ...BANK_5, ...KONSPEKT_4]);

console.log(`1. прототипов ${report.prototypes}, вариантов ${report.variants}`);
console.log(`   сгенерировано ${report.bySource.новый} (пометка «генератор» у каждого прототипа)`);
console.log(
  `2. из задачника ${report.bySource.задачник}, из конспекта ${report.bySource.конспект}, ` +
    `создано заново ${report.bySource.новый}`,
);
console.log(`3. ответ по формуле разошёлся с ответом перебором: ${report.mismatchPerebor}`);
console.log(`4. последний шаг разбора не равен ответу: ${report.mismatchSteps}`);
console.log(`5. ответ не пишется в клетки и округления в условии нет: ${report.badFormat}`);
console.log(`6. варианты из источников с проблемами: ${report.sourceProblems.length}`);
report.sourceProblems.slice(0, 20).forEach((item) => console.log(`   ${item.ref}: ${item.why}`));
console.log(`7. совпадающих вариантов: ${report.duplicates.length}`);
report.duplicates.forEach((item) => console.log(`   ${item.a} = ${item.b}`));
console.log(`столкновений отпечатков ответа: ${report.collisions.length}`);
report.collisions.forEach((item) => console.log(`   ${item.a} = ${item.b}`));

const prep = checkPrep([...PODGOTOVKA_4, ...PODGOTOVKA_5]);
console.log(`\nподготовка: блоков ${prep.bloki}, задач ${prep.zadachi}`);
console.log(`  ответ разошёлся с проверкой другим путём: ${prep.mismatch}`);
console.log(`  последний шаг разбора не равен ответу: ${prep.mismatchSteps}`);
console.log(`  ответ не пишется в клетки и округления в условии нет: ${prep.badFormat}`);
console.log(`  повторов: ${prep.duplicates.length}`);
prep.duplicates.forEach((item) => console.log(`   ${item}`));

/* Модель задачи (раздел 04 референса): метод у каждой задачи №4,
   рисунок собирается из параметров и показывает тот же ответ. */
const modeli = [
  ['№4', checkModel(BANK_4, PODGOTOVKA_4)],
  ['№5', checkModel(BANK_5, [])],
];
for (const [nomer, model] of modeli) {
  console.log(`\nмодель задания ${nomer}: задач по методам —`);
  for (const [metod, skolko] of Object.entries(model.poMetodam)) {
    console.log(`   ${metod}: ${skolko}`);
  }
  console.log(`  без методики: ${model.bezMetodiki.length}`);
  model.bezMetodiki.forEach((id) => console.log(`   ${id}`));
  console.log(`  рисунок показывает не тот ответ: ${model.risunokVret.length}`);
  model.risunokVret.slice(0, 20).forEach((item) => console.log(`   ${item}`));
  console.log(`  нарушений формы модели: ${model.problems.length}`);
  model.problems.slice(0, 20).forEach((item) => console.log(`   ${item}`));
}
const model = {
  bezMetodiki: modeli.flatMap(([, m]) => m.bezMetodiki),
  risunokVret: modeli.flatMap(([, m]) => m.risunokVret),
  problems: modeli.flatMap(([, m]) => m.problems),
};

const labirint = checkLabirint();
const {
  STENY,
  veroyatnostVyhoda,
  veroyatnostTupika,
  vyhody: vyhodyLabirinta,
} = require0(path.join(out, 'veroyatnost', 'labirint.js'));

/* Стены лабиринта записаны дважды: в labirint.ts, откуда берётся ответ,
   и в tools/gen_maze.py, откуда берётся картинка. Разойдутся — ученик
   увидит один лабиринт, а ответ будет от другого. Сверяем списки. */
const pySrc = fs.readFileSync(path.join(root, '..', 'tools', 'gen_maze.py'), 'utf8');
const pyBlok = pySrc.slice(
  pySrc.indexOf('RECTS = ['),
  pySrc.indexOf(']', pySrc.indexOf('RECTS = [')),
);
const pySteny = [...pyBlok.matchAll(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g)].map((m) =>
  m.slice(1, 5).map(Number).join(','),
);
const tsSteny = STENY.map((s) => s.join(','));
if (pySteny.join(' | ') !== tsSteny.join(' | ')) {
  const i = tsSteny.findIndex((s, k) => s !== pySteny[k]);
  const gde =
    i === -1
      ? `стен ${tsSteny.length} против ${pySteny.length}`
      : `стена ${i + 1}: [${tsSteny[i]}] против [${pySteny[i] ?? 'её нет'}]`;
  labirint.push(`стены в labirint.ts и tools/gen_maze.py разошлись — ${gde}`);
}

console.log(`\nлабиринт задачи 33: нарушений ${labirint.length}`);
console.log(`   стен ${tsSteny.length}, сверены с tools/gen_maze.py`);
console.log(
  `   ${vyhodyLabirinta()
    .map((imya) => `${imya} ${veroyatnostVyhoda(imya)}`)
    .join(', ')}, тупик ${veroyatnostTupika()}`,
);
labirint.forEach((item) => console.log(`   ${item}`));

fs.rmSync(out, { recursive: true, force: true });

if (labirint.length > 0) {
  console.error('\nЛабиринт разошёлся с рисунком.');
  process.exit(1);
}

if (model.bezMetodiki.length > 0 || model.risunokVret.length > 0 || model.problems.length > 0) {
  console.error('\nМодель задания №4 не сходится.');
  process.exit(1);
}

if (prep.bad.length > 0 || prep.duplicates.length > 0) {
  console.error(`\nПодготовительные задачи не сходятся: ${prep.bad.length} задач с проблемами.`);
  prep.bad.forEach((row) =>
    console.error(`  ${row.id} (конспект № ${row.n}): ${row.problems.join('; ')}`),
  );
  process.exit(1);
}

if (report.bad.length > 0 || report.malo.length > 0 || report.collisions.length > 0) {
  console.error(`\nБанк не сходится: ${report.bad.length} вариантов с проблемами.`);
  report.bad
    .slice(0, 40)
    .forEach((row) => console.error(`  ${row.id} вариант ${row.n}: ${row.problems.join('; ')}`));
  report.malo.forEach((item) => console.error(`  меньше десяти вариантов: ${item}`));
  process.exit(1);
}

console.log('\nБанк сходится: нарушений нет.');
