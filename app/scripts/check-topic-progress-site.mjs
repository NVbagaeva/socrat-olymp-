#!/usr/bin/env node
/* scripts/check-topic-progress-site.mjs — кольцо прогресса подтемы
   в собранном сайте.

   Запуск: pnpm build && pnpm test:topic-progress-site [--shots DIR]

   Поднимает app/out на локальном порту и проходит в Chromium три
   подтемы задания №12 (линейную, квадратичную, гиперболу) на ширине
   телефона, каждый раз с чистым хранилищем:

     - новый пользователь видит 0% и мотивирующую подпись;
     - открытые вкладки без действий прогресса не дают;
     - прокрутка теории в конец одним рывком и переход по последнему
       пункту «Содержания» теорию не засчитывают;
     - теория, прочитанная с паузами, и кнопка «Прочитано» засчитывают
       пункт — кольцо растёт ровно на 1/N;
     - метод засчитывается, когда его окно дочитано;
     - опорные задачи и тренажёр закрываются по записям их хранилищ;
     - прогресс переживает перезагрузку;
     - прогресс одной подтемы не виден в другой;
     - по нажатию на кольцо раскрывается список пунктов с галочками.

   Время на странице ускоряется часами Playwright (page.clock): чтение
   с паузами занимает секунды, а не минуты.

   --shots DIR — снимки кольца со списком: 0%, частично, 100%. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const SHOTS = shotsAt >= 0 ? args[shotsAt + 1] : null;
if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); }

/* Навыки опорных задач — из конфига страницы; типы заданий
   тренажёра — наборы прототипов подтемы в данных движка. Лишний
   набор в записи не мешает: кольцо считает только свои. */
const { prepSkillsFor } = requireSrc('content/prepSkills.ts');
const PROTOTYPES = { linear: '12', quadratic: '12q', rational: '12r', irrational: '12s' };
/** Сколько задач в наборе опорных задач навыка. */
function prepTotal(type, setId) {
  const dir = path.join(APP, 'src', 'lib', 'graph', 'data', 'prep', PROTOTYPES[type]);
  const set = fs.readdirSync(dir).filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))).find((item) => item.id === setId);
  return set === undefined ? 0 : set.tasks.length;
}
function trainerKinds(type) {
  const dir = path.join(APP, 'src', 'lib', 'graph', 'data', 'prototypes', PROTOTYPES[type]);
  return fs.readdirSync(dir).filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')).id);
}

/* ── Статический сервер ─────────────────────────────────────── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { file = path.join(file, 'index.html'); }
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) { file += '.html'; }
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});

const failures = [];
let checks = 0;
function expect(what, got, want) {
  checks += 1;
  if (got !== want) { failures.push(what + ': получено «' + got + '», ожидалось «' + want + '»'); }
}

async function ring(page) {
  return page.evaluate(() => ({
    percent: document.querySelector('.topic-progress .progress-ring__c .t-data-lg')?.textContent ?? '',
    text: document.querySelector('.topic-progress__text')?.firstChild?.textContent ?? '',
  }));
}

async function fresh(sub) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto(BASE + '/zadaniya/12/' + sub + '/', { waitUntil: 'load' });
  await page.clock.runFor(500);
  return { context, page, errors };
}

/** Пройти время на странице: таймеры чтения срабатывают. */
async function wait(page, ms) {
  await page.clock.runFor(ms);
}

async function tab(page, name) {
  const item = page.getByRole('tab', { name: new RegExp('^' + name) });
  if (await item.count() === 0) { return false; }
  await item.first().click();
  await wait(page, 600);
  return true;
}

async function shot(page, name) {
  if (!SHOTS) { return; }
  await page.evaluate(() => window.scrollTo(0, 0));
  const toggle = page.locator('.topic-progress__toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') { await toggle.click(); }
  await wait(page, 200);
  /* Снимок экрана телефона целиком — с полями страницы — от шапки
     до конца списка пунктов. */
  const box = await page.locator('.topic-progress').boundingBox();
  const height = Math.ceil((box ? box.y + box.height : 844) + 24);
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true, clip: { x: 0, y: 0, width: 390, height } });
}

/* Прочитать теорию с паузами: шаг в полэкрана, на каждом — 3,5 с. */
async function readSlowly(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 200; i += 1) {
    await wait(page, 3500);
    const end = await page.evaluate(() => {
      const before = window.scrollY;
      window.scrollBy(0, window.innerHeight / 2);
      return window.scrollY === before;
    });
    if (end) { await wait(page, 3500); break; }
  }
}

const SUBTOPICS = [
  { sub: 'linear', items: 3 },
  { sub: 'quadratic', items: 4 },
  { sub: 'rational', items: 4 },
  { sub: 'irrational', items: 3 },
];

for (const { sub, items } of SUBTOPICS) {
  const name = (what) => sub + ': ' + what;
  const step = Math.round(100 / items) + '%';

  /* 1. Новый пользователь, вкладки без действий, рывок в конец. */
  {
    const { context, page, errors } = await fresh(sub);
    let r = await ring(page);
    expect(name('новый пользователь — процент'), r.percent, '0%');
    expect(name('новый пользователь — подпись'), r.text, 'Начните с теории — здесь появится ваш прогресс');
    await page.locator('.topic-progress__toggle').click();
    expect(name('список пунктов'), await page.locator('.topic-progress__item').count(), items);
    expect(name('галочек у нового'), await page.locator('.topic-progress__item.is-done').count(), 0);
    await shot(page, sub + '-0');

    for (const t of ['Теория', 'Ключевые методы', 'Опорные задачи', 'Тренажёр']) {
      if (await tab(page, t)) { await wait(page, 4000); }
    }
    r = await ring(page);
    expect(name('открыл все вкладки — процент'), r.percent, '0%');

    await tab(page, 'Теория');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await wait(page, 1000);
    const toc = page.locator('.topic-open__btn');
    if (await toc.count()) {
      await toc.click(); await wait(page, 400);
      await page.locator('.contents-sheet button, .contents-sheet a').last().click();
      await wait(page, 1500);
    }
    const read = await page.evaluate((key) => JSON.parse(localStorage.getItem('budetege:read:v2:' + key) || '[]').length, 'theory:12:' + sub);
    expect(name('рывок в конец и «Содержание» — прочитано разделов'), read <= 1, true);
    r = await ring(page);
    expect(name('рывок в конец — процент'), r.percent, '0%');
    expect(name('ошибок на странице'), errors.length, 0);
    await context.close();
  }

  /* 2. Теория с паузами → ровно один пункт; перезагрузка; другие подтемы. */
  {
    const { context, page } = await fresh(sub);
    await tab(page, 'Теория');
    await readSlowly(page);
    let r = await ring(page);
    expect(name('теория прочитана с паузами — процент'), r.percent, step);
    expect(name('теория — подпись'), r.text, 'Вы изучили 1 из ' + items + ' разделов');
    await page.reload({ waitUntil: 'load' });
    await wait(page, 500);
    r = await ring(page);
    expect(name('после перезагрузки'), r.percent, step);
    await shot(page, sub + '-chast');

    for (const other of SUBTOPICS.filter((item) => item.sub !== sub)) {
      await page.goto(BASE + '/zadaniya/12/' + other.sub + '/', { waitUntil: 'load' });
      await wait(page, 500);
      expect(name('не влияет на ' + other.sub), (await ring(page)).percent, '0%');
    }
    await context.close();
  }

  /* 3. «Прочитано», методы, опорные задачи и тренажёр → 100%. */
  {
    const { context, page } = await fresh(sub);
    await tab(page, 'Теория');
    await page.getByRole('button', { name: 'Прочитано' }).click();
    await wait(page, 300);
    expect(name('кнопка «Прочитано» в теории'), (await ring(page)).percent, step);

    if (await tab(page, 'Ключевые методы')) {
      /* Один метод — дочитанным окном, остальные — кнопкой. */
      await page.locator('.vmetod').first().click();
      await wait(page, 500);
      await page.evaluate(() => {
        const body = document.querySelector('.vmetod-modal__body');
        let box = body?.parentElement ?? null;
        while (box && !['auto', 'scroll'].includes(getComputedStyle(box).overflowY)) { box = box.parentElement; }
        if (box) { box.scrollTop = box.scrollHeight; box.dispatchEvent(new Event('scroll')); }
      });
      await wait(page, 3500);
      const methods = await page.evaluate((key) => JSON.parse(localStorage.getItem('budetege:read:v2:' + key) || '[]').length, 'methods:12:' + sub);
      expect(name('метод дочитан в окне'), methods, 1);
      await page.keyboard.press('Escape');
      await wait(page, 300);
      await page.getByRole('button', { name: 'Прочитано' }).click();
      await wait(page, 300);
    }

    /* Опорные задачи — 79% мало, 80% хватает; тренажёр — по 2 задачи
       каждого типа. Записи — того же вида, что пишут сами вкладки. */
    const skills = prepSkillsFor(sub).map((skill) => ({ id: skill.id, total: prepTotal(sub, skill.setId) }));
    const kinds = trainerKinds(sub);
    const done = items - 2;
    /* Доля — по каждому навыку: 70% — заведомо меньше порога, 80% с
       округлением вверх — не меньше. */
    const prep = (share, round) => Object.fromEntries(skills.map(({ id, total }) =>
      [id, Array.from({ length: round(total * share) }, (_, i) => i + 1)]));
    await page.evaluate(([value]) => localStorage.setItem('budetege:prep:v1', JSON.stringify(value)), [prep(0.7, Math.floor)]);
    await page.reload({ waitUntil: 'load' }); await wait(page, 500);
    expect(name('опорные 70% — не пройдено'), (await ring(page)).percent, Math.round((done / items) * 100) + '%');
    await page.evaluate(([value]) => localStorage.setItem('budetege:prep:v1', JSON.stringify(value)), [prep(0.8, Math.ceil)]);
    const trainer = { kinds: Object.fromEntries(kinds.map((id) => [id, { done: 3, right: 2, seconds: 60 }])), mistakes: [] };
    await page.evaluate(([value]) => localStorage.setItem('budetege:trainer:v1', JSON.stringify(value)), [trainer]);
    await page.reload({ waitUntil: 'load' }); await wait(page, 500);
    const r = await ring(page);
    expect(name('всё пройдено — процент'), r.percent, '100%');
    expect(name('всё пройдено — подпись'), r.text, 'Вы изучили все разделы подтемы');
    await page.locator('.topic-progress__toggle').click();
    expect(name('всё пройдено — галочек'), await page.locator('.topic-progress__item.is-done').count(), items);
    await shot(page, sub + '-100');
    await context.close();
  }
}

await browser.close();
server.close();

console.log('Проверок кольца прогресса на сайте: ' + checks);
if (failures.length) {
  console.log('Расхождения — ' + failures.length + ':');
  failures.forEach((line) => console.log('  ' + line));
  process.exit(1);
}
console.log('Расхождений нет.');
