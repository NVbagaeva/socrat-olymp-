/* scripts/check-print-pages.mjs — печать листа без пустых страниц.

   Лист генератора печатается из браузера: страница /…/pechat/ набирает
   страницы листа и вызывает window.print(). Страница листа была ровно
   в A4 (297 мм), без запаса: если печатная область хоть чуть ниже —
   Safari на iPhone считает бумагу в целых пунктах, многие принтеры
   тоже, — подвал страницы уезжал на отдельную страницу, и после каждой
   страницы печаталась пустая (со светлым фоном сайта). Теперь страница
   на 2 мм ниже A4 (lib/sheet/theme.css), фон при печати белый.

   Проверяются листы ученика и учителя всех разделов с генератором,
   с постоянным зерном:

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
  ['№2', '/zadaniya/2/pechat/', 's=A1,A6,B6,C2&n=10&seed=print-check'],
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

const apache = await startApache(OUT, 4181);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'print-'));

/* ── Chromium: PDF ──────────────────────────────────────────── */

const chrome = await chromium.launch(
  fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);
for (const [name, route, query] of SHEETS) {
  for (const [who, sub] of [
    ['ученик', ''],
    ['учитель', 'otvety/'],
  ]) {
    const url = `${apache.url}${route}${sub}?${query}${TAIL}`;
    const { page, declared } = await openSheet(chrome, url);
    check(
      declared.footer === declared.pages,
      `${name}, ${who}: в колонтитуле ${declared.footer} стр., а набрано ${declared.pages}`,
    );
    const syroy = syroyTex(await sheetText(page));
    check(syroy.length === 0, `${name}, ${who}: сырой TeX на листе — ${syroy.join(', ')}`);
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
      `${name.padEnd(14)} ${who.padEnd(8)} лист ${declared.pages}  Chromium ${cells.join(' / ')}`,
    );
    await page.close();
  }
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
  for (const [name, route, query] of SHEETS) {
    for (const [who, sub] of [
      ['ученик', ''],
      ['учитель', 'otvety/'],
    ]) {
      const url = `${apache.url}${route}${sub}?${query}${TAIL}`;
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
