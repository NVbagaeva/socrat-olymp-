#!/usr/bin/env node
/* scripts/check-otchet-uchitelyu.mjs — «Отправить результат учителю»
   в браузере, по статической сборке (out/).

   Запуск: pnpm build && pnpm test:otchet-uchitelyu [--snimki]
   (OTCHET_BASE=http://localhost:3000 — проверить на запущенном pnpm dev).

   1. Тренировка, где все задачи пропущены: кнопки на итогах нет.
   2. ПК: короткая тренировка №1 (5 задач открытого банка, «Без
      подсказок»): одна верно, одна неверно (ответ «1»), «Завершить».
      На итогах кнопка есть; без имени — сообщение, попытка не идёт;
      с именем — ссылка в буфере обмена и «Ссылка скопирована…»;
      текст сообщения «Результат тренировки: Иванов Пётр, №1
      Планиметрия, 1 из N».
   3. Имя запомнилось: на следующих итогах поле уже заполнено.
   4. Ссылка → страница учителя (телефон 390 и ПК): те же цифры — имя,
      процент, «верно 1 из N», N строк задач, неверная — с ответом «1»,
      номера ФИПИ, тема со светофором 🔴, «Открыть эти задачи» ведёт в
      тренажёр №1 с типом p01; прокрутки вбок нет.
   5. Испорченная ссылка (один символ) — «Ссылка повреждена».
   6. Телефон: navigator.share получает текст и ту же ссылку.
   --snimki — снимки для PR в docs/otchet-uchitelyu/snimki/. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
const SNIMKI = process.argv.includes('--snimki')
  ? path.join(APP, '..', 'docs', 'otchet-uchitelyu', 'snimki')
  : null;
if (SNIMKI !== null) fs.mkdirSync(SNIMKI, { recursive: true });

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  console.log(`  ${ok ? 'ok' : 'НЕТ'}  ${what}`);
  return ok;
}

/* ── Ответы задач типа p01 из открытого банка: считает Node ─────── */

const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye');
const { prototip } = requireSrc('lib/planimetriya/stseny');
const P01 = prototip(1);
const BANK_P01 = dannyeTrenazhera1()
  .bank.filter((b) => b.id === 'p01' && !b.analog)
  .map((b) => {
    const params = { ...P01.primer, ...b.params };
    const nums = [...P01.uslovie(params).matchAll(/\d+/g)].map((m) => m[0]);
    return { no: b.no, nums, otvet: P01.otvet(params) };
  });

/** Задача на экране → номер ФИПИ и ответ (числа условия однозначны в типе p01). */
function zadachaPoTekstu(text) {
  const nums = new Set(text.match(/\d+/g) ?? []);
  return BANK_P01.find((b) => b.nums.every((n) => nums.has(n))) ?? null;
}

/* ── Сервер ──────────────────────────────────────────────────── */

let server = null;
let BASE = process.env.OTCHET_BASE ?? '';
if (BASE === '') {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет сборки: сначала pnpm build (или OTCHET_BASE=адрес pnpm dev).');
    process.exit(1);
  }
  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.json': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
  };
  server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(OUT, url);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!file.startsWith(OUT) || !fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  BASE = `http://127.0.0.1:${server.address().port}`;
}

const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const DESKTOP = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };
const IMYA = 'Иванов Пётр';
/* Задачи типа p01 из открытого банка (их там 4 — возьмутся все), одна попытка. */
const TRENAZHER = '/zadaniya/1/trenazher/?t=p01&ist=fipi&n=5&rezh=bez';

async function snimok(p, name, selector = null) {
  if (SNIMKI === null) return;
  await p.waitForTimeout(400);
  const file = path.join(SNIMKI, `${name}.png`);
  if (selector === null) await p.screenshot({ path: file, fullPage: true });
  else await p.locator(selector).first().screenshot({ path: file });
}

/** Экран итогов: от заголовка до блока отправки (с сообщением, если оно есть) — без длинного списка задач. */
async function snimokItogov(p, name) {
  if (SNIMKI === null) return;
  await p.waitForTimeout(400);
  const clip = await p.evaluate(() => {
    const box = (sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
    };
    const top = box('.tdone__head').top - 16;
    const bottom = box('.otp').bottom + 16;
    return { x: 0, y: top, width: document.documentElement.clientWidth, height: bottom - top };
  });
  await p.screenshot({ path: path.join(SNIMKI, `${name}.png`), fullPage: true, clip });
}

async function bezProkrutkiVbok(p) {
  return p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

async function nachat(p) {
  p.setDefaultTimeout(30_000);
  await p.goto(BASE + TRENAZHER, { waitUntil: 'load' });
  await p.locator('.flt').first().waitFor({ state: 'visible' });
  /* На телефоне панель «Начать» поначалу под плитками (аудит, В4). */
  await p.mouse.wheel(0, 3000);
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Начать тренировку' }).last().click();
  await p.locator('.ptask__question').waitFor({ state: 'visible' });
}

async function zavershit(p) {
  await p
    .getByRole('button', { name: /^Завершить/ })
    .first()
    .click();
  await p.locator('[role=dialog] button', { hasText: 'Завершить' }).last().click();
  await p.locator('.tsum').waitFor({ state: 'visible' });
}

/** Решить первую задачу верно, вторую — неверно («1»), завершить. Возвращает номера ФИПИ. */
async function korotkayaTrenirovka(p) {
  const nomera = [];
  for (const verno of [true, false]) {
    const text = await p.locator('.ptask__question').innerText();
    const z = zadachaPoTekstu(text);
    check(z !== null, `задача на экране найдена в банке p01 (${verno ? 'верно' : 'неверно'})`);
    nomera.push(z?.no ?? 0);
    const otvet = verno ? String(z?.otvet ?? 0).replace('.', ',') : '1';
    await p.locator('.trz-answer input').fill(otvet);
    await p.getByRole('button', { name: 'Проверить' }).click();
    await p.locator('.trz-verdict').waitFor({ state: 'visible' });
    await p.getByRole('button', { name: /Дальше/ }).click();
    await p.waitForTimeout(300);
  }
  await zavershit(p);
  return nomera;
}

const KNOPKA = 'Отправить результат учителю';
/* Сколько задач в тренировке: все задачи p01 открытого банка, но не больше 5. */
const N = Math.min(5, BANK_P01.length);
const PROCENT = Math.round(100 / N);

/* ── 1. Всё пропущено — кнопки нет ─────────────────────────────── */
console.log('1. Все задачи пропущены');
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const p = await ctx.newPage();
  await nachat(p);
  await zavershit(p);
  check((await p.locator('.otp').count()) === 0, 'на итогах без решённых задач кнопки нет');
  await ctx.close();
}

/* ── 2–5. ПК: тренировка, ссылка, страница учителя ──────────────── */
console.log('2. ПК: итоги и ссылка');
let ssylka = '';
let nomera = [];
{
  const ctx = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: SNIMKI === null ? 1 : 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  /* На ПК в Chromium без системного меню: navigator.share нет — путь «скопировать». */
  await ctx.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    } catch {
      /* Нет такого свойства — и так нет. */
    }
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await nachat(p);
  nomera = await korotkayaTrenirovka(p);
  const blok = p.locator('.otp');
  check(await blok.isVisible(), 'на итогах есть блок «Отправить результат учителю»');
  await blok.scrollIntoViewIfNeeded();
  await p.getByRole('button', { name: KNOPKA }).click();
  check(
    (await blok.locator('.otp__hint--error').count()) === 1,
    'без имени — просьба написать имя и фамилию',
  );
  check((await blok.locator('[role=status]').count()) === 0, 'без имени ничего не отправлено');
  await blok.locator('input').fill(`  ${IMYA} `);
  await p.getByRole('button', { name: KNOPKA }).click();
  await blok.locator('[role=status]').waitFor({ state: 'visible' });
  check(
    (await blok.locator('[role=status]').innerText()).includes(
      'Ссылка скопирована, отправьте её учителю',
    ),
    '«Ссылка скопирована, отправьте её учителю»',
  );
  const buf = await p.evaluate(() => navigator.clipboard.readText());
  const [stroka = '', url = ''] = buf.split('\n');
  check(
    stroka === `Результат тренировки: ${IMYA}, №1 Планиметрия, 1 из ${N}`,
    `текст сообщения: «${stroka}»`,
  );
  check(/\/rezultat\/#1\.[0-9a-z]+\.[A-Za-z0-9+$-]+$/.test(url), 'ссылка /rezultat/#… в буфере');
  check(url.length < 1500, `ссылка короткая: ${url.length} знаков`);
  check(
    await p.evaluate(() => localStorage.getItem('budetege:otchet:imya')),
    'имя запомнено в localStorage ученика',
  );
  ssylka = url.replace(/^https?:\/\/[^/]+/, '');
  await snimokItogov(p, 'itogi-pk');

  console.log('3. Имя запомнилось');
  await p.getByRole('button', { name: 'Новая тренировка' }).click();
  await nachat(p);
  await p.locator('.trz-answer input').fill('1');
  await p.getByRole('button', { name: 'Проверить' }).click();
  await zavershit(p);
  check((await p.locator('.otp input').inputValue()) === IMYA, 'на новых итогах имя уже в поле');
  check(errors.length === 0, `ошибок на странице нет${errors.length ? `: ${errors[0]}` : ''}`);
  await ctx.close();
}

console.log('4. Страница учителя');
for (const [name, viewport] of [
  ['pk', DESKTOP],
  ['telefon', PHONE],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: SNIMKI === null ? 1 : 2 });
  const p = await ctx.newPage();
  await p.goto(BASE + ssylka, { waitUntil: 'load' });
  await p.locator('.rez').waitFor({ state: 'visible' });
  check((await p.locator('#rez-name').innerText()) === IMYA, `${name}: имя ученика`);
  const score = await p.locator('[data-testid=rez-score]').innerText();
  check(
    new RegExp(`${PROCENT}\\s*%`).test(score) && score.includes(`верно 1 из ${N}`),
    `${name}: «${PROCENT} %, верно 1 из ${N}» (${score.replace(/\s+/g, ' ')})`,
  );
  const kicker = await p.locator('.rez__kicker').innerText();
  check(kicker.includes('№1') && kicker.includes('Планиметрия'), `${name}: раздел №1 Планиметрия`);
  const rows = p.locator('.rez-table tbody tr');
  check((await rows.count()) === N, `${name}: в таблице ${N} задач`);
  check(
    (await p.locator('.rez-table tr[data-itog=right]').count()) === 1 &&
      (await p.locator('.rez-table tr[data-itog=wrong]').count()) === 1 &&
      (await p.locator('.rez-table tr[data-itog=skipped]').count()) === N - 2,
    `${name}: 1 верно, 1 неверно, ${N - 2} пропущены`,
  );
  const wrong = await p.locator('.rez-table tr[data-itog=wrong]').innerText();
  check(/\b1\s*$/.test(wrong.trim()), `${name}: у неверной задачи ответ ученика «1»`);
  const tekst = await p.locator('.rez-table').innerText();
  check(
    nomera.every((n) => tekst.includes(`ФИПИ № ${n}`)),
    `${name}: номера ФИПИ ${nomera.join(', ')} в таблице`,
  );
  const tema = p.locator('.rez-tema');
  check(
    (await tema.count()) === 1 &&
      (await tema.getAttribute('data-svet')) === 'red' &&
      (await tema.innerText()).includes(`1 из ${N}`),
    `${name}: тема «Углы в треугольнике» — 🔴 1 из ${N}`,
  );
  const href = await p.getByRole('link', { name: 'Открыть эти задачи' }).getAttribute('href');
  check(href === '/zadaniya/1/trenazher/?t=p01', `${name}: «Открыть эти задачи» → ${href}`);
  check(
    (await p.getByRole('button', { name: 'Распечатать' }).count()) === 1,
    `${name}: «Распечатать»`,
  );
  check(
    (await p.locator('.rez__note').innerText()).includes('не проверен сервером'),
    `${name}: пометка «не проверен сервером»`,
  );
  check(await bezProkrutkiVbok(p), `${name}: страница не прокручивается вбок`);
  await snimok(p, `uchitel-${name}`);
  await ctx.close();
}

console.log('5. Испорченная ссылка');
{
  const ctx = await browser.newContext({ viewport: PHONE });
  const p = await ctx.newPage();
  const i = ssylka.length - 20;
  const isporchena = ssylka.slice(0, i) + (ssylka[i] === 'A' ? 'B' : 'A') + ssylka.slice(i + 1);
  await p.goto(BASE + isporchena, { waitUntil: 'load' });
  await p.getByRole('heading', { name: 'Ссылка повреждена' }).waitFor({ state: 'visible' });
  check(true, 'один символ изменён — «Ссылка повреждена»');
  check((await p.locator('.rez').count()) === 0, 'чужих цифр на странице нет');
  const p2 = await ctx.newPage();
  await p2.goto(BASE + ssylka.slice(0, ssylka.length - 30), { waitUntil: 'load' });
  check(
    await p2
      .getByRole('heading', { name: 'Ссылка повреждена' })
      .waitFor({ state: 'visible' })
      .then(
        () => true,
        () => false,
      ),
    'обрезанная ссылка — «Ссылка повреждена»',
  );
  await snimok(p, 'uchitel-povrezhdena');
  await ctx.close();
}

console.log('6. Телефон: меню «Поделиться»');
{
  const ctx = await browser.newContext({
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: SNIMKI === null ? 1 : 3,
  });
  await ctx.addInitScript(() => {
    window.__share = null;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data) => {
        window.__share = data;
        return Promise.resolve();
      },
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
  });
  const p = await ctx.newPage();
  await nachat(p);
  await korotkayaTrenirovka(p);
  const blok = p.locator('.otp');
  await blok.scrollIntoViewIfNeeded();
  await snimok(p, 'itogi-telefon-knopka', '.otp');
  await blok.locator('input').fill(IMYA);
  await p.getByRole('button', { name: KNOPKA }).click();
  await blok.locator('[role=status]').waitFor({ state: 'visible' });
  const share = await p.evaluate(() => window.__share);
  check(share !== null, 'navigator.share вызван');
  check(
    share?.text === `Результат тренировки: ${IMYA}, №1 Планиметрия, 1 из ${N}`,
    `в «Поделиться» — текст сообщения`,
  );
  check(/\/rezultat\/#1\./.test(share?.url ?? ''), 'в «Поделиться» — ссылка на результат');
  check(await bezProkrutkiVbok(p), 'итоги на телефоне не прокручиваются вбок');
  await snimokItogov(p, 'itogi-telefon');
  await ctx.close();
}

await browser.close();
server?.close();
console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}`);
if (failures.length > 0) {
  for (const f of failures) console.log(`  — ${f}`);
  process.exit(1);
}
