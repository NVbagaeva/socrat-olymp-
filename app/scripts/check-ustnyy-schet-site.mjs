#!/usr/bin/env node
/* scripts/check-ustnyy-schet-site.mjs — раздел «Устный счёт» в браузере,
   по статической сборке (out/).

   Запуск: pnpm build && pnpm test:ustnyy-schet-site [--snimki]

   1. Серия проходится с одной клавиатуры: Tab до «Начать», Enter;
      ответы набираются и отправляются Enter; ошибка объявляется
      aria-live («Неверно, ответ …»), через 1,5 с — следующий пример;
      итоги: 9 верно из 10, фокус на заголовке итогов.
   2. На время, с подменённым временем (page.clock): за 30 с таймер
      уходит на 30 с ± 100 мс, тренировка кончается не раньше чем за
      100 мс до минуты и не позже чем через 100 мс после.
   3. Свободный режим: после ошибки — разбор и «Понятно».
   4. Без WebGL (Chromium с --disable-webgl): таймер — SVG, ошибок нет.
   5. Телефон (палец): своя клавиатура, «OK» отвечает, системная
      клавиатура не открывается (inputmode=none).
   6. prefers-reduced-motion: встряски и вспышки выключены.
   7. 320 px: прокрутки вбок нет на витрине, странице приёма, таблице,
      настройках, экране тренировки и итогах.
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
console.log('2. Таймер: ±100 мс за минуту');
{
  const ctx = await context();
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
  await p.clock.pauseAt(Date.now() + 2000);
  const ostalos = () =>
    p.evaluate(() => {
      const ring = document.querySelector('.us-taymer__ring');
      const [a] = (ring?.getAttribute('stroke-dasharray') ?? '0 1').split(' ').map(Number);
      return (a / (2 * Math.PI * 52)) * 60_000;
    });
  const o0 = await ostalos();
  await p.clock.runFor(30_000);
  const o1 = await ostalos();
  check(Math.abs(o0 - o1 - 30_000) <= 100, `за 30 с таймер ушёл на ${Math.round(o0 - o1)} мс`);
  await p.clock.runFor(Math.max(0, Math.floor(o1) - 100));
  check((await p.locator('.us-itogi').count()) === 0, 'за 100 мс до конца тренировка ещё идёт');
  await p.clock.runFor(300);
  await p.locator('.us-itogi').waitFor({ timeout: 5000 });
  check(true, 'через 100–300 мс после конца — итоги');
  const stat = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('budetege:ustnyy-schet:v1') ?? 'null'),
  );
  check(
    Math.abs((stat?.sessii?.[0]?.ms ?? 0) - 60_000) <= 100,
    `записанное время ${stat?.sessii?.[0]?.ms} мс`,
  );
  check(p.errors.length === 0, `ошибок на странице нет ${p.errors.join('; ')}`);
  await ctx.close();
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

await browser.close();
await bezWebgl.close();
server.close();

if (failures.length > 0) {
  console.error(`\nУстный счёт в браузере: ${failures.length} из ${checks} проверок не прошли:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\nУстный счёт в браузере: ${checks} проверок, всё в порядке.`);
