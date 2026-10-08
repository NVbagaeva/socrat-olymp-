#!/usr/bin/env node
/* scripts/check-trenazher11-webkit.mjs — тренажёр №11 на iPhone (WebKit).

   Запуск: pnpm build && pnpm test:trenazher11
   Снимки экрана: в папку из переменной SHOTS (по умолчанию —
   временная папка), по одному на шаг.

   Собранный сайт открывается в WebKit — движке Safari — как на iPhone
   13: окно 390×844, isMobile, касания. Сценарий:
     1. выбор: источник «банк ФИПИ», в аккордеоне — первый тип раздела
        «Движение по прямой» и первый тип «Работы», 3 задачи;
     2. липкая кнопка «Начать тренировку» внизу экрана видна и не
        перекрыта нижней навигацией; нажимаем её;
     3. экран прокручен к задаче: экран решения встал под ленту
        вкладок, условие видно, шапка раздела ушла за верх;
     4. неверный ответ — «Пока неверно», карточка «Не получается?»
        выделена (is-urgent);
     5. верный ответ — «Верно!»;
     6. «Следующая задача →» — снова прокрутка к условию;
   и на каждом шаге — нет горизонтальной прокрутки.

   Ответы в браузер уходят только отпечатками, поэтому верный ответ
   берётся тем же путём, что у ученика: в отдельном проходе вводится
   неверный ответ и открывается «Показать решение», из разбора
   читается «Ответ: …». Чтобы оба прохода получили одни и те же
   задачи, Math.random и Date.now в странице заменены детерминированными
   (зерно тренировки строится из них). */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { devices, webkit } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
const SHOTS = process.env.SHOTS ?? fs.mkdtempSync(path.join(os.tmpdir(), 'trenazher11-'));
fs.mkdirSync(SHOTS, { recursive: true });

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
const URL = `http://127.0.0.1:${server.address().port}/zadaniya/11/trenazher/`;
const W = 390;
const H = 844;

let browser;
try {
  browser = await webkit.launch();
} catch (error) {
  server.close();
  if (process.env.CI) {
    throw error;
  }
  console.log('WebKit не установлен — проверка пропущена: pnpm exec playwright install webkit');
  process.exit(0);
}

const results = [];
function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
}

/* Детерминированные Math.random и Date.now: одни и те же задачи в обоих проходах. */
function determinism() {
  let s = 0x2f6b1a3d;
  Math.random = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Date.now = () => 1767225600000;
}

async function newPage() {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: W, height: H },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(determinism);
  const page = await context.newPage();
  return { context, page };
}

/** Видимый текст элемента без MathML-копий формул KaTeX. */
async function tekst(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)?.cloneNode(true);
    if (!el) return '';
    el.querySelectorAll('.katex-mathml').forEach((n) => n.remove());
    return el.textContent.replace(/\s+/g, ' ').trim();
  }, selector);
}

async function bezGorizontali(page) {
  return page.evaluate(() => ({
    sw: document.scrollingElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
}

/** Где экран решения и условие относительно ленты вкладок и окна. */
async function polozhenie(page) {
  return page.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
    const tabs = r('.topic-tabs-row');
    const resh = r('.z11-resh');
    const usl = r('.z11-resh__uslovie');
    const head = r('.z11-head') ?? r('.section-head');
    return {
      tabsBottom: tabs?.bottom ?? 0,
      reshTop: resh?.top ?? null,
      uslTop: usl?.top ?? null,
      uslBottom: usl?.bottom ?? null,
      headBottom: head?.bottom ?? null,
      sy: window.scrollY,
      vh: window.innerHeight,
    };
  });
}

/** Ждём, пока прокрутка остановится (плавная прокрутка к следующей задаче). */
async function zhdatProkrutku(page) {
  let prev = -1;
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(100);
    const sy = await page.evaluate(() => window.scrollY);
    if (sy === prev) return;
    prev = sy;
  }
}

function proverkaProkrutki(z, where) {
  if (z.reshTop === null || z.uslTop === null) {
    return `${where}: нет экрана решения или условия`;
  }
  const problems = [];
  if (z.reshTop < z.tabsBottom - 2 || z.reshTop > z.tabsBottom + 40) {
    problems.push(
      `верх экрана решения ${Math.round(z.reshTop)}, лента вкладок кончается на ${Math.round(z.tabsBottom)}`,
    );
  }
  if (z.uslTop < z.tabsBottom - 2 || z.uslTop > z.vh * 0.6) {
    problems.push(`условие начинается на ${Math.round(z.uslTop)} из ${z.vh}`);
  }
  if (z.headBottom !== null && z.headBottom > z.tabsBottom + 1) {
    problems.push(`шапка раздела видна (низ на ${Math.round(z.headBottom)})`);
  }
  return problems.length === 0 ? null : `${where}: ${problems.join('; ')}`;
}

async function vybrat(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  /* Ждём, пока React оживит страницу: кнопка источника становится нажимаемой. */
  const bank = page.getByRole('radio', { name: /банка ФИПИ/ });
  for (let i = 0; i < 20; i += 1) {
    await bank.click();
    if ((await bank.getAttribute('aria-checked')) === 'true') break;
    await page.waitForTimeout(250);
  }
  for (const razdel of ['Движение по прямой', 'Работа']) {
    const li = page.locator('.z11-akk__razdel', {
      has: page.locator('.z11-akk__name', { hasText: new RegExp(`^${razdel}$`) }),
    });
    await li.locator('.z11-akk__toggle').click();
    await li.locator('.z11-akk__podtip input[type=checkbox]').first().check();
  }
  const output = page.locator('.z11-stepper output').first();
  for (let i = 0; i < 60 && Number(await output.textContent()) > 3; i += 1) {
    await page.locator('.z11-stepper button[aria-label="Меньше задач"]').first().click();
  }
  return Number(await output.textContent());
}

async function nachat(page) {
  await page.locator('.z11-tr__start-mob button').click();
  await page.waitForSelector('.z11-resh__uslovie', { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function otvetit(page, value) {
  const input = page.locator('.z11-resh__input input, input.z11-resh__input').first();
  await input.fill(value);
  await page.locator('.z11-resh__bar-bottom button', { hasText: 'Проверить' }).click();
  await page.waitForSelector('.pverdict');
}

/* ── Проход 1: верные ответы из «Показать решение» ───────────────── */

const otvety = [];
const usloviya = [];
{
  const { context, page } = await newPage();
  await vybrat(page);
  await nachat(page);
  for (let i = 0; i < 2; i += 1) {
    usloviya.push(await tekst(page, '.z11-resh__uslovie .z11-resh__text'));
    await otvetit(page, '-987654');
    await page.getByRole('button', { name: 'Показать решение' }).click();
    await page.waitForSelector('.z11-resh__razbor');
    const razbor = await tekst(page, '.z11-resh__razbor');
    const m = [...razbor.matchAll(/Ответ:\s*([−-]?\d+(?:[.,]\d+)?)/g)].at(-1);
    otvety.push(m ? m[1].replace('−', '-') : null);
    await page.locator('.z11-resh__bar-bottom button').click();
    await zhdatProkrutku(page);
  }
  await context.close();
}
if (otvety.some((x) => x === null)) {
  step('Верные ответы из разбора', false, `не найден «Ответ: …» в разборе: ${otvety.join(', ')}`);
}

/* ── Проход 2: сценарий ученика ─────────────────────────────────── */

const { context, page } = await newPage();
const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const noScroll = async (where) => {
  const g = await bezGorizontali(page);
  step(`${where}: без горизонтальной прокрутки`, g.sw <= W, `scrollWidth ${g.sw}, окно ${W}`);
};

try {
  const count = await vybrat(page);
  await shot('1-vybor');
  step('Выбор: 2 типа, источник — банк, задач 3', count === 3, `задач ${count}`);
  await noScroll('Выбор');

  const bar = await page.evaluate(() => {
    const b = document.querySelector('.z11-tr__start-mob')?.getBoundingClientRect();
    const nav = document.querySelector('.bnav')?.getBoundingClientRect();
    return b ? { top: b.top, bottom: b.bottom, navTop: nav?.top ?? null } : null;
  });
  step(
    'Липкая кнопка «Начать тренировку» видна внизу экрана',
    bar !== null &&
      bar.top >= 0 &&
      bar.bottom <= H + 1 &&
      (bar.navTop === null || bar.bottom <= bar.navTop + 1),
    bar === null
      ? 'нет .z11-tr__start-mob'
      : `кнопка ${Math.round(bar.top)}–${Math.round(bar.bottom)}, нижняя навигация с ${bar.navTop === null ? '—' : Math.round(bar.navTop)}`,
  );
  await shot('2-knopka-start');

  await nachat(page);
  await zhdatProkrutku(page);
  await shot('3-zadacha-1');
  const u1 = await tekst(page, '.z11-resh__uslovie .z11-resh__text');
  step(
    'Те же задачи, что в проходе с разбором',
    u1 === usloviya[0],
    u1 === usloviya[0] ? '' : `«${u1.slice(0, 60)}» ≠ «${usloviya[0]?.slice(0, 60)}»`,
  );
  const z1 = await polozhenie(page);
  const e1 = proverkaProkrutki(z1, 'после «Начать тренировку»');
  step(
    'Прокрутка к условию задачи 1 (не к шапке раздела)',
    e1 === null,
    e1 ??
      `экран решения с ${Math.round(z1.reshTop)}, условие с ${Math.round(z1.uslTop)}, лента до ${Math.round(z1.tabsBottom)}`,
  );
  await noScroll('Задача 1');

  await otvetit(page, '-987654');
  const urgent = await page.evaluate(() => {
    const c = document.querySelector('.z11-pomosh');
    return c
      ? {
          urgent: c.classList.contains('is-urgent'),
          lead: c.querySelector('.z11-pomosh__lead')?.textContent ?? '',
          border: getComputedStyle(c).borderColor,
        }
      : null;
  });
  const verdict1 = await tekst(page, '.pverdict__title');
  await page.locator('.z11-pomosh').scrollIntoViewIfNeeded();
  await shot('4-neverno');
  step('Неверный ответ: «Пока неверно»', verdict1 === 'Пока неверно', verdict1);
  step(
    'Карточка «Не получается?» выделена',
    urgent !== null && urgent.urgent && /не сошёлся/.test(urgent.lead),
    urgent === null
      ? 'нет .z11-pomosh'
      : `is-urgent ${urgent.urgent}, «${urgent.lead}», рамка ${urgent.border}`,
  );
  await noScroll('Неверный ответ');

  if (otvety[0]) {
    await otvetit(page, otvety[0]);
    const verdict2 = await tekst(page, '.pverdict__title');
    await shot('5-verno');
    step(`Верный ответ ${otvety[0]}: «Верно!»`, verdict2 === 'Верно!', verdict2);
    await noScroll('Верный ответ');
  }

  await page.locator('.z11-resh__bar-bottom button').click();
  await zhdatProkrutku(page);
  await shot('6-zadacha-2');
  const z2 = await polozhenie(page);
  const e2 = proverkaProkrutki(z2, 'после «Следующая задача»');
  const n2 = await tekst(page, '.z11-resh__count');
  step(
    'Следующая задача: прокрутка к условию задачи 2',
    e2 === null && /2 из/.test(n2),
    e2 ?? `${n2}; экран решения с ${Math.round(z2.reshTop)}, условие с ${Math.round(z2.uslTop)}`,
  );
  await noScroll('Задача 2');
} catch (error) {
  await shot('oshibka').catch(() => {});
  step('Сценарий', false, error.message.split('\n')[0]);
}

await context.close();
await browser.close();
server.close();

const bad = results.filter((r) => !r.ok);
console.log(`\nТренажёр №11 в WebKit 390×844: шагов ${results.length}, ошибок ${bad.length}.`);
console.log(`Снимки: ${SHOTS}`);
if (bad.length > 0) {
  process.exitCode = 1;
}
