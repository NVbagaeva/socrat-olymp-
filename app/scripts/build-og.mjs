#!/usr/bin/env node
/* scripts/build-og.mjs — картинка превью ссылки (Open Graph) 1200×630.

   Временная: фон и кристалл первого экрана главной (public/hero/
   hero-kristall-600.png), шрифт сайта Inter. Когда автор пришлёт свою
   картинку, она заменит public/og/og-budetege.jpg, а этот скрипт можно
   не запускать. Подключение — metadata.openGraph в src/app/layout.tsx.

   JPEG, а не WebP: WebP-превью показывают не все мессенджеры.

   Запуск: node scripts/build-og.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/og');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (file) => fs.readFileSync(path.join(ROOT, file)).toString('base64');
const SHRIFT = b64('src/fonts/inter-variable.woff2');
const KRISTALL = b64('public/hero/hero-kristall-600.png');

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${SHRIFT}) format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #101728;
  background:
    radial-gradient(560px 420px at 86% 30%, rgb(31 95 208 / 0.22), transparent 70%),
    radial-gradient(420px 320px at 70% 95%, rgb(245 160 74 / 0.22), transparent 70%),
    radial-gradient(380px 300px at 4% 0%, rgb(31 95 208 / 0.12), transparent 70%),
    #f5f9ff; }
.t { position: absolute; left: 80px; top: 92px; width: 640px; }
.n { color: #1f5fd0; font-size: 22px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
h1 { margin-top: 22px; font-size: 76px; line-height: 1.02; font-weight: 680; letter-spacing: -0.03em; }
p { margin-top: 26px; font-size: 30px; line-height: 1.35; color: #4e5a70; }
.u { position: absolute; left: 80px; bottom: 64px; font-size: 24px; font-weight: 600; color: #1f5fd0; }
img { position: absolute; right: 30px; top: 70px; width: 470px; height: 470px; object-fit: contain; }
</style></head><body>
<div class="t">
  <div class="n">ЕГЭ · профильная математика</div>
  <h1>Будет на&nbsp;ЕГЭ</h1>
  <p>Теория, разобранные задачи и тренажёр с&nbsp;подсказками учителя по&nbsp;каждому заданию</p>
</div>
<div class="u">budetege.ru</div>
<img src="data:image/png;base64,${KRISTALL}" alt="">
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const file = path.join(OUT, 'og-budetege.jpg');
await page.screenshot({ path: file, type: 'jpeg', quality: 86 });
await browser.close();
console.log(path.relative(ROOT, file), `${Math.round(fs.statSync(file).size / 1024)} КБ`);
