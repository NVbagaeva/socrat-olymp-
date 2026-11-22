#!/usr/bin/env node
/* scripts/check-motion.mjs — уровень движения устройства (lib/motion.ts).

   Запуск: pnpm build && pnpm test:motion

   1. Без браузера: встроенный скрипт в <head> собранной страницы — ровно
      MOTION_LEVEL_SCRIPT, разбирается как JS и знает те же ключ и
      атрибут, что и модуль. Минификатор Next.js однажды выкинул кусок
      скрипта, склеивая шаблонные строки, — сборка прошла, а уровень не
      ставился.
   2. В браузере (Chromium и WebKit): data-motion-level на <html> —
      full по умолчанию, reduce при «Уменьшить движение», lite при малой
      памяти и при экономии трафика; ошибок на странице нет; токены
      уровня reduce и зоны «Учёба» действуют. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium, webkit);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const M = requireSrc('lib/motion');

/* ── 1. Скрипт в собранном HTML ───────────────────────────────── */
check(
  M.MOTION_LEVEL_SCRIPT.includes(`'${M.MOTION_KADRY_KEY}'`),
  `скрипт не знает ключа замера ${M.MOTION_KADRY_KEY}`,
);
check(
  M.MOTION_LEVEL_SCRIPT.includes(`'${M.MOTION_LEVEL_ATTR}'`),
  `скрипт не ставит атрибут ${M.MOTION_LEVEL_ATTR}`,
);
for (const stranica of ['index.html', 'zadaniya/index.html', 'about/index.html']) {
  const html = fs.readFileSync(path.join(OUT, stranica), 'utf8');
  check(html.includes(M.MOTION_LEVEL_SCRIPT), `${stranica}: в <head> не тот скрипт уровня`);
  const m = html.match(/<script>(\(function\(\)\{try\{var d=document[^]*?)<\/script>/);
  let razobran = false;
  try {
    new Function(m?.[1] ?? '');
    razobran = m !== null;
  } catch {
    razobran = false;
  }
  check(razobran, `${stranica}: скрипт уровня не разбирается как JS`);
}

/* ── 2. В браузере ─────────────────────────────────────────────── */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
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

const SLUCHAI = [
  { imya: 'обычное устройство', opts: {}, init: null, zhdem: 'full' },
  { imya: '«Уменьшить движение»', opts: { reducedMotion: 'reduce' }, init: null, zhdem: 'reduce' },
  {
    imya: 'мало памяти',
    opts: {},
    init: () => Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 }),
    zhdem: 'lite',
  },
  {
    imya: 'экономия трафика',
    opts: {},
    init: () => Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) }),
    zhdem: 'lite',
  },
];

for (const [dvizhok, engine] of [
  ['Chromium', chromium],
  ['WebKit', webkit],
]) {
  let browser;
  try {
    browser = await engine.launch(
      dvizhok === 'Chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {},
    );
  } catch {
    console.log(`${dvizhok} не установлен — пропущен (в CI он есть).`);
    continue;
  }
  for (const s of SLUCHAI) {
    const context = await browser.newContext(s.opts);
    if (s.init) await context.addInitScript(s.init);
    const page = await context.newPage();
    const oshibki = [];
    page.on('pageerror', (e) => oshibki.push(e.message));
    await page.goto(`${BASE}/zadaniya/`, { waitUntil: 'load' });
    const r = await page.evaluate(() => ({
      uroven: document.documentElement.getAttribute('data-motion-level'),
      base: getComputedStyle(document.documentElement).getPropertyValue('--motion-base').trim(),
      rise: getComputedStyle(document.querySelector('.app-main') ?? document.body)
        .getPropertyValue('--motion-rise')
        .trim(),
    }));
    const where = `${dvizhok}, ${s.imya}`;
    check(r.uroven === s.zhdem, `${where}: уровень ${r.uroven}, нужно ${s.zhdem}`);
    check(oshibki.length === 0, `${where}: ошибки на странице — ${oshibki.join(' | ')}`);
    if (s.zhdem === 'reduce') {
      check(r.base === '1ms', `${where}: --motion-base ${r.base}, нужно 1ms`);
    }
    check(r.rise === '0px', `${where}: в зоне «Учёба» --motion-rise ${r.rise}, нужно 0px`);
    await context.close();
  }
  await browser.close();
}
server.close();

if (failures.length > 0) {
  console.error(`Уровень движения: не прошло ${failures.length} из ${checks}:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Уровень движения: проверок ${checks}, расхождений нет.`);
