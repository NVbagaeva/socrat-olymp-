#!/usr/bin/env node
/* scripts/build-pdf-spravochnik-1.mjs — готовые PDF справочника по
   планиметрии №1.

   Запуск: pnpm build && pnpm build:pdf-spravochnik-1

   Печатная страница /zadaniya/1/pechat/spravochnik/ раскладывает лист
   в браузере (paginate.js, две колонки). Здесь та же страница
   открывается в Chromium из собранного сайта (out/), и после раскладки
   лист печатается в PDF — два файла, с примерами и без:

     app/public/materials/zadanie-1/spravochnik-po-planimetrii.pdf
     app/public/materials/zadanie-1/spravochnik-po-planimetrii-bez-primerov.pdf

   Ответов в справочнике нет — оба файла публичные, их отдаёт сайт
   («Скачать справочник» на вкладке «Теория»). Число страниц каждого
   файла ложится в src/content/spravochnik1/pdf.json: из него кнопка
   берёт подпись «PDF, A4, N страниц», а test:pdf-spravochnik-1
   сверяет его с тем, что раскладывает лист сейчас, — устаревший файл
   не пройдёт незамеченным. Пересобирает файлы workflow «PDF 1
   справочник». */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

const PAPKA = path.join(APP, 'public', 'materials', 'zadanie-1');
const MANIFEST = path.join(APP, 'src', 'content', 'spravochnik1', 'pdf.json');
const FAYLY = [
  { klyuch: 'sPrimerami', imya: 'spravochnik-po-planimetrii.pdf', zapros: '' },
  {
    klyuch: 'bezPrimerov',
    imya: 'spravochnik-po-planimetrii-bez-primerov.pdf',
    zapros: '?primery=0',
  },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const ispolnyaemyy =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = bezBanneraCookie(
  await chromium.launch(ispolnyaemyy === undefined ? {} : { executablePath: ispolnyaemyy }),
);

fs.mkdirSync(PAPKA, { recursive: true });
const manifest = {};
for (const f of FAYLY) {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(`${BASE}/zadaniya/1/pechat/spravochnik/${f.zapros}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(() => window.sheetPagination !== undefined, null, {
    timeout: 120000,
  });
  const otchet = await page.evaluate(() => window.sheetPagination);
  if (otchet.error !== undefined || otchet.overflowing.length > 0) {
    throw new Error(
      `${f.imya}: раскладка не удалась — ${otchet.error ?? otchet.overflowing.join(', ')}`,
    );
  }
  await page.emulateMedia({ media: 'print' });
  const file = path.join(PAPKA, f.imya);
  await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
  const stranic = Number(
    /Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file]).toString())?.[1] ?? NaN,
  );
  if (stranic !== otchet.pages) {
    throw new Error(`${f.imya}: в PDF ${stranic} стр., а в листе ${otchet.pages}`);
  }
  manifest[f.klyuch] = { fayl: `/materials/zadanie-1/${f.imya}`, stranic };
  console.log(
    `${f.imya}: ${stranic} стр., ${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} МБ`,
  );
  await page.close();
}

await browser.close();
server.close();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Число страниц — в ${path.relative(APP, MANIFEST)}`);
