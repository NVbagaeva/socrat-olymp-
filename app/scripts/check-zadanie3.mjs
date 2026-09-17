#!/usr/bin/env node
/* scripts/check-zadanie3.mjs — автотест банка задания №3.

   Запуск: pnpm test:zadanie3

   Прогоняет все варианты всех прототипов и печатает семь чисел:
   сколько прототипов и вариантов, откуда они взяты, где ответ по
   формуле разошёлся с ответом по модели, где последний шаг разбора
   не равен ответу, где ответ не подходит под формат ЕГЭ, какие
   варианты из источников не прошли проверку и есть ли повторы.
   Заодно каждый чертёж варианта проходит чек-лист из 12 пунктов.

   Ненулевой код возврата — банк не сходится.

   Проверка живёт в src/lib/zadanie3/selftest.ts: тот же модуль
   читает страница-витрина, так что сборка и автотест считают
   одно и то же. Здесь только запуск: TypeScript переводится
   в CommonJS во временную папку и вызывается.
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

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'zadanie3-'));
const src = path.join(root, 'src', 'lib');

for (const file of [...walk(path.join(src, 'solid')), ...walk(path.join(src, 'zadanie3'))]) {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const target = path.join(out, path.relative(src, file).replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, js);
}

const { checkBank, badVariants } = require0(path.join(out, 'zadanie3', 'selftest.js'));
const { BANK } = require0(path.join(out, 'zadanie3', 'index.js'));

const report = checkBank(BANK);
const bad = badVariants(report);

console.log(`1. прототипов ${report.prototypes}, вариантов ${report.variants}`);
console.log(
  `2. из задачника ${report.bySource.задачник}, из домашки ${report.bySource.домашка}, ` +
    `создано заново ${report.bySource.новый}`,
);
console.log(`3. ответ по формуле разошёлся с ответом по модели: ${report.mismatchModel}`);
console.log(`4. последний шаг разбора не равен ответу: ${report.mismatchSteps}`);
console.log(`5. ответ не целый и не конечная десятичная дробь: ${report.badFormat}`);
console.log(`6. варианты из источников с проблемами: ${report.sourceProblems.length}`);
report.sourceProblems.forEach((item) => console.log(`   ${item.ref}: ${item.why}`));
console.log(`7. совпадающих вариантов: ${report.duplicates.length}`);
report.duplicates.forEach((item) => console.log(`   ${item.a} = ${item.b}`));
console.log(`чертежей с нарушениями чек-листа: ${report.drawingViolations.length}`);
report.drawingViolations.forEach((item) => console.log(`   ${item.id}: пункты ${item.points}`));

fs.rmSync(out, { recursive: true, force: true });

if (bad.length > 0 || report.notTen.length > 0) {
  console.error(`\nБанк не сходится: ${bad.length} вариантов с проблемами.`);
  bad
    .slice(0, 30)
    .forEach((row) => console.error(`  ${row.id} вариант ${row.n}: ${row.problems.join('; ')}`));
  report.notTen.forEach((item) => console.error(`  не по десять вариантов: ${item}`));
  process.exit(1);
}

console.log('\nБанк сходится: нарушений нет.');
