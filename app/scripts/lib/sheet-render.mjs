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
  /* Рукописный Caveat — двумя подмножествами @fontsource/caveat 5.2.8
     с их же unicode-range: кириллица (в ней есть «ё») и латиница,
     где живут цифры и знаки препинания. Без второго запятая или тире
     в надписи приходили из системного шрифта. */
  { family: 'Caveat Sheet', file: 'caveat_5.2.8_cyrillic-400-normal.woff2', weight: 400,
    range: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' },
  { family: 'Caveat Sheet', file: 'caveat_5.2.8_latin-400-normal.woff2', weight: 400,
    range: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,' +
      'U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' },
];

function fontCss() {
  const faces = FONT_FACES.map((face) => {
    const data = fs.readFileSync(path.join(FONTS, face.file)).toString('base64');
    return '@font-face{font-family:"' + face.family + '";font-style:normal;' +
      'font-weight:' + face.weight + ';font-display:block;' +
      (face.range ? 'unicode-range:' + face.range + ';' : '') +
      'src:url(data:font/woff2;base64,' + data + ') format("woff2");}';
  }).join('\n');

  return faces + '\n:root{' +
    '--sheet-font-sans:"Inter Sheet",system-ui,-apple-system,sans-serif;' +
    '--sheet-font-hand:"Caveat Sheet",cursive;' +
    '--font:"Inter Sheet",system-ui,sans-serif;' +
    '}\n';
}

/* Шрифт подписей на чертеже.

   Подписи движка (y = f(x), буквы осей, числа) — это SVG-текст,
   а не KaTeX, и набираются они математической антиквой из graph.css.
   Своей антиквы в репозитории нет, поэтому бралась системная:
   в контейнере Liberation Serif, на другой машине Georgia или
   Cambria. Файл-то получался согласованным — шрифт вшивается, —
   но две сборки на двух машинах давали разные чертежи.

   Когда KaTeX доступен, берём его математический шрифт: он уже
   вшит ради формул, нарисован именно для математики, и подписи
   на чертеже становятся того же начертания, что переменные
   в условии. Без KaTeX остаётся прежняя цепочка.

   Правило идёт последним: в graph.css --font-math объявлен в :root,
   и объявленное позже побеждает при равной специфичности. */
function mathFontCss(hasKatex) {
  if (!hasKatex) { return ''; }
  /* Inter стоит замыкающим намеренно. Если какого-то знака в шрифтах
     KaTeX не окажется, он придёт из нашего же Inter, а не из системного
     шрифта машины: начертание тогда не то, зато сборка остаётся
     одинаковой всюду, и автотест состава шрифтов это видит. */
  return ':root{--font-math:"KaTeX_Math","KaTeX_Main","Inter Sheet",serif;}\n';
}

function readSheetAsset(name) {
  return fs.readFileSync(path.join(SHEET, name), 'utf8');
}

/* ══════════════════════════════════════════════════════════
   KaTeX
   ══════════════════════════════════════════════════════════
   Формула в разметке живёт тем же способом, что и на сайте:
   <span class="math" data-tex="…">. Внутри лежит запасной набор
   из graph/math.js, поэтому лист читается и без KaTeX.

   Подстановка вёрстки — graph/katex-upgrade.js, тот же модуль, что
   работает в приложении. Он ES-модуль, а в документ нужен обычный
   script, поэтому хвост с экспортами срезается — и результат
   проверяется, иначе молча уехал бы лист без формул.
*/
function upgradeScript() {
  const source = fs.readFileSync(
    path.join(APP, 'src', 'lib', 'graph', 'katex-upgrade.js'), 'utf8');

  /* Срезаем всё от объявления api: дальше только экспорты. */
  const cut = source.indexOf('const api =');
  if (cut < 0) { throw new Error('katex-upgrade.js: не найден хвост с экспортами'); }
  const body = source.slice(0, cut);
  if (/\bexport\b/.test(body)) {
    throw new Error('katex-upgrade.js: в теле остался export, обычным скриптом не выйдет');
  }
  if (!/function upgrade\s*\(/.test(body)) {
    throw new Error('katex-upgrade.js: функция upgrade не найдена');
  }

  return '(function(){' + body + '\nwindow.sheetTypeset = function (root) {' +
    ' return upgrade(root, window.katex); };})();';
}

/** KaTeX из зависимостей проекта: код, стили и шрифты одним куском. */
function katexAssets() {
  const require = createRequire(import.meta.url);
  let dist;
  try {
    dist = path.join(path.dirname(require.resolve('katex/package.json')), 'dist');
  } catch {
    return null;                    /* пакета нет — работает запасной набор */
  }

  const js = fs.readFileSync(path.join(dist, 'katex.min.js'), 'utf8');
  let css = fs.readFileSync(path.join(dist, 'katex.min.css'), 'utf8');

  /* Шрифты вшиваются в документ: сети у печати нет. Из трёх форматов
     берём только woff2 — Chromium его понимает, а woff и ttf утроили
     бы вес документа ни за чем. */
  css = css.replace(/src:[^;}]+/g, (src) => {
    const found = /url\(fonts\/([^)]+\.woff2)\)/.exec(src);
    if (!found) { return src; }
    const file = path.join(dist, 'fonts', found[1]);
    if (!fs.existsSync(file)) { return src; }
    const data = fs.readFileSync(file).toString('base64');
    return 'src:url(data:font/woff2;base64,' + data + ') format("woff2")';
  });

  return { js, css };
}

/**
 * Собранный HTML одного листа. Печатать его не обязательно.
 *
 * Второе значение говорит, набраны формулы KaTeX или запасным
 * набором: сборка полного сборника требует KaTeX и без него падает,
 * а образцу запасного достаточно.
 */
export function buildHtml(spec, extraCss) {
  const graphCss = fs.readFileSync(path.join(APP, 'src', 'lib', 'graph', 'graph.css'), 'utf8');
  const katex = katexAssets();

  const html = sheet.buildDocument(spec, {
    fontCss: fontCss(),
    css: readSheetAsset('theme.css') + '\n' + graphCss + '\n' + readSheetAsset('sheet.css') +
      (katex ? '\n' + katex.css : '') + '\n' + mathFontCss(Boolean(katex)),
    extraCss: extraCss || '',
    script: (katex ? katex.js + '\n' + upgradeScript() + '\n' : '') + readSheetAsset('paginate.js'),
  });

  return { html, katex: Boolean(katex) };
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
  const built = buildHtml(spec, options.extraCss);
  const html = built.html;

  if (options.requireKatex && !built.katex) {
    throw new Error(
      'KaTeX не найден, а сборка требует его. Поставьте зависимости:\n' +
      '    pnpm install\n' +
      'Либо соберите файлы в GitHub Actions — там реестр npm доступен.'
    );
  }

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
    report.katex = built.katex;
    report.formulas = report.formulas || 0;
    if (problems.length) { throw new Error('ошибка на странице: ' + problems.join('; ')); }

    /* Отчёт кладётся рядом с промежуточным HTML: по нему работают
       автотесты, и им не нужно поднимать браузер второй раз. */
    if (options.keepHtml) {
      fs.writeFileSync(options.keepHtml.replace(/\.html$/, '.json'),
        JSON.stringify(report, null, 1));
    }

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

