#!/usr/bin/env node
/* scripts/check-chast2-site.mjs — часть 2 онлайн в браузере.

   Нужен запущенный сайт со служебными страницами кабинета:
     pnpm dev          (или сборка с KABINET=1 и раздача out/)
     BASE=http://localhost:3000 node scripts/check-chast2-site.mjs [--shots]

   1. Самопроверка без входа (компьютер): MathLive, сверка ответа,
      решение и критерии, свой балл, счётчик на итогах.
   2. Ученик, работа из кабинета (телефон): не-фото отклоняется, поворот
      по EXIF, редактор (выпрямление, обрезка, «как скан»), HEIC, обрыв
      связи (фото ждёт и уходит), ответы сохраняются в работу, проверка
      перед отправкой, «На проверке».
   3. Учитель (компьютер): выдача, счётчик, чужой учитель не видит работу,
      пометки на фото, баллы по критериям, правка части 1, завершение,
      повторное открытие, история, Excel; ученик видит «Проверено».

   --shots кладёт снимки в docs/chast2-snimki/. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const FIX = path.join(HERE, 'fixtures', 'chast2');
const SHOTS = path.join(ROOT, 'docs', 'chast2-snimki');
const BASE = process.env.BASE ?? 'http://localhost:3000';
const shots = process.argv.includes('--shots');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'chast2-site-'));
const NE_FOTO = path.join(TMP, 'ne-foto.jpg');
fs.writeFileSync(NE_FOTO, '%PDF-1.4 это не фото');

let failures = 0;
function ok(cond, what, extra = '') {
  if (cond) console.log(`  ✓ ${what}`);
  else {
    failures += 1;
    console.error(`  ✗ ${what}${extra ? ` — ${extra}` : ''}`);
  }
}
async function shot(p, name, fullPage = true) {
  if (!shots) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
}

const ONBOARDING = JSON.stringify({ welcomeSeen: true, active: null, tours: {} });
const user = (id, role, name) => ({
  id,
  email: `${id}@test`,
  role,
  name,
  grade: null,
  birthYear: null,
  parentEmail: null,
  parentConfirmedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  consents: [],
});
const KAB = {
  v: 1,
  currentUserId: 'T',
  users: [
    user('ADM', 'admin', 'Администратор'),
    user('T', 'tutor', 'Наталья Викторовна'),
    user('X', 'tutor', 'Другой учитель'),
    user('A', 'student', 'Аня Петрова'),
    user('Bo', 'student', 'Борис Смирнов'),
  ],
  invitations: [],
  links: [
    { tutorId: 'T', studentId: 'A', linkedAt: '', endedAt: null },
    { tutorId: 'T', studentId: 'Bo', linkedAt: '', endedAt: null },
  ],
  classes: [],
  members: [],
  homework: [],
  recipients: [],
  attempts: [],
  sessions: [],
};
const as = (p, id) =>
  p.evaluate((who) => {
    const k = JSON.parse(localStorage.getItem('budetege:kabinet:v1'));
    k.currentUserId = who;
    localStorage.setItem('budetege:kabinet:v1', JSON.stringify(k));
  }, id);
const raboty = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('budetege:raboty:v1')));
const closeCookie = (p) =>
  p
    .locator('.cookie-notice button')
    .last()
    .click({ timeout: 3000 })
    .catch(() => {});
const hideKeyboard = (p) =>
  p.evaluate(() => {
    document.activeElement?.blur();
    window.mathVirtualKeyboard?.hide();
  });

/** Дождаться, что отправлено ровно n фото (миниатюры с id), и очередь пуста. */
const fotoUshli = (p, n) =>
  p.waitForFunction(
    (k) =>
      document.querySelectorAll('[data-foto-id]').length === k &&
      !document.querySelector('[data-testid=c2-thumb-q]'),
    n,
    { timeout: 60_000 },
  );

const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const errors = [];

try {
  /* ── 1. Самопроверка без входа ── */
  console.log('1. Самопроверка без входа');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript((o) => localStorage.setItem('budetege:onboarding:v1', o), ONBOARDING);
    const p = await ctx.newPage();
    const ext = [];
    p.on('request', (r) => {
      if (!r.url().startsWith(BASE)) ext.push(r.url());
    });
    p.on('pageerror', (e) => errors.push(`самопроверка: ${e.message}`));
    await p.goto(`${BASE}/variant/reshat/?kod=PV-01&v=1&r=t&tm=0&w=ege`, {
      waitUntil: 'networkidle',
      timeout: 180_000,
    });
    await closeCookie(p);
    await p.getByTestId('vo-begin').click();
    ok((await p.locator('.vo-strip__no').count()) === 20, 'лента 1–20');
    await p.locator('.vo-strip__no.is-part2').first().click();
    await p.locator('math-field').first().waitFor({ timeout: 30_000 });
    ok(
      await p.getByTestId('c2-login').isVisible(),
      'плашка «Войдите, чтобы отправить решение учителю»',
    );
    await p.getByTestId('c2-14-0-0').click();
    await p.keyboard.type('2pi n');
    await p.getByTestId('c2-14-0-add').click();
    await p.getByTestId('c2-14-0-1').click();
    await p.keyboard.type('-pi/2');
    await p.keyboard.press('ArrowRight');
    await p.keyboard.type('+2pi n');
    await p.getByTestId('c2-14-1-0').click();
    await p.keyboard.type('7pi/2');
    await p.getByTestId('c2-14-1-add').click();
    await p.getByTestId('c2-14-1-1').click();
    await p.keyboard.type('4pi');
    await p.getByTestId('c2-14-sverit').click();
    ok(
      (await p.getByTestId('c2-14-0-sverka').textContent())?.startsWith('Совпадает') === true &&
        (await p.getByTestId('c2-14-1-sverka').textContent())?.startsWith('Совпадает') === true,
      'серии и корни, набранные в MathLive, — «совпадает»',
    );
    await p.getByTestId('c2-14-reshenie').click();
    await p.getByTestId('c2-14-reshenie-ok').click();
    await p.getByTestId('c2-14-row-2-0').click();
    ok(
      (await p.locator('.c2-krit__itog').textContent()) === 'Ваша оценка: 2 из 2',
      'строка критериев ставит балл',
    );
    await shot(p, 'samoproverka-kompyuter');
    await p.locator('.vo-strip__no.is-part2', { hasText: '16' }).click();
    await p.getByTestId('c2-16-0-0-lo').click();
    await p.keyboard.type('1');
    await p.getByTestId('c2-16-0-0-hi').click();
    await p.keyboard.type('1.5');
    await p.getByTestId('c2-16-0-add-interval').click();
    await p.getByTestId('c2-16-0-1-lo').click();
    await p.keyboard.type('9');
    await p.getByTestId('c2-16-0-1-inf').click();
    await shot(p, 'promezhutki-kompyuter', false);
    await p.getByTestId('vo-finish').first().click();
    await p.getByTestId('vo-confirm').click();
    await p.getByTestId('c2-itog').waitFor();
    const counter = (await p.getByTestId('c2-counter').textContent()) ?? '';
    ok(
      counter.includes('Часть 2: 2 / 20') && counter.includes('/ 33'),
      `счётчик на итогах: ${counter}`,
    );
    ok(ext.length === 0, 'внешних запросов нет (шрифты MathLive свои)', ext.join(', '));
    await ctx.close();
  }

  /* ── 2. Ученик: работа из кабинета, телефон ── */
  console.log('2. Ученик, работа из кабинета (телефон)');
  const W = 'w0000001-test';
  const rab = {
    v: 1,
    works: [
      {
        id: W,
        tutorId: 'T',
        classId: null,
        title: 'Пробник 1.1',
        note: 'Часть 2 — фото решений',
        code: 'PV-01',
        versiya: 1,
        part2Mode: 'teacher',
        dueAt: '2099-12-31T18:00:00Z',
        createdAt: '2026-10-24T10:00:00Z',
        closedAt: null,
      },
    ],
    recipients: [{ workId: W, userId: 'A', assignedAt: '2026-10-24T10:00:00Z', dueOverride: null }],
    subs: [],
    answers: [],
    photos: [],
    marks: [],
    grades: [],
    history: [],
    notices: [],
  };
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(
      ([k, r, o]) => {
        if (sessionStorage.getItem('seeded')) return;
        localStorage.setItem('budetege:onboarding:v1', o);
        localStorage.setItem('budetege:kabinet:v1', JSON.stringify({ ...k, currentUserId: 'A' }));
        localStorage.setItem('budetege:raboty:v1', JSON.stringify(r));
        sessionStorage.setItem('seeded', '1');
      },
      [KAB, rab, ONBOARDING],
    );
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`ученик: ${e.message}`));
    p.on('dialog', (d) => d.accept());
    await p.goto(`${BASE}/variant/reshat/?kod=PV-01&v=1&r=k&tm=0&w=ege&rabota=${W}`, {
      waitUntil: 'networkidle',
      timeout: 180_000,
    });
    await closeCookie(p);
    await shot(p, 'rabota-start-telefon', false);
    await p.getByTestId('vo-begin').click();
    await p.getByTestId('vo-input').fill('2,5');
    await p.locator('.vo-strip__no.is-part2').first().click();
    await p.locator('math-field').first().waitFor();
    ok(await p.getByTestId('c2-foto-warn-14').isVisible(), 'без фото — предупреждение о 0 баллов');
    await p.getByTestId('c2-foto-input-14').setInputFiles(NE_FOTO);
    await p.locator('.c2-foto__error').waitFor();
    ok(
      (await p.locator('.c2-foto__error').textContent())?.startsWith('Это не фотография') === true,
      'не-фото отклоняется по содержимому',
    );

    await p.getByTestId('c2-foto-input-14').setInputFiles(path.join(FIX, 'exif6.jpg'));
    await p.getByTestId('c2-red').waitFor({ timeout: 30_000 });
    const [w, h] = await p.$eval('[data-testid=c2-red-canvas]', (c) => [c.width, c.height]);
    ok(h > w, `поворот по EXIF применён (${w}×${h})`);
    await p.getByTestId('c2-red-angle').fill('4');
    await p.getByTestId('c2-red-scan').check();
    const se = await p.getByTestId('c2-red-se').boundingBox();
    await p.mouse.move(se.x + 10, se.y + 10);
    await p.mouse.down();
    await p.mouse.move(se.x - 20, se.y - 40, { steps: 5 });
    await p.mouse.up();
    await shot(p, 'redaktor-telefon', false);
    await p.getByTestId('c2-red-save').click();
    await p.getByTestId('c2-red').waitFor({ state: 'detached' });
    await fotoUshli(p, 1);

    await p.getByTestId('c2-foto-input-14').setInputFiles(path.join(FIX, 'stranica2.heic'));
    await p.getByTestId('c2-red').waitFor({ timeout: 60_000 });
    await p.getByTestId('c2-red-save').click();
    await p.getByTestId('c2-red').waitFor({ state: 'detached' });
    await fotoUshli(p, 2);
    ok(true, 'HEIC открылся в редакторе и ушёл');

    await ctx.setOffline(true);
    await p.getByTestId('c2-foto-input-14').setInputFiles(path.join(FIX, 'exif6.jpg'));
    await p.getByTestId('c2-red').waitFor({ timeout: 30_000 });
    await p.getByTestId('c2-red-save').click();
    await p.getByTestId('c2-red').waitFor({ state: 'detached' });
    await p.waitForFunction(
      () =>
        document.querySelector('[data-testid=c2-thumb-q] [data-testid=c2-thumb-status]')
          ?.textContent === 'ждёт связи',
      null,
      { timeout: 30_000 },
    );
    ok(true, 'без связи фото «ждёт связи»');
    await shot(p, 'foto-bez-svyazi-telefon');
    await ctx.setOffline(false);
    await p.evaluate(() => window.dispatchEvent(new Event('online')));
    await fotoUshli(p, 3);
    const db = await raboty(p);
    ok(db.photos.length === 3, `связь вернулась — все фото в работе (${db.photos.length})`);
    ok(
      db.photos.every((x) => Math.max(x.width, x.height) <= 2000 && x.bytes <= 1_100_000),
      'фото ≤ 2000 px и около 1 МБ',
    );
    await p.getByTestId('c2-14-0-0').click();
    await p.keyboard.type('2pi n');
    await p.waitForTimeout(1500);
    const db2 = await raboty(p);
    ok(
      db2.answers.some((a) => a.taskNo === 1 && a.vvod === '2,5') &&
        db2.answers.some((a) => a.taskNo === 14 && a.punkt === '0'),
      'ответы сохраняются в работу по ходу решения',
    );
    ok(
      (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390,
      'страница не шире экрана телефона',
    );
    await hideKeyboard(p);
    await shot(p, 'zadanie-14-foto-telefon');
    await p.getByTestId('vo-finish').first().click();
    await p.getByTestId('c2-review').waitFor({ timeout: 30_000 });
    ok(
      (await p.getByTestId('c2-review-nophoto').textContent())?.includes('№15') === true,
      'перед отправкой — какие задания без фото',
    );
    await shot(p, 'pered-otpravkoy-telefon');
    await p.getByTestId('c2-review-send').click();
    await p.getByTestId('c2-rabota-itog').waitFor();
    ok((await p.getByTestId('c2-status').textContent()) === 'На проверке', 'статус «На проверке»');
    ok(
      (await p.getByTestId('c2-plaque').textContent()) ===
        'Полное количество баллов будет после проверки учителем.',
      'плашка «Полное количество баллов…»',
    );
    ok(
      (await p.getByTestId('c2-itog-counter').textContent())?.includes('Часть 2: на проверке') ===
        true,
      'часть 2 — «на проверке», тестового балла нет',
    );
    await shot(p, 'otpravleno-telefon');
    await ctx.close();
  }

  /* ── 3. Учитель ── */
  console.log('3. Учитель (компьютер)');
  {
    const ctx = await browser.newContext({
      viewport: { width: 1360, height: 900 },
      acceptDownloads: true,
    });
    await ctx.addInitScript(
      ([k, o]) => {
        if (!localStorage.getItem('budetege:kabinet:v1'))
          localStorage.setItem('budetege:kabinet:v1', JSON.stringify(k));
        localStorage.setItem('budetege:onboarding:v1', o);
      },
      [KAB, ONBOARDING],
    );
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`учитель: ${e.message}`));
    p.on('dialog', (d) => d.accept());
    await p.goto(`${BASE}/kabinet/vydat-variant/`, { waitUntil: 'networkidle', timeout: 180_000 });
    await closeCookie(p);
    await p.getByTestId('vydat-title').fill('Пробник: вариант 1.1');
    await p.getByTestId('vydat-st-A').check();
    await p.getByTestId('vydat-st-Bo').check();
    await shot(p, 'vydat-kompyuter');
    await p.getByTestId('vydat-submit').click();
    await p.getByTestId('vydat-back').waitFor();
    const W2 = (await raboty(p)).works[0].id;

    await as(p, 'A');
    await p.goto(`${BASE}/kabinet/raboty/`, { waitUntil: 'networkidle' });
    await p.getByTestId('rab-mine-open').click();
    await p.getByTestId('vo-begin').click();
    for (const v of ['2,5', '-26', '7']) {
      await p.getByTestId('vo-input').fill(v);
      await p.getByTestId('vo-next').click();
    }
    await p.locator('.vo-strip__no.is-part2').first().click();
    await p.getByTestId('c2-14-0-0').click();
    await p.keyboard.type('2pi n');
    await p.getByTestId('c2-foto-input-14').setInputFiles(path.join(FIX, 'exif6.jpg'));
    await p.getByTestId('c2-red-save').click();
    await p.getByTestId('c2-red').waitFor({ state: 'detached' });
    await fotoUshli(p, 1);
    await p.locator('.vo-strip__no.is-part2').nth(1).click();
    await p.getByTestId('c2-foto-input-15').setInputFiles(path.join(FIX, 'stranica2.heic'));
    await p.getByTestId('c2-red-save').click({ timeout: 60_000 });
    await p.getByTestId('c2-red').waitFor({ state: 'detached' });
    await fotoUshli(p, 1);
    await p.waitForTimeout(1200);
    await p.getByTestId('vo-finish').first().click();
    await p.getByTestId('c2-review-send').click();
    await p.getByTestId('c2-rabota-itog').waitFor();

    await as(p, 'T');
    await p.goto(`${BASE}/kabinet/raboty/`, { waitUntil: 'networkidle' });
    ok(
      (await p.getByTestId('rab-counter').textContent()) === 'ждут проверки: 1',
      'счётчик «ждут проверки: 1»',
    );
    await shot(p, 'raboty-na-proverku-kompyuter');
    const sub = (await raboty(p)).subs[0].id;
    await as(p, 'X');
    await p.goto(`${BASE}/kabinet/proverka/?id=${sub}`, { waitUntil: 'networkidle' });
    ok(
      (await p.locator('main').innerText()).includes('Работа не найдена'),
      'другой учитель работу не открывает',
    );
    await as(p, 'T');
    await p.goto(`${BASE}/kabinet/raboty/`, { waitUntil: 'networkidle' });
    await p.getByTestId('rab-open').first().click();
    await p.getByTestId('rab-check').waitFor();
    await p.getByTestId('rab-start').click();
    await p.setViewportSize({ width: 1360, height: 1600 });
    await p.getByTestId('rab-tab-14').click();
    await p.getByTestId('fp-img').waitFor();
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(400);
    const box = await p.getByTestId('fp-img').boundingBox();
    const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
    await p.getByTestId('fp-tool-pen').click();
    await p.mouse.move(...at(0.15, 0.2));
    await p.mouse.down();
    await p.mouse.move(...at(0.6, 0.22), { steps: 8 });
    await p.mouse.up();
    await p.getByTestId('fp-tool-ok').click();
    await p.mouse.click(...at(0.75, 0.3));
    await p.getByTestId('fp-tool-no').click();
    await p.mouse.click(...at(0.75, 0.45));
    await p.getByTestId('fp-tool-text').click();
    await p.getByTestId('fp-text').fill('нет отбора');
    await p.mouse.click(...at(0.4, 0.55));
    await p.waitForTimeout(1500);
    const marks = (await raboty(p)).marks.flatMap((m) => m.layer.items.map((i) => i.t));
    ok(
      ['pen', 'ok', 'no', 'text'].every((t) => marks.includes(t)),
      `пометки сохранены отдельным слоем (${marks.join(', ')})`,
    );
    await p.getByTestId('rab-krit-14-row-1-0').click();
    await p.getByTestId('rab-comment-14').fill('Пункт б не обоснован');
    await p.getByTestId('rab-tab-15').click();
    await p.setViewportSize({ width: 1360, height: 900 });
    await p.getByTestId('rab-tab-14').click();
    await p.getByTestId('rab-tab-14').scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await shot(p, 'proverka-kompyuter', false);
    ok(
      (await raboty(p)).grades.find((g) => g.taskNo === 14)?.comment === 'Пункт б не обоснован',
      'комментарий к заданию сохранился сам',
    );
    await p.getByTestId('rab-tab-15').click();
    await p.getByTestId('rab-krit-15-ball-2').click();
    await p.getByTestId('rab-tab-part1').click();
    await p.getByTestId('rab-p1-3').click();
    await p.waitForTimeout(300);
    const c = (await p.getByTestId('rab-check-counter').textContent()) ?? '';
    ok(c.startsWith('Часть 1: 3 / 13 · Часть 2: 3 / 20 · Итого: 6 / 33'), `живой счётчик: ${c}`);
    await p.getByTestId('rab-general').fill('Хорошая работа, поработай над отбором корней.');
    await p.getByTestId('rab-finish').click();
    await p.getByTestId('rab-finished').waitFor();
    await p.getByTestId('rab-reopen').click();
    await p.getByTestId('rab-tab-15').click();
    await p.getByTestId('rab-krit-15-ball-3').click();
    await p.getByTestId('rab-finish').click();
    await p.getByTestId('rab-finished').waitFor();
    await p.locator('.rab-history summary').click();
    const hist = await p.getByTestId('rab-history').innerText();
    ok(
      /№15: 2 → 3/.test(hist) && hist.includes('проверка открыта снова'),
      'история: повторное открытие и 2 → 3',
    );
    await p.goto(`${BASE}/kabinet/raboty/`, { waitUntil: 'networkidle' });
    await p.locator('button', { hasText: 'Статистика' }).first().click();
    await p.getByTestId('rab-stat').waitFor();
    const [dl] = await Promise.all([
      p.waitForEvent('download'),
      p.getByTestId('rab-excel').first().click(),
    ]);
    const xlsxPath = path.join(TMP, 'otchet.xlsx');
    await dl.saveAs(xlsxPath);
    const head = fs.readFileSync(xlsxPath).subarray(0, 2).toString();
    ok(
      /* Имя в headless-Chromium с кириллицей приходит как «download»: проверяем содержимое. */
      head === 'PK' && fs.readFileSync(xlsxPath).includes('xl/worksheets/sheet1.xml'),
      'Excel скачан: книга .xlsx с листом',
    );
    await shot(p, 'statistika-kompyuter');
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto(`${BASE}/kabinet/proverka/?id=${sub}`, { waitUntil: 'networkidle' });
    await p.getByTestId('rab-tab-14').click();
    await p.waitForTimeout(800);
    await shot(p, 'proverka-telefon');
    await p.goto(`${BASE}/kabinet/raboty/`, { waitUntil: 'networkidle' });
    await shot(p, 'raboty-na-proverku-telefon');

    await as(p, 'A');
    await p.setViewportSize({ width: 1360, height: 900 });
    await p.goto(`${BASE}/variant/reshat/?kod=PV-01&v=1&r=k&tm=0&w=ege&rabota=${W2}`, {
      waitUntil: 'networkidle',
    });
    await p.getByTestId('c2-rabota-itog').waitFor();
    ok((await p.getByTestId('c2-status').textContent()) === 'Проверено', 'ученик: «Проверено»');
    ok(
      (await p.getByTestId('c2-itog-counter').textContent())?.includes('Итого: 7 / 33') === true,
      'ученик: баллы после проверки',
    );
    await p.getByTestId('c2-itog-open-14').click();
    await p.waitForTimeout(800);
    await shot(p, 'provereno-uchenik-kompyuter');
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(400);
    await shot(p, 'provereno-uchenik-telefon');
    await ctx.close();
  }
} catch (e) {
  failures += 1;
  console.error(e);
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      await pg
        .screenshot({ path: path.join(TMP, `fail-${Date.now()}.png`), fullPage: true })
        .catch(() => {});
    }
  }
  console.error(`снимки при сбое: ${TMP}`);
} finally {
  await browser.close();
}

ok(errors.length === 0, 'ошибок на страницах нет', errors.join('; '));
if (failures > 0) {
  console.error(`\nЧасть 2 в браузере: ошибок ${failures}`);
  process.exit(1);
}
console.log('\nЧасть 2 в браузере: всё в порядке.');
