#!/usr/bin/env node
/* scripts/check-theory-labels.mjs — подписи на рисунках теории не
   наезжают друг на друга и на график.

   Запуск: pnpm build && pnpm test:theory-labels
           pnpm test:theory-labels --all            все рисунки двух разделов
           THEORY_LABELS_URL=http://localhost:3000 pnpm test:theory-labels  (dev-сервер)

   По умолчанию проверяются примеры 8.2 «Найти x по значению»
   (#lin-q-argument): их рисунки сверстаны под правило «без наложений».
   Остальные рисунки теории — в отчёте --all: часть подписей там стоит
   вплотную к линии сознательно (f у прямой, k > 0 у графика). 
   Каждый рисунок теории (.kfig) открывается в Chromium на ширине
   компьютера и телефона. Подписи — настоящие блоки KaTeX поверх SVG,
   поэтому проверяется живая вёрстка, а не расчёт:
     — две подписи не пересекаются;
     — подпись не лежит на синей линии графика;
     — подпись не вылезает за край рисунка. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const ALL = process.argv.includes('--all');
const PAGES = ALL ? ['/zadaniya/12/linear/', '/zadaniya/12/irrational/'] : ['/zadaniya/12/linear/'];
const SCOPE = ALL ? '' : '#lin-q-argument ';
const SIZES = [1440, 390];

let BASE = process.env.THEORY_LABELS_URL ?? '';
let server = null;
if (BASE === '') {
  const OUT = path.join(APP, 'out');
  if (!fs.existsSync(OUT)) {
    console.error('Нет папки сборки out: сначала pnpm build');
    process.exit(1);
  }
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  server = http.createServer((req, res) => {
    let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  BASE = 'http://127.0.0.1:' + server.address().port;
}

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

/* В странице: что не так на каждом рисунке. Прямоугольник подписи —
   блок KaTeX (или вся подпись, если в ней есть обычный текст). */
function inspect(scope) {
  const problems = [];
  document.querySelectorAll(scope + '.kfig').forEach((fig, index) => {
    const frame = fig.getBoundingClientRect();
    /* Свёрнутая врезка: рисунка на экране нет. */
    if (frame.width === 0) return;
    const svg = fig.querySelector('svg');
    const m = svg.getScreenCTM();
    const name = (
      fig
        .closest('.rich-example, .rich-card, .rich-main, .rich-fork__branch')
        ?.querySelector('h4, h5, .rich-example__title')?.textContent ?? ''
    )
      .trim()
      .slice(0, 40);
    const where = `рисунок ${index + 1}${name === '' ? '' : ` («${name}»)`}`;
    const labels = [...fig.querySelectorAll('.kfig__label')].map((el) => {
      const plain = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
      const box = plain
        ? el.getBoundingClientRect()
        : (el.querySelector('.katex') ?? el).getBoundingClientRect();
      return { text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 18), box };
    });
    /* Синие линии графика: точки пути в координатах окна. */
    const samples = [];
    svg.querySelectorAll('path').forEach((p) => {
      if (!/1F5FD0/i.test(p.getAttribute('stroke') ?? '') || p.getAttribute('fill') !== 'none')
        return;
      const length = p.getTotalLength();
      for (let s = 0; s <= length; s += 2) {
        const q = p.getPointAtLength(s);
        samples.push([q.x * m.a + m.e, q.y * m.d + m.f]);
      }
    });
    const pad = 1.5;
    labels.forEach((a, i) => {
      labels.forEach((b, j) => {
        if (
          j > i &&
          !(
            a.box.right < b.box.left ||
            b.box.right < a.box.left ||
            a.box.bottom < b.box.top ||
            b.box.bottom < a.box.top
          )
        ) {
          problems.push(`${where}: «${a.text}» и «${b.text}» пересекаются`);
        }
      });
      if (
        samples.some(
          ([x, y]) =>
            x > a.box.left - pad &&
            x < a.box.right + pad &&
            y > a.box.top - pad &&
            y < a.box.bottom + pad,
        )
      ) {
        problems.push(`${where}: «${a.text}» лежит на линии графика`);
      }
      if (
        a.box.left < frame.left - 1 ||
        a.box.right > frame.right + 1 ||
        a.box.top < frame.top - 1 ||
        a.box.bottom > frame.bottom + 1
      ) {
        problems.push(`${where}: «${a.text}» за краем рисунка`);
      }
    });
  });
  return problems;
}

const failures = [];
let figures = 0;
for (const width of SIZES) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const url of PAGES) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page
      .click('[role=tab][id$="-tab-teoriya"], [role=tab][id$="-tab-theory"]')
      .catch(() => {});
    await page.waitForSelector('.kfig', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(800);
    figures += await page.$$eval(
      SCOPE + '.kfig',
      (list) => list.filter((f) => f.getBoundingClientRect().width > 0).length,
    );
    (await page.evaluate(inspect, SCOPE)).forEach((p) =>
      failures.push(`${width} px, ${url}: ${p}`),
    );
  }
  await page.close();
}
await browser.close();
server?.close();

console.log(`рисунков с подписями проверено: ${figures}`);
if (failures.length > 0) {
  console.log(`\nНАЛОЖЕНИЯ (${failures.length}):`);
  failures.forEach((f) => console.log('  • ' + f));
  process.exit(1);
}
console.log('наложений нет');
