#!/usr/bin/env node
/* scripts/check-trainer-sessions.mjs — сохранение тренировки во всех
   тренажёрах сайта, в собранном сайте и в настоящем браузере.

   Запуск: pnpm build && pnpm test:trainer-sessions [--only <часть имени>]
   Сборка app/out поднимается своим маленьким сервером на node:http
   (/путь/ → путь/index.html, остальное — файлы): Apache не нужен.
   Браузер — Chromium из Playwright. Свой Chromium, если версия
   Playwright с ним не совпадает: PW_CHROMIUM=/путь/к/chrome (или
   CHROMIUM_PATH, как в check-navigation.mjs).

   Сценарии (номера — как в постановке задачи PR #131):

     1. Старт тренировки: запись budetege:trainer:<раздел>:session есть,
        на вкладке «Тренажёр» горит метка .tabs__dot.
     2. Задание 1 — верный ответ: вердикт «Верно», в панели «решено 1»,
        в записи ui.marks[0] = 'right'. Задание 2 — неверный ответ:
        ui.tried[1] = true. Перезагрузка: задание 1 засчитано, панель
        «решено 1», на задании 2 тот же неверный ответ. «Завершить
        тренировку» → итоги: Верно 1, Неверно 1, Пропущено N − 2,
        задание 1 «Верно», задание 2 «Неверно»; записи больше нет.
        Сценарии 1–2 — во всех тренажёрах (все адреса из TRAINERS).
     4. Две вкладки и одна тренировка: вкладка с выбором тренировки
        жмёт «Начать» при уже начатой в другой — вопрос «У вас есть
        незавершённая тренировка (решено X из N)…»; «Продолжить старую»
        открывает ту же тренировку; «Начать новую» из третьей вкладки —
        в первой «В другой вкладке начата новая тренировка».
     5. Действие во второй вкладке той же тренировки — в первой «Тренировка
        продолжена в другой вкладке»; «Продолжить здесь» показывает то,
        что сделано во второй.
     6. №11, ответ выбором варианта (подтип RZ-17): выбранный вариант
        переживает перезагрузку.
     7. Хранилище почти полно (старая тренировка другого раздела и
        посторонний ключ): новая тренировка записывается, старая чужая
        вытеснена, посторонний ключ цел. Места нет совсем: страница
        работает, плашка «в хранилище браузера не хватает места»,
        тренировка идёт.
     8. Запись прежней схемы (schemaVersion 1) и мусор под ключом
        раздела: плашка «…сброшена», выбор тренировки на месте.
     9. Время восстановления после перезагрузки (№12 quadratic и №2
        на «Все»): печатается, не проверяется; дольше 5 с —
        предупреждение.
     Сценарии 4, 5, 7, 8 — на представителях (rep: true).

   Верный ответ на странице не найти: в бандле его нет (только
   отпечатки). Тест берёт рецепт задания из записи сессии и считает
   ответ здесь, в Node, тем же кодом сайта, которым задание собрано:
     №12      — generateSet(набор, seed) движка lib/graph/generate.js,
                задача по id: answer (у задач с вариантами — номер варианта);
     №8, №2   — generate(прототип, seed[, уровень]).otvet
                (lib/vychisleniya/generate.ts, lib/vektory/generate.ts);
     №9       — generate(прототип, seed).otvet (lib/proizvodnaya/generate.ts);
     №11      — reshitPlan(план, банк dannyeTrenazhera()): answer или
                номер верного варианта (lib/zadanie11/trenazher/zadacha.ts);
     №4, №5   — otvetUchenika(прототип, параметры варианта) из банка
                lib/veroyatnost; «Узнай метод» — метод, чей отпечаток
                sealMetod совпал с отпечатком варианта uznayMetodPool();
     №3       — prototype.otvet(параметры варианта) из lib/zadanie3.

   Новый тренажёр — один объект в TRAINERS ниже: адрес, раздел, как
   начать тренировку и как по записи получить верный ответ. Поле ответа,
   кнопки «Проверить» и «Дальше», вердикт и панель общие для всех. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const argOf = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const OUT = path.resolve(argOf('--out') ?? path.join(APP, 'out'));
const ONLY = argOf('--only');

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error(`Нет сборки ${OUT}: сначала pnpm build (в app/).`);
  process.exit(1);
}

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) {
    failures.push(what);
  }
  return ok;
}

/* ── Верные ответы: тем же кодом сайта, по рецепту из записи ──── */

/* Движок №12 — ES-модуль; наборы ему отдаются с диска, как в
   check-graph-*.mjs (в бандле их отдаёт data/index.js). */
let graph = null;
async function graphEngine() {
  if (graph === null) {
    const { default: engine } = await import('../src/lib/graph/generate.js');
    const root = path.join(APP, 'src', 'lib', 'graph', 'data');
    const readSets = (kind) =>
      ['12', '12q', '12r', '12s'].flatMap((dir) => {
        const full = path.join(root, kind, dir);
        return fs.existsSync(full)
          ? fs
              .readdirSync(full)
              .filter((name) => name.endsWith('.json'))
              .sort()
              .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')))
          : [];
      });
    engine.setSets({ prep: readSets('prep'), prototypes: readSets('prototypes') });
    graph = engine;
  }
  return graph;
}

/** №12: рецепт {set, seed, id, sig} → ответ числом или номер варианта. */
async function answer12(payload, at) {
  const recipe = payload.tasks[at];
  const engine = await graphEngine();
  const task = engine.generateSet(recipe.set, recipe.seed).find((item) => item.id === recipe.id);
  if (task === undefined) {
    throw new Error(`№12: нет задачи ${recipe.id} в наборе ${recipe.set} (seed ${recipe.seed})`);
  }
  return Array.isArray(task.options) && task.options.length > 0
    ? { option: String(task.answer) }
    : { text: String(task.answer) };
}

/** Число ответа так, как его ввёл бы ученик: девять знаков, запятая. */
function numberText(value) {
  return String(Math.round(Number(value) * 1e9) / 1e9).replace('.', ',');
}

/** №8: [«прототип|seed|уровень», подпись] → generate(…).otvet. */
function answer8(payload, at) {
  const { generate } = requireSrc('lib/vychisleniya/generate');
  const [prototype, seed, level] = payload.tasks[at][0].split('|');
  return {
    text: numberText(
      generate(prototype, seed, level === 'base' || level === 'advanced' ? level : null).otvet,
    ),
  };
}

/** №2: [«прототип|seed», подпись] → generate(…).otvet. */
function answer2(payload, at) {
  const { generate } = requireSrc('lib/vektory/generate');
  const [prototype, seed] = payload.tasks[at][0].split('|');
  return { text: numberText(generate(prototype, seed).otvet) };
}

/** №9: ids[номер] = «прототип|seed» (запись packTrenazher9) → generate(…).otvet. */
function answer9(payload, at) {
  const { generate } = requireSrc('lib/proizvodnaya/generate');
  const id = payload.ids[at];
  const split = id.indexOf('|');
  return { text: numberText(generate(id.slice(0, split), id.slice(split + 1)).otvet) };
}

/** №11: [вид, подтип, номер в банке или seed, подпись] → reshitPlan. */
let bank11 = null;
function answer11(payload, at) {
  const { reshitPlan } = requireSrc('lib/zadanie11/trenazher/zadacha');
  if (bank11 === null) {
    bank11 = requireSrc('lib/zadanie11/trenazher/dannye').dannyeTrenazhera().bank;
  }
  const [vid, id, otkuda] = payload.zadachi[at];
  const plan = vid === 'new' ? { vid, id, seed: String(otkuda) } : { vid, id, no: Number(otkuda) };
  const solved = reshitPlan(plan, bank11);
  return solved.vybor === undefined
    ? { text: numberText(solved.answer) }
    : { option: String(solved.vybor.correct + 1) };
}

/** №4, №5: [прототип, номер варианта, подпись] → ответ ученика или метод. */
const uznay = new Map();
function answer45(payload, at) {
  const [kindId, n] = payload.tasks[at];
  if (payload.rezhim === 'uznay') {
    if (!uznay.has(payload.zadanie)) {
      uznay.set(
        payload.zadanie,
        requireSrc('lib/veroyatnost/pool').uznayMetodPool(payload.zadanie),
      );
    }
    const variant = uznay
      .get(payload.zadanie)
      .kinds.find((kind) => kind.id === kindId)
      ?.variants.find((item) => item.n === n);
    const { sealMetod } = requireSrc('lib/veroyatnost/secret');
    const { navykiZadaniya } = requireSrc('components/tasks/veroyatnost/metody');
    const metod = navykiZadaniya(payload.zadanie).find(
      (item) => sealMetod(item.id) === variant?.metodSeal,
    );
    if (metod === undefined) {
      throw new Error(`«Узнай метод»: не нашёлся метод задачи ${kindId}#${n}`);
    }
    return { method: metod.nazvanie };
  }
  const { BANK_4, BANK_5, otvetUchenika } = requireSrc('lib/veroyatnost/index');
  const prototype = (payload.zadanie === 4 ? BANK_4 : BANK_5).find((item) => item.id === kindId);
  const variant = prototype?.varianty.find((item) => item.n === n);
  if (variant === undefined) {
    throw new Error(`№${payload.zadanie}: нет варианта ${kindId}#${n}`);
  }
  return { text: numberText(otvetUchenika(prototype, variant.params)) };
}

/** №3: пул {kind, n} → prototype.otvet(параметры варианта). */
function answer3(payload, at) {
  const { prototypeById } = requireSrc('lib/zadanie3/index');
  const item = payload.pool[at];
  const prototype = prototypeById(item.kind);
  const variant = prototype?.varianty.find((entry) => entry.n === item.n);
  if (variant === undefined) {
    throw new Error(`№3: нет варианта ${item.kind}#${item.n}`);
  }
  return { text: numberText(prototype.otvet(variant.params)) };
}

/* ── Тренажёры ──────────────────────────────────────────────────

   Один объект — один адрес тренажёра:
     name    — имя в отчёте;
     url     — адрес вкладки «Тренажёр»;
     scope   — раздел записи: budetege:trainer:<scope>:session;
     answer  — (payload из записи, номер задания в пуле) → верный ответ:
               { text } — ввести в поле, { option } — номер варианта
               (.popt), { method } — название метода (.z4-picker__btn);
     start   — как начать тренировку (по умолчанию «Начать тренировку»);
     all     — как выбрать «Все» задания (для замера восстановления);
     rep     — представитель: на нём идут сценарии 4, 5, 7, 8;
     tabs    — false, если у страницы нет ленты вкладок (метку не искать). */

/** Нажать «Начать тренировку» на выборе тренировки. */
async function pressStart(page) {
  await page
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
}

/** Самая большая тренировка №12, №8, №2: режим «Смешанная», количество «Все (N)». */
async function chooseAll(page) {
  await page
    .getByRole('radio', { name: /^Смешанная/ })
    .first()
    .click();
  await page
    .getByRole('radio', { name: /^Все \(\d+\)/ })
    .first()
    .click();
}

const TRAINERS = [
  ...['linear', 'quadratic', 'rational', 'irrational'].map((sub) => ({
    name: `№12 ${sub}`,
    url: `/zadaniya/12/${sub}/trenazher/`,
    scope: `12:${sub}`,
    answer: answer12,
    all: chooseAll,
    rep: sub === 'linear',
  })),
  {
    name: '№8',
    url: '/zadaniya/8/trenazher/',
    scope: '8',
    answer: answer8,
    all: chooseAll,
    rep: true,
  },
  { name: '№2', url: '/zadaniya/2/trenazher/', scope: '2', answer: answer2, all: chooseAll },
  {
    name: '№9',
    url: '/zadaniya/9/trenazher/',
    scope: '9',
    answer: answer9,
    all: chooseAll,
    rep: true,
  },
  {
    name: '№11',
    url: '/zadaniya/11/trenazher/',
    scope: '11',
    answer: answer11,
    /* Типы задач по умолчанию не отмечены: быстрая настройка на всё задание. */
    start: async (page) => {
      await page.getByRole('button', { name: 'Всё задание 11' }).click();
      await pressStart(page);
    },
    rep: true,
  },
  { name: '№4', url: '/zadaniya/4/trenazher/', scope: '4', answer: answer45, rep: true },
  { name: '№5', url: '/zadaniya/5/trenazher/', scope: '5', answer: answer45 },
  {
    name: '№4 «Узнай метод»',
    url: '/zadaniya/4/trenazher/uznay-metod/',
    scope: '4',
    answer: answer45,
  },
  ...solid3Urls().map((url) => ({
    name: `№3 ${url.split('/')[3] === 'trenazher' ? 'общий' : url.split('/')[3]}`,
    url,
    scope: url.split('/')[3] === 'trenazher' ? '3' : `3:${url.split('/')[3]}`,
    answer: answer3,
    rep: url === '/zadaniya/3/trenazher/',
    /* У общего тренажёра №3 своей ленты вкладок нет: метке негде гореть. */
    tabs: url !== '/zadaniya/3/trenazher/',
  })),
];

/** Тренажёры №3: общий и по фигурам — по папкам сборки. */
function solid3Urls() {
  const dir = path.join(OUT, 'zadaniya', '3');
  const figures = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((name) => fs.existsSync(path.join(dir, name, 'trenazher', 'index.html')))
        .sort()
    : [];
  return ['/zadaniya/3/trenazher/', ...figures.map((name) => `/zadaniya/3/${name}/trenazher/`)];
}

/* ── Статический сервер над out/ ────────────────────────────── */

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
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
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

/* ── Общие действия на странице ─────────────────────────────── */

const KEY = (scope) => `budetege:trainer:${scope}:session`;
const BODY = '.tsess__body';
/** Поле ответа: у каждого экрана своё, но оно одно. */
const ANSWER_INPUT = [
  'input.ttask__input',
  'input.z11-resh__input',
  'input.pc__input',
  'input.z3t__input',
]
  .map((sel) => `${BODY} ${sel}`)
  .join(', ');
/** Условие текущего задания. */
const QUESTION = ['.ptask__question', '.z11-resh__text', '.pc__text', '.z3t__question']
  .map((sel) => `${BODY} ${sel}`)
  .join(', ');

async function newPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('pageerror', (error) => {
    console.log(`     [ошибка страницы ${page.url()}] ${error.message}`);
    page.errors = (page.errors ?? 0) + 1;
  });
  return page;
}

async function open(page, url) {
  await page.goto(BASE + url, { waitUntil: 'load' });
}

async function readRecord(page, scope) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), KEY(scope));
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { broken: raw };
  }
}

/** Дождаться записи, для которой условие верно. null — не дождались. */
async function waitRecord(page, scope, test = () => true, timeout = 10_000) {
  const until = Date.now() + timeout;
  for (;;) {
    const record = await readRecord(page, scope);
    if (record !== null && !record.broken && test(record)) {
      return record;
    }
    if (Date.now() > until) {
      return null;
    }
    await page.waitForTimeout(100);
  }
}

async function waitNoRecord(page, scope, timeout = 5_000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if ((await readRecord(page, scope)) === null) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
}

/** Панель тренировки: «решено X». */
async function solvedOnBar(page) {
  return (await page.locator('.tsess__solved b').first().textContent())?.trim();
}

async function waitBar(page, timeout = 30_000) {
  await page.locator('.tsess__bar').first().waitFor({ state: 'visible', timeout });
}

/** Номер задания пула на позиции показа: раскладка подхода или как есть. */
function poolIndex(record, position) {
  return record.ui?.order?.[position] ?? position;
}

/** Сколько заданий в тренировке: по раскладке, иначе по записи. */
function totalOf(record) {
  return record.ui?.order?.length ?? record.total;
}

/** Ввести ответ (или выбрать вариант, метод) и проверить. */
async function give(page, answer) {
  const body = page.locator(BODY);
  if (answer.text !== undefined) {
    await page.locator(ANSWER_INPUT).first().fill(answer.text);
    await body.getByRole('button', { name: 'Проверить', exact: true }).first().click();
  } else if (answer.option !== undefined) {
    await body
      .locator('.popt')
      .filter({ has: page.locator('.popt__no', { hasText: new RegExp(`^${answer.option}$`) }) })
      .first()
      .click();
    await body.getByRole('button', { name: 'Проверить', exact: true }).first().click();
  } else {
    /* «Узнай метод»: нажатие на метод — это и есть ответ. */
    await body
      .locator('.z4-picker__btn')
      .filter({ has: page.locator('.z4-picker__name', { hasText: answer.method }) })
      .first()
      .click();
  }
}

/** Неверный ответ того же вида, что верный. */
async function wrongOf(page, right) {
  if (right.text !== undefined) {
    return { text: right.text === '987654' ? '987653' : '987654' };
  }
  if (right.option !== undefined) {
    const numbers = await page.locator(`${BODY} .popt .popt__no`).allTextContents();
    return { option: numbers.map((item) => item.trim()).find((item) => item !== right.option) };
  }
  const names = await page.locator(`${BODY} .z4-picker__name`).allTextContents();
  return { method: names.map((item) => item.trim()).find((item) => item !== right.method) };
}

/** Что сейчас введено или выбрано на экране задания — в той же форме, что ответ. */
async function shownAnswer(page, like) {
  if (like.text !== undefined) {
    return { text: await page.locator(ANSWER_INPUT).first().inputValue() };
  }
  if (like.option !== undefined) {
    const chosen = page.locator(`${BODY} .popt.is-chosen .popt__no`);
    return {
      option: (await chosen.count()) === 0 ? null : (await chosen.first().textContent()).trim(),
    };
  }
  const pressed = page.locator(`${BODY} .z4-picker__btn[aria-pressed="true"] .z4-picker__name`);
  return {
    method: (await pressed.count()) === 0 ? null : (await pressed.first().textContent()).trim(),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Вердикт «Верно» на экране задания («Неверно» с маленькой «в» не подходит). */
async function verdictRight(page) {
  try {
    await page
      .locator(`${BODY} [role="status"]`, { hasText: /Верно/ })
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/** К следующему заданию: «Следующее задание →», «Следующая задача →», «Следующая», «Пропустить». */
async function goNext(page) {
  const body = page.locator(BODY);
  const next = body.getByRole('button', { name: /^(Следующ|Дальше|Далее)/ });
  if ((await next.count()) > 0) {
    await next.first().click();
  } else {
    await body
      .getByRole('button', { name: /^Пропустить/ })
      .first()
      .click();
  }
}

/** Условие текущего задания: по нему сравниваются вкладки. */
async function questionOf(page) {
  return (await page.locator(QUESTION).first().innerHTML()).trim();
}

/** Начать тренировку и дождаться панели и первой записи экрана. */
async function startRun(page, trainer) {
  await (trainer.start ?? pressStart)(page);
  await waitBar(page);
  return waitRecord(page, trainer.scope, (record) => record.ui !== null);
}

/** Метка на вкладке «Тренажёр». */
async function tabDot(page) {
  const tab = page.locator('.tabs a, .tabs button', { hasText: 'Тренажёр' }).first();
  try {
    await tab.locator('.tabs__dot').waitFor({ state: 'attached', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/** Сколько в итогах: строки «Верно», «Неверно», «Пропущено». */
async function summaryRows(page) {
  await page.locator('.tdone__rows').waitFor({ state: 'visible' });
  return page
    .locator('.tdone__rows .tdone__row')
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((row) => [
          row.querySelector('dt')?.textContent?.trim(),
          row.querySelector('dd')?.textContent?.trim(),
        ]),
      ),
    );
}

async function finishRun(page) {
  await page
    .locator('.tsess__bar')
    .getByRole('button', { name: /Завершить/ })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
}

/** Каждый сценарий — в своём контексте: чистое хранилище и своя вкладка. */
async function inContext(what, run) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    await run(context);
  } catch (error) {
    /* Строка сценария, на которой упало: по ней видно, какой шаг. */
    const at = (error.stack ?? '')
      .split('\n')
      .find((line) => line.includes('check-trainer-sessions'));
    check(
      false,
      `${what}: сценарий упал — ${error.message.split('\n')[0]}` +
        (at === undefined ? '' : ` (${at.trim().replace(/^at .*?([\w-]+\.mjs:\d+).*$/, '$1')})`),
    );
  } finally {
    await context.close();
  }
}

/* ── 1–2. Старт, верный и неверный ответ, перезагрузка, итоги ── */

async function basicScenario(trainer) {
  await inContext(trainer.name, async (context) => {
    const page = await newPage(context);
    const tag = trainer.name;
    await open(page, trainer.url);
    let record = await startRun(page, trainer);
    if (!check(record !== null, `${tag}: после старта есть запись ${KEY(trainer.scope)}`)) {
      return;
    }
    if (trainer.tabs === false) {
      console.log(`  —   ${tag}: ленты вкладок на странице нет, метка не проверяется`);
    } else {
      check(await tabDot(page), `${tag}: метка на вкладке «Тренажёр»`);
    }
    const total = totalOf(record);

    const right = await trainer.answer(record.payload, poolIndex(record, 0));
    await give(page, right);
    check(
      await verdictRight(page),
      `${tag}: задание 1, верный ответ ${JSON.stringify(right)} — «Верно»`,
    );
    record = await waitRecord(page, trainer.scope, (item) => item.ui?.marks?.[0] === 'right');
    check(record !== null, `${tag}: в записи ui.marks[0] = 'right'`);
    check((await solvedOnBar(page)) === '1', `${tag}: в панели «решено 1»`);

    await goNext(page);
    await page.waitForFunction(
      ([key]) => JSON.parse(localStorage.getItem(key) ?? 'null')?.ui?.index === 1,
      [KEY(trainer.scope)],
    );
    const right2 = await trainer.answer(record.payload, poolIndex(record, 1));
    const wrong = await wrongOf(page, right2);
    await give(page, wrong);
    record = await waitRecord(page, trainer.scope, (item) => item.ui?.tried?.[1] === true);
    check(record !== null, `${tag}: задание 2, неверный ответ — в записи ui.tried[1] = true`);

    /* Перезагрузка: всё на месте. */
    await page.reload({ waitUntil: 'load' });
    await waitBar(page);
    await page.locator(QUESTION).first().waitFor({ state: 'visible' });
    record = await readRecord(page, trainer.scope);
    check(record?.ui?.marks?.[0] === 'right', `${tag}: после перезагрузки задание 1 засчитано`);
    check(record?.ui?.index === 1, `${tag}: после перезагрузки открыто задание 2`);
    check((await solvedOnBar(page)) === '1', `${tag}: после перезагрузки в панели «решено 1»`);
    const shown = await shownAnswer(page, wrong);
    check(
      same(shown, wrong),
      `${tag}: на задании 2 неверный ответ на месте (${JSON.stringify(shown)})`,
    );

    await finishRun(page);
    const rows = await summaryRows(page);
    check(
      rows['Верно'] === '1' && rows['Неверно'] === '1' && rows['Пропущено'] === String(total - 2),
      `${tag}: итоги — Верно 1, Неверно 1, Пропущено ${total - 2} (${JSON.stringify(rows)})`,
    );
    const items = page.locator('.tsum__list .tsum__item');
    const first = await items.nth(0).getAttribute('class');
    const second = await items.nth(1).getAttribute('class');
    check(
      /tsum__item--right/.test(first ?? '') && /tsum__item--wrong/.test(second ?? ''),
      `${tag}: в списке итогов задание 1 «Верно», задание 2 «Неверно»`,
    );
    check(await waitNoRecord(page, trainer.scope), `${tag}: после итогов записи нет`);
    check(!page.errors, `${tag}: без ошибок на странице`);
  });
}

/* ── 4. Вопрос «продолжить или начать новую» ─────────────────── */

async function unfinishedDialogScenario(trainer) {
  await inContext(`${trainer.name} (две вкладки, вопрос)`, async (context) => {
    const tag = `${trainer.name}, вопрос о незавершённой`;
    /* B и C открыты, пока тренировки нет: у них виден выбор. */
    const b = await newPage(context);
    await open(b, trainer.url);
    const c = await newPage(context);
    await open(c, trainer.url);
    const a = await newPage(context);
    await open(a, trainer.url);
    let record = await startRun(a, trainer);
    if (!check(record !== null, `${tag}: в A тренировка начата`)) {
      return;
    }
    await give(a, await trainer.answer(record.payload, poolIndex(record, 0)));
    record = await waitRecord(a, trainer.scope, (item) => item.ui?.marks?.[0] === 'right');
    const total = totalOf(record);
    const questionA = await questionOf(a);

    await b.bringToFront();
    await (trainer.start ?? pressStart)(b);
    const dialog = b.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    const text = (await dialog.textContent()) ?? '';
    check(
      text.includes(`У вас есть незавершённая тренировка (решено 1 из ${total})`),
      `${tag}: в B вопрос «У вас есть незавершённая тренировка (решено 1 из ${total})…»`,
    );
    await dialog.getByRole('button', { name: 'Продолжить старую' }).click();
    await waitBar(b);
    await b.locator(QUESTION).first().waitFor({ state: 'visible' });
    check(
      (await questionOf(b)) === questionA,
      `${tag}: «Продолжить старую» открыла ту же тренировку`,
    );
    check((await solvedOnBar(b)) === '1', `${tag}: в B «решено 1», как в A`);
    check(
      (await readRecord(b, trainer.scope))?.id === record.id,
      `${tag}: тренировка та же (id записи)`,
    );

    await c.bringToFront();
    await (trainer.start ?? pressStart)(c);
    const dialogC = c.getByRole('dialog');
    await dialogC.waitFor({ state: 'visible' });
    await dialogC.getByRole('button', { name: 'Начать новую' }).click();
    await waitBar(c);
    const fresh = await waitRecord(c, trainer.scope, (item) => item.id !== record.id);
    check(fresh !== null, `${tag}: «Начать новую» записала новую тренировку`);
    try {
      await a.getByText('В другой вкладке начата новая тренировка').waitFor({ state: 'visible' });
      check(true, `${tag}: в A — «В другой вкладке начата новая тренировка»`);
    } catch {
      check(false, `${tag}: в A — «В другой вкладке начата новая тренировка»`);
    }
  });
}

/* ── 5. Две вкладки в одной тренировке ───────────────────────── */

async function twoTabsScenario(trainer) {
  await inContext(`${trainer.name} (две вкладки)`, async (context) => {
    const tag = `${trainer.name}, две вкладки`;
    const a = await newPage(context);
    await open(a, trainer.url);
    const record = await startRun(a, trainer);
    if (!check(record !== null, `${tag}: в A тренировка начата`)) {
      return;
    }
    const b = await newPage(context);
    await open(b, trainer.url);
    await waitBar(b);
    await b.locator(QUESTION).first().waitFor({ state: 'visible' });
    await give(b, await trainer.answer(record.payload, poolIndex(record, 0)));
    const after = await waitRecord(b, trainer.scope, (item) => item.ui?.marks?.[0] === 'right');
    check(after !== null, `${tag}: в B задание 1 решено`);
    const cover = a.getByText('Тренировка продолжена в другой вкладке');
    try {
      await cover.waitFor({ state: 'visible' });
      check(true, `${tag}: в A — «Тренировка продолжена в другой вкладке»`);
    } catch {
      check(false, `${tag}: в A — «Тренировка продолжена в другой вкладке»`);
      return;
    }
    await a.bringToFront();
    await a.getByRole('button', { name: 'Продолжить здесь' }).click();
    await a.locator(QUESTION).first().waitFor({ state: 'visible' });
    check(
      (await solvedOnBar(a)) === '1',
      `${tag}: «Продолжить здесь» — в A «решено 1», как сделано в B`,
    );
    check(await verdictRight(a), `${tag}: в A виден вердикт «Верно» из B`);
    try {
      await b.getByText('Тренировка продолжена в другой вкладке').waitFor({ state: 'visible' });
      check(true, `${tag}: теперь остановлена B`);
    } catch {
      check(false, `${tag}: теперь остановлена B`);
    }
  });
}

/* ── 6. №11: выбранный вариант переживает перезагрузку ──────── */

async function choiceScenario() {
  const trainer = TRAINERS.find((item) => item.scope === '11');
  await inContext('№11, вариант ответа', async (context) => {
    const tag = '№11, ответ выбором варианта (RZ-17)';
    const page = await newPage(context);
    /* ?tip= отмечает один подтип — как ссылка «Решать» из теории. */
    await open(page, `${trainer.url}?tip=RZ-17`);
    const record = await startRun(page, { ...trainer, start: pressStart });
    if (!check(record !== null, `${tag}: тренировка начата`)) {
      return;
    }
    const options = page.locator(`${BODY} .popt`);
    if (!check((await options.count()) > 0, `${tag}: у задания 1 есть варианты .popt`)) {
      return;
    }
    const right = await trainer.answer(record.payload, poolIndex(record, 0));
    const wrong = await wrongOf(page, right);
    await page
      .locator(`${BODY} .popt`)
      .filter({ has: page.locator('.popt__no', { hasText: new RegExp(`^${wrong.option}$`) }) })
      .first()
      .click();
    check(
      (await waitRecord(page, trainer.scope, (item) => item.ui?.value === wrong.option)) !== null,
      `${tag}: выбор варианта ${wrong.option} записан`,
    );
    await page.reload({ waitUntil: 'load' });
    await waitBar(page);
    await page.locator(`${BODY} .popt`).first().waitFor({ state: 'visible' });
    const shown = await shownAnswer(page, wrong);
    check(same(shown, wrong), `${tag}: после перезагрузки выбран тот же вариант (${shown.option})`);
  });
}

/* ── 10. Вход по ссылке на набор при незавершённой тренировке ─ */

/* Ярлык режима (/trenazher/<режим>/) или ?tip= не уводят молча в старую
   тренировку: оболочка спрашивает. «Продолжить старую» — та же
   тренировка; «Начать новую» — запись стёрта, открыт выбор по ссылке. */
async function entryLinkScenario(trainer, link, tag) {
  await inContext(tag, async (context) => {
    const page = await newPage(context);
    await open(page, trainer.url);
    const record = await startRun(page, trainer);
    if (!check(record !== null, `${tag}: тренировка начата`)) {
      return;
    }
    const question = await questionOf(page);
    const dialog = page.getByRole('dialog');

    await open(page, link);
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    check(
      /незавершённая тренировка/.test((await dialog.textContent()) ?? ''),
      `${tag}: по ссылке — вопрос «продолжить или начать новую»`,
    );
    check((await page.locator('.tsess__bar').count()) === 0, `${tag}: молча в старую не увело`);
    await dialog.getByRole('button', { name: 'Продолжить старую' }).click();
    await waitBar(page);
    check((await questionOf(page)) === question, `${tag}: «Продолжить старую» — та же тренировка`);

    await open(page, link);
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    await dialog.getByRole('button', { name: 'Начать новую' }).click();
    check(await waitNoRecord(page, trainer.scope), `${tag}: «Начать новую» — старая запись стёрта`);
    check(
      (await page.locator('.tsess__bar').count()) === 0 &&
        (await page.getByRole('button', { name: /Начать тренировку|Начать|Решать/ }).count()) > 0,
      `${tag}: открыт выбор тренировки`,
    );
  });
}

/* ── 7. Переполнение хранилища ──────────────────────────────── */

/** Старая тренировка другого раздела: шапка как у настоящей, задания — балласт. */
function oldForeignRecord(scope, size) {
  return (
    `{"schemaVersion":2,"scope":${JSON.stringify(scope)},"id":"old-test","createdAt":1000,` +
    `"updatedAt":1000,"rev":1,"writer":"test","paused":false,"activeMs":0,"total":1,` +
    `"ui":null,"payload":${JSON.stringify('x'.repeat(size))}}`
  );
}

/** Заполнить хранилище посторонним ключом так, чтобы свободно осталось не больше slack знаков. */
async function fillStorage(page, key, slack) {
  return page.evaluate(
    ([name, rest]) => {
      localStorage.removeItem(name);
      let lo = 0;
      let hi = 16 * 1024 * 1024;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        try {
          localStorage.setItem(name, 'x'.repeat(mid));
          lo = mid;
        } catch {
          hi = mid - 1;
        }
      }
      localStorage.setItem(name, 'x'.repeat(Math.max(0, lo - rest)));
      return lo;
    },
    [key, slack],
  );
}

async function quotaScenario(trainer) {
  const foreign = trainer.scope === '8' ? '11' : '8';
  const JUNK = 'budetege:test:junk';
  await inContext(`${trainer.name} (почти полное хранилище)`, async (context) => {
    const tag = `${trainer.name}, хранилище почти полно`;
    const page = await newPage(context);
    /* Заполняется со страницы без тренажёра: ей нечего дописывать. */
    await open(page, '/zadaniya/');
    await page.evaluate(
      ([key, raw]) => localStorage.setItem(key, raw),
      [KEY(foreign), oldForeignRecord(foreign, 200_000)],
    );
    /* Свободно меньше, чем займёт запись тренировки, но проба хранилища (23 знака) проходит. */
    await fillStorage(page, JUNK, 120);
    const junkLength = await page.evaluate((key) => localStorage.getItem(key)?.length, JUNK);
    await open(page, trainer.url);
    const record = await startRun(page, trainer);
    check(record !== null, `${tag}: запись своей тренировки есть`);
    check(
      (await readRecord(page, foreign)) === null,
      `${tag}: старая тренировка раздела ${foreign} вытеснена`,
    );
    check(
      (await page.evaluate((key) => localStorage.getItem(key)?.length, JUNK)) === junkLength,
      `${tag}: посторонний ключ цел`,
    );
    check(
      (await page.getByText('в хранилище браузера не хватает места').count()) === 0,
      `${tag}: плашки о нехватке места нет`,
    );
  });

  await inContext(`${trainer.name} (полное хранилище)`, async (context) => {
    const tag = `${trainer.name}, места нет совсем`;
    const page = await newPage(context);
    await open(page, '/zadaniya/');
    await fillStorage(page, JUNK, 0);
    await open(page, trainer.url);
    await (trainer.start ?? pressStart)(page);
    await waitBar(page);
    check((await readRecord(page, trainer.scope)) === null, `${tag}: записи нет (некуда)`);
    try {
      await page
        .getByText('в хранилище браузера не хватает места')
        .waitFor({ state: 'visible', timeout: 5_000 });
      check(true, `${tag}: плашка «в хранилище браузера не хватает места»`);
    } catch {
      const shown = (await page.locator('.tsess__nosave').allTextContents()).join(' | ');
      check(false, `${tag}: плашка «в хранилище браузера не хватает места» (видно: «${shown}»)`);
    }
    /* Тренировка идёт: ответ проверяется, панель считает. Рецепта в
       записи нет, поэтому задание 1 пропускается неверным ответом. */
    await page.locator(QUESTION).first().waitFor({ state: 'visible' });
    const input = page.locator(ANSWER_INPUT);
    if ((await input.count()) > 0) {
      await give(page, { text: '987654' });
    } else {
      const like =
        (await page.locator(`${BODY} .popt`).count()) > 0 ? { option: '' } : { method: '' };
      await give(page, await wrongOf(page, like));
    }
    await page.locator(`${BODY} [role="status"]`).first().waitFor({ state: 'visible' });
    check(true, `${tag}: тренировка идёт — ответ проверен`);
    check(!page.errors, `${tag}: страница не упала`);
  });
}

/* ── 8. Устаревшая и испорченная запись ─────────────────────── */

async function staleScenario(trainer) {
  for (const [what, raw, text] of [
    [
      'запись схемы 1',
      `{"schemaVersion":1,"scope":${JSON.stringify(trainer.scope)},"id":"v1","createdAt":1,"updatedAt":1,"rev":1,"writer":"t","paused":false,"activeMs":0,"ui":null,"payload":{"tasks":[]}}`,
      'устарела после обновления сайта и сброшена',
    ],
    ['мусор', '{"не запись', 'Не удалось восстановить сохранённую тренировку — она сброшена'],
  ]) {
    await inContext(`${trainer.name} (${what})`, async (context) => {
      const tag = `${trainer.name}, ${what}`;
      const page = await newPage(context);
      /* Подмена — со страницы другого раздела: открытая оболочка этого
         тренажёра при уходе перезаписала бы запись своей. */
      await open(page, '/zadaniya/');
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [KEY(trainer.scope), raw],
      );
      await open(page, trainer.url);
      try {
        await page.getByText(text).waitFor({ state: 'visible', timeout: 10_000 });
        check(true, `${tag}: плашка «…${text.slice(-30)}»`);
      } catch {
        check(false, `${tag}: плашка «…${text.slice(-30)}»`);
      }
      check(
        await page
          .getByRole('button', { name: /^Начать тренировку/ })
          .first()
          .isVisible(),
        `${tag}: выбор тренировки доступен`,
      );
      check((await readRecord(page, trainer.scope)) === null, `${tag}: запись убрана`);
    });
  }
}

/* ── 9. Время восстановления ────────────────────────────────── */

async function restoreTiming(trainer) {
  await inContext(`${trainer.name} (время восстановления)`, async (context) => {
    const page = await newPage(context);
    await open(page, trainer.url);
    await trainer.all(page);
    const record = await startRun(page, trainer);
    if (!check(record !== null, `${trainer.name}, «Все»: тренировка начата`)) {
      return;
    }
    const size =
      (await page.evaluate((key) => localStorage.getItem(key)?.length, KEY(trainer.scope))) ?? 0;
    const from = Date.now();
    await page.reload({ waitUntil: 'commit' });
    await waitBar(page, 60_000);
    const ms = Date.now() - from;
    const note = ms > 5_000 ? '  ПРЕДУПРЕЖДЕНИЕ: дольше 5 с' : '';
    console.log(
      `  ⏱  ${trainer.name}, «Все» (${totalOf(record)} заданий, запись ${Math.round(size / 1024)} КБ): ` +
        `от перезагрузки до панели ${(ms / 1000).toFixed(2)} с${note}`,
    );
  });
}

/* ── Прогон ─────────────────────────────────────────────────── */

const chosen = TRAINERS.filter((item) => ONLY === null || item.name.includes(ONLY));
console.log(`Сборка: ${OUT}\nТренажёров: ${chosen.length}`);

console.log('\n1–2. Старт, верный и неверный ответ, перезагрузка, итоги');
for (const trainer of chosen) {
  await basicScenario(trainer);
}

const reps = chosen.filter((item) => item.rep);
console.log('\n4. Вопрос «продолжить или начать новую»');
for (const trainer of reps) {
  await unfinishedDialogScenario(trainer);
}
console.log('\n5. Две вкладки в одной тренировке');
for (const trainer of reps) {
  await twoTabsScenario(trainer);
}
if (chosen.some((item) => item.scope === '11')) {
  console.log('\n6. №11: вариант ответа после перезагрузки');
  await choiceScenario();
}
console.log('\n10. Вход по ссылке на набор');
for (const [name, link, tag] of [
  [
    '№12 linear',
    '/zadaniya/12/linear/trenazher/value/',
    '№12 linear, ярлык «Найти значение функции»',
  ],
  ['№11', '/zadaniya/11/trenazher/?tip=RZ-17', '№11, ссылка ?tip=RZ-17'],
]) {
  const trainer = chosen.find((item) => item.name === name);
  if (trainer !== undefined) {
    await entryLinkScenario(trainer, link, tag);
  }
}
console.log('\n7. Переполнение хранилища');
for (const trainer of reps) {
  await quotaScenario(trainer);
}
console.log('\n8. Устаревшая и испорченная запись');
for (const trainer of reps) {
  await staleScenario(trainer);
}
console.log('\n9. Время восстановления после перезагрузки');
for (const trainer of chosen.filter(
  (item) => item.name === '№12 quadratic' || item.name === '№2',
)) {
  await restoreTiming(trainer);
}

await browser.close();
server.close();

console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}`);
if (failures.length > 0) {
  console.log('\nНе прошло:');
  failures.forEach((item) => console.log(`  — ${item}`));
  process.exit(1);
}
