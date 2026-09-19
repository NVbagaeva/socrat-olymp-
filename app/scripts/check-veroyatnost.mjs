#!/usr/bin/env node
/* scripts/check-veroyatnost.mjs — автотест банка заданий №4 и №5.

   Запуск: pnpm test:veroyatnost

   Прогоняет все варианты всех прототипов и печатает семь чисел:
   сколько прототипов и вариантов, откуда они взяты, где ответ по
   формуле разошёлся с ответом перебором исходов, где последний шаг
   разбора не равен ответу, где ответ не пишется в клетки ЕГЭ, какие
   варианты из источников не прошли проверку и есть ли повторы.

   Отдельно набирает формулы всех разборов настоящим KaTeX в строгом
   режиме — тем же кодом, что и сборка (pool.ts). Формула, которую
   KaTeX не принял, называется по задаче и роняет проверку: на сборке
   молчаливого отката формулы в текст нет, и здесь его тоже нет.

   И собирает листы генератора обоих заданий (sheet4Spec) со всеми
   вариантами всех прототипов: картинок задач на листе быть не должно —
   ни тега <img>, ни путей /images/. Картинки — только у подготовки
   и тренажёра.

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

/* Банк тянет за собой разбор ответа из lib/answer.ts, источник
   случайных чисел генератора из lib/zadanie3/podhod.ts, набор формул
   из lib/tex.ts и склонение из lib/plural.ts (его просят слова
   вкладки подготовки) — переводим их вместе с папкой раздела. */
for (const file of [
  ...walk(path.join(src, 'veroyatnost')),
  path.join(src, 'answer.ts'),
  path.join(src, 'plural.ts'),
  path.join(src, 'tex.ts'),
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
console.log(`   выкладки в тексте шага или формулы не в TeX: ${report.vykladki}`);
report.bad
  .flatMap((v) =>
    v.problems
      .filter((x) => x.includes('в тексте') || x.includes('не в TeX'))
      .map((x) => `${v.id} № ${v.n}: ${x}`),
  )
  .slice(0, 20)
  .forEach((item) => console.log(`   ${item}`));
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
console.log(`  выкладки в тексте шага или формулы не в TeX: ${prep.vykladki}`);
prep.bad
  .flatMap((v) =>
    v.problems
      .filter((x) => x.includes('в тексте') || x.includes('не в TeX'))
      .map((x) => `${v.id}: ${x}`),
  )
  .slice(0, 60)
  .forEach((item) => console.log(`   ${item}`));
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

/* Набор формул разборов настоящим KaTeX — тем же кодом, что на сборке.
   lib/tex.ts берёт KaTeX через graph/katex.js, а тот тянет CSS и в
   Node не грузится; вместо него в переводе лежит модуль с тем же
   экспортом, который берёт katex из зависимостей проекта по полному
   пути — из временной папки простой require('katex') его не нашёл бы.
   Нет KaTeX — нет и проверки, а значит и зелёного результата. */
const tex = { shagov: 0, formul: 0, oshibki: [] };
let katexPut;
try {
  katexPut = require0.resolve('katex');
} catch {
  tex.oshibki.push('KaTeX не установлен (pnpm install): набор формул не проверен');
}
if (katexPut !== undefined) {
  fs.mkdirSync(path.join(out, 'graph'), { recursive: true });
  fs.writeFileSync(
    path.join(out, 'graph', 'katex.js'),
    `exports.katex = require(${JSON.stringify(katexPut)});\n`,
  );
  const { shagiRazbora } = require0(path.join(out, 'veroyatnost', 'pool.js'));
  const nabrat = (imya, shagi) => {
    try {
      const razbor = shagiRazbora(shagi);
      tex.shagov += razbor.length;
      tex.formul += razbor.filter((shag) => shag.html !== undefined).length;
    } catch (error) {
      tex.oshibki.push(`${imya}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  for (const prototype of [...BANK_4, ...BANK_5, ...KONSPEKT_4]) {
    for (const variant of prototype.varianty) {
      nabrat(`${prototype.id} вариант ${variant.n}`, prototype.shagi(variant.params));
    }
  }
  for (const blok of [...PODGOTOVKA_4, ...PODGOTOVKA_5]) {
    for (const zadacha of blok.zadachi) {
      nabrat(zadacha.id, zadacha.shagi);
    }
  }
}

console.log(`\nнабор формул KaTeX: шагов ${tex.shagov}, из них с формулой ${tex.formul}`);
console.log(`  формул, которые KaTeX не принял: ${tex.oshibki.length}`);
tex.oshibki.slice(0, 40).forEach((item) => console.log(`   ${item}`));

/* Лист генератора: картинок задач на нём нет. Лист №5 печатается той
   же sheet4Spec со словами LIST_5, поэтому собираются оба задания, с
   ответами и без, со всеми вариантами всех прототипов. Модули листа
   импортируют «@/…» — во временной папке эти пути разложены в
   node_modules/@: lib — ссылка на перевод, content — переведённые
   слова. Плоские ES-модули листа переводятся в CommonJS тем же
   TypeScript. Пул набирает формулы разборов KaTeX, поэтому без него
   лист не собрать — и это ошибка, а не пропуск проверки. */
const listy = { sobrano: 0, oshibki: [] };
if (katexPut === undefined) {
  listy.oshibki.push('KaTeX не установлен (pnpm install): лист генератора не собран');
} else {
  const alias = path.join(out, 'node_modules', '@');
  fs.mkdirSync(path.join(alias, 'content'), { recursive: true });
  fs.mkdirSync(path.join(out, 'sheet'), { recursive: true });
  fs.symlinkSync(out, path.join(alias, 'lib'), 'dir');
  const perevesti = (file, target) => {
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        allowJs: true,
      },
      fileName: file,
    }).outputText;
    fs.writeFileSync(target, js);
  };
  for (const [file, target] of [
    ['content/sheet12.js', path.join(alias, 'content', 'sheet12.js')],
    ['content/trainerModes.ts', path.join(alias, 'content', 'trainerModes.js')],
    ['content/veroyatnost.ts', path.join(alias, 'content', 'veroyatnost.js')],
    ['lib/sheet/marks.js', path.join(out, 'sheet', 'marks.js')],
    ['lib/sheet/typography.js', path.join(out, 'sheet', 'typography.js')],
    ['lib/sheet/answers.js', path.join(out, 'sheet', 'answers.js')],
  ]) {
    perevesti(path.join(root, 'src', file), target);
  }

  const { sheet4Spec } = require0(path.join(out, 'veroyatnost', 'sheet4.js'));
  const { bank4Pool, bank5Pool } = require0(path.join(out, 'veroyatnost', 'pool.js'));
  const { LIST_4, LIST_5 } = require0(path.join(alias, 'content', 'veroyatnost.js'));
  /* Описание листа целиком в строку: функции слов листа пропускаются. */
  const stroka = (spec) =>
    JSON.stringify(spec, (key, value) => (typeof value === 'function' ? undefined : value));
  for (const [nomer, pool, slova] of [
    ['№4', bank4Pool(), LIST_4],
    ['№5', bank5Pool(), LIST_5],
  ]) {
    const skills = pool.kinds.map((kind) => kind.id);
    const vsego = pool.kinds.reduce((sum, kind) => sum + kind.variants.length, 0);
    for (const withAnswers of [false, true]) {
      const imya = `лист ${nomer}${withAnswers ? ' с ответами' : ''}`;
      const params = {
        skills,
        count: vsego,
        seed: 'проверка',
        theme: 'color',
        layout: 'single',
        kind: 'Проверка',
        date: '',
      };
      const spec = sheet4Spec(pool, params, withAnswers, slova);
      listy.sobrano += 1;
      const zadach = spec.blocks.reduce((sum, block) => sum + block.tasks.length, 0);
      if (zadach !== vsego) {
        listy.oshibki.push(`${imya}: задач на листе ${zadach}, в банке ${vsego}`);
      }
      const text = stroka(spec);
      if (/<img\b/i.test(text)) {
        listy.oshibki.push(`${imya}: на листе есть тег <img>`);
      }
      if (/\/images\//.test(text)) {
        listy.oshibki.push(`${imya}: на листе есть путь /images/`);
      }
    }
  }
}
console.log(`\nлист генератора: собрано ${listy.sobrano}, картинок задач на листе нет`);
console.log(`  нарушений: ${listy.oshibki.length}`);
listy.oshibki.forEach((item) => console.log(`   ${item}`));

fs.rmSync(out, { recursive: true, force: true });

if (listy.oshibki.length > 0) {
  console.error('\nНа листе генератора есть картинки задач.');
  process.exit(1);
}

if (tex.oshibki.length > 0) {
  console.error('\nФормулы разборов не набираются.');
  process.exit(1);
}

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
