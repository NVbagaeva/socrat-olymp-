/* scripts/lib/sheet-render.mjs — печать листа в PDF.

   Шаблон листа (src/lib/sheet/) про PDF ничего не знает: он отдаёт
   HTML. Здесь этот HTML собирается с вшитыми шрифтами и печатается
   headless-Chromium. Тот же HTML открывается и просто в браузере —
   на сайте и на телефоне, — поэтому генератору вариантов этот файл
   не нужен вовсе.

   Playwright объявлен в devDependencies и в обычной установке
   приходит вместе с остальными пакетами. Но песочница, в которой
   писался этот файл, до реестра npm не доходит, поэтому пакет
   ищется ещё и среди глобальных: тогда лист печатается и там.
   Нет ни там, ни там — скрипт говорит, что делать, и выходит
   с ошибкой, а не падает стеком.
*/

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import sheet from '../../src/lib/sheet/sheet.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', '..');
const SHEET = path.join(APP, 'src', 'lib', 'sheet');
const FONTS = path.join(APP, 'src', 'fonts');

/* ══════════════════════════════════════════════════════════
   Шрифты: вшиваются в документ base64. Так лист печатается
   без сети, а Chromium кладёт подмножества шрифтов в PDF.
   ══════════════════════════════════════════════════════════ */
const FONT_FACES = [
  { family: 'Inter Sheet', file: 'inter-400.woff2', weight: 400 },
  { family: 'Inter Sheet', file: 'inter-500.woff2', weight: 500 },
  { family: 'Inter Sheet', file: 'inter-600.woff2', weight: 600 },
  { family: 'Inter Sheet', file: 'inter-700.woff2', weight: 700 },
  { family: 'Caveat Sheet', file: 'caveat_5.2.8_cyrillic-400-normal.woff2', weight: 400 },
];

function fontCss() {
  const faces = FONT_FACES.map((face) => {
    const data = fs.readFileSync(path.join(FONTS, face.file)).toString('base64');
    return '@font-face{font-family:"' + face.family + '";font-style:normal;' +
      'font-weight:' + face.weight + ';font-display:block;' +
      'src:url(data:font/woff2;base64,' + data + ') format("woff2");}';
  }).join('\n');

  /* Рукописный Caveat лежит в подмножестве cyrillic: латиницы и цифр
     в нём нет, их отрисует запасной курсивный шрифт. Математическая
     антиква — для формул: цифры в ней не выпадают из строки. */
  return faces + '\n:root{' +
    '--sheet-font-sans:"Inter Sheet",system-ui,-apple-system,sans-serif;' +
    '--sheet-font-hand:"Caveat Sheet",cursive;' +
    '--font:"Inter Sheet",system-ui,sans-serif;' +
    '--font-math:"STIX Two Text","Cambria Math",Cambria,Charter,Georgia,' +
      '"Liberation Serif","Times New Roman",serif;' +
    '}\n';
}

function readSheetAsset(name) {
  return fs.readFileSync(path.join(SHEET, name), 'utf8');
}

/** Собранный HTML одного листа. Печатать его не обязательно. */
export function buildHtml(spec, extraCss) {
  const graphCss = fs.readFileSync(path.join(APP, 'src', 'lib', 'graph', 'graph.css'), 'utf8');
  return sheet.buildDocument(spec, {
    fontCss: fontCss(),
    css: readSheetAsset('theme.css') + '\n' + graphCss + '\n' + readSheetAsset('sheet.css'),
    extraCss: extraCss || '',
    script: readSheetAsset('paginate.js'),
  });
}

/* ══════════════════════════════════════════════════════════
   Chromium
   ══════════════════════════════════════════════════════════ */
const GLOBAL_CANDIDATES = [
  '/opt/node22/lib/node_modules/playwright',
  '/usr/lib/node_modules/playwright',
  '/usr/local/lib/node_modules/playwright',
];

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch { /* в зависимостях проекта нет — пробуем глобальный */ }

  const require = createRequire(import.meta.url);
  for (const dir of GLOBAL_CANDIDATES) {
    if (!fs.existsSync(dir)) { continue; }
    try {
      return require(dir);
    } catch { /* следующий */ }
  }

  throw new Error(
    'Playwright не найден. Он объявлен в devDependencies, значит\n' +
    'достаточно установки зависимостей:\n' +
    '    pnpm install && pnpm exec playwright install chromium\n' +
    'Ставить ничего не хочется — соберите файлы в GitHub Actions:\n' +
    'вкладка Actions, workflow «PDF 12», кнопка Run workflow.'
  );
}

/**
 * Печать одного листа.
 *
 * Возвращает отчёт пагинатора: сколько вышло страниц, сколько задач
 * встало на лист и не оказалось ли куска выше страницы. Сборка
 * смотрит на эти числа и падает, если они разошлись с ожиданием, —
 * молча выпустить PDF с потерянной задачей нельзя.
 */
export async function renderPdf(spec, file, options = {}) {
  const { chromium } = await loadPlaywright();
  const html = buildHtml(spec, options.extraCss);

  /* HTML пишется на диск: так его можно открыть глазами ровно в том
     виде, в каком его печатал Chromium. */
  if (options.keepHtml) {
    fs.mkdirSync(path.dirname(options.keepHtml), { recursive: true });
    fs.writeFileSync(options.keepHtml, html);
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', (error) => problems.push(String(error.message)));

    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForFunction('window.sheetPagination !== undefined', null, { timeout: 60000 });
    const report = await page.evaluate('window.sheetPagination');

    if (report.error) { throw new Error('пагинатор: ' + report.error); }
    if (problems.length) { throw new Error('ошибка на странице: ' + problems.join('; ')); }

    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.pdf({
      path: file,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return report;
  } finally {
    await browser.close();
  }
}

export default { buildHtml, renderPdf };
