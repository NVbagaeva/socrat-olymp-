#!/usr/bin/env node
/* scripts/record-intro.mjs — видео заставки первого визита, сравнение с
   макетами, частота кадров и память.

   Запуск:
     INTRO_DEV_PAGES=1 pnpm build      (сборка с /dev/intro в .next-dev/)
     pnpm record:intro                 (нужен ffmpeg)

   1. Видео 1440×900 и 390×844 (телефон, 2×): время заставки задаётся
      по кадрам (window.__intro.set), 30 кадров/с, — видео плавное, даже
      если браузер рисует медленно (в CI и в контейнере нет видеокарты).
   2. Сравнение «кадр макета | кадр из видео» в моменты 0,5 / 1,5 / 3,0 /
      4,5 с: кадры вынимаются из готового видео ffmpeg'ом.
   3. Частота кадров в реальном времени: компьютер; «слабый телефон» —
      телефонный режим и замедление процессора в 4 раза.
   4. Память: куча JS до показа, во время и после закрытия (после сборки
      мусора), и сколько объектов WebGL осталось живыми.

   Результат — docs/screenshots/intro/ и сводка в консоли (report.json). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const ROOT = path.join(APP, '.next-dev');
const DOCS = path.join(APP, '..', 'docs');
const OUT = path.join(DOCS, 'screenshots', 'intro');
const MOCKUPS = path.join(DOCS, 'mockups', 'intro');
if (!fs.existsSync(path.join(ROOT, 'dev', 'intro', 'index.html'))) {
  console.error('Нет сборки с прототипами: INTRO_DEV_PAGES=1 pnpm build');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/x-component',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
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

const browser = await chromium.launch({
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});

const VIEWS = [
  { id: 'desktop', mode: 'desktop', viewport: { width: 1440, height: 900 }, dpr: 1, mobile: false },
  { id: 'phone', mode: 'phone', viewport: { width: 390, height: 844 }, dpr: 2, mobile: true },
];
const FPS = 30;
const DURATION = 6;
const MOMENTS = [0.5, 1.5, 3.0, 4.5];
const MOCK = {
  desktop: ['kadr-1-oktaedr', 'kadr-2-raskrytie', 'kadr-3-cvetok', 'kadr-4-okno-desktop'],
  /* Для телефона в макетах есть только финал; раньше — кадры компьютера. */
  phone: ['kadr-1-oktaedr', 'kadr-2-raskrytie', 'kadr-3-cvetok', 'kadr-5-okno-mobile'],
};
const report = { errors: [] };

async function newPage(v) {
  const context = await browser.newContext({
    viewport: v.viewport,
    deviceScaleFactor: v.dpr,
    isMobile: v.mobile,
    hasTouch: v.mobile,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(`${v.id}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') report.errors.push(`${v.id}: ${m.text()}`);
  });
  return { context, page };
}

/* ── 1–2. Видео и сравнение ──────────────────────────────────── */
for (const v of VIEWS) {
  const { context, page } = await newPage(v);
  await page.goto(`${BASE}/dev/intro/?mode=${v.mode}&bare&manual`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__intro !== undefined, null, { timeout: 120000 });
  /* Фон-фрейм должен догрузиться. */
  await page.waitForTimeout(2500);
  const frames = path.join(OUT, `.frames-${v.id}`);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames);
  const total = DURATION * FPS;
  for (let i = 0; i <= total; i += 1) {
    await page.evaluate((t) => window.__intro.set(t), i / FPS);
    /* Окно появляется CSS-переходом в реальном времени: на его отрезке
       ждём столько же, сколько длится кадр. */
    if (i / FPS >= 3.75 && i / FPS <= 4.6) await page.waitForTimeout(1000 / FPS);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.png`) });
  }
  await context.close();
  const video = path.join(OUT, `intro-${v.viewport.width}x${v.viewport.height}.mp4`);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(FPS),
    '-i',
    path.join(frames, '%04d.png'),
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '22',
    '-preset',
    'slow',
    '-movflags',
    '+faststart',
    video,
  ]);
  fs.rmSync(frames, { recursive: true, force: true });
  report[`video_${v.id}`] = {
    file: path.relative(DOCS, video),
    kb: Math.round(fs.statSync(video).size / 1024),
  };

  /* Кадры из готового видео и макеты рядом. */
  const pairs = [];
  for (const [k, t] of MOMENTS.entries()) {
    const shot = path.join(OUT, `.${v.id}-${t}.png`);
    execFileSync('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-ss',
      String(t),
      '-i',
      video,
      '-frames:v',
      '1',
      shot,
    ]);
    const mock = path.join(MOCKUPS, `${MOCK[v.id][k]}.png`);
    const pair = path.join(OUT, `sravnenie-${v.id}-${String(t).replace('.', '_')}.jpg`);
    const h = v.id === 'desktop' ? 600 : 800;
    execFileSync('convert', [
      '(',
      mock,
      '-resize',
      `x${h}`,
      ')',
      '(',
      shot,
      '-resize',
      `x${h}`,
      ')',
      '-background',
      'white',
      '-splice',
      '0x0',
      '+append',
      '-quality',
      '82',
      pair,
    ]);
    fs.rmSync(shot);
    pairs.push(pair);
  }
  execFileSync('convert', [
    ...pairs,
    '-append',
    '-resize',
    v.id === 'desktop' ? '1600x' : '900x',
    '-quality',
    '80',
    path.join(OUT, `sravnenie-${v.id}.jpg`),
  ]);
}

/* ── 3. Частота кадров в реальном времени ───────────────────── */
async function measureFps(v, throttle) {
  const { context, page } = await newPage(v);
  const cdp = await context.newCDPSession(page);
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.goto(`${BASE}/dev/intro/?mode=${v.mode}&bare`, { waitUntil: 'load' });
  await page.waitForSelector('.intro canvas');
  /* Считаем кадры анимации: от 0,3 до 4,3 с. */
  await page.waitForTimeout(300);
  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let n = 0;
        const t0 = performance.now();
        const tick = (now) => {
          n += 1;
          if (now - t0 < 4000) requestAnimationFrame(tick);
          else resolve(Math.round((n * 1000) / (now - t0)));
        };
        requestAnimationFrame(tick);
      }),
  );
  await context.close();
  return fps;
}
report.fps = {
  desktop: await measureFps(VIEWS[0], 1),
  phoneThrottle4x: await measureFps(VIEWS[1], 4),
};

/* ── 4. Память ──────────────────────────────────────────────── */
{
  const v = VIEWS[0];
  const { context, page } = await newPage(v);
  const cdp = await context.newCDPSession(page);
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(300);
    await cdp.send('HeapProfiler.collectGarbage');
    const { usedSize } = await cdp.send('Runtime.getHeapUsage');
    return Math.round(usedSize / 1024);
  };
  await page.goto(`${BASE}/dev/intro/?mode=desktop&closed`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const before = await heap();
  await page.click('.dev-intro__replay');
  await page.waitForSelector('.intro[data-phase="card"]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  const during = await heap();
  const liveDuring = Number(
    (await page.textContent('.dev-intro__info')).match(/WebGL-объектов: (\d+)/)?.[1],
  );
  await page.click('.intro-card__later');
  await page.waitForTimeout(1000);
  const after = await heap();
  const canvases = await page.locator('canvas').count();
  report.memory = {
    heapKbBefore: before,
    heapKbOpen: during,
    heapKbAfter: after,
    webglObjectsOpen: liveDuring,
    canvasesAfter: canvases,
  };
  await context.close();
}

await browser.close();
server.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
