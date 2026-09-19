#!/usr/bin/env node
/* scripts/check-pdf-4.mjs — проверка сборника «Задание 4».
   Запуск: pnpm test:pdf-4

   Проверяется не картинка, а то, что можно проверить машинно:
   состав и порядок задач, сквозная нумерация, ответы против банка,
   формулы, шрифты, цвет в ч/б, ссылки, и главное — что в файлах
   для ученика нет ни одного ответа: ни в карточках, ни в разметке,
   ни в заголовке PDF. Ненулевой код возврата валит сборку.

   Проверки идут по готовым файлам в app/public/materials/zadanie-4
   и по промежуточному HTML с отчётом в app/.pdf-build. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import outputs from '../src/lib/sheet/outputs.js';
import { buildDir } from './lib/sheet-build.mjs';
import { checkNoAnswersTracked, checkNoTaskImages, checkPdfFile } from './lib/sheet-check.mjs';
import { collectSections, content, naming } from './lib/sheet4-tasks.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECTION = 'zadanie-4';
const BUILD = buildDir(APP);

const LINKS = content.foot.social.map((item) => item.href);
const PLACEHOLDERS = ['ВПИШИТЕ ФРАЗУ', 'Lorem', 'lorem', 'TODO', 'placeholder'];

const errors = [];
function fail(message) { errors.push(message); }

function pdfPath(name, withAnswers) {
  return outputs.target(APP, { name, section: SECTION, withAnswers }).file;
}

/* Ожидаемый состав — из того же модуля, что собирал лист, но без
   рисунков и решений: только номера, идентификаторы и ответы. */
const expected = collectSections(false).flatMap((section) =>
  section.tasks.map((task) => ({ no: task.no, id: task.id, answer: task.answer })));

/* ══════════════════════════════════════════════════════════
   Промежуточный HTML: куски потока до набора
   ══════════════════════════════════════════════════════════ */
function specItems(name) {
  const file = path.join(BUILD, name + '.html');
  if (!fs.existsSync(file)) { fail(name + ': нет промежуточного HTML, соберите заново'); return null; }
  const html = fs.readFileSync(file, 'utf8');
  checkNoTaskImages(html, name, fail);
  const found = /<script type="application\/json" id="sheet-spec">([\s\S]*?)<\/script>/.exec(html);
  if (!found) { fail(name + ': в HTML нет спецификации листа'); return null; }
  const title = /<title>([^<]*)<\/title>/.exec(html);
  return { spec: JSON.parse(found[1]), title: title ? title[1] : '' };
}

function textOf(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Число как отдельное слово: «0,2» не должно найтись внутри «0,25». */
function hasNumber(text, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^\\d,])' + escaped + '(?![\\d,])').test(text);
}

/* ══════════════════════════════════════════════════════════
   Отчёт сборки: состав, нумерация, ответы, формулы
   ══════════════════════════════════════════════════════════ */
function checkReport(name, withAnswers) {
  const file = path.join(BUILD, name + '.json');
  if (!fs.existsSync(file)) { fail(name + ': нет отчёта сборки, соберите заново'); return; }
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (report.tasks !== expected.length) {
    fail(name + ': задач в документе ' + report.tasks + ', в банке ' + expected.length);
  }
  const wrong = report.taskNumbers.findIndex((value, index) => value !== index + 1);
  if (wrong >= 0) {
    fail(name + ': нумерация не сквозная — на месте ' + (wrong + 1) +
      ' стоит номер ' + report.taskNumbers[wrong]);
  }
  expected.forEach((task, index) => {
    if (report.taskIds[index] !== task.id) {
      fail(name + ': на месте ' + task.no + ' задача ' + report.taskIds[index] +
        ', а банк даёт ' + task.id);
    }
  });
  if (report.formulasFailed) {
    fail(name + ': KaTeX не принял формул — ' + report.formulasFailed);
  }
  if (report.overflowing && report.overflowing.length) {
    fail(name + ': куски выше страницы — ' + report.overflowing.join(', '));
  }
  const links = [...new Set(report.links)].sort();
  if (links.join('|') !== [...LINKS].sort().join('|')) {
    fail(name + ': ссылки в подвале — ' + links.join(', '));
  }
  report.pageNumbers.forEach((label, index) => {
    const want = (index + 1) + ' / ' + report.pages;
    if (label !== want) { fail(name + ': номер страницы «' + label + '», ожидался «' + want + '»'); }
  });
  PLACEHOLDERS.forEach((mark) => {
    if (report.text.includes(mark)) { fail(name + ': в документе текст-заглушка «' + mark + '»'); }
  });

  if (!withAnswers) {
    if (report.answerLines !== expected.length) {
      fail(name + ': строк «Ответ: ____» — ' + report.answerLines +
        ', задач ' + expected.length);
    }
    if (report.answerRows.length || report.solutions) {
      fail(name + ': в файле для ученика есть ответы — строк таблицы ' +
        report.answerRows.length + ', решений ' + report.solutions);
    }
  } else {
    if (report.answerLines) {
      fail(name + ': в файле для учителя остались строки «Ответ: ____» — ' + report.answerLines);
    }
    if (report.answerRows.length !== expected.length) {
      fail(name + ': в таблице ответов ' + report.answerRows.length +
        ' строк, задач ' + expected.length);
    }
    const byNo = new Map(report.answerRows.map((row) => [row.no, row.answer]));
    expected.forEach((task) => {
      if (byNo.get(task.no) !== task.answer) {
        fail(name + ': ответ на задачу ' + task.no + ' в таблице «' + byNo.get(task.no) +
          '», банк считает «' + task.answer + '»');
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════
   Ученик: ни одного ответа ни в карточке, ни в разметке рисунка
   ══════════════════════════════════════════════════════════ */
function checkStudentItems(name) {
  const loaded = specItems(name);
  if (!loaded) { return; }
  const { spec, title } = loaded;

  if (/\d,\d/.test(title)) { fail(name + ': в заголовке документа есть число — «' + title + '»'); }

  const cards = spec.items.filter((item) => /class="sheet-task /.test(item));
  if (cards.length !== expected.length) {
    fail(name + ': карточек задач в спецификации ' + cards.length + ', задач ' + expected.length);
    return;
  }
  cards.forEach((card, index) => {
    const task = expected[index];
    if (/sheet-task-solution|sheet-steps|sheet-task-answer/.test(card)) {
      fail(name + ': в карточке ' + task.no + ' для ученика есть решение');
    }
    /* Подсветка благоприятного выдаёт m, а с ним и ответ: в заготовке
       её быть не должно — ни в классах, ни в подписях рисунка. */
    if (/--favorable|--highlighted|highlightedPaths|pr-counts|благоприятн\w+ \d/.test(card)) {
      fail(name + ': в рисунке задачи ' + task.no + ' для ученика есть подсветка ответа');
    }
    /* Заготовка без чисел: у плиток нет количеств «×873», в клетках
       таблицы нет сумм, у ветвей дерева нет вероятностей. */
    if (/×\d/.test(card)) {
      fail(name + ': у плиток задачи ' + task.no + ' для ученика стоят количества');
    }
    if (/class="pr-cell[^"]*"><rect[^>]*><\/rect><text/.test(card)) {
      fail(name + ': в клетках таблицы задачи ' + task.no + ' для ученика есть значения');
    }
    if (/pr-branch-p/.test(card)) {
      fail(name + ': у ветвей дерева задачи ' + task.no + ' для ученика стоят вероятности');
    }
    if (/pr-band/.test(card)) {
      fail(name + ': на оси задачи ' + task.no + ' для ученика показаны области условий');
    }
    /* Само число ответа в карточке — тоже утечка. Число ищется как
       отдельное слово, чтобы «0,2» не нашлось внутри «0,25». */
    if (hasNumber(textOf(card), task.answer)) {
      fail(name + ': в карточке ' + task.no + ' для ученика встречается ответ «' + task.answer + '»');
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PDF: шрифты, ссылки, цвет, заголовок
   ══════════════════════════════════════════════════════════ */
function checkPdf(name, mono, strictFonts, withAnswers) {
  const data = checkPdfFile(pdfPath(name, withAnswers), { name, mono, strictFonts, links: LINKS, fail });
  if (!data || withAnswers) { return; }
  /* Заголовок PDF ученика — без чисел: ответам там неоткуда взяться,
     но проверить дешевле, чем потом искать. Chromium пишет заголовок
     в UTF-16 шестнадцатеричной строкой. */
  const text = data.toString('latin1');
  const found = /\/Title\s*<([0-9A-Fa-f]+)>/.exec(text) || /\/Title\s*\(([^)]*)\)/.exec(text);
  if (!found) { fail(name + ': у PDF нет заголовка'); return; }
  let title = found[1];
  if (/^[0-9A-Fa-f]+$/.test(title) && title.toUpperCase().startsWith('FEFF')) {
    title = Buffer.from(title.slice(4), 'hex').swap16().toString('utf16le');
  }
  if (/\d,\d/.test(title)) { fail(name + ': в заголовке PDF есть число — «' + title + '»'); }
  for (const key of ['Subject', 'Keywords']) {
    if (new RegExp('/' + key + '\\s*[(<]').test(text)) {
      fail(name + ': в PDF есть поле ' + key + ', а лист его не задаёт');
    }
  }
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

console.log('сборник «' + naming().documentTitle + '»');
console.log('  банк: задач ' + expected.length);

files.forEach((file) => {
  const report = path.join(BUILD, file.name + '.json');
  const withKatex = fs.existsSync(report) &&
    JSON.parse(fs.readFileSync(report, 'utf8')).katex === true;

  checkPdf(file.name, file.mono, withKatex, file.answers);
  checkReport(file.name, file.answers);
  if (!file.answers) { checkStudentItems(file.name); }
  console.log('  проверен ' + file.name + (withKatex ? '' : ' (черновик, без KaTeX)'));
});

checkNoAnswersTracked(APP, fail);

if (errors.length) {
  console.error('\nсборник не сходится: нарушений ' + errors.length);
  errors.forEach((message) => console.error('  • ' + message));
  process.exit(1);
}
console.log('\nсборник сходится: нарушений нет');
