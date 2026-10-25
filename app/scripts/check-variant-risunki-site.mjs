#!/usr/bin/env node
/* scripts/check-variant-risunki-site.mjs — рисунки на листах вариантов
   в браузере, на собранном сайте (app/out).

   Запуск: pnpm build && pnpm test:variant-risunki-site [--shots]

   Листы ученика и учителя: «Варианты повышенной сложности» (все готовые
   варианты, версии 1 и 4) и «Собрать вариант» (все 13 заданий, среди
   рисунков — диаграмма Эйлера, дерево и мост). На каждом листе:

     1. Каждый рисунок (<figure class="sheet-figure"> → <svg>) нарисован
        движком раздела: у <svg> есть data-engine.
     2. Графики функций (.graph-curve, .pr-curve) сплошные: вычисленный
        stroke-dasharray — none (тема листа штрих не добавляет).
     3. У каждого графика функции есть подпись.
     4. Подписи рисунка не пересекаются: прямоугольники <text> по
        getBoundingClientRect, с допуском 0,75 px.
     5. Подписи на бумаге не мельче 10 pt (кегль × масштаб рисунка
        против 210 мм страницы).

   --shots — снимки docs/variant-risunki-snimki/: №9 и №12 листов ученика
   и учителя двух вариантов, по одному рисунку каждого другого типа —
   на компьютере и в предпросмотре на телефоне, масштаб 100 %. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { requireSrc, APP, SRC } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const SHOTS = process.argv.includes('--shots');
const OUT = path.join(APP, 'out');
const SHOT_DIR = path.join(APP, '..', 'docs', 'variant-risunki-snimki');
if (!fs.existsSync(path.join(OUT, 'variant', 'pechat', 'index.html'))) {
  console.error('Нет сборки out/variant/pechat/ — сначала pnpm build.');
  process.exit(1);
}

const warn = console.warn;
console.warn = (...a) => (String(a[0]).includes('LaTeX-incompatible') ? undefined : warn(...a));

let failures = 0;
function ok(cond, where, message) {
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${where}: ${message}`);
  } else {
    console.log(`  ✓ ${where}`);
  }
}

/* ── Листы ──────────────────────────────────────────────────────── */

const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const { povKod } = requireSrc('lib/povyshennye/kod');
const { encodeCode } = requireSrc('lib/variant/code');

const subtypeIds = {};
for (let n = 1; n <= 13; n += 1) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  const a = section.init(data == null ? null : JSON.parse(JSON.stringify(data)));
  subtypeIds[n] = a.info.subtypes.map((s) => s.id);
}
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
/* Подобраны так, что в серии есть рисунки №6 (Эйлер, дерево) и мост №10. */
const SOBRAT = [
  { seed: 'S006', subtypes: { 6: ['I'], 10: ['I'] } },
  { seed: 'S006', subtypes: { 6: ['II'], 10: ['I'] } },
].map(({ seed, subtypes }) =>
  encodeCode(
    {
      seed,
      config: { tasks: ALL, subtypes, source: 'mix', stars: [], count: 2, parallel: false },
      zameny: {},
      version: '00',
    },
    subtypeIds,
  ),
);

const LISTY = [];
for (const k of GOTOVY) {
  for (const v of [1, 4]) {
    for (const list of ['uchenik', 'uchitel']) {
      LISTY.push({
        name: `${povKod(k)}.${v} ${list}`,
        url: `kod=${povKod(k)}&v=${v}&list=${list}`,
      });
    }
  }
}
for (const code of SOBRAT) {
  for (const list of ['uchenik', 'uchitel']) {
    LISTY.push({ name: `«Собрать вариант» ${code} ${list}`, url: `kod=${code}&list=${list}` });
  }
}

/* ── Сервер над out/ ────────────────────────────────────────────── */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

/* ── Проверка рисунков в странице ───────────────────────────────── */

/** Выполняется в браузере: список нарушений по всем рисункам листа. */
function proverkaRisunkov() {
  const MIN_PT = 10;
  const out = [];
  const page =
    document.querySelector('#sheet-pages .sheet-page') ??
    document.querySelector('#sheet-pages > *');
  /* Миллиметр на экране: страница — 210 мм. */
  const pxNaMm = page.getBoundingClientRect().width / 210;
  const figs = [...document.querySelectorAll('#sheet-pages figure.sheet-figure')];
  const engines = {};
  figs.forEach((fig, i) => {
    const svg = fig.querySelector(':scope > svg');
    const card = fig.closest('[data-task-no], .sheet-task, .sheet-item');
    const no =
      card?.querySelector('.sheet-task-no, .var-task__no, .sheet-num')?.textContent?.trim() ?? '';
    const where = `рисунок ${i + 1}${no ? ` (№${no})` : ''}`;
    if (svg === null) {
      out.push(`${where}: не <svg>`);
      return;
    }
    const engine = svg.getAttribute('data-engine');
    if (engine === null) {
      out.push(`${where}: нет data-engine — нарисован не движком раздела`);
      return;
    }
    engines[engine] = (engines[engine] ?? 0) + 1;
    const curves = [...svg.querySelectorAll('.graph-curve, .pr-curve')];
    for (const c of curves) {
      const d = getComputedStyle(c).strokeDasharray;
      if (d !== 'none' && d !== '')
        out.push(`${where} (${engine}): график штрихом, stroke-dasharray ${d}`);
    }
    const labels = svg.querySelectorAll('.graph-curve-label, .pr-curve-label').length;
    if (curves.length > 0 && labels < curves.length)
      out.push(`${where} (${engine}): графиков ${curves.length}, подписей ${labels}`);
    const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim() !== '');
    const rects = texts.map((t) => t.getBoundingClientRect());
    for (let a = 0; a < texts.length; a += 1) {
      const fsPx = parseFloat(getComputedStyle(texts[a]).fontSize);
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const pt = (fsPx * scale) / pxNaMm / (25.4 / 72);
      if (pt < MIN_PT - 0.05) {
        out.push(`${where} (${engine}): «${texts[a].textContent}» ${pt.toFixed(1)} pt`);
        break;
      }
    }
    const T = 0.75;
    for (let a = 0; a < rects.length; a += 1) {
      for (let b = a + 1; b < rects.length; b += 1) {
        const r = rects[a];
        const q = rects[b];
        const w = Math.min(r.right, q.right) - Math.max(r.left, q.left) - 2 * T;
        const h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) - 2 * T;
        if (w > 0 && h > 0)
          out.push(
            `${where} (${engine}): подписи «${texts[a].textContent}» и «${texts[b].textContent}» пересекаются`,
          );
      }
    }
  });
  return { out, figs: figs.length, engines };
}

const errors = [];
const desk = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await welcomeSeen(desk);

async function otkryt(ctx, url) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.addInitScript(() => {
    window.print = () => {};
  });
  await p.goto(`${BASE}/variant/pechat/?${url}`);
  await p.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 180_000 });
  await p.evaluate(() => document.fonts.ready);
  return p;
}

const vsego = {};
for (const list of LISTY) {
  const p = await otkryt(desk, list.url);
  const r = await p.evaluate(proverkaRisunkov);
  for (const [e, c] of Object.entries(r.engines)) vsego[e] = (vsego[e] ?? 0) + c;
  ok(
    r.figs > 0 && r.out.length === 0,
    `${list.name}: рисунков ${r.figs}`,
    r.out.slice(0, 8).join('\n    '),
  );
  await p.close();
}
console.log(
  `  движки: ${Object.entries(vsego)
    .map(([e, c]) => `${e} ${c}`)
    .join(', ')}`,
);

/* ── Снимки ─────────────────────────────────────────────────────── */

if (SHOTS) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  await welcomeSeen(phone);
  /* Карточка задания с рисунком данного движка (или номером задания). */
  async function snimokZadaniya(p, sel, name) {
    const fig = p.locator(sel).first();
    if ((await fig.count()) === 0) {
      console.error(`  ✗ снимок ${name}: нет рисунка ${sel}`);
      failures += 1;
      return;
    }
    const box = fig.locator(
      'xpath=ancestor::*[contains(@class,"sheet-item") or contains(@class,"sheet-task")][1]',
    );
    const target = (await box.count()) > 0 ? box : fig;
    await target.scrollIntoViewIfNeeded();
    await target.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
    console.log(`  снимок ${name}.png`);
  }
  const PLAN = [
    /* №9 и №12 — ученик и учитель, два варианта. */
    { url: 'kod=PV-02&v=1', sel: 'svg[data-engine="proizvodnaya"]', name: 'v2-1-n9' },
    { url: 'kod=PV-02&v=1', sel: 'svg[data-engine="graph"]', name: 'v2-1-n12' },
    { url: 'kod=PV-05&v=1', sel: 'svg[data-engine="proizvodnaya"]', name: 'v5-1-n9' },
    { url: 'kod=PV-05&v=1', sel: 'svg[data-engine="graph"]', name: 'v5-1-n12' },
    /* Остальные типы рисунков. */
    { url: 'kod=PV-05&v=1', sel: 'svg[data-engine="planimetriya"]', name: 'n1-planimetriya' },
    { url: 'kod=PV-03&v=1', sel: 'svg[data-engine="vektory"]', name: 'n2-vektory' },
    { url: 'kod=PV-03&v=1', sel: 'svg[data-engine="solid"]', name: 'n3-stereometriya' },
    {
      url: `kod=${SOBRAT[0]}`,
      sel: 'svg[data-engine="chertezh3"]',
      name: 'n3-stereometriya-sobrat',
    },
    { url: `kod=${SOBRAT[0]}`, sel: 'svg.pr-eiler', name: 'n6-eiler' },
    { url: `kod=${SOBRAT[1]}`, sel: 'svg.pr-tree', name: 'n6-derevo' },
    { url: `kod=${SOBRAT[0]}`, sel: 'svg[data-engine="zadanie10"]', name: 'n10-most' },
  ];
  for (const { url, sel, name } of PLAN) {
    for (const list of ['uchenik', 'uchitel']) {
      if (!name.startsWith('v') && list === 'uchitel') continue;
      for (const [ctx, ustr] of [
        [desk, 'komputer'],
        [phone, 'telefon'],
      ]) {
        const p = await otkryt(ctx, `${url}&list=${list}`);
        await snimokZadaniya(p, `#sheet-pages ${sel}`, `${name}-${list}-${ustr}`);
        await p.close();
      }
    }
  }
}

ok(errors.length === 0, 'ошибок на страницах нет', errors.join('\n'));
await browser.close();
server.close();
console.log(failures === 0 ? '\nВсё в порядке.' : `\nОшибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
