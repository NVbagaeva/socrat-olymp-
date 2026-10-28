/* scripts/check-pdf-listy.mjs — листы генераторов в PDF: без пустых
   страниц, без наложений, формулы целые, ничего не обрезано.

   Лист печатается из браузера (lib/sheet: buildDocument → paginate.js →
   window.print). Проверка печатает его так же — Chromium, A4,
   printBackground — и сверяет PDF с набором:

     1. Страниц в PDF столько же, сколько листов (.sheet-page) в
        предпросмотре, пустых нет. И на A4 с правилом @page, и на
        бумаге 840 pt без него — так печатает Safari на iPhone.
     2. Набор не сообщил о кусках выше страницы (overflowing), поток
        каждой страницы помещается между шапкой и подвалом, ни один
        кусок потока не заходит на подвал.
     3. Текст и рисунки — в пределах листа с полями не меньше 12 мм:
        ни слоган шапки, ни ссылки подвала, ни заголовок под QR-кодом
        не уходят за край.
     4. Дроби KaTeX целые: числитель над чертой, знаменатель под ней
        (наезд — признак формул, набранных без шрифтов или стилей KaTeX).

   Листы — №11 «Домашняя работа» с «Повторяем», разобранным примером и
   QR-кодом, в клетку и без; лист учителя №11; генераторы №12, №1, №9,
   №6 и «Собрать вариант» с местом для решения.

   Запуск после pnpm build:  node scripts/check-pdf-listy.mjs
   Нужны apache2, Chromium (Playwright), pdfinfo и pdftotext (poppler).
   PDF_LISTY_BASE=http://localhost:3000 — проверить запущенный сайт
   (pnpm dev) вместо собранного out/; PDF_LISTY_ONLY=№11 — только листы
   с этой строкой в названии. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startApache } from './lib/apache.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');

const DOP_11 =
  'm=v&i=m&ps=2&s=PR-04:1,SM-06:1,DP-03:1,VD-01:1,RB-04:1,PG-01:1&seed=FJ85&tr=1&pr=1&vr=dz&qr=1&d=2026-10-24';
const LISTY = [
  ['№11 в клетку', '/zadaniya/11/pechat/', `${DOP_11}&sp=B`],
  ['№11 без поля', '/zadaniya/11/pechat/', DOP_11],
  ['№11 ч/б в клетку', '/zadaniya/11/pechat/', `${DOP_11}&sp=B&t=print`],
  ['№11 учитель', '/zadaniya/11/pechat/otvety/', DOP_11],
  [
    '№12 генератор',
    '/zadaniya/12/generator/pechat/',
    'ps=2&s=12.A:1,12Q.B:1,12R.A:1,12S.A:1,12E.A:1,12L.A:1,12T.A:1&seed=print-check&th=1&pr=1&sp=B',
  ],
  [
    '№1 с «Дополнительно»',
    '/zadaniya/1/pechat/',
    'm=v&i=m&ps=2&s=p01:1,p13:1,p24:1,p41:1&seed=print-check&tr=1&pr=1&qr=1&sp=B',
  ],
  [
    '№9 генератор',
    '/zadaniya/9/pechat/',
    'ps=2&s=9.1.1:1,9.2.1:1,9.4.1:2&seed=print-check&tr=1&r=1&sp=B',
  ],
  ['№6 в клетку', '/zadaniya/6/pechat/', 't=P01:2,P02:2,P03:2&i=m&v=1&e=0&st=v&seed=PRINT1&sp=B'],
  ['Вариант в клетку', '/variant/pechat/', 'list=uchenik&kod=PR7T-407ZZ-00.PB'],
];

/* Поля листа: не меньше 12 мм от края бумаги. */
const POLE_MM = 12;
const PX_MM = 96 / 25.4;

const failures = [];
const rows = [];
function check(ok, what) {
  if (!ok) failures.push(what);
  return ok;
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
    if (text.trim() === '') blank += 1;
  }
  return { pages, blank };
}

/** Раскладка листа в режиме печати: подвал, края, дроби. */
async function raskladka(page) {
  await page.emulateMedia({ media: 'print' });
  const r = await page.evaluate(
    ({ POLE_MM, PX_MM }) => {
      const out = { listov: 0, naPodval: [], zaKray: [], drobi: 0, slomany: [], potok: [] };
      const pole = POLE_MM * PX_MM;
      const imya = (el) =>
        (
          el.closest('[data-task]')?.getAttribute('data-task') ??
          el.closest('.sheet-item, .sheet-head, .sheet-foot, .sheet-title-block')?.className ??
          el.tagName
        )
          .toString()
          .slice(0, 50);
      const pages = [...document.querySelectorAll('#sheet-pages .sheet-page')];
      out.listov = pages.length;
      pages.forEach((p, n) => {
        const box = p.getBoundingClientRect();
        const foot = p.querySelector('.sheet-foot');
        const flow = p.querySelector('.sheet-flow');
        if (flow && flow.scrollHeight > flow.clientHeight + 1) {
          out.potok.push(`стр. ${n + 1}: поток ${flow.scrollHeight} > ${flow.clientHeight} px`);
        }
        if (foot && flow) {
          const top = foot.getBoundingClientRect().top;
          for (const item of flow.children) {
            const b = item.getBoundingClientRect();
            if (b.height > 0 && b.bottom > top + 1) {
              out.naPodval.push(
                `стр. ${n + 1}: ${imya(item)} заходит на подвал на ${Math.round(b.bottom - top)} px`,
              );
            }
          }
        }
        /* Текст — по строкам (Range), рисунки — по рамке. Сетка поля
           для решения нарочно шире поля и обрезана им; дуги в углах —
           украшение под содержимым. */
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          if (!t.textContent.trim()) continue;
          const host = t.parentElement;
          if (!host || host.closest('.katex-mathml, .sheet-arcs, script, style')) continue;
          range.selectNodeContents(t);
          for (const rect of range.getClientRects()) {
            if (rect.width === 0) continue;
            if (rect.left < box.left + pole - 1 || rect.right > box.right - pole + 1) {
              out.zaKray.push(
                `стр. ${n + 1}: «${t.textContent.trim().slice(0, 30)}» (${imya(host)})`,
              );
              break;
            }
          }
        }
        for (const el of p.querySelectorAll('svg, img')) {
          if (el.closest('.sheet-arcs, .sheet-space, .katex') || el.parentElement?.closest('svg'))
            continue;
          const b = el.getBoundingClientRect();
          if (b.width === 0) continue;
          if (b.left < box.left + pole - 1 || b.right > box.right - pole + 1) {
            out.zaKray.push(`стр. ${n + 1}: рисунок ${el.tagName} (${imya(el)})`);
          }
        }
      });
      /* Дробь: всё выше середины черты — числитель, ниже — знаменатель. */
      for (const frac of document.querySelectorAll('#sheet-pages .mfrac')) {
        const line = frac.querySelector('.frac-line');
        if (!line) continue;
        out.drobi += 1;
        const l = line.getBoundingClientRect();
        const mid = (l.top + l.bottom) / 2;
        const vlist = line.closest('.vlist');
        for (const row of vlist?.children ?? []) {
          if (row.contains(line)) continue;
          /* Рамки строк (span) выше самих знаков — сравниваются знаки:
             прямоугольники текста числителя и знаменателя (Range). */
          const r = document.createRange();
          r.selectNodeContents(row);
          let top = Infinity;
          let bottom = -Infinity;
          for (const rect of r.getClientRects()) {
            if (rect.height === 0 || rect.width === 0) continue;
            top = Math.min(top, rect.top);
            bottom = Math.max(bottom, rect.bottom);
          }
          if (!Number.isFinite(top)) continue;
          /* Знак KaTeX — с запасом под выносные элементы: наезд меньше
             трети кегля не видно, видно — числитель на знаменателе. */
          const em = parseFloat(getComputedStyle(row).fontSize) || 12;
          const center = (top + bottom) / 2;
          const naezd = center < mid ? bottom - l.top : l.bottom - top;
          if (naezd > em * 0.35) {
            out.slomany.push(
              `${frac.closest('.katex')?.textContent?.slice(0, 30) ?? ''} — наезд ${naezd.toFixed(1)} px`,
            );
          }
        }
      }
      return out;
    },
    { POLE_MM, PX_MM },
  );
  await page.emulateMedia({ media: null });
  return r;
}

const base = process.env.PDF_LISTY_BASE;
const apache = base ? null : await startApache(OUT, 4185);
const root = base ?? apache.url;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-listy-'));

const chrome = await chromium.launch(
  fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);
try {
  /* PDF_LISTY_ONLY=№11 — только листы, в названии которых есть строка. */
  const only = process.env.PDF_LISTY_ONLY;
  for (const [name, route, query] of LISTY.filter(([n]) => !only || n.includes(only))) {
    const page = await chrome.newPage();
    await page.addInitScript(() => {
      window.print = () => {};
    });
    await page.goto(`${root}${route}?${query}`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForFunction(() => window.sheetPagination !== undefined, null, {
      timeout: 180000,
    });
    const nabor = await page.evaluate(() => window.sheetPagination);
    check(nabor.error === undefined, `${name}: набор не удался — ${nabor.error}`);
    check(
      (nabor.overflowing ?? []).length === 0,
      `${name}: куски выше страницы — ${(nabor.overflowing ?? []).join(', ')}`,
    );
    const r = await raskladka(page);
    r.potok.slice(0, 3).forEach((x) => check(false, `${name}: ${x}`));
    r.naPodval.slice(0, 3).forEach((x) => check(false, `${name}: ${x}`));
    r.zaKray.slice(0, 3).forEach((x) => check(false, `${name}: за полем ${POLE_MM} мм — ${x}`));
    r.slomany.slice(0, 3).forEach((x) => check(false, `${name}: дробь KaTeX — ${x}`));

    const cells = [];
    for (const [label, height] of [
      ['A4', '297mm'],
      ['840 pt', `${((840 * 25.4) / 72).toFixed(3)}mm`],
    ]) {
      if (label !== 'A4') {
        /* Safari на iPhone правило @page не слушает: без него Chromium
           печатает на ту же бумагу так же — без подгонки листа. */
        await page.evaluate(() => {
          for (const sheet of document.styleSheets) {
            try {
              for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                if (sheet.cssRules[i].type === CSSRule.PAGE_RULE) sheet.deleteRule(i);
              }
            } catch {
              /* чужая таблица стилей — правил @page в ней нет */
            }
          }
        });
      }
      const file = path.join(tmp, `${route.replace(/\W/g, '')}-${label.replace(/\W/g, '')}.pdf`);
      await page.pdf({
        path: file,
        width: '210mm',
        height,
        printBackground: true,
        preferCSSPageSize: label === 'A4',
      });
      const { pages, blank } = pdfPages(file);
      check(
        pages === r.listov && blank === 0,
        `${name}, ${label}: PDF ${pages} стр. (пустых ${blank}), листов в предпросмотре ${r.listov}`,
      );
      cells.push(`${label} ${pages}${blank ? ` (пустых ${blank})` : ''}`);
    }
    rows.push(`${name.padEnd(22)} листов ${r.listov}; PDF: ${cells.join(', ')}; дробей ${r.drobi}`);
    await page.close();
  }
} finally {
  await chrome.close();
  apache?.stop();
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(rows.join('\n'));
if (failures.length > 0) {
  console.error(`\nЛисты в PDF — ошибок ${failures.length}:`);
  for (const f of failures.slice(0, 40)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nЛисты в PDF: страниц столько же, сколько листов, наложений нет, формулы целые.');
