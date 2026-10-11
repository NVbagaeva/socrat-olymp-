#!/usr/bin/env node
/* scripts/check-zadanie-hero.mjs — иллюстрация в верхнем блоке страницы
   «Задание 12».

   Запуск: pnpm build && pnpm test:zadanie-hero

   В собранной разметке: <picture> с WebP и PNG, srcset 480/768/1152,
   width/height, alt="" и aria-hidden, высокий приоритет и без
   loading="lazy"; файлы на месте, версия на телефон (WebP 480) не
   тяжелее 60 КБ; у других страниц заданий иллюстрации нет.
   В Chromium: на телефоне 390 картинка невысокая, и первая карточка
   раздела видна на первом экране; на компьютере картинка в правой
   колонке и не заходит на вкладки; при prefers-reduced-motion и на
   телефоне анимации нет; из srcset берётся 768 на плотном телефоне. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* ── Разметка ───────────────────────────────────────────────── */
const html = fs.readFileSync(path.join(OUT, 'zadaniya/12/index.html'), 'utf8');
const picture = html.match(/<picture class="zadanie-hero">[\s\S]*?<\/picture>/)?.[0] ?? '';
check(picture !== '', 'на /zadaniya/12/ нет picture.zadanie-hero');
check(
  /<source type="image\/webp"[^>]*srcSet="[^"]*480w[^"]*768w[^"]*1152w/i.test(picture),
  'WebP-источник без трёх ширин',
);
check(
  /<img[^>]*srcSet="[^"]*480w[^"]*768w[^"]*1152w/i.test(picture),
  'у img нет запасного PNG srcset с тремя ширинами',
);
check(
  /width="1536"/.test(picture) && /height="1024"/.test(picture),
  'у img нет width=1536 и height=1024',
);
check(/alt=""/.test(picture) && /aria-hidden="true"/.test(picture), 'нет alt="" и aria-hidden');
check(/fetchPriority="high"|fetchpriority="high"/i.test(picture), 'нет fetchpriority="high"');
check(!/loading="lazy"/.test(picture), 'у иллюстрации первого экрана стоит loading="lazy"');
check(/sizes="[^"]+"/.test(picture), 'нет sizes');

for (const width of [480, 768, 1152]) {
  for (const ext of ['webp', 'png']) {
    check(
      fs.existsSync(path.join(OUT, `images/zadaniya/12/hero-${width}.${ext}`)),
      `нет файла hero-${width}.${ext}`,
    );
  }
}
const phone = fs.statSync(path.join(OUT, 'images/zadaniya/12/hero-480.webp')).size;
check(phone <= 60 * 1024, `WebP 480 весит ${(phone / 1024).toFixed(1)} КБ, нужно не больше 60`);
check(!fs.existsSync(path.join(OUT, 'assets')), 'исходники попали в сборку (out/assets)');

for (const other of ['zadaniya/13', 'zadaniya/4', 'zadaniya/11']) {
  const file = path.join(OUT, other, 'index.html');
  if (fs.existsSync(file)) {
    check(
      !fs.readFileSync(file, 'utf8').includes('zadanie-hero'),
      `/${other}/: появилась иллюстрация №12`,
    );
  }
}

/* ── Браузер ────────────────────────────────────────────────── */
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
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
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
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

async function measure(page) {
  return page.evaluate(() => {
    const img = document.querySelector('.zadanie-hero img');
    const box = img.getBoundingClientRect();
    const card = document.querySelector('.subtopic')?.getBoundingClientRect();
    const tabs = document.querySelector('.topic-tabs, .tabs')?.getBoundingClientRect();
    return {
      w: box.width,
      h: box.height,
      right: box.right,
      bottom: box.bottom,
      vw: innerWidth,
      vh: innerHeight,
      cardTop: card?.top ?? 0,
      tabsTop: tabs?.top ?? 0,
      anim: getComputedStyle(img).animationName,
      loaded: img.complete && img.naturalWidth > 0,
      src: img.currentSrc,
      scrollW: document.documentElement.scrollWidth,
    };
  });
}

/* Телефон 390, плотность 2 */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/zadaniya/12/', { waitUntil: 'networkidle' });
  const m = await measure(page);
  check(m.loaded, 'телефон: картинка не загрузилась');
  check(m.h >= 150 && m.h <= 210, `телефон: высота картинки ${Math.round(m.h)} px, нужно 160–200`);
  check(
    m.cardTop > 0 && m.cardTop < m.vh - 40,
    `телефон: первая карточка раздела на ${Math.round(m.cardTop)} px — не видна на первом экране (${m.vh})`,
  );
  check(m.src.includes('hero-768.'), `телефон 2x: взят ${m.src.split('/').pop()}, нужен hero-768`);
  check(m.anim === 'none', `телефон: анимация «${m.anim}», нужна без неё`);
  check(m.scrollW <= m.vw, 'телефон: горизонтальная прокрутка');
  check(
    (await page.locator('.section-head__note').isVisible()) === false,
    'телефон: подпись не скрыта',
  );
  await ctx.close();
}
/* Телефон 390, плотность 1: 480 */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/zadaniya/12/', { waitUntil: 'networkidle' });
  const m = await measure(page);
  check(m.src.includes('hero-480.'), `телефон 1x: взят ${m.src.split('/').pop()}, нужен hero-480`);
  await ctx.close();
}
/* Компьютер 1440 */
for (const reduced of [false, true]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/zadaniya/12/', { waitUntil: 'networkidle' });
  const m = await measure(page);
  const where = `компьютер${reduced ? ' (reduced-motion)' : ''}`;
  check(m.w >= 420 && m.w <= 480, `${where}: ширина картинки ${Math.round(m.w)}, нужно 420–480`);
  check(
    m.bottom < m.tabsTop,
    `${where}: картинка (низ ${Math.round(m.bottom)}) заходит на вкладки (верх ${Math.round(m.tabsTop)})`,
  );
  check(m.right <= m.vw, `${where}: картинка выходит за экран`);
  check(reduced ? m.anim === 'none' : m.anim !== 'none', `${where}: анимация «${m.anim}»`);
  check(m.cardTop < m.vh, `${where}: карточки разделов не на первом экране`);
  await ctx.close();
}
await browser.close();
server.close();

console.log(`Иллюстрация задания №12: проверок ${checks}, ошибок ${failures.length}.`);
for (const f of failures) console.log(`  ✗ ${f}`);
if (failures.length > 0) process.exitCode = 1;
