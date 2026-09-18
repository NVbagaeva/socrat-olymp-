#!/usr/bin/env node
/* scripts/check-pdf-12.mjs — проверка сборника «Задание 12».

   Запуск: pnpm test:pdf-12

   Проверяется не картинка, а то, что можно проверить машинно:
   состав, нумерация, ответы, формулы, шрифты, цвета, ссылки.
   Ненулевой код возврата валит сборку.

   Проверки идут по готовым файлам в app/public/materials/zadanie-12
   и по промежуточному HTML в app/.pdf-build: PDF отвечает за шрифты,
   цвета и ссылки, HTML — за состав и нумерацию.
*/

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import content from '../src/content/sheet12.js';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'public', 'materials', 'zadanie-12');
const BUILD = path.join(APP, '.pdf-build');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');

const LINKS = ['https://t.me/budet_na_ege_math', 'https://youtube.com/@math_princess'];

/* Шрифты, которым место в готовом файле: свои из репозитория и KaTeX.
   Любой другой значит, что какого-то знака в наших шрифтах нет
   и браузер подставил системный — на другой машине он подставит
   другой, и строка поедет. Так в файле учителя однажды оказался
   DejaVuSans: из-за стрелки «→», которой нет в подмножестве Inter. */
const FONTS_ALLOWED = /^(Inter|Caveat|KaTeX)/;

/* Заглушки из образца оформления: ни одна из этих строк не должна
   попасть в документ. Образец рисовала нейросеть, тексты на нём
   выдуманные. */
const PLACEHOLDERS = ['ВПИШИТЕ ФРАЗУ', 'Lorem', 'lorem', 'TODO', 'placeholder', 'Две точки'];

const errors = [];
function fail(message) { errors.push(message); }

/* ══════════════════════════════════════════════════════════
   Банк: ответы считает движок, а не файл ответов
   ══════════════════════════════════════════════════════════ */
function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs.readdirSync(full).filter((n) => n.endsWith('.json')).sort()
    .map((n) => JSON.parse(fs.readFileSync(path.join(full, n), 'utf8')));
}
generator.setSets({ prep: readSets('prep/12'), prototypes: readSets('prototypes/12') });

const expected = [];
let number = 0;
for (const block of content.blocks) {
  for (const task of generator.generateSet(block.set)) {
    number += 1;
    expected.push({ no: number, id: task.id, answer: task.answer, set: block.set });
  }
}

/* ══════════════════════════════════════════════════════════
   PDF: шрифты, цвета, ссылки
   ══════════════════════════════════════════════════════════ */
function pdfStreams(data) {
  const out = [];
  const re = /stream\r?\n/g;
  let found;
  while ((found = re.exec(data.toString('latin1')))) {
    const start = found.index + found[0].length;
    const end = data.indexOf('endstream', start, 'latin1');
    if (end < 0) { continue; }
    const raw = data.subarray(start, end);
    try { out.push(zlib.inflateSync(raw).toString('latin1')); }
    catch { out.push(raw.toString('latin1')); }
  }
  return out;
}

function checkPdf(name, expectMono, strictFonts) {
  const file = path.join(OUT, name + '.pdf');
  if (!fs.existsSync(file)) { fail(name + '.pdf: файла нет'); return; }
  const data = fs.readFileSync(file);
  const text = data.toString('latin1');

  /* Шрифты вшиты: без FontFile принтер подставит свои. */
  if (!/\/FontFile/.test(text)) { fail(name + ': шрифты не вшиты в PDF'); }

  /* Посторонних шрифтов нет. Проверяется только у выпускной сборки:
     в черновике без KaTeX формулы набирает запасная антиква, и её
     системный шрифт здесь законен. */
  if (strictFonts) {
    const used = [...new Set([...text.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#-]+)/g)]
      .map((m) => m[1].split('+').pop()))];
    const stranger = used.filter((font) => !FONTS_ALLOWED.test(font));
    if (stranger.length) {
      fail(name + ': в файле посторонние шрифты — ' + stranger.join(', ') +
        '. Значит какого-то знака нет в наших шрифтах');
    }
  }

  /* Ссылки — ровно два адреса и никаких других. */
  const uris = [...new Set([...text.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]))].sort();
  if (uris.join('|') !== [...LINKS].sort().join('|')) {
    fail(name + ': ссылки в подвале — ' + (uris.join(', ') || 'нет') +
      ', а должно быть ровно два адреса');
  }

  /* Ч/б файл: только чёрный, белый и серые. */
  if (expectMono) {
    const colored = new Set();
    for (const stream of pdfStreams(data)) {
      for (const m of stream.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) (rg|RG)/g)) {
        const [r, g, b] = [m[1], m[2], m[3]].map(Number);
        if (Math.abs(r - g) > 0.02 || Math.abs(g - b) > 0.02) {
          colored.add([r, g, b].map((v) => v.toFixed(3)).join(' '));
        }
      }
    }
    if (colored.size) {
      fail(name + ': в ч/б файле цветá кроме серых — ' + [...colored].slice(0, 5).join('; '));
    }
  }
}

/* ══════════════════════════════════════════════════════════
   Отчёт сборки: состав, нумерация, ответы, формулы

   Проверяется ГОТОВЫЙ документ, а не его исходник: отчёт снят
   с отрисованных страниц. По исходному HTML проверять нельзя —
   куски потока лежат в нём строкой JSON, а имена классов ответов
   встречаются в таблице стилей у всех четырёх файлов.
   ══════════════════════════════════════════════════════════ */
function checkReport(name, withAnswers) {
  const file = path.join(BUILD, name + '.json');
  if (!fs.existsSync(file)) {
    fail(name + ': нет отчёта сборки, соберите заново');
    return;
  }
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));

  /* Число задач в документе равно числу задач в банке. */
  if (report.tasks !== expected.length) {
    fail(name + ': задач в документе ' + report.tasks + ', в банке ' + expected.length);
  }

  /* Нумерация сквозная: 1, 2, 3 … без пропусков и повторов. */
  const wrong = report.taskNumbers.findIndex((value, index) => value !== index + 1);
  if (wrong >= 0) {
    fail(name + ': нумерация не сквозная — на месте ' + (wrong + 1) +
      ' стоит номер ' + report.taskNumbers[wrong]);
  }

  /* Порядок задач совпадает с порядком банка. */
  expected.forEach((task, index) => {
    if (report.taskIds[index] !== task.id) {
      fail(name + ': на месте ' + task.no + ' задача ' + report.taskIds[index] +
        ', а банк даёт ' + task.id);
    }
  });

  /* Каждая формула прошла набор. */
  if (report.formulasFailed) {
    fail(name + ': KaTeX не принял формул — ' + report.formulasFailed);
  }

  /* Ссылки в подвале — ровно два адреса, на каждой странице. */
  const links = [...new Set(report.links)].sort();
  if (links.join('|') !== [...LINKS].sort().join('|')) {
    fail(name + ': ссылки в подвале — ' + links.join(', '));
  }

  /* Номера страниц: «N / M» по порядку. */
  const total = report.pages;
  report.pageNumbers.forEach((label, index) => {
    const want = (index + 1) + ' / ' + total;
    if (label !== want) { fail(name + ': номер страницы «' + label + '», ожидался «' + want + '»'); }
  });

  /* В кратких решениях нет округлённых чисел. Коэффициент может выйти
     дробью, которая в конечную десятичную не переводится (−1/3, 2/3):
     её печатают обыкновенной дробью. Все числа банка — целые или
     с одним знаком после запятой, поэтому три знака означают
     округление, а с ним выкладка перестаёт сходиться.

     Проверяются именно записи формул, а не текст страницы: в тексте
     соседние ячейки таблицы склеиваются и дают мнимые дроби. */
  (report.solutionTex || []).forEach((tex) => {
    if (/\{,\}\d{3}/.test(tex)) {
      fail(name + ': округлённое число вместо обыкновенной дроби — «' + tex + '»');
    }
  });

  /* Заглушек с образца оформления нет. */
  PLACEHOLDERS.forEach((mark) => {
    if (report.text.includes(mark)) {
      fail(name + ': в документе текст-заглушка «' + mark + '»');
    }
  });

  if (!withAnswers) {
    /* У ученика: строка ответа у каждой задачи и ни одного ответа. */
    if (report.answerLines !== expected.length) {
      fail(name + ': строк «Ответ: ____» — ' + report.answerLines +
        ', задач ' + expected.length);
    }
    if (report.answerRows.length || report.solutions) {
      fail(name + ': в файле для ученика есть ответы — строк таблицы ' +
        report.answerRows.length + ', решений ' + report.solutions);
    }
    if (/Ответы|Краткие решения/.test(report.text)) {
      fail(name + ': в файле для ученика есть раздел ответов');
    }
  } else {
    /* У учителя: строк ответа нет, таблица полная и сходится с движком. */
    if (report.answerLines) {
      fail(name + ': в файле для учителя остались строки «Ответ: ____» — ' + report.answerLines);
    }
    if (report.answerRows.length !== expected.length) {
      fail(name + ': в таблице ответов ' + report.answerRows.length +
        ' строк, задач ' + expected.length);
    }
    const byNo = new Map(report.answerRows.map((row) => [row.no, row.answer]));
    expected.forEach((task) => {
      const cell = byNo.get(task.no);
      if (cell === undefined) { fail(name + ': в таблице нет номера ' + task.no); return; }
      /* Минус в документе типографский, в ответе движка — обычный. */
      const same = cell.replace(/\u2212/g, '-');
      if (!same.includes(task.answer.replace(/\u2212/g, '-'))) {
        fail(name + ': ответ на задачу ' + task.no + ' в таблице «' + cell +
          '», движок считает «' + task.answer + '»');
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════
   Ссылки с сайта: карточка материала должна вести на живой файл
   ══════════════════════════════════════════════════════════ */

/* Карточка «Для репетиторов» без поля file рисуется приглушённой
   и не нажимается — так и было со «PDF-практикумом», пока сборник
   не собрали. Обратная беда тише и хуже: поле есть, а файла нет,
   и кнопка отдаёт 404. Проверяем прямо по конфигу разделов.

   sections.ts на TypeScript, из служебного скрипта его не
   импортировать, поэтому пути вынимаются разбором текста. */
function checkSiteLinks() {
  const file = path.join(APP, 'src', 'content', 'sections.ts');
  if (!fs.existsSync(file)) { fail('sections.ts: файла нет'); return; }
  const source = fs.readFileSync(file, 'utf8');

  const paths = [...source.matchAll(/^\s*file:\s*'([^']+)'/gm)].map((m) => m[1]);
  if (!paths.length) {
    fail('sections.ts: ни одна карточка материалов не ведёт на файл');
    return;
  }

  paths.forEach((href) => {
    /* Путь в конфиге — от корня сайта, файл лежит в app/public. */
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

console.log('сборник «Задание 12. Линейная функция»');
console.log('  банк: блоков ' + content.blocks.length + ', задач ' + expected.length);

files.forEach((file) => {
  /* Выпускная сборка идёт с KaTeX — об этом говорит отчёт. */
  const report = path.join(BUILD, file.name + '.json');
  const withKatex = fs.existsSync(report) &&
    JSON.parse(fs.readFileSync(report, 'utf8')).katex === true;

  checkPdf(file.name, file.mono, withKatex);
  checkReport(file.name, file.answers);
  console.log('  проверен ' + file.name + (withKatex ? '' : ' (черновик, без KaTeX)'));
});

checkSiteLinks();

if (errors.length) {
  console.error('\nнарушений: ' + errors.length);
  errors.forEach((message) => console.error('  ' + message));
  process.exit(1);
}
console.log('\nсборник сходится: нарушений нет');
