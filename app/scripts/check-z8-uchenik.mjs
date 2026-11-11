#!/usr/bin/env node
/* scripts/check-z8-uchenik.mjs — №8 глазами ученика, в браузере.

   Запуск после pnpm build: pnpm test:z8-uchenik [папка-для-снимков]
   Снимки для описания PR (375, 390, 430, 768, 1280, без проверок):
     node scripts/check-z8-uchenik.mjs --gallery папка

   Гость (без входа), телефон с сенсорным экраном и компьютер:
     • прогресс прежнего формата переносится в журнал: карточки групп
       на «О задании» показывают прежние счётчики;
     • поле ответа: inputmode="decimal", на телефоне кнопка «−»;
     • «1/4» при верном значении — подсказка «Значение верное, но…»,
       попытка не тратится; «5 см», «3 1/2», «1e3» — подсказка о формате;
       ответ с запятой засчитывается;
     • тренажёр берёт задачи банка, «решено X из 260» — разные задачи;
     • неверный ответ и открытое решение — задача в «Моих ошибках»;
       «Работа над ошибками» даёт новые аналоги, после двух верных
       подряд задача уходит из списка; «Прорешать те же задачи» нет;
     • «Отложить на потом» — закладка, по ссылке из списка открывается
       та же задача; закладка на опорной задаче открывает её номер;
     • итоги: «Просел» — у групп, где верных меньше половины; запись в
       истории тренировок;
     • на телефоне поле ответа, «−» и кнопки задачи не уходят под «?»
       и закреплённые панели — ни в начале страницы, ни в конце;
     • горизонтальной прокрутки нет на 375, 390, 430, 768, 1280;
       ошибок в консоли нет. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';

const OUT = path.join(APP, 'out');
const PORT = 4183;
const GALLERY = process.argv.includes('--gallery')
  ? (process.argv[process.argv.indexOf('--gallery') + 1] ?? 'snimki-z8')
  : null;
const SHOTS =
  GALLERY !== null ? null : (process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null);

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет out/index.html — сначала pnpm build.');
  process.exit(1);
}

const { generate } = requireSrc('lib/vychisleniya/generate.ts');
const { parseTaskId, isBankTask } = requireSrc('lib/vychisleniya/ids.ts');
const { ru } = requireSrc('lib/vychisleniya/numbers.ts');
const { BANK } = requireSrc('lib/vychisleniya/bank.ts');
const { zadachaHref } = requireSrc('lib/vychisleniya/links.ts');

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
  '.pdf': 'application/pdf',
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
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));
const SITE = `http://127.0.0.1:${PORT}`;
const TRENAZHER = `${SITE}/zadaniya/8/trenazher/`;
const ABOUT = `${SITE}/zadaniya/8/`;

/* ── Ответ задачи по идентификатору — тем же генератором ────────── */

function answerOf(id) {
  const p = parseTaskId(id);
  return generate(p.prototype, p.seed, p.level).otvet;
}

/** Ответ обыкновенной дробью: 0,25 → «1/4», 3 → «3/1», −0,6 → «−3/5». */
function asFraction(value) {
  let den = 1;
  while (Math.abs(Math.round(value * den) - value * den) > 1e-9 && den < 1e6) den *= 10;
  let num = Math.round(value * den);
  const g = (a, b) => (b === 0 ? Math.abs(a) : g(b, a % b));
  const d = g(num, den);
  num /= d;
  den /= d;
  return `${num < 0 ? '−' : ''}${Math.abs(num)}/${den}`;
}

/* ── Браузер ───────────────────────────────────────────────────── */

const browser = bezBanneraCookie(
  await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  }),
);
if (SHOTS !== null) fs.mkdirSync(SHOTS, { recursive: true });

async function shot(page, name, fullPage = false) {
  if (SHOTS === null) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
}

const errors = [];
function watch(page) {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
}

async function newPage(options) {
  const context = await browser.newContext(options);
  await welcomeSeen(context);
  const page = await context.newPage();
  watch(page);
  return { context, page };
}

const noScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
/**
 * Элементы управления, которые чем-то закрыты: «?», закреплённой
 * панелью, шапкой. Смотрим в начале страницы и в самом её конце — там
 * последние кнопки ближе всего к нижним панелям. Точка — центр
 * элемента: что в ней сверху, на то и нажмёт палец.
 */
async function coveredControls(page, selector) {
  const out = [];
  for (const where of ['top', 'bottom']) {
    out.push(
      ...(await page.evaluate(
        ([sel, at]) => {
          window.scrollTo(0, at === 'top' ? 0 : document.documentElement.scrollHeight);
          const bad = [];
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            if (y < 0 || y >= window.innerHeight || x < 0 || x >= window.innerWidth) continue;
            /* В начале страницы смотрим верхнюю половину экрана (шапка,
               вкладки), в конце — нижнюю («?», нижние панели): посередине
               прокрутки элемент под панелью законно уезжает за неё. */
            if ((at === 'bottom') !== y >= window.innerHeight / 2) continue;
            const hit = document.elementFromPoint(x, y);
            if (hit !== null && !el.contains(hit) && !hit.contains(el)) {
              const name = (node) =>
                `${node.tagName.toLowerCase()}.${String(node.className).split(' ')[0]}`;
              bad.push(`${name(el)} под ${name(hit)} (${at})`);
            }
          }
          return bad;
        },
        [selector, where],
      )),
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return out;
}

const TASK_CONTROLS = [
  '.trn-ekran .otvet-input__field',
  '.trn-ekran .otvet-input__minus',
  '.trn-knopki button',
  '.trn-zadacha .zakladka',
  '.stk-delimost summary',
].join(', ');

const store = (page, key) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);

const LOG = 'budetege:vychisleniya-8:log:v1';
const LEGACY = 'budetege:vychisleniya-8:v1';

/** Начать тренировку со стартового экрана: «Выбрать темы», все типы, 5 задач. */
async function startTraining(page) {
  await page.goto(TRENAZHER, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trn-start');
  await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
  await page.locator('.trn-vybor button:has-text("Выбрать все")').click();
  await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
  await page.locator('.trn-vybor__start').click();
  await page.waitForSelector(CARD);
}

const CARD = '.trn-zadacha[data-task]';

async function currentTask(page) {
  return page.locator(CARD).getAttribute('data-task');
}

/** «3 из 10» на карточке задачи: сколько задач в тренировке. */
async function totalTasks(page) {
  const text = await page.locator('.trn-zadacha__nomer').innerText();
  return Number(text.split('из')[1]?.trim() ?? '0');
}

async function answer(page, text) {
  await page.fill('.trn-ekran .otvet-input__field', text);
  await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
}

async function nextTask(page) {
  const next = page.locator('.trn-knopki button:has-text("Дальше")');
  if ((await next.count()) > 0) await next.first().click();
  else await page.locator('.trn-knopki button:has-text("К итогам")').first().click();
}

/** С итогов — на стартовый экран, панель прогресса раскрыта. */
async function toProgress(page) {
  await page.locator('.trn-itogi button:has-text("К выбору тем")').click();
  await page.locator('.trn-vybor button[aria-label="К режимам"]').click();
  await page.waitForSelector('.trn-progress');
  const panel = page.locator('.trn-progress');
  if ((await panel.getAttribute('open')) === null) await panel.locator('> summary').click();
  await page.waitForSelector('.trn-progress[open]');
}

/* ── Снимки для описания PR ────────────────────────────────────── */

/** Задача банка, в решении которой есть панель «Признаки делимости». */
function taskWithDelimost() {
  for (const entry of BANK) {
    for (const v of entry.variants) {
      const task = generate(entry.prototype, v.seed, v.level);
      if ((task.delimost ?? []).length > 0)
        return `${entry.prototype}|${v.seed}|${v.level ?? 'any'}`;
    }
  }
  return null;
}

async function runGallery(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const withDelimost = taskWithDelimost();
  for (const width of [375, 390, 430, 768, 1280]) {
    const phone = width < 500;
    const { context, page } = await newPage({
      viewport: { width, height: phone ? 812 : 900 },
      deviceScaleFactor: 2,
      hasTouch: phone,
      isMobile: phone,
    });
    const snap = async (name, fullPage = false) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(dir, `${width}-${name}.png`), fullPage });
    };
    /* Блок целиком, без шапки и подвала: так снимок читается в описании PR. */
    const snapBlock = async (name, selector) => {
      await page.evaluate(() => document.fonts.ready);
      /* Высокий блок снимается по частям, и закреплённые ленты и кнопки
         оказались бы посреди снимка: на время снимка они скрыты. */
      await page.evaluate((sel) => {
        const block = document.querySelector(sel);
        for (const el of document.querySelectorAll('body *')) {
          const pos = getComputedStyle(el).position;
          if ((pos === 'fixed' || pos === 'sticky') && !block?.contains(el)) {
            el.setAttribute('data-shot-hide', '');
          }
        }
      }, selector);
      await page
        .locator(selector)
        .first()
        .screenshot({
          path: path.join(dir, `${width}-${name}.png`),
          style:
            '[data-shot-hide], [data-shot-hide] * { visibility: hidden !important; opacity: 0 !important; }',
        });
      await page.evaluate(() =>
        document
          .querySelectorAll('[data-shot-hide]')
          .forEach((el) => el.removeAttribute('data-shot-hide')),
      );
    };

    /* Тренировка: дробь с верным значением, ошибка, закладка, итоги. */
    await startTraining(page);
    const id1 = await currentTask(page);
    await answer(page, asFraction(answerOf(id1)));
    await page.waitForSelector('.trn-otvetnaya .otvet-hint');
    await snap('01-podskazka-formata');
    await answer(page, ru(answerOf(id1)));
    await page.waitForSelector('.trn-verdikt--da');
    await nextTask(page);
    const id2 = await currentTask(page);
    await answer(page, String(answerOf(id2) + 1).replace('.', ','));
    await page.waitForSelector('.trn-verdikt--net');
    await page.locator('.trn-knopki button:has-text("Решение")').first().click();
    await page.waitForSelector('.trn-reshenie');
    await snapBlock('02-oshibka-i-reshenie', '.trn-ekran');
    await nextTask(page);
    await page.locator('.trn-zadacha .zakladka').click();
    for (let i = 0; i < 3; i += 1) {
      await answer(page, ru(answerOf(await currentTask(page))));
      await page.waitForSelector('.trn-verdikt--da');
      await nextTask(page);
    }
    await page.waitForSelector('.trn-itogi');
    await snapBlock('03-itogi', '.trn-itogi');
    await toProgress(page);
    await snapBlock('04-progress', '.trn-progress');

    /* Решение по шагам с панелью «Признаки делимости». */
    if (withDelimost !== null) {
      await page.goto(`${SITE}${zadachaHref(withDelimost)}`, { waitUntil: 'networkidle' });
      await page.waitForSelector(CARD);
      await answer(page, String(answerOf(withDelimost) + 1).replace('.', ','));
      await page.waitForSelector('.trn-verdikt--net');
      await page.locator('.trn-knopki button:has-text("Решение")').first().click();
      await page.waitForSelector('.stk-delimost');
      await page.locator('.stk-delimost summary').click();
      await snapBlock('05-reshenie-priznaki', '.trn-reshenie');
    }

    /* «О задании»: карточки групп с прогрессом. */
    await page.goto(ABOUT, { waitUntil: 'networkidle' });
    await page.waitForSelector('.kz-gruppa');
    await snapBlock('06-o-zadanii', '.kz-gruppy');

    /* Опорная задача: закладка и решение. */
    await page.goto(`${SITE}/zadaniya/8/opornye-zadachi/stepeni-korni/?zadacha=3`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.ptask .zakladka');
    await page.locator('.ptask .zakladka').click();
    const field = page.locator('.ptask .otvet-input__field');
    if ((await field.count()) === 1) {
      await field.fill('1');
      await page.locator('.ptask__actions button:has-text("Проверить")').click();
    }
    const reveal = page.locator('.ptask__actions button:has-text("Показать решение")');
    if ((await reveal.count()) > 0) {
      await reveal.first().click();
      await page.waitForSelector('.z8-razbor');
    }
    await snapBlock('07-opornaya', '.ptask');
    await context.close();
  }
  console.log(`Снимки: ${dir}`);
}

if (GALLERY !== null) {
  try {
    await runGallery(GALLERY);
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(0);
}

try {
  /* 1. Прежний формат и «О задании». */
  {
    const { context, page } = await newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(ABOUT, { waitUntil: 'networkidle' });
    await page.evaluate(
      ([key]) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            kinds: { '8.A': { done: 6, right: 4, seconds: 300 } },
            mistakes: [],
            outcomes: {},
          }),
        ),
      [LEGACY],
    );
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.kz-gruppa');
    /* 8.A — группа «Степени»: прежние счётчики видны на её карточке. */
    await page.waitForFunction(() =>
      /решено\s*6/.test(
        document.querySelector('#gruppa-stepeni .kz-gruppa__schet')?.textContent ?? '',
      ),
    );
    const s1 = await page.locator('#gruppa-stepeni .kz-gruppa__schet').innerText();
    check(
      /решено\s*6/.test(s1) && /верно\s*4/.test(s1),
      `«О задании»: прежние счётчики на карточке группы (${s1.replace(/\s+/g, ' ')})`,
    );
    check(
      (await page.locator('.kz-gruppa').count()) === 5,
      '«О задании»: карточки всех пяти групп',
    );
    const log = await store(page, LOG);
    check(log !== null && Object.keys(log.archive).length === 1, 'прежний формат свёрнут в журнал');
    check((await store(page, LEGACY)) !== null, 'прежний ключ не стёрт (на случай отката)');
    await shot(page, 'o-zadanii-progress-1280', true);
    await context.close();
  }

  /* 2. Тренажёр на телефоне: поле ответа, подсказки, банк. */
  let mistakeTask = null;
  let bookmarked = null;
  {
    const { context, page } = await newPage({
      ...devices['iPhone 13'],
      hasTouch: true,
      isMobile: true,
    });
    await startTraining(page);
    const input = page.locator('.trn-ekran .otvet-input__field');
    check(
      (await input.getAttribute('inputmode')) === 'decimal',
      'поле ответа: inputmode="decimal"',
    );
    check(
      (await page.locator('.trn-ekran .otvet-input__minus').count()) === 1,
      'телефон: рядом с полем кнопка «−»',
    );
    await input.fill('3');
    await page.locator('.trn-ekran .otvet-input__minus').click();
    check((await input.inputValue()) === '−3', 'кнопка «−» ставит минус');
    await page.locator('.trn-ekran .otvet-input__minus').click();
    check((await input.inputValue()) === '3', 'и убирает его');
    check(await noScroll(page), 'тренажёр 390: горизонтальной прокрутки нет');
    {
      const covered = await coveredControls(page, TASK_CONTROLS);
      check(
        covered.length === 0,
        `телефон: поле, «−» и кнопки задачи ничем не закрыты${covered.length ? `: ${covered.join('; ')}` : ''}`,
      );
    }

    /* Задание 1: дробь с верным значением, неверные записи, потом верно. */
    const id1 = await currentTask(page);
    check(isBankTask(id1), `первая задача — из банка (${id1})`);
    const a1 = answerOf(id1);
    await answer(page, asFraction(a1));
    check(
      (await page.locator('.trn-otvetnaya .otvet-hint').innerText()).startsWith(
        'Значение верное, но в бланк ЕГЭ записывают',
      ),
      `«${asFraction(a1)}» — «Значение верное, но…»`,
    );
    check(
      (await page.locator('.trn-verdikt').count()) === 0,
      'дробь с верным значением — не ошибка, вердикта нет',
    );
    await shot(page, 'drob-verno-390');
    for (const [text, starts] of [
      ['5 см', 'В бланк ЕГЭ записывают только число, без единиц'],
      ['3 1/2', 'Смешанное число в бланк не записывают'],
      ['1e3', 'Это запись калькулятора'],
      ['50%', 'В бланк ЕГЭ записывают только число, без знака %'],
    ]) {
      await answer(page, text);
      check(
        (await page.locator('.trn-otvetnaya .otvet-hint').innerText()).startsWith(starts) &&
          (await page.locator('.trn-verdikt').count()) === 0,
        `«${text}» — подсказка о формате, попытка не тратится`,
      );
    }
    await answer(page, ru(a1));
    await page.waitForSelector('.trn-verdikt--da');
    check(true, `ответ «${ru(a1)}» с запятой засчитан`);
    await nextTask(page);

    /* Задание 2: неверный ответ, потом открыть решение. */
    mistakeTask = await currentTask(page);
    await answer(page, String(answerOf(mistakeTask) + 1).replace('.', ','));
    await page.waitForSelector('.trn-verdikt--net');
    check(true, 'неверный ответ — «Пока не так»');
    await shot(page, 'oshibka-390');
    await page.locator('.trn-knopki button:has-text("Решение")').first().click();
    await page.waitForSelector('.trn-reshenie');
    check(true, 'решение открывается');
    {
      const covered = await coveredControls(page, TASK_CONTROLS);
      check(
        covered.length === 0,
        `телефон, открыто решение: кнопки ничем не закрыты${covered.length ? `: ${covered.join('; ')}` : ''}`,
      );
    }
    await nextTask(page);

    /* Задание 3: отложить на потом. */
    bookmarked = await currentTask(page);
    await page.locator('.trn-zadacha .zakladka').click();
    check(
      (await page.locator('.trn-zadacha .zakladka').getAttribute('aria-pressed')) === 'true',
      'кнопка «Отложить на потом» нажата',
    );
    for (let i = 0; i < 3; i += 1) {
      const id = await currentTask(page);
      await answer(page, ru(answerOf(id)));
      await page.waitForSelector('.trn-verdikt--da');
      await nextTask(page);
    }
    await page.waitForSelector('.trn-itogi');
    /* Метка «Просел» — у группы, где верных меньше половины. Задачи
       тренировки случайные: ошибка одна, и попасть она может в группу
       с одной задачей (0 из 1 — «Просел») или с несколькими (1 из 2 —
       метки нет). Поэтому сверяем каждую строку разбивки с её счётом,
       а не ждём метку всегда. */
    {
      const stroki = await page.locator('.trn-itogi .trn-razbivka li').evaluateAll((items) =>
        items.map((li) => {
          const schet = /(\d+)\s*из\s*(\d+)/.exec(
            li.querySelector('.trn-razbivka__schet')?.textContent ?? '',
          );
          return {
            verno: schet === null ? NaN : Number(schet[1]),
            vsego: schet === null ? NaN : Number(schet[2]),
            metka: li.querySelector('.stk-metka')?.textContent?.trim() ?? '',
          };
        }),
      );
      const neTak = stroki.filter((s) => (s.metka === 'Просел') !== s.verno / s.vsego < 0.5);
      check(
        stroki.length > 0 && neTak.length === 0,
        `итоги: «Просел» ровно у групп, где верных меньше половины${
          neTak.length ? `: ${JSON.stringify(neTak)}` : ''
        }`,
      );
      check(
        stroki.reduce((sum, s) => sum + s.vsego, 0) === 5 &&
          stroki.reduce((sum, s) => sum + s.verno, 0) === 4 &&
          stroki.filter((s) => s.verno < s.vsego).length === 1,
        `итоги: в разбивке пять задач, одна группа с ошибкой: ${JSON.stringify(stroki)}`,
      );
    }
    check(
      (await page.locator('.trn-itogi button:has-text("Прорешать")').count()) === 0,
      'итоги: повтора тех же задач нет',
    );
    check(
      (await page.locator('.trn-itogi button:has-text("Работа над ошибками")').count()) === 1,
      'итоги: «Работа над ошибками» — новые аналоги',
    );
    await shot(page, 'itogi-390', true);

    const log = await store(page, LOG);
    const mine = log.attempts.filter((a) => a.session);
    check(mine.length === 5, `в журнале пять задач тренировки, получили ${mine.length}`);
    check(
      mine.find((a) => a.task === mistakeTask)?.outcome === 'revealed',
      'задача с ошибкой и открытым решением — «открыто решение»',
    );
    check(mine.filter((a) => a.outcome === 'right').length === 4, 'четыре верных');
    const historyValue = await store(page, 'budetege:istoriya:v1');
    check(
      historyValue?.items?.length === 1 && historyValue.items[0].total === 5,
      'тренировка в истории',
    );
    const zakladki = await store(page, 'budetege:zakladki:v1');
    check(zakladki?.items?.[0]?.ref === bookmarked, 'закладка сохранена');

    /* Панель прогресса на стартовом экране. */
    await toProgress(page);
    const counter = await page.locator('.trn-progress .z8-counter').innerText();
    check(
      /Решено\s*5\s*из\s*260/.test(counter),
      `«решено X из 260» — разные задачи банка: ${counter}`,
    );
    check(
      (await page.locator('[data-section="mistakes8"] .tp-row').count()) === 1,
      '«Мои ошибки»: одна задача',
    );
    check(
      (await page.locator('[data-section="later8"] .tp-row').count()) === 1,
      '«Отложенные»: одна задача',
    );
    check(
      (await page.locator('[data-section="history8"] .tp-row').count()) === 1,
      '«История тренировок»: одна запись',
    );
    check(await noScroll(page), 'прогресс 390: горизонтальной прокрутки нет');
    await shot(page, 'progress-390', true);

    /* Работа над ошибками: аналоги, два верных подряд. */
    await page.locator('[data-section="mistakes8"] button:has-text("Работа над ошибками")').click();
    await page.waitForSelector(CARD);
    const analog1 = await currentTask(page);
    check(
      analog1 !== mistakeTask && analog1.split('|')[0] === mistakeTask.split('|')[0],
      'аналог: тот же тип, другая задача',
    );
    check((await totalTasks(page)) === 2, 'на одну ошибку — два аналога');
    for (let i = 0; i < 2; i += 1) {
      const id = await currentTask(page);
      await answer(page, ru(answerOf(id)));
      await page.waitForSelector('.trn-verdikt--da');
      await nextTask(page);
    }
    await page.waitForSelector('.trn-itogi');
    const after = await store(page, LOG);
    check(
      after.attempts.filter((a) => a.fixes === mistakeTask).length === 2,
      'аналоги записаны как работа над этой ошибкой',
    );
    await toProgress(page);
    check(
      (await page.locator('[data-section="mistakes8"] .tp-row').count()) === 0,
      'два верных аналога подряд — задача ушла из «Моих ошибок»',
    );

    /* Закладка открывает ту же задачу. */
    await page.locator('[data-section="later8"] a:has-text("Открыть")').click();
    await page.waitForSelector(CARD);
    check((await currentTask(page)) === bookmarked, 'закладка открывает ту же задачу');
    check((await totalTasks(page)) === 1, 'из закладки — одна задача');
    await context.close();
  }

  /* 3. Опорные задачи: подсказка о формате, закладка с номером. */
  {
    const { context, page } = await newPage({
      ...devices['iPhone 13'],
      hasTouch: true,
      isMobile: true,
    });
    await page.goto(`${SITE}/zadaniya/8/opornye-zadachi/stepeni-korni/?zadacha=3`, {
      waitUntil: 'networkidle',
    });
    await page.waitForFunction(() =>
      /Задание\s*3\s*из/.test(document.querySelector('.ptask__counter')?.textContent ?? ''),
    );
    check(true, 'опорная задача по ссылке ?zadacha=3 открывает третью задачу');
    const field = page.locator('.ptask .otvet-input__field');
    if ((await field.count()) === 1) {
      await field.fill('5 см');
      await page.locator('.ptask__actions button:has-text("Проверить")').click();
      check(
        (await page.locator('.ptask .otvet-hint').innerText()).startsWith(
          'В бланк ЕГЭ записывают только число',
        ),
        'опорная: «5 см» — подсказка о формате',
      );
    }
    await page.locator('.ptask .zakladka').click();
    const z = await store(page, 'budetege:zakladki:v1');
    check(
      z.items.some(
        (i) =>
          i.place === 'opornye' && i.href.endsWith('/opornye-zadachi/stepeni-korni/?zadacha=3'),
      ),
      'закладка опорной задачи ведёт на её номер',
    );
    check(await noScroll(page), 'опорные 390: горизонтальной прокрутки нет');
    await shot(page, 'opornye-390');
    await context.close();
  }

  /* 4. Ширины: тренажёр и «О задании» без горизонтальной прокрутки. */
  for (const width of [375, 390, 430, 768, 1280]) {
    const { context, page } = await newPage({
      viewport: { width, height: width < 500 ? 844 : 900 },
      hasTouch: width < 500,
      isMobile: width < 500,
    });
    for (const [name, url] of [
      ['o-zadanii', ABOUT],
      ['trenazher', TRENAZHER],
    ]) {
      await page.goto(url, { waitUntil: 'networkidle' });
      check(await noScroll(page), `${name} ${width}: горизонтальной прокрутки нет`);
      if (name === 'trenazher') {
        const covered = await coveredControls(page, '.trn-rezhim, .trn-progress > summary');
        check(
          covered.length === 0,
          `тренажёр ${width}: выбор и «Начать» ничем не закрыты${covered.length ? `: ${covered.join('; ')}` : ''}`,
        );
      }
    }
    await context.close();
  }

  check(
    errors.length === 0,
    `ошибок в консоли нет${errors.length ? `: ${errors.slice(0, 5).join(' | ')}` : ''}`,
  );
} catch (error) {
  check(false, `сценарий дошёл до конца: ${error.message}`);
} finally {
  await browser.close();
  server.close();
}

console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}.`);
if (failures.length > 0) {
  console.error('\nНе прошли:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
