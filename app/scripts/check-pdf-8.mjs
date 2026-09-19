#!/usr/bin/env node
/* scripts/check-pdf-8.mjs — проверка сборника «Задание 8. Вычисления
   и преобразования».

   Запуск: pnpm test:pdf-8

   Проверяется не картинка, а то, что можно проверить машинно:
   состав, нумерация, ответы, формулы, шрифты, цвета, ссылки.
   Ненулевой код возврата валит сборку.

   Проверки идут по готовым файлам в app/public/materials/zadanie-8
   и по промежуточному HTML в app/.pdf-build: PDF отвечает за шрифты,
   цвета и ссылки, HTML — за состав и нумерацию.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import content from '../src/content/sheet8.js';
import outputs from '../src/lib/sheet/outputs.js';
import { requireSrc } from './lib/load-ts.mjs';
import { checkNoAnswersTracked, checkPdfFile } from './lib/sheet-check.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECTION = 'zadanie-8';
const BUILD = path.join(APP, '.pdf-build');

function pdfPath(name, withAnswers) {
  return outputs.target(APP, { name, section: SECTION, withAnswers }).file;
}

const LINKS = ['https://t.me/budet_na_ege_math', 'https://youtube.com/@math_princess'];

const PLACEHOLDERS = ['ВПИШИТЕ ФРАЗУ', 'Lorem', 'lorem', 'TODO', 'placeholder'];

const errors = [];
function fail(message) { errors.push(message); }

/* ══════════════════════════════════════════════════════════
   Банк: ответы считает движок и банк, а не файл ответов
   ══════════════════════════════════════════════════════════ */
const { BANK } = requireSrc('lib/vychisleniya/bank');
const { generate } = requireSrc('lib/vychisleniya/generate');
const { ru } = requireSrc('lib/vychisleniya/numbers');
const { SKILLS } = requireSrc('lib/vychisleniya/skills');

const expected = [];
let number = 0;
for (const skill of SKILLS) {
  for (const protoId of skill.prototypes) {
    const entry = BANK.find((item) => item.prototype === protoId);
    if (entry === undefined) { fail('банк: нет прототипа ' + protoId); continue; }
    for (const variant of entry.variants) {
      const task = generate(protoId, variant.seed, variant.level);
      number += 1;
      expected.push({ no: number, id: protoId + '#' + variant.n, answer: ru(task.otvet), set: skill.id });
    }
  }
}

/* ══════════════════════════════════════════════════════════
   PDF: шрифты, цвета, ссылки — общая проверка листа
   ══════════════════════════════════════════════════════════ */
function checkPdf(name, expectMono, strictFonts, withAnswers) {
  checkPdfFile(pdfPath(name, withAnswers), { name, mono: expectMono, strictFonts, links: LINKS, fail });
}

/* ══════════════════════════════════════════════════════════
   Отчёт сборки: состав, нумерация, ответы, формулы
   ══════════════════════════════════════════════════════════ */
function checkReport(name, withAnswers) {
  const file = path.join(BUILD, name + '.json');
  if (!fs.existsSync(file)) {
    fail(name + ': нет отчёта сборки, соберите заново');
    return;
  }
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (report.tasks !== expected.length) {
    fail(name + ': задач в документе ' + report.tasks + ', в банке ' + expected.length);
  }

  const wrong = report.taskNumbers.findIndex((value, index) => value !== index + 1);
  if (wrong >= 0) {
    fail(name + ': нумерация не сквозная — на месте ' + (wrong + 1) + ' стоит номер ' + report.taskNumbers[wrong]);
  }

  expected.forEach((task, index) => {
    if (report.taskIds[index] !== task.id) {
      fail(name + ': на месте ' + task.no + ' задача ' + report.taskIds[index] + ', а банк даёт ' + task.id);
    }
  });

  if (report.formulasFailed) {
    fail(name + ': KaTeX не принял формул — ' + report.formulasFailed);
  }

  const links = [...new Set(report.links)].sort();
  if (links.join('|') !== [...LINKS].sort().join('|')) {
    fail(name + ': ссылки в подвале — ' + links.join(', '));
  }

  const total = report.pages;
  report.pageNumbers.forEach((label, index) => {
    const want = (index + 1) + ' / ' + total;
    if (label !== want) { fail(name + ': номер страницы «' + label + '», ожидался «' + want + '»'); }
  });

  PLACEHOLDERS.forEach((mark) => {
    if (report.text.includes(mark)) {
      fail(name + ': в документе текст-заглушка «' + mark + '»');
    }
  });

  if (!withAnswers) {
    if (report.answerLines !== expected.length) {
      fail(name + ': строк «Ответ: ____» — ' + report.answerLines + ', задач ' + expected.length);
    }
    if (report.answerRows.length || report.solutions) {
      fail(name + ': в файле для ученика есть ответы — строк таблицы ' + report.answerRows.length +
        ', решений ' + report.solutions);
    }
    if (/Ответы|Краткие решения/.test(report.text)) {
      fail(name + ': в файле для ученика есть раздел ответов');
    }
  } else {
    if (report.answerLines) {
      fail(name + ': в файле для учителя остались строки «Ответ: ____» — ' + report.answerLines);
    }
    if (report.answerRows.length !== expected.length) {
      fail(name + ': в таблице ответов ' + report.answerRows.length + ' строк, задач ' + expected.length);
    }
    const byNo = new Map(report.answerRows.map((row) => [row.no, row.answer]));
    expected.forEach((task) => {
      const cell = byNo.get(task.no);
      if (cell === undefined) { fail(name + ': в таблице нет номера ' + task.no); return; }
      const same = cell.replace(/−/g, '-');
      if (!same.includes(task.answer.replace(/−/g, '-'))) {
        fail(name + ': ответ на задачу ' + task.no + ' в таблице «' + cell + '», банк даёт «' + task.answer + '»');
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════
   Ссылки с сайта: карточка материала должна вести на живой файл
   ══════════════════════════════════════════════════════════ */
function checkSiteLinks() {
  const file = path.join(APP, 'src', 'content', 'vychisleniya.ts');
  if (!fs.existsSync(file)) { fail('vychisleniya.ts: файла нет'); return; }
  const source = fs.readFileSync(file, 'utf8');

  const paths = [...source.matchAll(/^\s*file:\s*'([^']+)'/gm)].map((m) => m[1]);
  if (!paths.length) {
    fail('vychisleniya.ts: ни одна карточка материалов не ведёт на файл');
    return;
  }

  paths.forEach((href) => {
    const target = path.join(APP, 'public', href.replace(/^\//, ''));
    if (!fs.existsSync(target)) {
      fail('карточка ведёт на ' + href + ', а файла в app/public нет');
      return;
    }
    console.log('  ссылка с сайта: ' + href + ' — файл на месте');
  });
}

/* ══════════════════════════════════════════════════════════
   Прогон
   ══════════════════════════════════════════════════════════ */
const files = [
  { name: content.files.uchenik, mono: false, answers: false },
  { name: content.files.uchenikChb, mono: true, answers: false },
  { name: content.files.uchitel, mono: false, answers: true },
  { name: content.files.uchitelChb, mono: true, answers: true },
];

console.log('сборник «Задание 8. Вычисления и преобразования»');
console.log('  банк: навыков ' + SKILLS.length + ', задач ' + expected.length);

files.forEach((file) => {
  const report = path.join(BUILD, file.name + '.json');
  const withKatex = fs.existsSync(report) && JSON.parse(fs.readFileSync(report, 'utf8')).katex === true;

  checkPdf(file.name, file.mono, withKatex, file.answers);
  checkReport(file.name, file.answers);
  console.log('  проверен ' + file.name + (withKatex ? '' : ' (черновик, без KaTeX)'));
});

checkSiteLinks();
checkNoAnswersTracked(APP, fail);

if (errors.length) {
  console.error('\nнарушений: ' + errors.length);
  errors.forEach((message) => console.error('  ' + message));
  process.exit(1);
}
console.log('\nсборник сходится: нарушений нет');
