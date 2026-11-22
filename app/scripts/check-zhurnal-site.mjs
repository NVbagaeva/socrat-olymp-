#!/usr/bin/env node
/* scripts/check-zhurnal-site.mjs — журнал решения задач в браузере.

   Запуск после сборки с входом, подставным сервером и флагами журнала:
     NEXT_PUBLIC_AUTH_ENABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
     NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key \
     NEXT_PUBLIC_KAB2_ZHURNAL=1 NEXT_PUBLIC_KAB2_RAZDELY=5,8 LEGAL_DRAFT=1 pnpm build
     pnpm test:zhurnal-site [--shots папка]

   Сервер подставной: запросы к 127.0.0.1:54321 перехватываются, пачки
   journal_push складываются и сверяются. Саму функцию базы проверяет
   pnpm test:kabinet-sql (supabase/tests/zhurnal.test.sql).

     • ученик, тренажёр №8: неверный ответ как введён, подсказка, верный
       ответ — три события по порядку, задача закрыта, условие в снимке,
       ссылка воспроизводит задачу;
     • «Дальше» без ответа — пропуск; «Решение» — открытое решение;
     • активное время: пять минут без действий — в активное идёт не больше
       двух минут, общее — все пять; скрытая вкладка не считается;
     • сети нет — пачка ждёт в очереди и уходит позже, без потерь;
     • перезагрузка страницы — запись той же задачи продолжается;
     • опорные задачи №8 и №5, тренажёр №5 — пишут журнал;
     • раздел не из списка флага (№1), гость и репетитор — журнал не пишется;
     • 375 px: горизонтальной прокрутки нет; ошибок в консоли нет. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';

const OUT = path.join(APP, 'out');
const SHOTS = process.argv.includes('--shots')
  ? (process.argv[process.argv.indexOf('--shots') + 1] ?? 'snimki-zhurnal')
  : null;
const API = 'http://127.0.0.1:54321';

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет out/index.html — сначала pnpm build (с флагами журнала, см. начало файла).');
  process.exit(1);
}

const { generate } = requireSrc('lib/vychisleniya/generate.ts');
const { parseTaskId } = requireSrc('lib/vychisleniya/ids.ts');
const { ru } = requireSrc('lib/vychisleniya/numbers.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

/* ── Статический сервер над out/ ───────────────────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const SITE = `http://127.0.0.1:${server.address().port}`;

/* ── Браузер и подставной сервер ───────────────────────────────── */

const browser = bezBanneraCookie(
  await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  }),
);
if (SHOTS !== null) fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

/**
 * Страница вошедшего (или гостя — role === null). `mock.pushes` — пачки
 * журнала по порядку; `mock.offline = true` — сеть «лежит».
 */
async function newPage({ role = 'student', width = 1280, height = 900 } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    ...(width < 500 ? { hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await welcomeSeen(context);
  const mock = { pushes: [], offline: false, other: 0, summary: null, summaryCalls: [], lenta: [] };
  if (role !== null) {
    const session = {
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
      token_type: 'bearer',
      expires_in: 360000,
      expires_at: Math.floor(Date.now() / 1000) + 360000,
      user: {
        id: role === 'student' ? 'c1000000-0000-4000-8000-000000000001' : 'b1000000-0000-4000-8000-000000000001',
        email: `${role}@x.ru`,
        user_metadata: { role, name: role === 'student' ? 'Ученик' : 'Репетитор' },
      },
    };
    await context.addInitScript((value) => {
      try {
        if (localStorage.getItem('budetege-auth') === null) {
          localStorage.setItem('budetege-auth', value);
        }
      } catch {
        /* about:blank */
      }
    }, JSON.stringify(session));
  }
  await context.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const url = new URL(req.url());
    if (url.pathname === '/rest/v1/rpc/journal_push') {
      if (mock.offline) {
        await route.abort('internetdisconnected');
        return;
      }
      const body = req.postDataJSON().p;
      mock.pushes.push(body);
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: JSON.stringify({ runs: body.runs.length, events: 0, works: body.works.length }),
      });
      return;
    }
    if (url.pathname === '/rest/v1/rpc/my_summary' && mock.summary !== null) {
      mock.summaryCalls.push(req.postDataJSON());
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: JSON.stringify(mock.summary),
      });
      return;
    }
    if (url.pathname === '/rest/v1/task_runs' && mock.summary !== null) {
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: JSON.stringify(mock.lenta),
      });
      return;
    }
    mock.other += 1;
    /* Остальное (профиль, перенос прогресса) журналу не нужно: пусто. */
    await route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json', 'content-range': '*/0' },
      body: url.pathname.startsWith('/rest/v1/rpc/') ? 'null' : '[]',
    });
  });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    /* Отказ сети в проверке очереди — ожидаемый. */
    if (/ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(text)) return;
    errors.push(`${page.url()}: ${text}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return { context, page, mock };
}

/** Все события и последнее состояние записи по пачкам. */
function sobrat(mock) {
  const runs = new Map();
  for (const push of mock.pushes) {
    for (const r of push.runs) {
      const prev = runs.get(r.id) ?? { events: [] };
      runs.set(r.id, {
        ...prev,
        ...r,
        snapshot: r.snapshot ?? prev.snapshot ?? null,
        events: [...prev.events, ...r.events],
      });
    }
  }
  return [...runs.values()];
}

/** Ждать, пока в пачках появится запись, подходящая под условие. */
async function waitRun(page, mock, test, what) {
  for (let i = 0; i < 80; i += 1) {
    const found = sobrat(mock).find(test);
    if (found !== undefined) return found;
    await page.waitForTimeout(250);
  }
  check(false, `не дождались записи журнала: ${what}`);
  return null;
}

const noScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function shot(page, name) {
  if (SHOTS === null) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

const CARD = '.trn-zadacha[data-task]';

async function startTraining8(page) {
  await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trn-start');
  await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
  await page.locator('.trn-vybor button:has-text("Выбрать все")').click();
  await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
  await page.locator('.trn-vybor__start').click();
  await page.waitForSelector(CARD);
}
const currentTask = (page) => page.locator(CARD).getAttribute('data-task');
function answerOf(id) {
  const p = parseTaskId(id);
  return generate(p.prototype, p.seed, p.level).otvet;
}
async function answer(page, text) {
  await page.fill('.trn-ekran .otvet-input__field', text);
  await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
}
async function nextTask(page) {
  await page.locator('.trn-knopki button:has-text("Дальше")').first().click();
}

/* ── 1. Тренажёр №8: попытки, подсказка, закрытие ──────────────── */
console.log('\nТренажёр №8, ученик:');
{
  const { context, page, mock } = await newPage();
  await startTraining8(page);
  const id1 = await currentTask(page);
  const right = ru(answerOf(id1));
  const wrong = ` ${ru(answerOf(id1) + 1)} `;
  await answer(page, wrong);
  const hint = page.locator('.trn-ekran button:has-text("Подсказка")');
  const hasHint = (await hint.count()) > 0;
  if (hasHint) await hint.first().click();
  await answer(page, right);
  const run1 = await waitRun(page, mock, (r) => r.ref === id1 && r.closed_at !== null, 'закрытая задача тренажёра №8');
  if (run1 !== null) {
    const types = run1.events.map((e) => e.type).join();
    check(types === (hasHint ? 'attempt,hint_open,attempt' : 'attempt,attempt'), `события по порядку: ${types}`);
    check(run1.events[0].answer === wrong && run1.events[0].ok === false, 'неверный ответ записан как введён');
    check(run1.events.at(-1).answer === right && run1.events.at(-1).ok === true, 'верный ответ записан');
    check(run1.events.map((e) => e.seq).join() === run1.events.map((_, i) => i + 1).join(), 'номера событий подряд');
    check(run1.outcome === 'wrong', `исход после ошибки и верного ответа — «с ошибкой»: ${run1.outcome}`);
    check(run1.source === 'trainer' && run1.task_no === 8 && run1.kind === id1.split('|')[0], 'раздел, тип и источник');
    check(run1.snapshot !== null && run1.snapshot.statement.length > 20, 'условие задачи — в снимке');
    check(run1.position === 1 && typeof run1.session === 'string', 'номер в тренировке и тренировка');
    check(run1.active_ms > 0 && run1.active_ms <= run1.total_ms, `активное время не больше общего: ${run1.active_ms}/${run1.total_ms}`);
  }
  await shot(page, 'trenazher-8-1280');

  /* «Дальше» — вторая задача; без ответа ещё раз «Дальше» — пропуск. */
  await nextTask(page);
  await page.waitForFunction((prev) => document.querySelector('.trn-zadacha[data-task]')?.getAttribute('data-task') !== prev, id1);
  const id2 = await currentTask(page);
  await nextTask(page);
  const run2 = await waitRun(page, mock, (r) => r.ref === id2 && r.closed_at !== null, 'пропущенная задача');
  if (run2 !== null) {
    check(run2.outcome === 'skipped' && run2.events.map((e) => e.type).join() === 'skip', `пропуск: ${run2.outcome}`);
  }

  /* Третья задача: «Решение» до ответа. */
  await page.waitForFunction((prev) => document.querySelector('.trn-zadacha[data-task]')?.getAttribute('data-task') !== prev, id2);
  const id3 = await currentTask(page);
  await page.locator('.trn-knopki button:has-text("Решение")').first().click();
  const run3 = await waitRun(page, mock, (r) => r.ref === id3 && r.closed_at !== null, 'задача с открытым решением');
  if (run3 !== null) {
    check(run3.outcome === 'revealed' && run3.events.some((e) => e.type === 'solution'), `открытое решение: ${run3.outcome}`);
  }
  check(new Set(sobrat(mock).map((r) => r.id)).size === sobrat(mock).length, 'у каждой задачи своя запись');
  await context.close();
}

/* ── 2. Активное время ─────────────────────────────────────────── */
console.log('\nАктивное время:');
{
  const { context, page, mock } = await newPage();
  await page.clock.install({ time: new Date() });
  await startTraining8(page);
  const id = await currentTask(page);
  /* Пять минут без единого действия. */
  await page.clock.fastForward(5 * 60_000);
  await answer(page, ru(answerOf(id)));
  await page.clock.runFor(2000);
  const run = await waitRun(page, mock, (r) => r.ref === id && r.closed_at !== null, 'задача после простоя');
  if (run !== null) {
    check(run.total_ms >= 5 * 60_000, `общее время — все пять минут: ${run.total_ms}`);
    check(run.active_ms <= 2 * 60_000 + 15_000 && run.active_ms > 0, `активное — не больше двух минут: ${run.active_ms}`);
    check(run.outcome === 'right', 'верно с первой попытки');
  }

  /* Скрытая вкладка: десять минут в фоне в активное время не идут. */
  await page.locator('.trn-knopki button:has-text("Дальше")').first().click();
  await page.waitForFunction((prev) => document.querySelector('.trn-zadacha[data-task]')?.getAttribute('data-task') !== prev, id);
  const id2 = await currentTask(page);
  await page.clock.runFor(10_000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(10 * 60_000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(5_000);
  await answer(page, ru(answerOf(id2)));
  await page.clock.runFor(2000);
  const run2 = await waitRun(page, mock, (r) => r.ref === id2 && r.closed_at !== null, 'задача после фоновой вкладки');
  if (run2 !== null) {
    check(run2.total_ms >= 10 * 60_000, `общее — со временем в фоне: ${run2.total_ms}`);
    check(run2.active_ms < 60_000, `скрытая вкладка в активное не идёт: ${run2.active_ms}`);
  }
  await context.close();
}

/* ── 3. Сети нет; перезагрузка страницы ────────────────────────── */
console.log('\nОчередь без сети и перезагрузка:');
{
  const { context, page, mock } = await newPage();
  await page.clock.install({ time: new Date() });
  mock.offline = true;
  await startTraining8(page);
  const id = await currentTask(page);
  await answer(page, ru(answerOf(id) + 1));
  await page.clock.runFor(20_000);
  check(mock.pushes.length === 0, 'без сети ничего не ушло');
  const queued = await page.evaluate(() => JSON.parse(localStorage.getItem('budetege:zhurnal:ochered:v1') ?? 'null'));
  check(queued !== null && queued.zapisi.length === 1 && queued.zapisi[0].events.length === 1, 'запись ждёт в очереди браузера');

  /* Перезагрузка: тренировка восстановлена, запись — та же. */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector(CARD);
  check((await currentTask(page)) === id, 'после перезагрузки — та же задача');
  mock.offline = false;
  await answer(page, ru(answerOf(id)));
  await page.clock.runFor(70_000);
  const run = await waitRun(page, mock, (r) => r.ref === id && r.closed_at !== null, 'задача после перезагрузки');
  if (run !== null) {
    check(run.id === queued?.zapisi[0].id, 'после перезагрузки запись та же, а не новая');
    check(run.events.map((e) => e.type).join() === 'attempt,attempt' && run.events[1].seq === 2, 'события до и после перезагрузки — в одной записи');
    check(run.snapshot !== null, 'снимок условия дошёл с первой удачной пачкой');
  }
  check(sobrat(mock).filter((r) => r.ref === id).length === 1, 'дублей записи нет');
  await context.close();
}

/* ── 4. Опорные задачи и №5 ────────────────────────────────────── */
console.log('\nОпорные задачи №8, раздел №5:');
{
  const { context, page, mock } = await newPage();
  await page.goto(`${SITE}/zadaniya/8/opornye-zadachi/`, { waitUntil: 'networkidle' });
  const blok = await page.locator('a[href*="/zadaniya/8/opornye-zadachi/"]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href')).find((h) => /opornye-zadachi\/[^/]+\/$/.test(h ?? '')),
  );
  await page.goto(`${SITE}${blok}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ptask');
  const pole = page.locator('.ptask .otvet-input__field');
  if ((await pole.count()) > 0) {
    await pole.fill('123456');
    await page.locator('.ptask__actions button:has-text("Проверить")').click();
  }
  await page.locator('.ptask__actions button:has-text("Показать решение")').first().click();
  const run = await waitRun(page, mock, (r) => r.source === 'opornye' && r.task_no === 8 && r.closed_at !== null, 'опорная задача №8');
  if (run !== null) {
    check(run.outcome === 'revealed' && run.events.some((e) => e.type === 'solution'), `опорная №8 — решение открыто: ${run.outcome}`);
    check(/^[^|]+\|[^|]+\|[^|]+$/.test(run.ref), `ссылка «блок|задача|seed»: ${run.ref}`);
  }
  await shot(page, 'opornye-8-1280');

  /* Тренажёр №5: первая задача, неверный ответ, «Дальше». */
  mock.pushes.length = 0;
  await page.goto(`${SITE}/zadaniya/5/trenazher/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trn-start');
  await page.locator('.trn-rezhim').first().click();
  const start = page.locator('.trn-vybor__start');
  if ((await start.count()) > 0) {
    const vse = page.locator('.trn-vybor button:has-text("Выбрать все")');
    if ((await vse.count()) > 0) await vse.first().click();
    await start.click();
  }
  await page.waitForSelector(CARD, { timeout: 20_000 });
  const id5 = await currentTask(page);
  await answer(page, '0,123');
  await nextTask(page);
  const run5 = await waitRun(page, mock, (r) => r.task_no === 5 && r.closed_at !== null, 'задача тренажёра №5');
  if (run5 !== null) {
    check(run5.ref === id5 && run5.source === 'trainer', `№5: ссылка «прототип:номер» — ${run5.ref}`);
    check(run5.events[0]?.type === 'attempt' && run5.events[0].answer === '0,123', '№5: ответ как введён');
    check(run5.snapshot !== null, '№5: условие в снимке');
  }
  await context.close();
}

/* ── 5. Кому журнал не пишется ─────────────────────────────────── */
console.log('\nКому журнал не пишется:');
for (const [role, kto] of [[null, 'гость'], ['tutor', 'репетитор']]) {
  const { context, page, mock } = await newPage({ role });
  await startTraining8(page);
  const id = await currentTask(page);
  await answer(page, ru(answerOf(id)));
  await page.waitForTimeout(1500);
  check(mock.pushes.length === 0, `${kto}: журнал не отправляется`);
  check(
    (await page.evaluate(() => localStorage.getItem('budetege:zhurnal:ochered:v1'))) === null,
    `${kto}: очереди в браузере нет`,
  );
  await context.close();
}
{
  /* Раздел не из списка флага: №1 у ученика журнал не пишет. */
  const { context, page, mock } = await newPage();
  await page.goto(`${SITE}/zadaniya/1/trenazher/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  check(mock.pushes.length === 0, 'раздел вне списка флага: журнал не отправляется');
  await context.close();
}

/* ── 6. Телефон 375 px ─────────────────────────────────────────── */
console.log('\nТелефон 375 px:');
{
  const { context, page, mock } = await newPage({ width: 375, height: 812 });
  await startTraining8(page);
  const id = await currentTask(page);
  await answer(page, ru(answerOf(id)));
  check(await noScroll(page), 'тренажёр №8 на 375 px — без горизонтальной прокрутки');
  await waitRun(page, mock, (r) => r.ref === id && r.closed_at !== null, 'задача с телефона');
  await shot(page, 'trenazher-8-375');
  await context.close();
}

/* ── 7. «Моя статистика» ───────────────────────────────────────── */
console.log('\nМоя статистика:');
{
  const den = (nazad) => new Date(Date.now() + 3 * 3600_000 - nazad * 86_400_000).toISOString().slice(0, 10);
  const summary = {
    from: den(6),
    to: den(0),
    active_ms: 4_500_000,
    solved: 31,
    tasks: [
      { task_no: 5, closed: 12, right: 8, active_ms: 1_500_000 },
      { task_no: 8, closed: 28, right: 23, active_ms: 3_000_000 },
    ],
    days: [
      { day: den(5), closed: 9, active_ms: 500_000 },
      { day: den(3), closed: 14, active_ms: 1_900_000 },
      { day: den(1), closed: 6, active_ms: 300_000 },
      { day: den(0), closed: 11, active_ms: 1_800_000 },
    ],
    works: [
      { id: 'w1', kind: 'sobrat', title: 'Вариант 1', finished_at: new Date(Date.now() - 3 * 86_400_000).toISOString(), primary: 9, max: 12, test: 64, active_ms: 3_600_000 },
      { id: 'w2', kind: 'povyshennye', title: 'Вариант повышенной сложности №7', finished_at: new Date(Date.now() - 86_400_000).toISOString(), primary: 10, max: 12, test: 70, active_ms: 4_000_000 },
    ],
  };
  const lenta = [
    ['trainer', 8, 'right', 42_000],
    ['trainer', 8, 'wrong', 95_000],
    ['opornye', 5, 'hinted', 180_000],
    ['cards', 5, 'right', 8_000],
    ['variant', 8, 'skipped', 0],
    ['homework', 8, 'revealed', 61_000],
  ].map(([source, task_no, outcome, active_ms], i) => ({
    id: `r${i}`,
    source,
    task_no,
    kind: null,
    outcome,
    active_ms,
    started_at: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
  for (const width of [1280, 375]) {
    const { context, page, mock } = await newPage({ width, height: width < 500 ? 812 : 900 });
    mock.summary = summary;
    mock.lenta = lenta;
    await page.goto(`${SITE}/kabinet/statistika/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-section="itogi"]');
    const text = await page.locator('[data-page="moya-statistika"]').innerText();
    if (width === 1280) {
      check(text.includes('1 ч 15 мин') && text.includes('31'), 'итоги: время и решено');
      check(text.includes('78%'), 'общая точность — 31 из 40');
      check((await page.locator('.kab2-zadaniya__row').count()) === 2, 'точность по двум заданиям');
      check((await page.locator('.kab2-dni__den').count()) === 7, 'календарь — семь дней');
      check((await page.locator('.kab2-dni__den:not([data-l="0"])').count()) === 4, 'дней с занятиями — четыре');
      check((await page.locator('.kab2-raboty__row').count()) === 2 && text.includes('64'), 'варианты с тестовым баллом');
      check((await page.locator('.kab2-lenta__row').count()) === 6, 'лента последних задач');
      check(!/подозр|быстро/i.test(text), 'пометок для учителя ученик не видит');
      const call = mock.summaryCalls[0];
      check(call?.p_from === summary.from && call?.p_to === summary.to, 'период — последние семь дней по Москве');
      await page.locator('.kab2-period__btn:has-text("30 дней")').click();
      await page.waitForFunction(() => document.querySelector('.kab2__grid')?.getAttribute('aria-busy') === 'false');
      check(mock.summaryCalls.length === 2 && mock.summaryCalls[1].p_from === den(29), 'смена периода — новый запрос');
    } else {
      check(await noScroll(page), '«Моя статистика» на 375 px — без горизонтальной прокрутки');
      const uzkie = await page.locator('.kab2-period__btn').evaluateAll((items) =>
        items.filter((b) => b.getBoundingClientRect().height < 40).length,
      );
      check(uzkie === 0, 'кнопки периода не ниже 40 px');
    }
    if (SHOTS !== null) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(SHOTS, `moya-statistika-${width}.png`), fullPage: true });
    }
    await context.close();
  }
  /* Репетитору страница статистику ученика не показывает. */
  const { context, page, mock } = await newPage({ role: 'tutor' });
  mock.summary = summary;
  await page.goto(`${SITE}/kabinet/statistika/`, { waitUntil: 'networkidle' });
  check((await page.locator('[data-section="itogi"]').count()) === 0 && mock.summaryCalls.length === 0,
    'репетитор: чужая статистика не запрашивается');
  await context.close();
}

check(errors.length === 0, `ошибок в консоли нет${errors.length > 0 ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);

await browser.close();
server.close();
if (failures.length > 0) {
  console.error(`\nЖурнал в браузере: не прошло ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\nЖурнал в браузере: ${checks} проверок прошли.`);
