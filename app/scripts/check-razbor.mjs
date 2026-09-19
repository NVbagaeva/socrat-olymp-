#!/usr/bin/env node
/* scripts/check-razbor.mjs — разборы заданий №4 и №5 набираются.

   Запуск: pnpm test:razbor

   На карточке шаг разбора показывается словами и формулой: хвост
   строки из чисел и знаков уходит в KaTeX (см. lib/veroyatnost/razbor.ts).
   На сборке ошибка TeX не роняет страницу — формула остаётся текстом,
   и заметить это можно только глазами. Здесь тот же набор идёт в
   строгом режиме: любая формула, которую KaTeX не принял, роняет
   проверку и называется по имени. Заодно у каждой координатной
   прямой проверяется, что промежуток лежит в отрезке.

   Печатает, сколько шагов набрано и у скольких из них есть формула:
   если второе число вдруг упало, автоматика перестала узнавать
   вычисления.

   TypeScript переводится в CommonJS во временную папку внутри app/,
   а не в системную: оттуда require('katex') находит зависимости
   проекта. Модуль graph/katex.js тянет CSS и в Node не грузится —
   вместо него кладётся заглушка с тем же экспортом. */

import fs from 'node:fs';
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
    if (entry.isDirectory()) {
      return walk(full);
    }
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const out = fs.mkdtempSync(path.join(root, '.check-razbor-'));
const src = path.join(root, 'src', 'lib');

try {
  /* Внутри app/ файлы .js считаются модулями ES — package.json проекта
     объявляет "type": "module". Переведённый код — CommonJS, поэтому
     папке нужен свой package.json с обратным объявлением. */
  fs.writeFileSync(path.join(out, 'package.json'), '{ "type": "commonjs" }\n');
  for (const file of [
    ...walk(path.join(src, 'veroyatnost')),
    path.join(src, 'answer.ts'),
    path.join(src, 'tex.ts'),
  ]) {
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    }).outputText;
    const target = path.join(out, path.relative(src, file).replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, js);
  }
  fs.mkdirSync(path.join(out, 'graph'), { recursive: true });
  fs.writeFileSync(path.join(out, 'graph', 'katex.js'), "exports.katex = require('katex');\n");

  const { BANK_4, BANK_5, PODGOTOVKA_4, PODGOTOVKA_5 } = require0(
    path.join(out, 'veroyatnost', 'index.js'),
  );
  const { naborRazbora } = require0(path.join(out, 'veroyatnost', 'nabor.js'));
  const { promezhutok } = require0(path.join(out, 'veroyatnost', 'pryamaya.js'));

  let shagov = 0;
  let formul = 0;
  let pryamyh = 0;
  const oshibki = [];

  function proverit(imya, shagi, pryamaya) {
    try {
      if (pryamaya !== undefined) {
        promezhutok(pryamaya);
        pryamyh += 1;
      }
      const razbor = naborRazbora(shagi, pryamaya, true);
      shagov += razbor.shagi.length;
      formul += razbor.shagi.filter((shag) => shag.formula !== null).length;
    } catch (error) {
      oshibki.push(`${imya}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const prototype of [...BANK_4, ...BANK_5]) {
    for (const variant of prototype.varianty) {
      proverit(
        `${prototype.id} вариант ${variant.n}`,
        prototype.shagi(variant.params),
        prototype.pryamaya?.(variant.params),
      );
    }
  }
  for (const blok of [...PODGOTOVKA_4, ...PODGOTOVKA_5]) {
    for (const zadacha of blok.zadachi) {
      proverit(zadacha.id, zadacha.shagi, zadacha.pryamaya);
    }
  }

  console.log(
    `шагов набрано: ${shagov}, из них с формулой: ${formul}, координатных прямых: ${pryamyh}`,
  );
  if (oshibki.length > 0) {
    console.error(`\nНе набрались ${oshibki.length}:`);
    oshibki.slice(0, 40).forEach((row) => console.error(`  ${row}`));
    process.exitCode = 1;
  } else {
    console.log('Все разборы набираются.');
  }
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
