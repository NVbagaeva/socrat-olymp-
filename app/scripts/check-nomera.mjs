#!/usr/bin/env node
/* scripts/check-nomera.mjs — номер задания ЕГЭ не пишется в тексте руками.

   Запуск: pnpm test:nomera            — проверка, код 1 при находках;
           pnpm test:nomera -- --vse   — показать и разрешённые места.

   Номер задания на экзамене стоит в одном файле — src/content/struktura.js.
   Сменилась структура экзамена — меняется он, и все подписи «Задание
   №7», «№7 · Уравнения», «в задании №10» должны поменяться сами. Поэтому
   в строках сайта номера нет: текст берёт его функцией nomerRazdela()
   (и nomerDvumya(), slovoChasti()).

   Проверка разбирает исходники TypeScript и смотрит только в строки и
   текст разметки — комментарии не трогает: в комментариях и в именах
   файлов «№7» — номер хранения раздела, он постоянный.

   Что считается номером задания в строке:
     «№7», «№ 7»            — знак номера и одна-две цифры;
     «задание 7», «задании 10», «заданий 4, 5 и 8»;
     «Задания 1–13», «14–20» — диапазон номеров рядом со словом «задани…».

   Что разрешено — список RAZRESHENO ниже: номера задач открытого банка
   и источников, номера в условиях задач («автобус № 5»), и разделы,
   которые ещё не переведены на struktura.js (ждут слияния своих PR). */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'src');
const require = createRequire(import.meta.url);
const ts = require('typescript');

const VSE = process.argv.includes('--vse');

/* ── Что ищем ────────────────────────────────────────────────────── */

const NOMER = [
  /№\s?\d{1,2}(?![\d.,]?\d)/u,
  /[Зз]адани(?:е|я|ю|ем|и|й|ям|ях|ями)\s+№?\s?\d{1,2}(?![\d.,]?\d)/u,
];

/* ── Что разрешено ───────────────────────────────────────────────────

   file — начало пути от src (или RegExp); text — что должно быть в
   строке (RegExp), не задано — любая строка файла; why — почему. */

const RAZRESHENO = [
  /* Служебные страницы и витрины: в сборку для хостинга не идут. */
  { file: /^app\/styleguide\//, why: 'витрина разработки' },
  { file: /\.dev\.tsx$/, why: 'служебная страница разработки' },
  { file: /^app\/dev\//, why: 'служебная страница разработки' },
  { file: 'lib/graph/preview-ui.js', why: 'служебная страница разработки' },
  {
    file: /^lib\/variant\/adapters\/z\d\d\/info\.ts$/,
    why: 'заметки адаптера варианта: печатает только проверка check-variant',
  },
  { file: 'content/perenos-iz-04-v-05.ts', why: 'временный файл переноса, на сайт не выводится' },

  /* Базовая математика — другой экзамен со своей нумерацией (21 задание),
     она не менялась. Структура профиля (struktura.js) её не описывает. */
  { file: /^(content|lib|components)\/baza\//, why: 'базовый ЕГЭ: своя нумерация' },
  { file: /^app\/baza\//, why: 'базовый ЕГЭ: своя нумерация' },

  /* Не номер задания ЕГЭ. */
  { file: 'content/blanki.ts', why: 'номер бланка ответов' },
  { file: 'content/variant.ts', text: /бланк ответов № 1/u, why: 'номер бланка ответов' },
  {
    file: /^lib\/veroyatnost\/(bank4|bank5)\//,
    text: /(школ|маршрут)\S*\s+№/u,
    why: 'номер в условии задачи',
  },
  {
    file: 'lib/veroyatnost/podgotovka5.ts',
    text: /маршрут\S*\s+№/u,
    why: 'номер в условии задачи',
  },

  /* Написано в нумерации экзамена 2026 года и до переключения сайта на
     19 заданий остаётся как есть: текст на экране не меняется. При
     переключении (PR 6 плана) эти номера станут верными — тогда их
     заменить на nomerRazdela() и убрать правила. */
  {
    file: 'content/teoriya1.ts',
    text: /Для задачи №17/u,
    why: 'нумерация 2026: планиметрия второй части',
  },
  {
    file: 'lib/planimetriya/teoriya-proverka.ts',
    text: /для №17/u,
    why: 'нумерация 2026: планиметрия второй части',
  },
  {
    file: 'content/teoriya7-irr.ts',
    text: /пригодится в №13/u,
    why: 'нумерация 2026: уравнение второй части',
  },
  {
    file: /^content\/(zadanie13|ekonomicheskie13)\.ts$/,
    text: /шли заданием 16/u,
    why: 'история: номер экономической задачи до 2027 года; текст перепишется в PR 6',
  },

  /* Файлы, которые правят открытые PR: переводятся на struktura.js после
     их слияния, чтобы не создавать конфликтов. Правило убрать вместе с
     переводом. */
  { file: 'lib/progressImport/registry.ts', why: 'ждёт слияния PR 349, 350, 352, 358' },
  { file: 'content/zadanie10.ts', why: 'ждёт слияния PR 352' },
  { file: 'components/tasks/zadanie10/Teoriya10.tsx', why: 'ждёт слияния PR 352' },
  {
    file: /^components\/tasks\/vychisleniya\/(Podgotovka8Screen|Trenazher8Screen)\.tsx$/,
    why: 'ждёт слияния PR 362',
  },
];

function razresheno(rel, text) {
  return RAZRESHENO.find(
    (r) =>
      (typeof r.file === 'string' ? rel.startsWith(r.file) : r.file.test(rel)) &&
      (r.text === undefined || r.text.test(text)),
  );
}

/* Поля, в которых записан источник задачи: номер задачи открытого
   банка, сборника, урока. Это не номер задания ЕГЭ. */
const POLYA_ISTOCHNIKA = new Set(['source', 'sourceNote', 'iz', 'fipiNos', 'istochnik', 'gde']);

/* ── Разбор ──────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** Строки и текст разметки файла: [{ line, text }]. Комментариев тут нет. */
function stroki(file) {
  const source = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, false, kind);
  const out = [];
  const add = (node, text) => {
    out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text });
  };
  const visit = (node) => {
    /* Сообщение об ошибке разработчику: new Error('№7: нет данных').
       Ученик его не видит, а номер в нём — номер хранения. */
    if (ts.isNewExpression(node) && /Error$/.test(node.expression.getText(sf))) {
      return;
    }
    /* Служебные поля банка: откуда задача. На экран не выводятся. */
    if (
      ts.isPropertyAssignment(node) &&
      POLYA_ISTOCHNIKA.has(node.name.getText(sf).replace(/['"]/g, ''))
    ) {
      return;
    }
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      add(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const nahodki = [];
const propuski = [];
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  for (const { line, text } of stroki(file)) {
    if (!NOMER.some((re) => re.test(text))) continue;
    const kratko = text.replace(/\s+/g, ' ').trim().slice(0, 110);
    const pravilo = razresheno(rel, text);
    (pravilo ? propuski : nahodki).push({ rel, line, kratko, why: pravilo?.why });
  }
}

if (VSE) {
  const poPrichine = new Map();
  for (const p of propuski) poPrichine.set(p.why, (poPrichine.get(p.why) ?? 0) + 1);
  console.log('Разрешено:');
  for (const [why, n] of poPrichine) console.log(`  ${n} — ${why}`);
}

if (nahodki.length > 0) {
  console.error(`\nНомер задания ЕГЭ записан в тексте руками — ${nahodki.length}:\n`);
  for (const n of nahodki) console.error(`  src/${n.rel}:${n.line}  «${n.kratko}»`);
  console.error(
    '\nНомер берётся из src/content/struktura.js: nomerRazdela(код раздела).' +
      '\nЕсли это не номер задания ЕГЭ (номер задачи банка, источник, условие задачи) —' +
      '\nдобавьте правило в RAZRESHENO в scripts/check-nomera.mjs.',
  );
  process.exit(1);
}
console.log(
  `Номера заданий ЕГЭ в текстах: руками не записан ни один (разрешённых мест — ${propuski.length}).`,
);
