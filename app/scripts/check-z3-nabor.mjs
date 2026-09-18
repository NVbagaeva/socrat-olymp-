#!/usr/bin/env node
/* scripts/check-z3-nabor.mjs — автотест набора математики в задании №3.

   Запуск: pnpm test:z3-nabor

   Правило одно: вся математика в видимом тексте идёт через KaTeX.
   Значит, в условии и в шагах разбора не должно быть ни юникодных
   индексов (₀–₉), ни знака «√», ни дефиса вместо минуса, ни
   «°» руками. Всё это KaTeX делает сам, а набранный руками символ
   ни курсива переменной, ни отбивки вокруг знака не даёт.

   Юникод-индекс остаётся ровно в трёх местах, и они проверяются
   отдельно: alt чертежа, <title> внутри SVG и aria-label. Там
   формулу не прочитать вслух, поэтому буквами — правильно.

   На самом чертеже подписи вершин набирает движок шрифтом формул,
   поэтому в <text> юникодных индексов тоже быть не должно: индекс
   рисуется отдельным <tspan>.

   Ненулевой код возврата — набор разошёлся с правилом.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

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
    return entry.isDirectory() ? walk(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'z3-nabor-'));
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

const { BANK } = require0(path.join(out, 'zadanie3', 'index.js'));

const SUB = /[₀-₉]/;          /* ₀ … ₉                      */
const ROOT = /√/;                  /* √                          */
const DEGREE = /°/;                /* °                          */

/* Куски вне формул: всё, что не между долларами. */
function outsideFormulas(text) {
  return text.split('$').filter((_, i) => i % 2 === 0).join(' ');
}

/* Дефис как минус: перед числом и после пробела или скобки. */
const HYPHEN_MINUS = /(^|[\s(])-\d/;

/* Латинская буква вне формулы — это всегда переменная или вершина:
   русский текст банка латиницы не содержит. Знак равенства вне
   формулы — тоже математика, набранная руками. */
const LATIN = /[A-Za-z]/;
const EQUALS = /=/;

const rules = [
  { key: 'индекс ₁', test: (t) => SUB.test(t) },
  { key: 'знак √', test: (t) => ROOT.test(t) },
  { key: 'знак °', test: (t) => DEGREE.test(t) },
  { key: 'дефис вместо минуса', test: (t) => HYPHEN_MINUS.test(t) },
  { key: 'латиница вне формулы', test: (t) => LATIN.test(t) },
  { key: 'знак = вне формулы', test: (t) => EQUALS.test(t) },
];

const found = new Map();
let variants = 0;
let texts = 0;

function look(where, text) {
  texts++;
  const bare = outsideFormulas(text);
  for (const rule of rules) {
    if (rule.test(bare)) {
      const list = found.get(rule.key) ?? [];
      list.push(`${where}: ${text.slice(0, 120)}`);
      found.set(rule.key, list);
    }
  }
}

for (const prototype of BANK) {
  for (const variant of prototype.varianty) {
    variants++;
    look(`${prototype.id}/${variant.n} условие`, prototype.uslovie(variant.params));
    prototype.shagi(variant.params).forEach((step, i) => {
      look(`${prototype.id}/${variant.n} шаг ${i + 1}`, step.text);
    });
  }
}

console.log(`просмотрено вариантов ${variants}, строк ${texts}`);

/* Сводка по прототипам: конвертация идёт файлами, и знать надо,
   какие прототипы ещё не переведены, а не только сколько строк. */
const byPrototype = new Map();
for (const list of found.values()) {
  for (const item of list) {
    const id = item.slice(0, item.indexOf('/'));
    byPrototype.set(id, (byPrototype.get(id) ?? 0) + 1);
  }
}
console.log(`прототипов с ручным набором: ${byPrototype.size}`);

let total = 0;
for (const rule of rules) {
  const list = found.get(rule.key) ?? [];
  total += list.length;
  console.log(`${rule.key}: ${list.length}`);
  list.slice(0, 8).forEach((item) => console.log(`   ${item}`));
  if (list.length > 8) {
    console.log(`   … и ещё ${list.length - 8}`);
  }
}

fs.rmSync(out, { recursive: true, force: true });

if (total > 0) {
  console.error(`\nНабор разошёлся с правилом: ${total} строк.`);
  process.exit(1);
}

console.log('\nНабор чистый: вся математика идёт через KaTeX.');
