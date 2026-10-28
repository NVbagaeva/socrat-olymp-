/* scripts/check-print-pages.mjs — печать листа без пустых страниц.

   Лист генератора печатается из браузера: страница /…/pechat/ набирает
   страницы листа и вызывает window.print(). Страница листа была ровно
   в A4 (297 мм), без запаса: если печатная область хоть чуть ниже —
   Safari на iPhone считает бумагу в целых пунктах, многие принтеры
   тоже, — подвал страницы уезжал на отдельную страницу, и после каждой
   страницы печаталась пустая (со светлым фоном сайта). Теперь страница
   на 2 мм ниже A4 (lib/sheet/theme.css), фон при печати белый.

   Проверяются листы ученика и учителя всех разделов с генератором,
   с постоянным зерном, три листа «Собрать вариант» по постоянному коду
   и справочник по планиметрии №1 (с примерами и без):

     Chromium — печать в PDF на трёх высотах бумаги: ровно A4 (с
       правилом @page листа) и 841 pt, 840 pt без @page — так печатает
       Safari на iPhone: правило не слушает, бумагу считает в пунктах.
       Страниц в PDF столько же, сколько в колонтитуле листа «N / M»,
       пустых страниц нет.
     WebKit (движок Safari) — Playwright не умеет печатать в нём PDF,
       поэтому проверяется вёрстка в режиме печати: каждая страница
       помещается в A4 с запасом, вне страниц ничего не печатается, фон
       белый, разрыв после каждой страницы, кроме последней.

   Сырой TeX — формула, которую KaTeX не набрал («$D$», «\\vec{a}»,
   «0{,}6») — ищется в тексте каждого листа после набора, в каждом
   напечатанном PDF и в готовых сборниках out/materials/**.pdf:
   в видимом тексте его быть не должно (scripts/lib/math-markup.mjs).

   Рисунки (правила lib/sheet/figureRules.js) — на каждом листе, у каждого
   рисунка задачи и разбора (.sheet-figure) по размерам на бумаге:
   клетка клетчатого рисунка — не меньше 6 мм; подписи — не мельче 10 pt,
   индексы — не мельче 7 pt; основные линии — не тоньше 1,5 pt; сетка
   листа не светлее #BBBBBB. Ниже минимума — проверка падает.

   Запуск после pnpm build:  node scripts/check-print-pages.mjs
   Нужны apache2, Chromium и WebKit (Playwright). Без WebKit проверка
   падает в CI (переменная CI) и пропускает его на своём компьютере. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { startApache } from './lib/apache.mjs';
import { findRawTex } from './lib/math-markup.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { RULES } from '../src/lib/sheet/figureRules.js';

/* Баннер cookie в этой проверке не нужен: он перекрывает кнопки снизу. */
bezBanneraCookieVsyudu(chromium, webkit);

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');

const TAIL = '&t=color&c=1&k=%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0';
const SHEETS = [
  ['№12 линейная', '/zadaniya/12/linear/pechat/', 's=12.A&n=10&l=lucky&seed=print-check'],
  ['№12 парабола', '/zadaniya/12/quadratic/pechat/', 's=12Q.A&n=10&l=lucky&seed=print-check'],
  ['№12 гипербола', '/zadaniya/12/rational/pechat/', 's=12R.A&n=10&l=lucky&seed=print-check'],
  ['№4', '/zadaniya/4/pechat/', 's=p4-01&n=10&seed=print-check'],
  ['№5', '/zadaniya/5/pechat/', 's=p5-01&n=10&seed=print-check'],
  ['№8', '/zadaniya/8/pechat/', 's=S1&n=10&l=base&seed=print-check'],
  ['№9', '/zadaniya/9/pechat/', 'g=I,II,III&n=9&seed=print-check&r=2'],
  ['№2', '/zadaniya/2/pechat/', 's=A1,A6,B6,C2&n=10&seed=print-check'],
  /* №1 и №3: чертежи планиметрии и стереометрии — правила крупных рисунков. */
  [
    '№1',
    '/zadaniya/1/pechat/',
    'm=v&i=m&s=p01:1,p05:1,p13:1,p17:1,p24:1,p35:1,p41:1,p46:1,p49:1,p62:1&seed=print-check',
  ],
  ['№3', '/zadaniya/3/pechat/parallelepiped/', 'n=6&seed=print-check'],
  /* №6, №7, №10 — на общем шаблоне (lib/sheetList.ts). У них t= — типы
     задач, поэтому свой хвост без темы (пятый элемент). */
  ['№6', '/zadaniya/6/pechat/', 't=P01:2,P02:2,P03:2&i=m&v=1&e=0&st=v&seed=PRINT1', null, ''],
  ['№7', '/zadaniya/7/pechat/', 't=P01:2,P02:2,P03:2&i=m&v=1&e=0&seed=PRINT1', null, ''],
  [
    '№10',
    '/zadaniya/10/pechat/',
    'm=g&l=uchenik&t=P01:2,P02:2,P03:2&i=m&v=1&e=0&k=0&s=PRINT1',
    [['ученик', '']],
    '',
  ],
  [
    '№10',
    '/zadaniya/10/pechat/',
    'm=g&l=uchitel&t=P01:2,P02:2,P03:2&i=m&v=1&e=0&k=0&s=PRINT1',
    [['учитель', '']],
    '',
  ],
  /* Место для решения (lib/sheet/space.js): в клетку «авто» и большое,
     пустое место — у варианта, листа раздела и листа №6. */
  ['Место: клетка', '/variant/pechat/', 'list=uchenik&kod=PR7T-407ZZ-00.PB', [['ученик', '']]],
  ['Место: пустое', '/variant/pechat/', 'list=uchenik&kod=PR7T-407ZZ-00.P7', [['ученик', '']]],
  ['Место: №8', '/zadaniya/8/pechat/', 's=S1&n=10&l=base&seed=print-check&sp=A', [['ученик', '']]],
  /* Общий генератор (ps=2): поле у листа ученика. «Всё одним PDF» — в
     test:variant (vseWithSpace): у его вариантов своя нумерация страниц. */
  [
    'Место: №9 из генератора',
    '/zadaniya/9/pechat/',
    'ps=2&s=9.1.1:1,9.2.1:1,9.4.1:2&seed=print-check&sp=B',
    [['ученик', '']],
  ],

  [
    'Место: №6',
    '/zadaniya/6/pechat/',
    't=P01:2,P02:2,P03:2&i=m&v=1&e=0&st=v&seed=PRINT1&sp=B',
    [['ученик', '']],
    '',
  ],
  /* №2 на общем генераторе: ключи позиций, QR-код, вид работы и дата. */
  [
    '№2 из генератора',
    '/zadaniya/2/pechat/',
    'ps=2&s=A1:2,B3:2,B9:1,C1:1&seed=print-check&qr=1&d=2026-10-24',
  ],
  /* №12 на общем генераторе: подтема без подписей и все типы с «Запомни» и примером. */
  [
    '№12 из генератора',
    '/zadaniya/12/quadratic/pechat/',
    'ps=2&s=12Q.A:2,12Q.B:2,12Q.E:2&l=lucky&seed=print-check&qr=1&d=2026-10-24',
  ],
  [
    '№12 все типы',
    '/zadaniya/12/generator/pechat/',
    'ps=2&s=12.A:1,12Q.B:1,12R.A:1,12S.A:1,12E.A:1,12L.A:1,12T.A:1&seed=print-check&th=1&pr=1',
  ],
  /* №9 на общем генераторе: «Запомни», пример, рисунки учителя, QR-код, урок серии. */
  [
    '№9 из генератора',
    '/zadaniya/9/pechat/',
    'ps=2&s=9.1.1:1,9.2.1:1,9.4.1:2,9.5.4:1&seed=print-check&tr=1&r=1&u=1&qr=1&d=2026-10-24',
  ],
  /* №8 на общем генераторе: ключи позиций, уровень, QR-код и дата. */
  [
    '№8 из генератора',
    '/zadaniya/8/pechat/',
    'ps=2&s=8.A:2,8.H:2,8.M:2,8.T:1,8.W:1&l=advanced&seed=print-check&qr=1&d=2026-10-24',
  ],
  /* №11 с «Дополнительно» общего генератора: рамка теории, примеры,
     QR-код, вид работы и дата в шапке. */
  [
    '№11 с «Дополнительно»',
    '/zadaniya/11/pechat/',
    'm=o&i=n&ps=2&s=VD-01:1,VD-02:2,VD-05:1&seed=print-check&tr=1&pr=2&qr=1&vr=dz&d=2026-10-24',
  ],
  /* №1 на общем генераторе: чертежи, рамка «Повторяем» с примером, QR. */
  [
    '№1 с «Дополнительно»',
    '/zadaniya/1/pechat/',
    'm=v&i=m&ps=2&s=p01:1,p13:1,p24:1,p41:1&seed=print-check&tr=1&pr=1&qr=1',
  ],
  /* №3 на общем генераторе: чертежи-сценарии (I–III) и SVG тел вращения, QR. */
  [
    '№3 генератор',
    '/zadaniya/3/pechat/',
    'i=m&s=P03-19:1,P03-26:1,P03-45:1,P03-55:1,P03-66:1,P03-72:1,P03-85:1&seed=print-check&qr=1&vr=dz&d=2026-10-24',
  ],
  /* №13: «Домашка» компактным листом и зачёт с полями для оформления. */
  [
    '№13',
    '/zadaniya/13/pechat/',
    's=A:2,B:1,C:2,D:1&l=base&i=mix&h=ramka&f=compact&v=1&seed=print-check',
  ],
  [
    '№13 зачёт',
    '/zadaniya/13/pechat/',
    's=A:5,B:5,C:5,D:5,T:10&l=all&i=mix&h=net&f=full&v=1&zc=1&seed=print-check',
  ],
  /* «Собрать вариант»: задания 1–13, один вариант (у каждого варианта
     своя нумерация страниц, а проверка сверяет колонтитул с листом). Без
     экрана, открывшего вкладку, лист собирается по коду из адреса. */
  ['Вариант', '/variant/pechat/', 'list=uchenik&kod=PR7T-407ZZ-00', [['ученик', '']]],
  ['Вариант', '/variant/pechat/', 'list=uchitel&kod=PR7T-407ZZ-00', [['учитель', '']]],
  ['Вариант', '/variant/pechat/', 'list=razbor&kod=PR7T-407ZZ-00', [['разбор', '']]],
  /* №13, «Для репетиторов»: лист урока 6 (опорные, банк, новые, «Определи тип») и карточки. */
  ['№13 урок', '/zadaniya/13/pechat/', 's=&l=all&i=mix&h=net&f=compact&v=1&u=5&seed=print-check'],
  ['№13 карточки', '/zadaniya/13/pechat/kartochki/', 'seed=print-check', [['карточки', '']]],
  /* Справочник №1: один лист, с примерами и без; в две колонки. */
  ['№1 справочник', '/zadaniya/1/pechat/spravochnik/', 'primery=1', [['с примерами', '']]],
  ['№1 справочник', '/zadaniya/1/pechat/spravochnik/', 'primery=0', [['без примеров', '']]],
];

/* Листы генератора — ученика и учителя; у справочника свои варианты. */
const OBA = [
  ['ученик', ''],
  ['учитель', 'otvety/'],
];

/* Высоты бумаги для Chromium: A4 и печатные области, округлённые до
   целых пунктов (1 pt = 25,4/72 мм). */
const PAPER = [
  ['A4 297 мм', '297mm'],
  ['841 pt', `${((841 * 25.4) / 72).toFixed(3)}mm`],
  ['840 pt', `${((840 * 25.4) / 72).toFixed(3)}mm`],
];

const MM = 96 / 25.4;
const A4_PX = 297 * MM;

const failures = [];
const rows = [];
function check(ok, what) {
  if (!ok) {
    failures.push(what);
  }
  return ok;
}

/** Сырой TeX в тексте: короткая выдержка вокруг первых находок. */
function syroyTex(text) {
  const flat = text.replace(/\s+/g, ' ');
  const hits = findRawTex(flat);
  return hits.slice(0, 3).map((h) => `«${flat.slice(Math.max(0, h.at - 30), h.at + 30).trim()}»`);
}

function pdfText(file) {
  return execFileSync('pdftotext', ['-q', file, '-']).toString();
}

/** Текст листа после набора — без MathML-копий формул: в них TeX законно. */
async function sheetText(page) {
  return page.evaluate(() => {
    const root = document.querySelector('#sheet-pages')?.cloneNode(true);
    if (!root) {
      return '';
    }
    root
      .querySelectorAll('.katex-mathml, annotation, script, style, svg')
      .forEach((n) => n.remove());
    return root.textContent ?? '';
  });
}

function pdfPages(file) {
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file]).toString())[1]);
  let blank = 0;
  for (let i = 1; i <= pages; i++) {
    const text = execFileSync('pdftotext', [
      '-f',
      String(i),
      '-l',
      String(i),
      file,
      '-',
    ]).toString();
    if (text.trim() === '') {
      blank += 1;
    }
  }
  return { pages, blank };
}

async function openSheet(browser, url) {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 60000 });
  const error = await page.evaluate(() => window.sheetPagination.error);
  if (error !== undefined) {
    throw new Error(`${url}: набор листа не удался — ${error}`);
  }
  /* Номер последней страницы из колонтитула «N / M». */
  const declared = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('#sheet-pages .sheet-page')];
    const last = pages
      .at(-1)
      ?.innerText.match(/(\d+)\s*\/\s*(\d+)/g)
      ?.at(-1);
    return { pages: pages.length, footer: last ? Number(last.split('/')[1]) : null };
  });
  return { page, declared };
}

/**
 * Размеры рисунков листа на бумаге. Масштаб рисунка — отношение его
 * ширины на странице к ширине viewBox; кегль текста SVG задан в единицах
 * viewBox, поэтому на бумаге он равен кеглю × масштаб. Индекс — текст
 * мельче своей подписи (tspan внутри text).
 */
async function figureMetrics(page) {
  return page.evaluate(() => {
    const PX_MM = 96 / 25.4;
    const PT_PX = 0.75;
    const out = [];
    for (const svg of document.querySelectorAll('#sheet-pages .sheet-figure svg')) {
      const vb = svg.viewBox.baseVal;
      const w = svg.getBoundingClientRect().width;
      if (!vb || vb.width === 0 || w === 0) continue;
      const scale = w / vb.width;
      const cell = Number(svg.getAttribute('data-grid-cell'));
      const fonts = [];
      const indexes = [];
      for (const t of svg.querySelectorAll('text, tspan')) {
        if (!t.textContent.trim()) continue;
        const size = parseFloat(getComputedStyle(t).fontSize);
        const parent = t.parentElement?.closest('text');
        const parentSize =
          parent && parent !== t ? parseFloat(getComputedStyle(parent).fontSize) : size;
        (size < parentSize - 0.01 ? indexes : fonts).push(size * scale * PT_PX);
      }
      const strokes = [];
      for (const el of svg.querySelectorAll(
        'path, line, polyline, polygon, circle, ellipse, rect',
      )) {
        const cs = getComputedStyle(el);
        if (cs.stroke === 'none' || cs.display === 'none') continue;
        const sw = parseFloat(cs.strokeWidth);
        /* non-scaling-stroke: толщина задана в пикселях печати, без масштаба. */
        const k = cs.vectorEffect === 'non-scaling-stroke' ? 1 : scale;
        const dash =
          cs.strokeDasharray === 'none'
            ? null
            : cs.strokeDasharray.split(/[ ,]+/).map((x) => parseFloat(x) * k * PT_PX);
        if (sw > 0)
          strokes.push({
            pt: sw * k * PT_PX,
            dashed: dash !== null,
            dash,
            dot: el.tagName === 'circle',
          });
      }
      /* Стереометрия (data-line-pt): свои толщины — видимые 1,2–1,5 pt,
         невидимые 0,8–1 pt штрихом 4/3 pt. */
      const own = svg.hasAttribute('data-line-pt');
      const lines = strokes.filter((x) => !x.dot);
      const solid = lines.filter((x) => !x.dashed).map((x) => x.pt);
      const dashed = lines.filter((x) => x.dashed);
      /* Самая толстая сплошная линия: пунктир (вторая прямая, построения)
         в основные не входит и планку не задаёт. */
      const thick = Math.max(0, ...strokes.filter((x) => !x.dashed).map((x) => x.pt));
      const main = strokes.filter((x) => !x.dashed && x.pt >= thick * 0.6).map((x) => x.pt);
      const task = svg.closest('.sheet-task')?.querySelector('.sheet-task-no')?.textContent ?? '';
      out.push({
        task,
        widthMm: w / PX_MM,
        cellMm: cell > 0 ? (cell * scale) / PX_MM : null,
        labelPt: fonts.length ? Math.min(...fonts) : null,
        indexPt: indexes.length ? Math.min(...indexes) : null,
        linePt: main.length ? Math.min(...main) : null,
        stereo: own
          ? {
              solid: solid.length ? [Math.min(...solid), Math.max(...solid)] : null,
              dashed: dashed.length
                ? [Math.min(...dashed.map((x) => x.pt)), Math.max(...dashed.map((x) => x.pt))]
                : null,
              dash: dashed.length ? dashed[0].dash : null,
            }
          : null,
      });
    }
    const grid = getComputedStyle(document.documentElement).getPropertyValue('--graph-grid').trim();
    return { figures: out, grid };
  });
}

/* Яркость цвета #RRGGBB (Rec. 709), 0…255. */
function luma(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Место для решения на листе (lib/sheet/space.js): клетка 5 мм ± 0,2 по
 * линиям SVG; ширина поля — целое число клеток; каждый кусок поля целиком
 * на своей странице и высотой в целое число клеток (переносы — только по
 * границе строки); линии есть и в режиме печати; строка «Ответ:» стоит в
 * одном куске с последней строкой поля и после неё.
 */
async function spaceMetrics(page) {
  return page.evaluate(() => {
    const PX_MM = 96 / 25.4;
    const out = { fields: 0, pieces: 0, cells: [], bad: [], lines: 0, answers: 0 };
    for (const el of document.querySelectorAll('#sheet-pages .sheet-space')) {
      out.pieces += 1;
      if (el.classList.contains('sheet-space--first')) out.fields += 1;
      const r = el.getBoundingClientRect();
      const h = el.clientHeight / PX_MM;
      const rows = Number(el.dataset.rows);
      if (Math.abs(h - rows * 5) > 0.2)
        out.bad.push(`кусок поля ${h.toFixed(2)} мм, а строк ${rows}`);
      const flow =
        el.closest('.sheet-page')?.querySelector('.sheet-flow') ?? el.closest('.sheet-page');
      const fr = flow?.getBoundingClientRect();
      if (fr && (r.top < fr.top - 1 || r.bottom > fr.bottom + 1))
        out.bad.push('кусок поля выходит за страницу');
      if (el.classList.contains('sheet-space--grid')) {
        const w = el.clientWidth / PX_MM;
        if (Math.abs(w / 5 - Math.round(w / 5)) > 0.04)
          out.bad.push(`ширина поля ${w.toFixed(2)} мм — не целое число клеток`);
        const svg = el.querySelector('svg.sheet-space__grid');
        if (!svg) {
          out.bad.push('в поле «в клетку» нет сетки');
        } else {
          const vb = svg.viewBox.baseVal;
          const cell = ((svg.getBoundingClientRect().width / vb.width) * 5) / PX_MM;
          out.cells.push(cell);
          if (Math.abs(cell - 5) > 0.2) out.bad.push(`клетка ${cell.toFixed(2)} мм`);
        }
      }
      /* Продолжение поля в начале страницы — с закрытой верхней строкой. */
      const item = el.closest('.sheet-item');
      if (
        el.classList.contains('sheet-space--grid') &&
        !el.classList.contains('sheet-space--first') &&
        item?.parentElement?.firstElementChild === item
      ) {
        const top = el.querySelector('.sheet-space__top');
        if (!top || getComputedStyle(top).display === 'none')
          out.bad.push('продолжение поля на странице без верхней линии');
      }
      if (el.classList.contains('sheet-space--last')) {
        const next = el.nextElementSibling;
        const answer = el.closest('.sheet-item')?.querySelector('.sheet-answer-line');
        if (answer) {
          out.answers += 1;
          if (next !== answer) out.bad.push('«Ответ:» не сразу после поля');
        }
      }
    }
    return out;
  });
}

async function spacePrintLines(page) {
  await page.emulateMedia({ media: 'print' });
  const r = await page.evaluate(() => {
    let lines = 0;
    let bad = 0;
    for (const path of document.querySelectorAll(
      '#sheet-pages .sheet-space__grid path:not(.sheet-space__top)',
    )) {
      const cs = getComputedStyle(path);
      const svg = path.closest('svg');
      const visible =
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        getComputedStyle(svg).display !== 'none';
      if (visible && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0) lines += 1;
      else bad += 1;
    }
    return { lines, bad };
  });
  /* Эмуляцию — по умолчанию: PDF дальше печатается со своими стилями печати. */
  await page.emulateMedia({ media: null });
  return r;
}

const EPS = 0.05;
function checkFigures(where, metrics) {
  const { figures, grid } = metrics;
  const max = luma(RULES.gridColorMax);
  if (grid !== '' && luma(grid) !== null) {
    check(luma(grid) <= max + 0.5, `${where}: сетка ${grid} светлее ${RULES.gridColorMax}`);
  }
  const low = (v, min) => v !== null && v < min - EPS;
  for (const f of figures) {
    const at = `${where}, рисунок${f.task ? ` задачи ${f.task}` : ''}`;
    check(
      !(f.cellMm !== null && f.cellMm < RULES.gridCellMinMm - EPS),
      `${at}: клетка ${f.cellMm?.toFixed(2)} мм < ${RULES.gridCellMinMm} мм`,
    );
    check(
      !low(f.labelPt, RULES.labelPt),
      `${at}: подпись ${f.labelPt?.toFixed(2)} pt < ${RULES.labelPt} pt`,
    );
    check(
      !low(f.indexPt, RULES.indexPt),
      `${at}: индекс ${f.indexPt?.toFixed(2)} pt < ${RULES.indexPt} pt`,
    );
    if (f.stereo !== null) {
      const { solid, dashed, dash } = f.stereo;
      const v = (r) => r.map((x) => x.toFixed(2)).join('–');
      check(
        solid === null || (solid[0] >= 1.2 - EPS && solid[1] <= 1.5 + EPS),
        `${at}: видимые линии ${solid && v(solid)} pt, нужно 1,2–1,5`,
      );
      check(
        dashed === null || (dashed[0] >= 0.8 - EPS && dashed[1] <= 1.0 + EPS),
        `${at}: невидимые линии ${dashed && v(dashed)} pt, нужно 0,8–1`,
      );
      check(
        dash === null || (Math.abs(dash[0] - 4) < 0.3 && Math.abs(dash[1] - 3) < 0.3),
        `${at}: штрих ${dash && v(dash)} pt, нужно 4/3`,
      );
      continue;
    }
    check(
      !low(f.linePt, RULES.linePt),
      `${at}: основная линия ${f.linePt?.toFixed(2)} pt < ${RULES.linePt} pt`,
    );
  }
  const vals = (k) => figures.map((f) => f[k]).filter((v) => v !== null);
  const min = (k) => (vals(k).length ? Math.min(...vals(k)).toFixed(1) : '—');
  return `рисунков ${figures.length}: клетка ≥ ${min('cellMm')} мм, подпись ≥ ${min('labelPt')} pt, индекс ≥ ${min('indexPt')} pt, линия ≥ ${min('linePt')} pt`;
}

const apache = await startApache(OUT, 4181);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'print-'));

/* ── Chromium: PDF ──────────────────────────────────────────── */

const chrome = await chromium.launch(
  fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);
for (const [name, route, query, vidy, tail = TAIL] of SHEETS) {
  for (const [who, sub] of vidy ?? OBA) {
    const url = `${apache.url}${route}${sub}?${query}${tail}`;
    const { page, declared } = await openSheet(chrome, url);
    check(
      declared.footer === declared.pages,
      `${name}, ${who}: в колонтитуле ${declared.footer} стр., а набрано ${declared.pages}`,
    );
    const syroy = syroyTex(await sheetText(page));
    check(syroy.length === 0, `${name}, ${who}: сырой TeX на листе — ${syroy.join(', ')}`);
    const figuresRow = checkFigures(`${name}, ${who}`, await figureMetrics(page));
    const space = await spaceMetrics(page);
    let spaceRow = '';
    if (space.pieces > 0) {
      const lines = await spacePrintLines(page);
      space.bad
        .slice(0, 5)
        .forEach((b) => check(false, `${name}, ${who}: место для решения — ${b}`));
      if (space.cells.length > 0) {
        check(
          lines.lines > 0 && lines.bad === 0,
          `${name}, ${who}: линий клетки при печати нет (${lines.bad} скрыто)`,
        );
      }
      const min = space.cells.length ? Math.min(...space.cells).toFixed(2) : '—';
      const max = space.cells.length ? Math.max(...space.cells).toFixed(2) : '—';
      spaceRow = `; место: полей ${space.fields}, кусков ${space.pieces}, клетка ${min}–${max} мм, «Ответ:» после поля ${space.answers}`;
    }
    const cells = [];
    for (const [label, height] of PAPER) {
      if (!label.startsWith('A4')) {
        /* Safari на iPhone правило @page не слушает (потому и печатает
           адрес и дату) и раскладывает лист на свою бумагу. Chromium с
           @page сам ужал бы лист под заданную бумагу и ошибку бы скрыл —
           поэтому для этих высот правило убирается. */
        await page.evaluate(() => {
          for (const sheet of document.styleSheets) {
            try {
              for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                if (sheet.cssRules[i].type === CSSRule.PAGE_RULE) {
                  sheet.deleteRule(i);
                }
              }
            } catch {
              /* чужая таблица стилей — правил @page в ней нет */
            }
          }
        });
      }
      const file = path.join(tmp, `${route.replace(/\W/g, '')}-${who}-${height}.pdf`);
      await page.pdf({
        path: file,
        width: '210mm',
        height,
        printBackground: true,
        preferCSSPageSize: label.startsWith('A4'),
      });
      const { pages, blank } = pdfPages(file);
      if (label.startsWith('A4')) {
        const vPdf = syroyTex(pdfText(file));
        check(vPdf.length === 0, `${name}, ${who}: сырой TeX в PDF — ${vPdf.join(', ')}`);
      }
      check(
        pages === declared.pages && blank === 0,
        `${name}, ${who}, бумага ${label}: PDF ${pages} стр. (пустых ${blank}), в листе ${declared.pages}`,
      );
      cells.push(`${pages}${blank ? ` (пустых ${blank})` : ''}`);
    }
    rows.push(
      `${name.padEnd(14)} ${who.padEnd(8)} лист ${declared.pages}  Chromium ${cells.join(' / ')}; ${figuresRow}${spaceRow}`,
    );
    await page.close();
  }
}
/* «Собрать вариант» без места для решения и с обычными рисунками: лист
   ученика ровно 2 страницы на вариант — на 60 случайных вариантах 1–13
   (плотный режим VariantPrint). Рисунки «обычные» — из шапки работы на
   устройстве (localStorage), как у учителя, выбравшего их на экране. */
{
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const ctx = await chrome.newContext();
  await ctx.addInitScript(() => {
    window.print = () => {};
    try {
      localStorage.setItem('budetege:variant:meta', JSON.stringify({ figures: 'normal' }));
    } catch {
      /* хранилища нет — останутся крупные рисунки, проверка это покажет */
    }
  });
  const wrong = [];
  for (let i = 0; i < 60; i += 1) {
    let seed = '';
    for (let k = 0; k < 4; k += 1) seed += ALPHABET[(i * 7 + k * 13 + i * k * 3) % 32];
    const page = await ctx.newPage();
    await page.goto(`${apache.url}/variant/pechat/?list=uchenik&kod=${seed}-407ZZ-00`, {
      waitUntil: 'networkidle',
    });
    await page.waitForFunction(() => window.sheetPagination !== undefined, null, {
      timeout: 60000,
    });
    const pages = await page.evaluate(() => window.sheetPagination.pages);
    if (pages !== 2) wrong.push(`${seed}: ${pages}`);
    await page.close();
  }
  await ctx.close();
  check(wrong.length === 0, `Вариант без места для решения: не 2 страницы — ${wrong.join(', ')}`);
  rows.push(
    `Вариант, место «нет», рисунки обычные: 60 вариантов, не по 2 страницы — ${wrong.length}`,
  );
}

/* Ключ ответов банка №2: лист без задач, только таблицы ответов. */
for (const [name, route] of [['№2 ключ', '/zadaniya/2/pechat/klyuch/?t=print']]) {
  const { page } = await openSheet(chrome, `${apache.url}${route}`);
  const syroy = syroyTex(await sheetText(page));
  check(syroy.length === 0, `${name}: сырой TeX на листе — ${syroy.join(', ')}`);
  await page.close();
}
await chrome.close();

/* ── Готовые сборники: PDF в out/materials ─────────────────────── */

const materials = path.join(OUT, 'materials');
const sborniki = fs.existsSync(materials)
  ? fs
      .readdirSync(materials, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.pdf'))
  : [];
for (const rel of sborniki) {
  const syroy = syroyTex(pdfText(path.join(materials, rel)));
  check(syroy.length === 0, `сборник materials/${rel}: сырой TeX — ${syroy.join(', ')}`);
}
rows.push(`Сборники PDF в out/materials: ${sborniki.length}, проверены на сырой TeX`);

/* ── WebKit: вёрстка в режиме печати ───────────────────────────── */

let safari = null;
try {
  safari = await webkit.launch();
} catch (error) {
  if (process.env.CI) {
    throw new Error(
      'WebKit не установлен: pnpm exec playwright install --with-deps webkit\n' + error.message,
    );
  }
  console.log('WebKit не установлен — его проверку пропускаю (в CI она обязательна).');
}

if (safari !== null) {
  for (const [name, route, query, vidy, tail = TAIL] of SHEETS) {
    for (const [who, sub] of vidy ?? OBA) {
      const url = `${apache.url}${route}${sub}?${query}${tail}`;
      const { page, declared } = await openSheet(safari, url);
      await page.emulateMedia({ media: 'print' });
      const g = await page.evaluate(() => {
        const pages = [...document.querySelectorAll('#sheet-pages .sheet-page')];
        const heights = pages.map((p) => p.getBoundingClientRect().height);
        const breaks = pages.map(
          (p) => getComputedStyle(p).breakAfter || getComputedStyle(p).pageBreakAfter,
        );
        const printed = document.documentElement.scrollHeight;
        const sum = heights.reduce((a, b) => a + b, 0);
        return {
          heights,
          breaks,
          printed,
          sum,
          bg: getComputedStyle(document.body).backgroundColor,
          paper: getComputedStyle(pages[0]).backgroundColor,
        };
      });
      const maxH = Math.max(...g.heights);
      check(
        maxH <= A4_PX - MM,
        `${name}, ${who}, WebKit: страница ${(maxH / MM).toFixed(2)} мм — нет запаса до A4`,
      );
      check(
        Math.abs(g.printed - g.sum) < 2,
        `${name}, ${who}, WebKit: при печати высота документа ${(g.printed / MM).toFixed(1)} мм, а страниц — ${(g.sum / MM).toFixed(1)} мм`,
      );
      check(
        g.bg === g.paper,
        `${name}, ${who}, WebKit: фон при печати ${g.bg}, а не цвет бумаги ${g.paper}`,
      );
      const lastAuto = !/page|always/.test(g.breaks.at(-1));
      const othersPage = g.breaks.slice(0, -1).every((b) => /page|always/.test(b));
      check(
        lastAuto && othersPage,
        `${name}, ${who}, WebKit: разрывы страниц ${g.breaks.join(', ')}`,
      );
      rows.push(
        `${name.padEnd(14)} ${who.padEnd(8)} лист ${declared.pages}  WebKit: страница ${(maxH / MM).toFixed(1)} мм, ${Math.round(g.printed / A4_PX + 0.49)} листа A4 по высоте документа`,
      );
      await page.close();
    }
  }
  await safari.close();
}

apache.stop();
console.log(rows.join('\n'));
if (failures.length > 0) {
  console.error(`\nПечать листов (${failures.length}):`);
  failures.forEach((f) => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('\nПечать листов: страниц в PDF столько же, сколько в листе, пустых нет.');
