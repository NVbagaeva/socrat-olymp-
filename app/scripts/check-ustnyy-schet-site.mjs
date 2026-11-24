#!/usr/bin/env node
/* scripts/check-ustnyy-schet-site.mjs — раздел «Устный счёт» в браузере,
   по статической сборке (out/).

   Запуск: pnpm build && pnpm test:ustnyy-schet-site [--snimki]

   1. Серия проходится с одной клавиатуры: Tab до «Начать», Enter;
      ответы набираются и отправляются Enter; ошибка объявляется
      aria-live («Неверно, ответ …»), через 1,5 с — следующий пример;
      итоги: 9 верно из 10, фокус на заголовке итогов.
   2. На время, с подменённым временем (page.clock), для 3D- и
      SVG-таймера: за 30 с таймер уходит на 30 с ± 100 мс, тренировка
      кончается не раньше чем за 100 мс до минуты и не позже чем через
      100 мс после; на нуле — вспышка, потом итоги.
   2а. 3D-таймер: сцена three.js грузится отдельным файлом только на
      экране тренировки (на витрине и странице приёма её нет); кадры
      рисуются, на скрытой вкладке встают и снова идут, когда вкладка
      видна; на слабом устройстве и при reduced-motion — SVG-кольцо.
   3. Свободный режим: после ошибки — разбор и «Понятно».
   4. Без WebGL (Chromium с --disable-webgl): таймер — SVG, ошибок нет.
   5. Телефон (палец): своя клавиатура, «OK» отвечает, системная
      клавиатура не открывается (inputmode=none).
   6. prefers-reduced-motion: встряски и вспышки выключены.
   6а. Карточка «Разминка: устный счёт» на №8 профиля и №4, 14, 15, 16
      базы ведёт в тренировку; /statistika/ — пусто до первой
      тренировки, после — тренировки, примеры, точность.
   7. 320 px: прокрутки вбок нет на витрине, странице приёма, таблице,
      настройках, экране тренировки и итогах.
   8. Квадратные уравнения (обратная теорема Виета): страницы четырёх приёмов открываются
      (картинка в шапке, без прокрутки вбок на 375 и 1440 px); тренировка
      с двумя полями решается с клавиатуры (Enter в «x₁» — к «x₂», корни
      в любом порядке), верный ответ — точки на прямой, ошибка — оба
      корня; режим «Как в ЕГЭ» — одно поле; «Конструктор корней» ходит
      стрелками, парабола проходит через выбранные точки.
   --snimki — снимки в docs/ustnyy-schet-snimki/ (телефон 320 и 390,
   планшет, компьютер). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
const SNIMKI = process.argv.includes('--snimki')
  ? path.join(APP, '..', 'docs', 'ustnyy-schet-snimki')
  : null;
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки: сначала pnpm build.');
  process.exit(1);
}
if (SNIMKI !== null) fs.mkdirSync(SNIMKI, { recursive: true });

const { vychislit, str } = requireSrc('lib/ustnyySchet/chislo.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  console.log(`  ${ok ? 'ok' : 'НЕТ'}  ${what}`);
  return ok;
}

/* ── Статический сервер ─────────────────────────────────────── */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
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
const bezWebgl = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'],
});

async function context(opts = {}, b = browser) {
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: SNIMKI === null ? 1 : 2,
    ...opts,
  });
  await welcomeSeen(ctx);
  return ctx;
}

async function open(ctx, url, wait = '.us-stranica') {
  const p = await ctx.newPage();
  p.setDefaultTimeout(20_000);
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.goto(BASE + url, { waitUntil: 'load' });
  await p.locator(wait).first().waitFor({ state: 'visible' });
  return p;
}

async function snimok(p, name, full = true) {
  if (SNIMKI === null) return;
  await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(SNIMKI, `${name}.png`), fullPage: full });
}

async function bezProkrutki(p) {
  return p.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

/** Ответ на текущий пример — пересчёт выражения в Node. */
async function otvetNaTekushiy(p) {
  const expr = await p.locator('.us-igra__vopros').getAttribute('data-expr');
  return str(vychislit(expr)).replace('.', ',');
}

/* ── 1. Серия с одной клавиатуры ─────────────────────────────── */
console.log('1. Серия с клавиатуры');
{
  const ctx = await context();
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?t=7%2C8&r=s10', '.us-nastroyki');
  let found = false;
  for (let i = 0; i < 120 && !found; i += 1) {
    await p.keyboard.press('Tab');
    found = await p.evaluate(
      () => document.activeElement?.classList.contains('us-nastroyki__start') ?? false,
    );
  }
  check(found, 'Tab доходит до «Начать»');
  await p.keyboard.press('Enter');
  await p.locator('.us-igra__vopros').waitFor();
  check(
    await p.evaluate(() => document.activeElement?.id === 'us-otvet'),
    'поле ответа сразу в фокусе',
  );
  for (let i = 0; i < 10; i += 1) {
    const before = await p.locator('.us-igra__vopros').getAttribute('data-expr');
    const ans = await otvetNaTekushiy(p);
    if (i === 4) {
      await p.keyboard.type('1');
      await p.keyboard.press('Enter');
      await p.locator('.us-igra__verniy').waitFor();
      const live = (await p.locator('[role="status"]').textContent()) ?? '';
      check(
        live.replace(/​/g, '').trim() === `Неверно, ответ ${ans}`,
        `aria-live: «${live.trim()}»`,
      );
      check(
        (await p.locator('.us-igra__oshibka .us-razbor').count()) === 0,
        'в серии разбора на экране нет — он в итогах',
      );
      await p.locator('.us-igra__verniy').waitFor({ state: 'detached', timeout: 4000 });
      continue;
    }
    await p.keyboard.type(ans);
    await p.keyboard.press('Enter');
    if (i < 9) {
      await p.waitForFunction(
        (b) =>
          document.querySelector('.us-igra__vopros')?.getAttribute('data-expr') !== b ||
          document.querySelector('.us-itogi'),
        before,
      );
      if (i === 0) {
        const live = (await p.locator('[role="status"]').textContent()) ?? '';
        check(live.trim() === 'Верно', `aria-live после верного: «${live.trim()}»`);
      }
    }
  }
  await p.locator('.us-itogi').waitFor();
  const plitka = (await p.locator('.us-plitka').first().textContent()) ?? '';
  check(/9\s*из 10/.test(plitka), `итоги: ${plitka}`);
  check(
    await p.evaluate(() => document.activeElement?.id === 'us-itogi-zag'),
    'фокус на заголовке итогов',
  );
  check(
    (await p.locator('.us-oshibka .us-razbor__shag').count()) > 0,
    'в итогах — ошибка с разбором',
  );
  check(
    (await p.getByRole('button', { name: 'Повторить ошибки' }).count()) === 1,
    'кнопка «Повторить ошибки»',
  );
  const stat = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('budetege:ustnyy-schet:v1') ?? 'null'),
  );
  check(
    stat?.sessii?.length === 1 && stat.sessii[0].verno === 9 && stat.sessii[0].vsego === 10,
    'тренировка записана в статистику',
  );
  check(Object.keys(stat?.tablica ?? {}).length > 0, 'клетки таблицы обновлены');
  check(p.errors.length === 0, `ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 2. Таймер на время с подменённым временем ───────────────── */
console.log('2. Таймер: ±100 мс за минуту (3D и SVG)');
async function proverkaTaymera(b, nazv) {
  const ctx = await context({}, b);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.clock.install();
  await p.goto(`${BASE}/ustnyy-schet/trenirovka/?t=2%2C3&r=v60&go=1`, { waitUntil: 'load' });
  await p.locator('.us-taymer').waitFor();
  /* Два ответа: пустая тренировка в статистику не пишется. */
  for (let i = 0; i < 2; i += 1) {
    await p.keyboard.type(await otvetNaTekushiy(p));
    await p.keyboard.press('Enter');
    await p.waitForTimeout(50);
  }
  /* 3D-сцена грузится лениво — дождаться, если она будет. */
  await p.waitForTimeout(800);
  await p.clock.pauseAt(Date.now() + 2000);
  const vid = await p.locator('.us-taymer').getAttribute('data-taymer');
  const ostalos = async () => Number(await p.locator('.us-taymer').getAttribute('data-ms'));
  const o0 = await ostalos();
  await p.clock.runFor(30_000);
  const o1 = await ostalos();
  check(
    Math.abs(o0 - o1 - 30_000) <= 100,
    `${nazv} (${vid}): за 30 с таймер ушёл на ${o0 - o1} мс`,
  );
  await p.clock.runFor(Math.max(0, o1 - 100));
  check(
    (await p.locator('.us-taymer.is-nol').count()) === 0 &&
      (await p.locator('.us-itogi').count()) === 0,
    `${nazv}: за 100 мс до конца тренировка ещё идёт`,
  );
  await p.clock.runFor(200);
  check(
    (await p.locator('.us-taymer.is-nol').count()) === 1,
    `${nazv}: через 100 мс после конца — ноль и вспышка`,
  );
  check(
    await p.locator('#us-otvet').evaluate((e) => e.readOnly),
    `${nazv}: после конца ответы не принимаются`,
  );
  await p.clock.runFor(600);
  await p.locator('.us-itogi').waitFor({ timeout: 5000 });
  check(true, `${nazv}: после вспышки — итоги`);
  const stat = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('budetege:ustnyy-schet:v1') ?? 'null'),
  );
  check(
    Math.abs((stat?.sessii?.[0]?.ms ?? 0) - 60_000) <= 100,
    `${nazv}: записанное время ${stat?.sessii?.[0]?.ms} мс`,
  );
  check(p.errors.length === 0, `${nazv}: ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
  return vid;
}
const vidObychnyy = await proverkaTaymera(browser, 'обычный Chromium');
await proverkaTaymera(bezWebgl, 'без WebGL');

/* ── 2а. 3D-таймер: ленивая загрузка, кадры, скрытая вкладка ──── */
console.log('2а. 3D-таймер');
{
  const ctx = await context();
  const skripty = new Map();
  ctx.on('response', async (r) => {
    if (r.url().endsWith('.js')) skripty.set(r.url(), r);
  });
  const est3d = vidObychnyy === '3d';
  check(
    true,
    `WebGL в этом Chromium ${est3d ? 'есть — проверяем 3D' : 'недоступен — 3D-часть пропущена'}`,
  );
  if (est3d) {
    /* Витрина и страница приёма: сцены three.js в загрузке нет. */
    const v = await open(ctx, '/ustnyy-schet/', '.us-hero');
    await v.waitForTimeout(500);
    const naVitrine = new Set(skripty.keys());
    const pr = await open(ctx, '/ustnyy-schet/kvadrat-na-5/', '.us-pravilo');
    await pr.waitForTimeout(500);
    const doTrenirovki = new Set(skripty.keys());
    const p = await open(ctx, '/ustnyy-schet/trenirovka/?t=7&r=v120&go=1', '.us-igra__vopros');
    await p.locator('.us-taymer[data-taymer="3d"]').waitFor({ timeout: 15_000 });
    check(true, 'на экране тренировки — 3D-таймер');
    const novye = [...skripty.keys()].filter((u) => !doTrenirovki.has(u));
    let sScenoy = null;
    for (const u of novye) {
      const body = await skripty
        .get(u)
        .text()
        .catch(() => '');
      if (body.includes('WebGLRenderer')) sScenoy = u;
    }
    check(sScenoy !== null, 'сцена three.js пришла отдельным файлом при старте тренировки');
    check(sScenoy !== null && !naVitrine.has(sScenoy), 'на витрине сцены three.js нет');
    check((await p.locator('.us-taymer__canvas').count()) === 1, 'холст WebGL на месте');
    check(
      /^\d:\d\d$/.test((await p.locator('.us-taymer__cifry').textContent())?.trim() ?? ''),
      'цифры — текстом поверх холста',
    );
    check(
      (await p.locator('.us-taymer [role="timer"]').count()) === 1,
      'у таймера role=timer для скринридера',
    );
    const kadrov = () =>
      p.locator('.us-taymer__canvas').evaluate((c) => Number(c.dataset.kadrov ?? 0));
    const k0 = await kadrov();
    await p.waitForTimeout(400);
    const k1 = await kadrov();
    check(k1 > k0, `кадры рисуются (${k0} → ${k1})`);
    /* Скрытая вкладка: кадры встают. */
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await p.waitForTimeout(100);
    const k2 = await kadrov();
    await p.waitForTimeout(600);
    const k3 = await kadrov();
    check(k3 === k2, `на скрытой вкладке рендер стоит (${k2} → ${k3})`);
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await p.waitForTimeout(400);
    check((await kadrov()) > k3, 'вкладка снова видна — кадры пошли');
    await snimok(p, 'kompyuter-1280-taymer-3d', false);
    check(
      p.errors.length === 0 && v.errors.length === 0,
      `ошибок на странице нет ${p.errors.join('; ')}`,
    );
  }
  await ctx.close();

  /* Слабое устройство: два ядра — SVG-кольцо, сцена не грузится. */
  const slab = await context();
  await slab.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
  });
  const ps = await open(slab, '/ustnyy-schet/trenirovka/?t=7&r=v60&go=1', '.us-igra__vopros');
  await ps.waitForTimeout(800);
  check(
    (await ps.locator('[data-taymer="2d"]').count()) === 1,
    'слабое устройство (2 ядра) — SVG-кольцо',
  );
  await slab.close();

  /* prefers-reduced-motion — SVG-кольцо. */
  const tiho = await context({ reducedMotion: 'reduce' });
  const pt = await open(tiho, '/ustnyy-schet/trenirovka/?t=7&r=v60&go=1', '.us-igra__vopros');
  await pt.waitForTimeout(800);
  check((await pt.locator('[data-taymer="2d"]').count()) === 1, 'reduced-motion — SVG-кольцо');
  await tiho.close();
}

/* ── 3. Свободный режим: разбор и «Понятно» ──────────────────── */
console.log('3. Свободный режим');
{
  const ctx = await context();
  const p = await open(
    ctx,
    '/ustnyy-schet/trenirovka/?p=kvadrat-na-5&r=svobodnyy&go=1',
    '.us-igra__vopros',
  );
  const ans = await otvetNaTekushiy(p);
  await p.locator('#us-otvet').focus();
  await p.keyboard.type('5');
  await p.keyboard.press('Enter');
  await p.locator('.us-igra__oshibka .us-razbor__shag').first().waitFor();
  check(
    (await p.locator('.us-igra__verniy').textContent())?.includes(ans),
    'после ошибки — верный ответ',
  );
  check(
    await p.evaluate(() => document.activeElement?.textContent === 'Понятно'),
    'фокус на «Понятно»',
  );
  await p.keyboard.press('Enter');
  await p.locator('.us-igra__oshibka').waitFor({ state: 'detached' });
  check(
    await p.evaluate(() => document.activeElement?.id === 'us-otvet'),
    'после «Понятно» — снова поле ответа',
  );
  await p.getByRole('button', { name: 'Подсказка: приём' }).click();
  check((await p.locator('.us-igra__pravilo .katex').count()) > 0, 'подсказка приёма с формулой');
  check(p.errors.length === 0, `ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 4. Без WebGL ───────────────────────────────────────────── */
console.log('4. Без WebGL');
{
  const ctx = await context({}, bezWebgl);
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?t=4&r=v60&go=1', '.us-igra__vopros');
  check(
    await p.evaluate(() => !document.createElement('canvas').getContext('webgl')),
    'WebGL действительно выключен',
  );
  check((await p.locator('[data-taymer="2d"]').count()) === 1, 'таймер — SVG');
  await p.locator('#us-otvet').focus();
  for (let i = 0; i < 3; i += 1) {
    await p.keyboard.type(await otvetNaTekushiy(p));
    await p.keyboard.press('Enter');
    await p.waitForTimeout(50);
  }
  check((await p.locator('.us-igra__nomer').textContent())?.includes('4'), 'три ответа приняты');
  check(p.errors.length === 0, `ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 5. Телефон: своя клавиатура ─────────────────────────────── */
console.log('5. Телефон');
{
  const ctx = await context({
    ...devices['iPhone 13'],
    deviceScaleFactor: SNIMKI === null ? 1 : 3,
  });
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?t=6&r=s10&go=1', '.us-igra__vopros');
  await p.locator('.keypad').waitFor();
  check(
    (await p.locator('#us-otvet').getAttribute('inputmode')) === 'none',
    'системная клавиатура не всплывает',
  );
  const ans = await otvetNaTekushiy(p);
  const before = await p.locator('.us-igra__vopros').getAttribute('data-expr');
  for (const c of ans) await p.locator(`.keypad__key[data-key="${c === ',' ? ',' : c}"]`).tap();
  await p.locator('.keypad__key[data-key="ok"]').tap();
  await p.waitForFunction(
    (b) => document.querySelector('.us-igra__vopros')?.getAttribute('data-expr') !== b,
    before,
  );
  check(true, '«OK» на экранной клавиатуре отвечает');
  const keys = await p
    .locator('.keypad__key')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  check(
    keys.every((h) => h >= 44),
    `клавиши не ниже 44 px (${Math.min(...keys)})`,
  );
  const vopros = await p.locator('.us-igra__vopros').boundingBox();
  const keypad = await p.locator('.keypad').boundingBox();
  check(
    vopros !== null && keypad !== null && vopros.y + vopros.height <= keypad.y,
    'клавиатура не закрывает пример',
  );
  await snimok(p, 'telefon-390-trenirovka', false);
  check(p.errors.length === 0, `ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 6. Без анимаций ─────────────────────────────────────────── */
console.log('6. prefers-reduced-motion');
{
  const ctx = await context({ reducedMotion: 'reduce' });
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?t=9&r=svobodnyy&go=1', '.us-igra__vopros');
  await p.locator('#us-otvet').focus();
  await p.keyboard.type('0');
  await p.keyboard.press('Enter');
  await p.locator('.us-igra__verniy').waitFor();
  const anim = (cls) =>
    p.evaluate((c) => {
      const igra = document.querySelector('.us-igra');
      igra.classList.add(c);
      const name = getComputedStyle(igra.querySelector('.us-igra__karta')).animationName;
      igra.classList.remove(c);
      return name;
    }, cls);
  const a1 = await anim('is-neverno');
  const a2 = await anim('is-verno');
  check(a1 === 'none' && a2 === 'none', `встряски и вспышки нет (${a1}, ${a2})`);
  await ctx.close();
  /* Для сравнения — без просьбы системы анимация есть. */
  const ctx2 = await context();
  const p2 = await open(ctx2, '/ustnyy-schet/trenirovka/?t=9&r=svobodnyy&go=1', '.us-igra__vopros');
  const b1 = await p2.evaluate(() => {
    const igra = document.querySelector('.us-igra');
    igra.classList.add('is-neverno');
    return getComputedStyle(igra.querySelector('.us-igra__karta')).animationName;
  });
  check(b1 === 'us-neverno', `без reduced-motion встряска есть (${b1})`);
  await ctx2.close();
}

/* ── 6а. Разминка на страницах заданий и статистика ─────────── */
console.log('6а. Разминка и статистика');
{
  const ctx = await context();
  for (const url of [
    '/zadaniya/vychisleniya/',
    '/baza/zadaniya/4/',
    '/baza/zadaniya/14/',
    '/baza/zadaniya/15/',
    '/baza/zadaniya/16/',
  ]) {
    const p = await open(ctx, url, 'main');
    const n = await p.locator('.us-razminka').count();
    check(n === 1, `${url}: карточка «Разминка: устный счёт»`);
    if (n === 1) {
      const a = p.locator('.us-razminka a', { hasText: '10 примеров' });
      check(
        ((await a.getAttribute('href')) ?? '').startsWith('/ustnyy-schet/trenirovka/?'),
        `${url}: ссылка на тренировку`,
      );
    }
    await p.close();
  }
  const pz = await open(ctx, '/baza/zadaniya/5/', 'main');
  check((await pz.locator('.us-razminka').count()) === 0, 'на задании без вычислений разминки нет');
  await pz.close();

  /* Пусто, потом — после тренировки — цифры. */
  const st0 = await open(ctx, '/statistika/', '.us-stat--kabinet');
  check(
    (await st0.getByText('Здесь появятся твои результаты').count()) === 1,
    'статистика: пусто до первой тренировки',
  );
  await st0.close();
  const p = await open(ctx, '/zadaniya/vychisleniya/', '.us-razminka');
  await p.locator('.us-razminka a', { hasText: '10 примеров' }).click();
  await p.locator('.us-igra__vopros').waitFor();
  for (let i = 0; i < 10; i += 1) {
    const before = await p.locator('.us-igra__vopros').getAttribute('data-expr');
    await p.locator('#us-otvet').focus();
    await p.keyboard.type(i === 0 ? '999999' : await otvetNaTekushiy(p));
    await p.keyboard.press('Enter');
    if (i < 9) {
      await p.waitForFunction(
        (b) => document.querySelector('.us-igra__vopros')?.getAttribute('data-expr') !== b,
        before,
        { timeout: 5000 },
      );
    }
  }
  await p.locator('.us-itogi').waitFor();
  await p.goto(`${BASE}/statistika/`, { waitUntil: 'load' });
  await p.locator('.us-stat__plitki').waitFor();
  const plitki = (await p.locator('.us-stat__plitki').innerText()).replace(/\s+/g, ' ');
  check(
    /Тренировок 1/.test(plitki) && /Примеров 10/.test(plitki) && /90 %/.test(plitki),
    `статистика: ${plitki}`,
  );
  check(await bezProkrutki(p), 'статистика: прокрутки вбок нет');
  await snimok(p, 'kompyuter-1280-statistika');
  check(p.errors.length === 0, `ошибок нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 7. 320 px и снимки ──────────────────────────────────────── */
console.log('7. Ширина 320 и снимки');
const STRANICY = [
  ['vitrina', '/ustnyy-schet/', '.us-hero'],
  ['priyom', '/ustnyy-schet/kvadrat-na-5/', '.us-pravilo'],
  ['kvadraty', '/ustnyy-schet/kvadraty-11-30/', '.us-kartochki'],
  ['tablica', '/ustnyy-schet/tablica-umnozheniya/', '.us-setka'],
  ['nastroyki', '/ustnyy-schet/trenirovka/?p=okolo-100%2Cna-11&r=v60', '.us-nastroyki'],
  [
    'trenirovka',
    '/ustnyy-schet/trenirovka/?p=procent-ot-chisla&r=s10&u=2&go=1',
    '.us-igra__vopros',
  ],
];
const EKRANY = [
  ['telefon-320', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }],
  ['telefon-390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['planshet-768', { viewport: { width: 768, height: 1024 }, hasTouch: true }],
  ['kompyuter-1440', { viewport: { width: 1440, height: 900 } }],
];
for (const [ekran, opts] of EKRANY) {
  if (SNIMKI === null && ekran !== 'telefon-320') continue;
  const ctx = await context(opts);
  for (const [name, url, wait] of STRANICY) {
    const p = await open(ctx, url, wait);
    check(await bezProkrutki(p), `${ekran} ${name}: прокрутки вбок нет`);
    await snimok(p, `${ekran}-${name}`);
    if (name === 'trenirovka') {
      /* Ошибка и итоги. */
      await p.locator('#us-otvet').fill('1');
      await p.locator('#us-otvet').press('Enter');
      await p.locator('.us-igra__verniy').waitFor();
      check(await bezProkrutki(p), `${ekran} ошибка: прокрутки вбок нет`);
      await snimok(p, `${ekran}-oshibka`, false);
      await p.getByRole('button', { name: 'Закончить' }).click();
      await p.locator('.us-itogi').waitFor();
      check(await bezProkrutki(p), `${ekran} итоги: прокрутки вбок нет`);
      await snimok(p, `${ekran}-itogi`);
    }
    check(p.errors.length === 0, `${ekran} ${name}: ошибок нет ${p.errors.join('; ')}`);
    await p.close();
  }
  await ctx.close();
}

/* ── 8. Квадратные уравнения: Виет ──────────────────────────── */
console.log('8. Виет: страницы, два поля, ЕГЭ, конструктор');
/** Оба корня текущего уравнения: из формулы корня в data-expr (±√D). */
async function korniNaTekushiy(p) {
  const expr = await p.locator('.us-igra__vopros').getAttribute('data-expr');
  const drugoy = expr.includes('-sqrt(')
    ? expr.replace('-sqrt(', '+sqrt(')
    : expr.replace('+sqrt(', '-sqrt(');
  return [str(vychislit(expr)), str(vychislit(drugoy))].map((x) => x.replace('.', ','));
}
{
  for (const [ekran, vp] of [
    ['375', { width: 375, height: 812 }],
    ['1440', { width: 1440, height: 900 }],
  ]) {
    const ctx = await context({ viewport: vp });
    for (const id of [
      'vieta-privedennoe',
      'vieta-delim-na-a',
      'vieta-summa-koefficientov',
      'vieta-perebroska',
    ]) {
      const p = await open(ctx, `/ustnyy-schet/${id}/`);
      check((await p.locator('h1').count()) === 1, `${ekran} ${id}: страница открылась`);
      const img = p.locator('.us-priyom__kartinka');
      check(
        (await img.count()) === 1 &&
          (await img.getAttribute('width')) !== null &&
          (await img.getAttribute('loading')) === 'lazy',
        `${ekran} ${id}: картинка Виета в шапке (width/height, lazy)`,
      );
      check((await p.locator('.us-primer').count()) >= 2, `${ekran} ${id}: разобранные примеры`);
      if (id === 'vieta-privedennoe') await p.locator('.us-kk').waitFor();
      check(await bezProkrutki(p), `${ekran} ${id}: прокрутки вбок нет`);
      await snimok(p, `vieta-${ekran}-${id}`);
      check(p.errors.length === 0, `${ekran} ${id}: ошибок нет ${p.errors.join('; ')}`);
      await p.close();
    }
    await ctx.close();
  }

  /* Тренировка: серия из 10 с двумя полями. */
  const ctx = await context({ viewport: { width: 375, height: 812 } });
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?p=vieta-privedennoe&r=s10&go=1', '.us-igra');
  await p.locator('#us-otvet-2').waitFor();
  check(
    (await p.locator('.us-igra__korni-podpis').textContent())?.includes('в любом порядке') === true,
    'подпись «Корни в любом порядке…»',
  );
  check(await p.evaluate(() => document.activeElement?.id === 'us-otvet'), 'фокус в поле x₁');
  for (let i = 0; i < 10; i += 1) {
    const before = await p.locator('.us-igra__vopros').getAttribute('data-expr');
    const [k1, k2] = await korniNaTekushiy(p);
    if (i === 2) {
      await p.keyboard.type(k1);
      await p.keyboard.press('Enter');
      check(
        await p.evaluate(() => document.activeElement?.id === 'us-otvet-2'),
        'Enter в x₁ переводит в x₂',
      );
      await p.keyboard.type(`${k2}1`);
      await p.keyboard.press('Enter');
      await p.locator('.us-igra__verniy').waitFor();
      const t = (await p.locator('.us-igra__verniy').textContent()) ?? '';
      check(
        t.includes(k1.replace('-', '−')) && t.includes(k2.replace('-', '−')),
        `ошибка — оба корня: «${t}»`,
      );
      await p.locator('.us-igra__verniy').waitFor({ state: 'detached', timeout: 4000 });
      continue;
    }
    /* Корни в обратном порядке — тоже верно. */
    await p.keyboard.type(k2);
    await p.keyboard.press('Enter');
    await p.keyboard.type(k1);
    await p.keyboard.press('Enter');
    if (i < 9) {
      await p.waitForFunction(
        (b) =>
          document.querySelector('.us-igra__vopros')?.getAttribute('data-expr') !== b ||
          document.querySelector('.us-itogi'),
        before,
      );
      if (i === 0) {
        check((await p.locator('.us-polet').count()) === 1, 'верно — точки на прямой');
        await snimok(p, 'vieta-trenirovka-375', false);
      }
    }
  }
  await p.locator('.us-itogi').waitFor();
  const plitka = (await p.locator('.us-plitka').first().textContent()) ?? '';
  check(/9\s*из 10/.test(plitka), `Виет, итоги: ${plitka}`);
  const oshibka = (await p.locator('.us-oshibka__vopros').first().textContent()) ?? '';
  check(
    /x1=.*x2=|x\s*1\s*=/.test(oshibka.replace(/\s/g, '')),
    `итоги: оба корня у ошибки «${oshibka}»`,
  );
  check(await bezProkrutki(p), 'Виет, итоги: прокрутки вбок нет');
  check(p.errors.length === 0, `Виет, тренировка: ошибок нет ${p.errors.join('; ')}`);
  await p.close();

  /* «Как в ЕГЭ»: одно поле, меньший корень. */
  const e = await open(
    ctx,
    '/ustnyy-schet/trenirovka/?p=vieta-privedennoe&r=svobodnyy&ege=men&go=1',
    '.us-igra',
  );
  check((await e.locator('#us-otvet-2').count()) === 0, 'ЕГЭ: одно поле');
  check(
    (await e.locator('.us-igra__korni-podpis').textContent())?.includes('меньший') === true,
    'ЕГЭ: «В ответ запиши меньший корень»',
  );
  const b0 = await e.locator('.us-igra__vopros').getAttribute('data-expr');
  await e.keyboard.type(await otvetNaTekushiy(e));
  await e.keyboard.press('Enter');
  await e.waitForFunction(
    (b) => document.querySelector('.us-igra__vopros')?.getAttribute('data-expr') !== b,
    b0,
  );
  check(
    (await e.locator('[role="status"]').textContent())?.trim() === 'Верно',
    'ЕГЭ: меньший корень принят',
  );
  await e.close();

  /* Переключатель «Как в ЕГЭ» в настройках — только у уравнений. */
  const n = await open(ctx, '/ustnyy-schet/trenirovka/?p=vieta-perebroska', '.us-nastroyki');
  check(
    (await n.getByRole('switch', { name: /Как в ЕГЭ/ }).count()) === 1,
    'настройки: переключатель «Как в ЕГЭ»',
  );
  await n.locator('label.us-vykl', { hasText: 'Как в ЕГЭ' }).click();
  check(
    (await n.getByRole('button', { name: 'Больший корень' }).count()) === 1,
    'настройки: меньший или больший корень',
  );
  await n.close();
  const n2 = await open(ctx, '/ustnyy-schet/trenirovka/?p=na-11', '.us-nastroyki');
  check(
    (await n2.getByRole('switch', { name: /Как в ЕГЭ/ }).count()) === 0,
    'у других приёмов переключателя нет',
  );
  await n2.close();
  await ctx.close();

  /* Конструктор корней: стрелки и парабола через точки. */
  for (const vp of [
    { width: 375, height: 812 },
    { width: 1440, height: 900 },
  ]) {
    const c = await context({ viewport: vp });
    const k = await open(c, '/ustnyy-schet/vieta-privedennoe/', '.us-kk');
    const t1 = k.getByRole('slider', { name: 'Корень x₁' });
    await t1.focus();
    for (let i = 0; i < 5; i += 1) await k.keyboard.press('ArrowLeft');
    const t2 = k.getByRole('slider', { name: 'Корень x₂' });
    await t2.focus();
    await k.keyboard.press('ArrowRight');
    const x1 = Number(await t1.getAttribute('aria-valuenow'));
    const x2 = Number(await t2.getAttribute('aria-valuenow'));
    check(x1 === -3 && x2 === 6, `${vp.width}: стрелки двигают корни: ${x1}, ${x2}`);
    /* Дождаться конца плавного перехода параболы. */
    await k.waitForFunction(
      ([a, b]) => {
        const el = document.querySelector('.us-kk__parabola');
        return (
          el !== null &&
          Number(el.getAttribute('data-a')) === a &&
          Number(el.getAttribute('data-b')) === b
        );
      },
      [x1, x2],
    );
    const proxodit = await k.evaluate(() => {
      const path = document.querySelector('.us-kk__parabola');
      const pts = path
        .getAttribute('d')
        .slice(1)
        .split('L')
        .map((s) => s.split(',').map(Number));
      return [...document.querySelectorAll('.us-kk__koren')].map((c) => {
        const cx = Number(c.getAttribute('cx'));
        const cy = Number(c.getAttribute('cy'));
        let best = pts[0];
        for (const q of pts) if (Math.abs(q[0] - cx) < Math.abs(best[0] - cx)) best = q;
        return Math.abs(best[0] - cx) < 2.5 && Math.abs(best[1] - cy) < 3;
      });
    });
    check(
      proxodit.length === 2 && proxodit.every(Boolean),
      `${vp.width}: парабола проходит через x₁ и x₂`,
    );
    const uravn = (await k.locator('.us-kk__formula--itog').textContent()) ?? '';
    check(
      /x2−3x−18=0/.test(uravn.replace(/\s/g, '').replace(/-/g, '−')),
      `${vp.width}: уравнение «${uravn}»`,
    );
    const znak = (await k.locator('.us-kk__znak').textContent()) ?? '';
    check(/разных знаков/.test(znak), `${vp.width}: подпись знаков «${znak}»`);
    check(k.errors.length === 0, `${vp.width}: конструктор без ошибок ${k.errors.join('; ')}`);
    await c.close();
  }
}

await browser.close();
await bezWebgl.close();
server.close();

if (failures.length > 0) {
  console.error(`\nУстный счёт в браузере: ${failures.length} из ${checks} проверок не прошли:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\nУстный счёт в браузере: ${checks} проверок, всё в порядке.`);
