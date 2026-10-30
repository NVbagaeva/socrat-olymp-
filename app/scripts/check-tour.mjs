#!/usr/bin/env node
/* scripts/check-tour.mjs — тур по сайту: рамка подсветки держится на цели.

   Запуск: pnpm build && pnpm test:tour
   Снимки шагов: TOUR_SHOTS=папка pnpm test:tour
   Другая сборка: TOUR_OUT=папка pnpm test:tour
   Живой сервер вместо сборки: TOUR_BASE=http://localhost:3000 node scripts/check-tour.mjs

   Тур — components/onboarding/Tour.tsx, позиция рамки —
   components/onboarding/spotlight.ts. Собранный сайт открывается в
   Chromium на телефоне (390×844 и 375×667) и на компьютере (1280×800).
   Каждый шаг каждого тура открывается с чистого листа, и проверяется:
     — подсказка появилась, рамка стоит на видимой копии цели
       (у вкладок раздела их две: плитки и липкая панель) с точностью
       до 1 px — после прокрутки к шагу;
     — цель целиком видна: не под липкими полосами сверху (панель
       вкладок, полоса фильтров генератора) и не под нижним листом
       подсказки на телефоне;
     — на каждом кадре прокрутки страницы вверх и вниз, в том числе
       плавной, рамка совпадает с целью: без отставания и без
       анимации положения; то же при прокрутке ленты вкладок вбок и
       при смене размера окна;
     — цель пропала посреди шага — рамка прячется без ошибок в консоли;
     — у рамки нет перехода по top/left/width/height/transform.
   «Цель» — её видимая часть: что обрезала лента с прокруткой вбок,
   рамка не обводит. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { COOKIE_NOTICE_KEY, ONBOARDING_KEY } from './lib/cookie-notice.mjs';

const OUT = process.env.TOUR_OUT ? path.resolve(process.env.TOUR_OUT) : path.join(APP, 'out');
const SHOTS = process.env.TOUR_SHOTS ? path.resolve(process.env.TOUR_SHOTS) : null;
if (!process.env.TOUR_BASE && !fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const { TOURS } = requireSrc('content/onboarding');

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
const BASE = process.env.TOUR_BASE ?? 'http://127.0.0.1:' + server.address().port;

const SIZES = [
  {
    name: 'телефон 390',
    narrow: true,
    context: {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    },
  },
  {
    name: 'телефон 375',
    narrow: true,
    context: {
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  },
  { name: 'компьютер', narrow: false, context: { viewport: { width: 1280, height: 800 } } },
];

/** Отступ рамки от цели — PAD в spotlight.ts. */
const PAD = 8;
const EPS = 1;

const errors = [];
let checks = 0;
function fail(where, msg) {
  errors.push(`${where}: ${msg}`);
}

/* Код ниже выполняется в странице: как тур, ищем видимую копию цели. */
function probe(selectors) {
  const shown = (el) =>
    el.closest('[inert], [aria-hidden="true"]') === null &&
    getComputedStyle(el).visibility !== 'hidden' &&
    el.getClientRects().length > 0;
  let t = Infinity;
  let l = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  for (const sel of selectors) {
    const el = Array.from(document.querySelectorAll(sel)).find(shown);
    if (!el) return { target: null };
    /* Видимая часть: ленты с прокруткой вбок обрезают цель. */
    const box = el.getBoundingClientRect();
    let [bt, bl, br, bb] = [box.top, box.left, box.right, box.bottom];
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.position === 'fixed') break;
      const pr = p.getBoundingClientRect();
      if (s.overflowX !== 'visible') [bl, br] = [Math.max(bl, pr.left), Math.min(br, pr.right)];
      if (s.overflowY !== 'visible') [bt, bb] = [Math.max(bt, pr.top), Math.min(bb, pr.bottom)];
    }
    if (br - bl < 1 || bb - bt < 1) continue;
    t = Math.min(t, bt);
    l = Math.min(l, bl);
    r = Math.max(r, br);
    b = Math.max(b, bb);
  }
  if (t === Infinity) return { target: null };
  const hole = document.querySelector('.tour__hole');
  const hs = hole ? getComputedStyle(hole) : null;
  const holeBox =
    hole && hs.display !== 'none' && hs.visibility !== 'hidden'
      ? hole.getBoundingClientRect()
      : null;
  const card = document.querySelector('.tour-card')?.getBoundingClientRect() ?? null;
  return {
    target: { top: t, left: l, right: r, bottom: b },
    hole: holeBox && {
      top: holeBox.top,
      left: holeBox.left,
      right: holeBox.right,
      bottom: holeBox.bottom,
    },
    holeTransition: hs ? hs.transitionProperty : '',
    card: card && { top: card.top, bottom: card.bottom, left: card.left, right: card.right },
    vh: window.innerHeight,
    y: window.scrollY,
    max: document.documentElement.scrollHeight - window.innerHeight,
  };
}

/** Рамка совпадает с целью (с отступом PAD) — или строка с расхождением. */
function mismatch(p) {
  if (p.target === null) return 'цель не найдена';
  if (p.hole === null) return 'рамки нет';
  const d = {
    top: p.hole.top - (p.target.top - PAD),
    left: p.hole.left - (p.target.left - PAD),
    right: p.hole.right - (p.target.right + PAD),
    bottom: p.hole.bottom - (p.target.bottom + PAD),
  };
  const bad = Object.entries(d).filter(([, v]) => Math.abs(v) > EPS);
  return bad.length === 0
    ? null
    : bad.map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v.toFixed(1)}px`).join(', ');
}

/** Нижний край липких полос сверху, под которыми цель была бы не видна. */
function occludedTop() {
  let line = 0;
  for (const el of document.querySelectorAll('.topic-tabs-row--panel.is-shown, .gen-strip')) {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.top <= 1 + (parseFloat(s.top) || 0)) line = Math.max(line, r.bottom);
  }
  return line;
}

const browser = await chromium.launch();

for (const size of SIZES) {
  for (const tour of Object.values(TOURS)) {
    for (const [index, step] of tour.steps.entries()) {
      if (process.env.TOUR_ONLY && !`${size.name} ${step.id}`.includes(process.env.TOUR_ONLY))
        continue;
      const where = `${size.name} · ${tour.id} · шаг ${index + 1} «${step.short}»`;
      const context = await browser.newContext(size.context);
      await context.addInitScript(
        ([cookieKey, onbKey, id, n]) => {
          try {
            localStorage.setItem(cookieKey, JSON.stringify({ seen: true }));
            localStorage.setItem(
              onbKey,
              JSON.stringify({
                welcomeSeen: true,
                active: id,
                tours: { [id]: { step: n, done: false } },
              }),
            );
          } catch {
            /* about:blank */
          }
        },
        [COOKIE_NOTICE_KEY, ONBOARDING_KEY, tour.id, index],
      );
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      await page.goto(BASE + step.href, { waitUntil: 'networkidle' });
      try {
        await page.waitForSelector('.tour-card:not(.is-hidden)', { timeout: 15000 });
      } catch {
        fail(where, 'подсказка не появилась');
        await context.close();
        continue;
      }
      /* Подсказка проявляется с переходом прозрачности. */
      await page.waitForTimeout(400);
      const shot = async (name) => {
        if (SHOTS) {
          await page.screenshot({
            path: path.join(
              SHOTS,
              `${size.name.replace(/\s/g, '')}-${tour.id}-${index + 1}-${step.id}-${name}.png`,
            ),
          });
        }
      };
      await shot('0-start');

      const sel = size.narrow && step.narrowTarget ? step.narrowTarget : step.target;
      if (sel.length === 0) {
        await context.close();
        continue;
      }
      let p = await page.evaluate(probe, sel);
      checks++;
      const m0 = mismatch(p);
      if (m0) fail(where, `после перехода к шагу рамка мимо цели: ${m0}`);
      if (/top|left|width|height|transform|\ball\b/.test(p.holeTransition)) {
        fail(where, `у рамки переход по положению: ${p.holeTransition}`);
      }
      if (p.target) {
        const top = await page.evaluate(occludedTop);
        checks++;
        if (p.target.top < top - EPS) {
          fail(
            where,
            `цель под липкой полосой: верх ${p.target.top.toFixed(0)} < ${top.toFixed(0)}`,
          );
        }
        const bottomLine = size.narrow && p.card ? p.card.top : p.vh;
        const fitsSheet = p.target.bottom - p.target.top + 2 * PAD <= bottomLine - top;
        if (size.narrow && p.card && p.card.top > p.vh / 2) {
          checks++;
          if (fitsSheet && p.target.bottom > bottomLine + EPS) {
            fail(
              where,
              `нижний лист закрывает цель: низ цели ${p.target.bottom.toFixed(0)} > верх листа ${bottomLine.toFixed(0)}`,
            );
          }
        }
        if (!size.narrow && p.card && p.hole) {
          checks++;
          const overlap =
            p.card.left < p.hole.right &&
            p.card.right > p.hole.left &&
            p.card.top < p.hole.bottom &&
            p.card.bottom > p.hole.top;
          if (overlap && fitsSheet) fail(where, 'подсказка закрывает рамку');
        }
      }

      /* Прокрутка: рывками и плавно, на каждом кадре сверяем рамку. */
      const frames = await page.evaluate(
        async ([selectors, pad, eps, probeSrc, mismatchSrc]) => {
          const probeFn = new Function(`return (${probeSrc})`)();
          const mismatchFn = new Function('PAD', 'EPS', `return (${mismatchSrc})`)(pad, eps);
          const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
          const out = [];
          const check = async (label) => {
            /* Кадр, в котором браузер прокрутил, — и задача после него:
               все rAF этого кадра, и тура тоже, уже отработали, на
               экране то, что мерим. Ровно один кадр, без запаса. */
            await raf();
            await new Promise((r) => setTimeout(r, 0));
            const m = mismatchFn(probeFn(selectors));
            if (m) out.push(`${label}: ${m}`);
          };
          const start = window.scrollY;
          const max = () => document.documentElement.scrollHeight - window.innerHeight;
          for (const [label, y] of [
            ['вниз 120', start + 120],
            ['вниз 400', start + 520],
            ['вверх 250', start + 270],
            ['в начало', 0],
            ['вниз 60', 60],
            ['вниз 200', 260],
            ['в конец', max()],
            ['обратно', start],
          ]) {
            window.scrollTo({ top: y, behavior: 'instant' });
            await check(label);
          }
          /* Плавная прокрутка: проверяем каждый кадр. */
          for (const dy of [30, -30]) {
            for (let i = 0; i < 25; i++) {
              window.scrollBy({ top: dy, behavior: 'instant' });
              await check(`плавно ${dy > 0 ? 'вниз' : 'вверх'}, кадр ${i + 1}`);
            }
          }
          window.scrollTo({ top: start, behavior: 'instant' });
          await check('на месте');
          /* Лента вкладок прокручивается вбок — цель на ней едет. */
          for (const strip of document.querySelectorAll('.topic-tabs')) {
            if (strip.scrollWidth <= strip.clientWidth + 1) continue;
            strip.scrollLeft = 80;
            await check('лента вбок');
            strip.scrollLeft = 0;
            await check('лента обратно');
          }
          return out;
        },
        [sel, PAD, EPS, probe.toString(), mismatch.toString()],
      );
      checks += 62;
      /* Первые три расхождения — дальше обычно то же самое. */
      for (const f of frames.slice(0, 3)) fail(where, `при прокрутке ${f}`);
      if (frames.length > 3) fail(where, `… и ещё ${frames.length - 3} кадров мимо цели`);

      /* Плавная прокрутка вниз и снимок посреди неё: здесь «отставала» рамка. */
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
      await page.waitForTimeout(90);
      await shot('1-mid-scroll');
      await page.waitForTimeout(700);
      await shot('2-scrolled');

      /* Смена размера окна (поворот, адресная строка iOS). */
      const vp = size.context.viewport;
      await page.setViewportSize({ width: vp.width, height: vp.height - 80 });
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      p = await page.evaluate(probe, sel);
      checks++;
      const mr = mismatch(p);
      if (mr) fail(where, `после смены высоты окна: ${mr}`);
      await page.setViewportSize(vp);

      /* Цель пропала посреди шага: рамка прячется, подсказка остаётся. */
      await page.evaluate((selectors) => {
        /* :nth-child(1) после удаления находит следующий — убираем всех. */
        for (const sel of selectors) {
          for (let i = 0; i < 50 && document.querySelector(sel); i++) {
            document.querySelectorAll(sel).forEach((el) => el.remove());
          }
        }
      }, sel);
      /* Рамка гаснет переходом прозрачности (--dur-switch). */
      await page.waitForTimeout(500);
      const gone = await page.evaluate(() => ({
        spot: document.querySelector('.tour')?.getAttribute('data-spot'),
        hole: (() => {
          const el = document.querySelector('.tour__hole');
          return el ? getComputedStyle(el).visibility : 'hidden';
        })(),
        card: document.querySelector('.tour-card:not(.is-hidden)') !== null,
      }));
      checks++;
      if (gone.spot !== 'off' || gone.hole !== 'hidden' || !gone.card) {
        fail(where, `цель убрали — ${JSON.stringify(gone)}`);
      }

      if (consoleErrors.length > 0)
        fail(where, `ошибки в консоли: ${consoleErrors.slice(0, 2).join(' | ')}`);
      await context.close();
    }
  }
}

await browser.close();
server.close();

if (errors.length > 0) {
  console.error(`Тур: ${errors.length} ошибок\n` + errors.map((e) => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`Тур: рамка держится на цели — ${checks} проверок пройдено`);
