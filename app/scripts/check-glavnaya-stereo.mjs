#!/usr/bin/env node
/* scripts/check-glavnaya-stereo.mjs — живая стереометрия на главной.

   Запуск после pnpm build: pnpm test:glavnaya-stereo

   Часть витрины «Стереометрию надо видеть…» (components/landing/sumerki/
   StereoChast, StereoOzhivit, stereoOzhivlenie). Chromium:
     1. Без скриптов: в HTML главной — первый кадр чертежа (SVG), шаги,
        миниатюры; число задач в тексте — из банка №3.
     2. Движка рисунка нет в скриптах первой загрузки главной: он
        приезжает, когда блок подъезжает к экрану.
     3. Компьютер: при первом появлении фигура сама качнётся и
        остановится; мышь вращает; после поворота подсказка-жест
        скрывается и появляется «Вернуть вид», она возвращает первый
        кадр; шаги разбора меняют выделение на фигуре.
     4. Телефон (касания): палец вбок вращает фигуру и страницу не
        двигает; палец вверх по фигуре листает страницу и фигуру не
        крутит.
     5. prefers-reduced-motion: фигура сама не крутится.
     6. Ошибок в консоли нет.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const OUT = path.join(APP, 'out');
const INDEX = path.join(OUT, 'index.html');
if (!fs.existsSync(INDEX)) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

/* ── 1–2. Разметка и первая загрузка ─────────────────────────── */

const html = fs.readFileSync(INDEX, 'utf8');
const Z = requireSrc('lib/zadanie3/index.ts');
const zadach = Z.BANK.reduce((s, p) => s + p.varianty.length, 0);
check(html.includes('vit-chast--stereo'), 'главная: нет части «живая стереометрия»');
check(/class="vst-kholst"><svg/.test(html), 'главная: нет первого кадра чертежа в HTML');
check((html.match(/data-shag="/g) ?? []).length === 3, 'главная: шагов разбора не 3');
check((html.match(/class="vst-mini__k"/g) ?? []).length === 3, 'главная: миниатюр не 3');
check(
  html.includes(`все ${zadach} задач`),
  `главная: в тексте нет числа задач из банка (${zadach})`,
);

const skripty = [
  ...new Set([...html.matchAll(/(\/_next\/static\/[^"\\ ]+\.js)/g)].map((m) => m[1])),
];
const sDvizhkom = skripty.filter((u) =>
  fs.readFileSync(path.join(OUT, u), 'utf8').includes('liveMargin'),
);
check(sDvizhkom.length === 0, `движок рисунка в первой загрузке главной: ${sDvizhkom.join(', ')}`);

/* ── 3–6. Браузер ────────────────────────────────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
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
const URL = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
const kadr = (page) => page.locator('.vst-kholst').innerHTML();
const zhdat = (page, ms) => page.waitForTimeout(ms);
const oshibki = (page, gde) => {
  page.on('pageerror', (e) => failures.push(`${gde}: ошибка страницы: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') failures.push(`${gde}: консоль: ${m.text().slice(0, 200)}`);
  });
};
async function centr(page) {
  await page.locator('.vst-scena').evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await zhdat(page, 300);
  const b = await page.locator('.vst-oblast').boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

try {
  /* Компьютер */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    oshibki(page, 'компьютер');
    await page.goto(URL, { waitUntil: 'networkidle' });
    check(
      (await page.locator('[data-zhivaya]').count()) === 0,
      'компьютер: фигура ожила до подъезда',
    );
    const k0 = await kadr(page);
    await page.locator('.vit-chast--stereo').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.mouse.wheel(0, -100);
    await page.waitForSelector('[data-zhivaya="1"]', { timeout: 10000 });
    await zhdat(page, 500);
    check((await kadr(page)) !== k0, 'компьютер: нет автоповорота при появлении');
    await zhdat(page, 2000);
    const kStop = await kadr(page);
    await zhdat(page, 400);
    check((await kadr(page)) === kStop, 'компьютер: автоповорот не остановился');

    const c = await centr(page);
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    for (let i = 1; i <= 25; i += 1) await page.mouse.move(c.x + i * 8, c.y + i * 2);
    await page.mouse.up();
    await zhdat(page, 900);
    check((await kadr(page)) !== kStop, 'компьютер: мышь не вращает фигуру');
    check(
      await page.locator('.vst-zhest.is-skryt').count(),
      'компьютер: подсказка-жест не скрылась',
    );
    check(await page.locator('.vst-sbros').isVisible(), 'компьютер: нет «Вернуть вид»');

    const kDo = await kadr(page);
    await page.locator('[data-shag="1"]').click();
    await zhdat(page, 300);
    check((await kadr(page)) !== kDo, 'компьютер: шаг не меняет выделение');
    check(
      (await page.locator('[data-shag="1"]').getAttribute('aria-pressed')) === 'true',
      'компьютер: выбранный шаг не отмечен',
    );
    await page.locator('[data-shag="3"]').click();
    await page.locator('.vst-sbros').click();
    await zhdat(page, 300);
    check((await kadr(page)) === k0, 'компьютер: «Вернуть вид» не вернул первый кадр');
    check(
      !(await page.locator('.vst-sbros').isVisible()),
      'компьютер: «Вернуть вид» не спряталась',
    );
    await ctx.close();
  }

  /* Телефон */
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await ctx.newPage();
    oshibki(page, 'телефон');
    const cdp = await ctx.newCDPSession(page);
    const palec = async (pts) => {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: pts[0][0], y: pts[0][1] }],
      });
      for (const [x, y] of pts.slice(1)) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        await zhdat(page, 16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await zhdat(page, 900);
    };
    await page.goto(URL, { waitUntil: 'networkidle' });
    await centr(page);
    await page.waitForSelector('[data-zhivaya="1"]', { timeout: 10000 });
    await zhdat(page, 2600);

    let c = await centr(page);
    let k = await kadr(page);
    let y = await page.evaluate(() => window.scrollY);
    await palec(Array.from({ length: 25 }, (_, i) => [c.x - 100 + i * 8, c.y]));
    check((await kadr(page)) !== k, 'телефон: палец вбок не вращает фигуру');
    check(
      Math.abs((await page.evaluate(() => window.scrollY)) - y) < 3,
      'телефон: палец вбок двигает страницу',
    );

    c = await centr(page);
    k = await kadr(page);
    y = await page.evaluate(() => window.scrollY);
    await palec(Array.from({ length: 25 }, (_, i) => [c.x, c.y + 120 - i * 10]));
    check(
      (await page.evaluate(() => window.scrollY)) - y > 80,
      'телефон: палец вверх по фигуре не листает страницу',
    );
    check((await kadr(page)) === k, 'телефон: палец вверх-вниз крутит фигуру');
    await ctx.close();
  }

  /* prefers-reduced-motion */
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    const k0 = await kadr(page);
    await page.locator('.vit-chast--stereo').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.waitForSelector('[data-zhivaya="1"]', { timeout: 10000 });
    await zhdat(page, 2500);
    check((await kadr(page)) === k0, 'reduced-motion: фигура крутится сама');
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length > 0) {
  console.error(`check-glavnaya-stereo: ${failures.length} проблем:`);
  for (const f of failures) console.error(`  — ${f}`);
  process.exit(1);
}
console.log(`check-glavnaya-stereo: ok (${checks} проверок)`);
