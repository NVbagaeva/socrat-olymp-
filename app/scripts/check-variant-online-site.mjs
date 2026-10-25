#!/usr/bin/env node
/* scripts/check-variant-online-site.mjs — онлайн-вариант в собранном
   сайте и в настоящем браузере.

   Запуск: pnpm build && pnpm test:variant-online-site [--shots]

   Сборка app/out поднимается маленьким сервером на node:http, браузер —
   Chromium из Playwright (свой — PW_CHROMIUM=/путь/к/chrome). Верные
   ответы тест считает в Node тем же кодом сайта (lib/variant), что
   собирает вариант в браузере: в разметке до завершения их нет.

   Сценарии:
     1. Контрольная (компьютер): «Начать», ответы — верный, неверный,
        неверная запись «1/2» (подсказка о формате, не сохраняется),
        «вернусь позже». Перезагрузка: ответы, флажок и номер задания
        на месте. «Завершить работу» — в вопросе пустые номера.
        Результат: первичный и тестовый балл, таблица, код результата.
     2. Код результата → /variant/proverka/: тот же разбор и баллы.
     3. Тренировка (телефон): своя клавиатура вместо системной, минус и
        запятая с неё; неверный ответ → подсказка и вторая попытка;
        верный со второй попытки — в баллы не идёт.
     4. Серия из 10 вариантов: страница серии, карточки и статусы,
        статистика серии после трёх завершённых вариантов.
   --shots — снимки экрана в docs/variant-onlayn-snimki/ (телефон и
   компьютер): экран решения, клавиатура, результаты, статистика серии. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { requireSrc, SRC, APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { generatorVersions } from './lib/generator-versions.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const args = process.argv.slice(2);
const SHOTS = args.includes('--shots');
const OUT = path.join(APP, 'out');
const SHOT_DIR = path.join(APP, '..', 'docs', 'variant-onlayn-snimki');
if (!fs.existsSync(path.join(OUT, 'variant', 'reshat', 'index.html'))) {
  console.error('Нет сборки out/variant/reshat/ — сначала pnpm build.');
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

/* ── Варианты в Node: те же задачи, что соберёт браузер ─────────── */

const { buildVariantSet } = requireSrc('lib/variant/build');
const { encodeCode } = requireSrc('lib/variant/code');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');
const { testScore } = requireSrc('lib/variant/online/proverka');
const adapters = new Map();
for (let n = 1; n <= 13; n += 1) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  adapters.set(n, section.init(data == null ? null : JSON.parse(JSON.stringify(data))));
}
const subtypeIds = {};
for (let n = 1; n <= 13; n += 1) subtypeIds[n] = adapters.get(n).info.subtypes.map((s) => s.id);
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const config = { tasks: ALL, subtypes: {}, source: 'mix', stars: [], count: 10, parallel: false };
const SEED = 'K7M2';
/* Версия генератора — как у сборки: иначе страница предупредит, что
   вариант собран другой версией. */
const VERSION = generatorVersions(SRC).variant ?? '00';
const CODE = encodeCode({ seed: SEED, config, zameny: {}, version: VERSION }, subtypeIds);
const SET = buildVariantSet(
  { config, seed: SEED, zameny: {}, version: VERSION, code: CODE },
  adapters,
);
/** Верный ответ задания i варианта v — как вводит ученик: «-2,25». */
const answerOf = (v, i) =>
  normalizeAnswer(SET.variants[v - 1].tasks[i].answer).value.replace('.', ',');
console.log(`Серия ${CODE}`);

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

const reshat = (v, mode, tm = '0') =>
  `${BASE}/variant/reshat/?kod=${encodeURIComponent(CODE)}&v=${v}&r=${mode}&tm=${tm}&w=probnik`;
const seriya = (mode) =>
  `${BASE}/variant/seriya/?kod=${encodeURIComponent(CODE)}&r=${mode}&tm=0&w=probnik`;

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false });
  console.log(`  снимок ${name}.png`);
}

async function begin(page, url) {
  await page.goto(url);
  await page.getByTestId('vo-begin').click({ timeout: 60_000 });
  await page.getByTestId('vo-card').waitFor();
}

async function go(page, i) {
  await page.locator('.vo-strip__no').nth(i).click();
}

/** Ввести ответ с клавиатуры компьютера в задании i. */
async function type(page, i, value) {
  await go(page, i);
  const input = page.getByTestId('vo-input');
  await input.fill(value);
}

const errors = [];

/* ── 1–2. Контрольная на компьютере, перезагрузка, результат ───── */

console.log('1. Контрольная: ответы, перезагрузка, завершение');
const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await welcomeSeen(desk);
const page = await desk.newPage();
page.on('pageerror', (e) => errors.push(String(e)));
await begin(page, reshat(2, 'k', '90'));
await type(page, 0, answerOf(2, 0));
/* Время на задание: 2,5 с на первом — в таблице результатов 2–3 с. */
await page.waitForTimeout(2500);
await type(page, 1, '12345');
await type(page, 2, '1/2');
ok(
  (await page.locator('.vo-answer__hint.is-problem').textContent())?.includes('десятичной') ===
    true,
  'подсказка о формате на «1/2»',
  'нет подсказки',
);
await go(page, 3);
await page.locator('.vo-later input').check();
await go(page, 4);
ok(
  (await page.locator('.vo-strip__no').nth(0).getAttribute('data-status')) === 'answered',
  'статус «ответ введён»',
  'нет',
);
ok(
  (await page.locator('.vo-strip__no').nth(2).getAttribute('data-status')) === 'empty',
  '«1/2» не сохранён как ответ',
  'сохранён',
);
ok(
  (await page.locator('.vo-strip__no').nth(3).getAttribute('data-status')) === 'later',
  'статус «вернусь позже»',
  'нет',
);
await shot(page, 'reshenie-kompyuter');
await page.waitForTimeout(400);
await page.reload();
await page.getByTestId('vo-card').waitFor({ timeout: 60_000 });
ok(
  (await page.locator('.vo-strip__no.is-current').textContent())?.trim() === '5',
  'после перезагрузки — то же задание',
  'другое',
);
ok(
  (await page.locator('.vo-strip__no').nth(3).getAttribute('data-status')) === 'later',
  'после перезагрузки — «вернусь позже»',
  'потерян',
);
await go(page, 0);
ok(
  (await page.getByTestId('vo-input').inputValue()) === answerOf(2, 0),
  'после перезагрузки — ответ на месте',
  'потерян',
);
await go(page, 1);
ok(
  (await page.getByTestId('vo-input').inputValue()) === '12345',
  'после перезагрузки — второй ответ',
  'потерян',
);
await page.getByTestId('vo-finish').click();
const question = await page.locator('.modal').textContent();
ok(
  question?.includes('№3') === true && question.includes('№13') === true,
  'в вопросе — пустые номера',
  question ?? '',
);
await page.getByTestId('vo-confirm').click();
await page.getByTestId('vo-result').waitFor({ timeout: 60_000 });
ok(
  (await page.getByTestId('vo-primary').textContent())?.includes('1 из 13') === true,
  'первичный балл 1 из 13',
  (await page.getByTestId('vo-primary').textContent()) ?? '',
);
ok(
  (await page.getByTestId('vo-test').textContent())?.includes(String(testScore(1))) === true,
  'тестовый балл по шкале',
  (await page.getByTestId('vo-test').textContent()) ?? '',
);
ok(
  (await page.locator('.vo-table tbody tr.is-right').count()) === 1,
  'в таблице одно верное',
  'не так',
);
const t1 =
  (await page.locator('.vo-table tbody tr').first().locator('td').nth(3).textContent()) ?? '';
ok(/^[23] с$/.test(t1.trim()), 'время на задание записано', t1);
ok(
  page.url().includes('/variant/reshat/') && (await page.locator('.vo-warn').count()) === 0,
  'нет предупреждения о версии',
  'есть',
);
await shot(page, 'rezultat-kompyuter');
const code = (await page.getByTestId('vo-result-code').textContent())?.trim() ?? '';
ok(code.startsWith(CODE + '_'), 'код результата', code);
ok(
  (await page.evaluate(
    (k) => localStorage.getItem(k),
    `budetege:trainer:variant:${CODE}:2:k:session`,
  )) === null,
  'сессия удалена после завершения',
  'осталась',
);

console.log('2. Проверка результата учителем');
const teacher = await desk.newPage();
await teacher.goto(`${BASE}/variant/proverka/`);
await teacher.getByTestId('vo-proverka-input').fill(code);
await teacher.getByTestId('vo-proverka-open').click();
await teacher.getByTestId('vo-result').waitFor({ timeout: 60_000 });
ok(
  (await teacher.getByTestId('vo-primary').textContent())?.includes('1 из 13') === true,
  'у учителя тот же балл',
  'другой',
);
ok(
  (await teacher.locator('.vo-table tbody tr').first().textContent())?.includes(
    answerOf(2, 0).replace('-', '−'),
  ) === true,
  'у учителя ответ ученика',
  'нет',
);
await teacher.locator('.vo-table .vo-link').first().click();
ok((await teacher.locator('.vo-table__razbor').count()) === 1, 'разбор открывается', 'нет');
await shot(teacher, 'proverka-kompyuter');
await teacher.close();

/* ── 3. Тренировка на телефоне ──────────────────────────────────── */

console.log('3. Тренировка на телефоне: клавиатура, подсказки, вторая попытка');
const phone = await browser.newContext({ ...devices['iPhone 13'] });
await welcomeSeen(phone);
const mob = await phone.newPage();
mob.on('pageerror', (e) => errors.push(String(e)));
await begin(mob, reshat(1, 't'));
ok((await mob.locator('.keypad').count()) === 1, 'своя клавиатура на телефоне', 'нет');
ok(
  (await mob.getByTestId('vo-input').getAttribute('inputmode')) === 'none',
  'системная клавиатура не открывается',
  'inputmode не none',
);
/* Задание с подсказками-вопросами: №6, 7, 9, 10, 11, 13 — берём №7. */
const i7 = 6;
await mob.locator('.vo-strip__no').nth(i7).click();
await mob.locator('.keypad__key[data-key="-"]').click();
await mob.locator('.keypad__key[data-key="9"]').click();
await mob.locator('.keypad__key[data-key=","]').click();
await mob.locator('.keypad__key[data-key="5"]').click();
ok(
  (await mob.getByTestId('vo-input').inputValue()) === '-9,5',
  'минус и запятая с клавиатуры',
  await mob.getByTestId('vo-input').inputValue(),
);
await shot(mob, 'klaviatura-telefon');
await mob.getByTestId('vo-check').click();
await mob.locator('.vo-verdict.is-wrong').first().waitFor();
ok((await mob.locator('.pc-hint').count()) === 1, 'после ошибки — подсказка по шагам', 'нет');
await shot(mob, 'podskazka-telefon');
for (let k = 0; k < 6; k += 1) await mob.locator('.keypad__key[data-key="erase"]').click();
for (const ch of answerOf(1, i7)) await mob.locator(`.keypad__key[data-key="${ch}"]`).click();
await mob.getByTestId('vo-check').click();
await mob.locator('.vo-verdict.is-right').waitFor();
ok(
  (await mob.locator('.vo-strip__no').nth(i7).getAttribute('data-status')) === 'wrong',
  'в ленте — первая попытка (неверно)',
  'нет',
);
/* Задание 1 — верно с первой попытки. */
await mob.locator('.vo-strip__no').nth(0).click();
for (const ch of answerOf(1, 0)) await mob.locator(`.keypad__key[data-key="${ch}"]`).click();
await mob.getByTestId('vo-check').click();
await mob.locator('.vo-verdict.is-right').waitFor();
await shot(mob, 'reshenie-telefon');
await mob.getByTestId('vo-finish').click();
await mob.getByTestId('vo-confirm').click();
await mob.getByTestId('vo-result').waitFor({ timeout: 60_000 });
ok(
  (await mob.getByTestId('vo-primary').textContent())?.includes('1 из 13') === true,
  'в баллы — только первая попытка',
  (await mob.getByTestId('vo-primary').textContent()) ?? '',
);
await shot(mob, 'rezultat-telefon');

/* ── 4. Серия ───────────────────────────────────────────────────── */

console.log('4. Серия: карточки и статистика');
/* Ещё два варианта контрольной: часть ответов верна. */
for (const v of [1, 3]) {
  await begin(page, reshat(v, 'k'));
  for (let i = 0; i < 13; i += 1) {
    if ((i + v) % 3 !== 0) await type(page, i, answerOf(v, i));
    /* Для снимков статистики — немного времени на задание. */
    if (SHOTS) await page.waitForTimeout(300 + ((i * 7 + v * 3) % 10) * 150);
  }
  await page.getByTestId('vo-finish').click();
  await page.getByTestId('vo-confirm').click();
  await page.getByTestId('vo-result').waitFor({ timeout: 60_000 });
}
/* Вариант 4 — начат, но не завершён. */
await begin(page, reshat(4, 'k'));
await type(page, 0, '1');
await page.waitForTimeout(400);
await page.goto(seriya('k'));
await page.getByTestId('vo-series').waitFor({ timeout: 60_000 });
const cards = page.locator('.vo-vcard');
ok((await cards.count()) === 10, '10 карточек', String(await cards.count()));
const st = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
ok(
  st[0] === 'done' && st[1] === 'done' && st[2] === 'done' && st[3] === 'run' && st[4] === 'none',
  'статусы карточек',
  st.join(','),
);
ok((await page.getByTestId('vo-stats').count()) === 1, 'статистика серии', 'нет');
ok(
  (await page.locator('.vo-heat__cell').count()) === 13,
  'тепловая карта 1–13',
  String(await page.locator('.vo-heat__cell').count()),
);
await shot(page, 'seriya-kompyuter');
await page.locator('.vo-series__stats').scrollIntoViewIfNeeded();
await shot(page, 'statistika-serii-kompyuter');
/* Телефон с тем же хранилищем, что у завершённых работ. */
const narrow = await desk.newPage();
await narrow.setViewportSize({ width: 390, height: 844 });
await narrow.goto(seriya('k'));
await narrow.getByTestId('vo-series').waitFor({ timeout: 60_000 });
await shot(narrow, 'seriya-telefon');
await narrow.locator('.vo-series__stats').scrollIntoViewIfNeeded();
await shot(narrow, 'statistika-serii-telefon');

/* ── 5. Экран «Собрать вариант»: «Решать онлайн» и «Создать серию» ── */

console.log('5. «Собрать вариант»: ссылка ученику и серия');
const build = await desk.newPage();
build.on('pageerror', (e) => errors.push(String(e)));
await build.goto(`${BASE}/variant/`);
await build.getByRole('button', { name: 'Сформировать' }).click();
await build.getByTestId('vo-panel').waitFor({ timeout: 120_000 });
ok(
  (await build.getByTestId('vo-kit-online').count()) === 1,
  '«Решать онлайн» рядом с листами',
  'нет',
);
const studentLink = (await build.getByTestId('vo-link').textContent()) ?? '';
ok(
  /\/variant\/reshat\/\?kod=[^&]+&v=1&r=[tk]&tm=/.test(studentLink),
  'ссылка для ученика',
  studentLink,
);
ok((await build.locator('.vo-panel .qr').count()) >= 1, 'QR-код ссылки', 'нет');
await build.getByTestId('vo-series').click();
await build.getByTestId('vo-series-link').waitFor({ timeout: 120_000 });
const seriesLink = (await build.getByTestId('vo-series-link').textContent()) ?? '';
ok(
  /\/variant\/seriya\/\?kod=[0-9A-Z]{4}-[0-9A-Z]{5}-/.test(seriesLink),
  'ссылка на серию',
  seriesLink,
);
ok(
  (await build.locator('.var-tabs__btn').count()) === 10,
  'серия — 10 вариантов',
  String(await build.locator('.var-tabs__btn').count()),
);
await build.getByTestId('vo-panel').scrollIntoViewIfNeeded();
await shot(build, 'sobrat-variant-onlayn');

ok(errors.length === 0, 'ошибок на страницах нет', errors.join('\n'));

await browser.close();
server.close();
console.log(failures === 0 ? '\nВсё в порядке.' : `\nОшибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
