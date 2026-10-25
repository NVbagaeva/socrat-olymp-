#!/usr/bin/env node
/* scripts/check-variant-kabinet-site.mjs — онлайн-вариант через кабинет
   (этап 2) в собранном сайте и в браузере.

   Запуск: KABINET=1 pnpm build && pnpm test:variant-kabinet-site [--shots]

   Пробный кабинет (админ, репетитор, класс, двое учеников) готовится на
   Node тем же кодом (lib/kabinet/localApi) и кладётся в localStorage
   браузера. Дальше — как у людей:
     1. Репетитор: «Собрать вариант» → «Выдать через кабинет» → форма
        выдачи с кодом из адреса → «Выдать» классу.
     2. Ученик: кабинет → работа → вариант → «Начать»; верный ответ,
        неверный (подсказка с сервера), «Завершить работу» → результат.
        Ответы в браузере до завершения не видны: тест берёт ключ из
        хранилища пробного кабинета (на сервере его не взять никому).
     3. Репетитор: таблица «ученики × номера», средние, работа ученика,
        выгрузка в Excel (файл читается).
     4. Ученик: статистика по вариантам в кабинете.
   --shots — снимки в docs/variant-onlayn-snimki/ (этап 2). */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const SHOTS = process.argv.includes('--shots');
const OUT = path.join(APP, 'out');
const SHOT_DIR = path.join(APP, '..', 'docs', 'variant-onlayn-snimki');
if (!fs.existsSync(path.join(OUT, 'kabinet', 'rabota', 'index.html'))) {
  console.error('Нет out/kabinet/rabota/ — соберите с KABINET=1.');
  process.exit(1);
}

let failures = 0;
function ok(cond, what) {
  if (cond) console.log(`  ✓ ${what}`);
  else {
    failures += 1;
    console.error(`  ✗ ${what}`);
  }
}

/* ── Пробный кабинет на Node ──────────────────────────────────────── */
const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
    key: (i) => [...memory.keys()][i] ?? null,
    get length() {
      return memory.size;
    },
  },
  addEventListener() {},
  removeEventListener() {},
};
const { createLocalApi } = requireSrc('lib/kabinet/localApi');
const { KABINET_KEY } = requireSrc('lib/kabinet/localDb');
const api = createLocalApi();
const form = (name, email) => ({
  name,
  email,
  birthYear: 2000,
  parentEmail: null,
  grade: 11,
  acceptSoglashenie: true,
  acceptSoglasie: true,
});
await api.bootstrapAdmin(form('Наталья', 'admin@x.ru'));
await api.register(await api.createInvitation('tutor'), form('Репетитор Анна', 't@x.ru'));
const tutorId = (await api.me()).id;
const classId = await api.createClass('11 «А»');
const inv1 = await api.createInvitation('student', classId);
const inv2 = await api.createInvitation('student', classId);
await api.register(inv1, form('Ученик Пётр', 's1@x.ru'));
const s1 = (await api.me()).id;
api.trial.signIn(tutorId);
await api.register(inv2, form('Ученица Вера', 's2@x.ru'));
const s2 = (await api.me()).id;
api.trial.signIn(tutorId);
const SEED_DB = memory.get(KABINET_KEY);

/* ── Сервер над out/ ──────────────────────────────────────────────── */
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
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
await welcomeSeen(context);
await context.addInitScript(
  ([key, db]) => {
    try {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, db);
    } catch {
      /* без хранилища кабинета не будет — тест упадёт ниже */
    }
  },
  [KABINET_KEY, SEED_DB],
);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

async function shot(p, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await p.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
  console.log(`  снимок ${name}.png`);
}
async function signIn(id) {
  await page.evaluate(
    ([key, uid]) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.currentUserId = uid;
      localStorage.setItem(key, JSON.stringify(db));
    },
    [KABINET_KEY, id],
  );
}
const db = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KABINET_KEY);

try {
  console.log('1. Репетитор выдаёт вариант из «Собрать вариант»');
  await page.goto(`${BASE}/variant/`);
  await page.getByRole('button', { name: 'Сформировать' }).click();
  await page.getByTestId('vo-to-kabinet').waitFor({ timeout: 120_000 });
  await page.getByTestId('vo-to-kabinet').click();
  await page.getByTestId('vo-issue').waitFor();
  await page.locator('select').first().waitFor();
  await page.getByLabel('Весь класс').waitFor();
  await page.getByText(/Какие варианты выдать/).waitFor({ timeout: 120_000 });
  ok(
    (await page.getByTestId('vo-issue-code').inputValue()).length > 6,
    'код партии пришёл из «Собрать вариант»',
  );
  await page.getByLabel('Весь класс').selectOption({ label: '11 «А» (2)' });
  await page.getByLabel('Режим').selectOption('trening');
  await shot(page, 'kabinet-vydat-variant');
  await page.getByTestId('vo-issue-submit').click();
  await page.getByTestId('vo-issued').click();
  await page.getByTestId('vo-class').waitFor();
  const workId = new URL(page.url()).searchParams.get('id');
  ok(workId !== null, 'работа выдана, открыта её страница');
  const keys = (await db()).variantKeys.filter((k) => k.workId === workId && k.variant === 1);
  ok(keys.length === 13, 'ключ — 13 ответов, на «сервере»');

  console.log('2. Ученик решает в кабинете');
  await signIn(s1);
  await page.goto(`${BASE}/kabinet/proba/`);
  await page.getByTestId('student-variants').getByRole('link').first().click();
  await page.getByTestId('vo-kab-start-1').click();
  await page.getByTestId('vo-begin').click();
  await page.getByTestId('vo-card').waitFor();
  ok(
    !/"answer"/.test(
      JSON.stringify((await db()).variantTasks.find((t) => t.workId === workId) ?? {}),
    ),
    'условия без ответа',
  );
  const answer = (pos) => keys.find((k) => k.position === pos).answer.replace('.', ',');
  await page.getByTestId('vo-input').fill(answer(1));
  await page.getByTestId('vo-check').click();
  await page.locator('.vo-verdict.is-right').waitFor();
  await page.locator('.vo-strip__no').nth(6).click();
  await page.getByTestId('vo-input').fill('987654321');
  await page.getByTestId('vo-check').click();
  await page.locator('.vo-verdict.is-wrong').first().waitFor();
  const hintsShown =
    (await page.locator('.pc-hint').count()) > 0 || (await page.locator('.vo-steps').count()) > 0;
  ok(hintsShown, 'после ошибки — подсказка (с сервера)');
  await shot(page, 'kabinet-reshenie');
  await page.getByTestId('vo-finish').click();
  await page.getByTestId('vo-confirm').click();
  await page.getByTestId('vo-result').waitFor({ timeout: 60_000 });
  ok(
    (await page.getByTestId('vo-primary').textContent())?.includes('1 из 13') === true,
    'результат: 1 из 13',
  );
  const att = (await db()).variantAttempts.find((a) => a.workId === workId && a.studentId === s1);
  ok(att?.finishedAt != null && att.primary === 1, 'итог записан в кабинет');

  /* Вторая ученица — все верно, через проверку на «сервере». */
  await signIn(s2);
  await page.goto(`${BASE}/kabinet/rabota/?id=${workId}&v=1`);
  await page.getByTestId('vo-begin').click();
  await page.getByTestId('vo-card').waitFor();
  for (let i = 0; i < 13; i += 1) {
    await page.locator('.vo-strip__no').nth(i).click();
    await page.getByTestId('vo-input').fill(answer(i + 1));
    await page.getByTestId('vo-check').click();
    await page.locator('.vo-verdict.is-right').waitFor();
  }
  await page.getByTestId('vo-finish').click();
  await page.getByTestId('vo-confirm').click();
  await page.getByTestId('vo-result').waitFor({ timeout: 60_000 });
  ok(
    (await page.getByTestId('vo-primary').textContent())?.includes('13 из 13') === true,
    'вторая ученица: 13 из 13',
  );

  console.log('3. Репетитор: результаты класса и Excel');
  await signIn(tutorId);
  await page.goto(`${BASE}/kabinet/rabota/?id=${workId}`);
  await page.getByTestId('vo-class').waitFor();
  ok((await page.locator('.vo-class tbody tr').count()) === 2, 'в таблице двое учеников');
  ok((await page.getByTestId('vo-avg-0').textContent())?.trim() === '100%', 'среднее по №1 — 100%');
  ok((await page.getByTestId('vo-avg-6').textContent())?.trim() === '50%', 'среднее по №7 — 50%');
  await shot(page, 'kabinet-rezultaty-klassa');
  await page.locator('.vo-class__name', { hasText: 'Ученик Пётр' }).click();
  await page.locator('.vo-class__open .vo-result').waitFor();
  ok(
    (await page.locator('.vo-class__open .vo-table tbody tr.is-right').count()) === 1,
    'работа ученика: одно верное',
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('vo-excel').click(),
  ]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-'));
  // Имя файла (по-русски, excelName) проверяет check-variant-kabinet:
  // headless-Chromium отдаёт для не-ASCII имени «download».
  const file = path.join(dir, 'rezultaty.xlsx');
  await download.saveAs(file);
  const py = spawnSync(
    'python3',
    [
      '-c',
      'import sys,openpyxl;ws=openpyxl.load_workbook(sys.argv[1]).active;print(ws.max_row, ws["A2"].value, ws["C3"].value)',
      file,
    ],
    { encoding: 'utf8' },
  );
  if (py.status === 0) ok(/^4 /.test(py.stdout.trim()), `Excel читается: ${py.stdout.trim()}`);
  else ok(spawnSync('unzip', ['-t', file]).status === 0, 'архив .xlsx цел');
  fs.rmSync(dir, { recursive: true, force: true });
  const narrow = await context.newPage();
  await narrow.setViewportSize({ width: 390, height: 844 });
  await narrow.goto(`${BASE}/kabinet/rabota/?id=${workId}`);
  await narrow.getByTestId('vo-class').waitFor();
  await shot(narrow, 'kabinet-rezultaty-telefon');
  await narrow.close();

  console.log('4. Ученик: статистика в кабинете');
  await signIn(s1);
  await page.goto(`${BASE}/kabinet/proba/`);
  await page.getByTestId('vo-stats').waitFor();
  ok(
    (await page.locator('.vo-heat__cell').count()) === 13,
    'статистика по вариантам в кабинете ученика',
  );
  await page.getByTestId('student-variants').scrollIntoViewIfNeeded();
  await shot(page, 'kabinet-uchenik');
} catch (e) {
  failures += 1;
  console.error(`  ✗ ${e.message}`);
  await page
    .screenshot({ path: path.join(os.tmpdir(), 'variant-kabinet-fail.png') })
    .catch(() => undefined);
}

ok(errors.length === 0, `ошибок на страницах нет${errors.length ? `: ${errors.join('; ')}` : ''}`);
await browser.close();
server.close();
console.log(failures === 0 ? '\nВсё в порядке.' : `\nОшибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
