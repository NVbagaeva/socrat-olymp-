#!/usr/bin/env node
/* scripts/check-kabinet-site.mjs — пробный кабинет в браузере, целиком.

   Запуск:
     KABINET=1 LEGAL_DRAFT=1 pnpm build && pnpm test:kabinet-site
     или против запущенного next dev: pnpm test:kabinet-site --base http://localhost:3000
     --shots <папка> — ещё снимки экранов ученика, репетитора, выдачи ДЗ
     и администратора на 390 и 1440.

   Сценарий (docs/kabinet-roli-dz.md):
     1. первый запуск — аккаунт администратора, второго не будет;
     2. админ приглашает репетитора, тот регистрируется по ссылке
        (роль из приглашения, галочки согласий обязательны);
     3. репетитор создаёт класс и приглашает ученика сразу в класс;
        ссылка одноразовая;
     4. репетитор выдаёт ДЗ классу: №8, 2 задачи;
     5. ученик открывает ДЗ, «Решать», решает 2 задачи в тренажёре №8,
        уходит в кабинет — тренировка там незавершённой, «Поставить на
        паузу» ставит паузу в записи тренажёра, «Завершить тренировку»
        записывает попытки: прогресс №08 и выполнение ДЗ 2 из 2;
        то же, если завершить кнопкой в самом тренажёре;
     6. ученик сдаёт ДЗ, репетитор видит «сдали 1 из 1»;
     7. ученику экран выдачи ДЗ закрыт;
     8. гость решает в тренажёре — в кабинет ничего не пишется. */

import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const argOf = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
let BASE = argOf('--base');
const OUT = path.join(APP, 'out');

let server = null;
if (BASE === null) {
  if (!fs.existsSync(path.join(OUT, 'kabinet', 'index.html'))) {
    console.error('Нет out/kabinet/ — соберите с KABINET=1 (или укажите --base).');
    process.exit(1);
  }
  server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(OUT, url);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    const ext = path.extname(file);
    const type =
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
      }[ext] ?? 'application/octet-stream';
    res.setHeader('content-type', type);
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = `http://127.0.0.1:${server.address().port}`;
}

const KEY8 = 'budetege:trainer:8:session';
const problems = [];
const ok = (cond, what) => {
  if (cond) console.log(`  ok: ${what}`);
  else {
    console.log(`  FAIL: ${what}`);
    problems.push(what);
  }
};

function numberText(value) {
  return String(Math.round(Number(value) * 1e9) / 1e9).replace('.', ',');
}
function answer8(record, at) {
  const { generate } = requireSrc('lib/vychisleniya/generate');
  const pool = record.ui?.order?.[at] ?? at;
  const [prototype, seed, level] = record.payload.tasks[pool][0].split('|');
  return numberText(
    generate(prototype, seed, level === 'base' || level === 'advanced' ? level : null).otvet,
  );
}

/* PW_CHROMIUM — свой Chromium, если версия Playwright не совпала с установленной. */
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('pageerror', (e) => problems.push(`ошибка на странице: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') console.log(`  console: ${m.text().slice(0, 300)}`);
});
const go = (url) => page.goto(BASE + url, { waitUntil: 'load' });
/* Плашка cookie закрывает низ экрана: отмечаем её прочитанной заранее. */
await context.addInitScript(() => {
  try {
    localStorage.setItem('budetege:cookie-notice:v1', '{"seen":true}');
  } catch {
    /* нет хранилища — плашка просто останется */
  }
});

async function fillRegistration({ name, email, birthYear = null }) {
  await page.getByLabel('Имя', { exact: true }).fill(name);
  await page.getByLabel('Почта', { exact: true }).fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill('пароль-12345');
  if (birthYear !== null) await page.getByLabel('Год рождения').fill(String(birthYear));
  await page.locator('input[name="accept-soglashenie"]').check();
  await page.locator('input[name="accept-soglasie"]').check();
}

async function inviteUrl() {
  const url = (await page.locator('.kab-invite__url').first().textContent())?.trim() ?? '';
  return url.replace(/^https?:\/\/[^/]+/, '');
}

async function signInAs(name) {
  await go('/kabinet/');
  /* Кабинет сначала грузится: ждём либо вошедшего, либо экран входа. */
  await page.locator('.kab-trial, .kab-list__row').first().waitFor();
  const switchBtn = page.getByRole('button', { name: 'Сменить аккаунт' });
  if (await switchBtn.isVisible()) await switchBtn.click();
  await page
    .locator('.kab-list__row', { hasText: name })
    .getByRole('button', { name: 'Войти' })
    .click();
  await page.locator('.kab-trial').waitFor();
}

try {
  console.log('1. Первый запуск');
  await go('/kabinet/');
  await page.getByText('Первый запуск').waitFor();
  await fillRegistration({ name: 'Наталья', email: 'admin@example.ru' });
  await page.getByRole('button', { name: 'Создать аккаунт администратора' }).click();
  await page.getByTestId('invite-tutor').waitFor();
  ok(true, 'администратор создан, открыт его кабинет');

  console.log('2. Приглашение репетитора');
  await page.getByTestId('invite-tutor').click();
  const tutorInvite = await inviteUrl();
  ok(tutorInvite.includes('/kabinet/priglashenie/?kod='), 'ссылка-приглашение показана');
  await page.getByRole('button', { name: 'Сменить аккаунт' }).click();
  await go(tutorInvite);
  await page.getByText('Вы регистрируетесь как репетитор').waitFor();
  ok((await page.getByText('Кто вы').count()) === 0, 'роль не выбирается — она из приглашения');
  await page.getByLabel('Имя', { exact: true }).fill('Репетитор Анна');
  await page.getByLabel('Почта', { exact: true }).fill('tutor@example.ru');
  await page.getByLabel('Пароль', { exact: true }).fill('пароль-12345');
  ok(
    await page.getByRole('button', { name: 'Зарегистрироваться' }).isDisabled(),
    'без галочек согласий кнопка неактивна',
  );
  await page.locator('input[name="accept-soglashenie"]').check();
  await page.locator('input[name="accept-soglasie"]').check();
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await page.getByText('Аккаунт создан').waitFor();

  console.log('3. Класс и приглашение ученика');
  await go('/kabinet/');
  await page.getByTestId('issue-homework').waitFor();
  await page.getByLabel('Название класса или группы').fill('11 «А»');
  await page.getByRole('button', { name: 'Создать', exact: true }).click();
  await page.getByTestId('classes').getByRole('link', { name: '11 «А»' }).click();
  await page.getByRole('button', { name: 'Пригласить в этот класс' }).click();
  const studentInvite = await inviteUrl();
  await page.getByRole('button', { name: 'Сменить аккаунт' }).click();
  await go(studentInvite);
  await page.getByText('Класс: 11 «А»').waitFor();
  await fillRegistration({ name: 'Ученик Пётр', email: 'student@example.ru', birthYear: 2000 });
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await page.getByText('Аккаунт создан').waitFor();
  await go(studentInvite);
  await page.getByText('Приглашение не действует').waitFor();
  ok(true, 'приглашение одноразовое');

  console.log('4. Репетитор выдаёт ДЗ');
  await signInAs('Репетитор Анна');
  ok(
    (await page.getByTestId('students').textContent())?.includes('Ученик Пётр') === true,
    'ученик в списке репетитора',
  );
  await page.getByTestId('issue-homework').click();
  await page.getByLabel('Класс или группа').selectOption({ label: '11 «А» (1)' });
  await page.getByLabel('Название').fill('Вычисления к пятнице');
  await page.getByLabel('Номер задания').selectOption('8');
  await page.getByLabel('Прототип').selectOption({ index: 1 });
  await page.getByLabel('Сколько задач').fill('2');
  await page.getByRole('button', { name: 'Выдать', exact: true }).click();
  await page.getByText('Задание выдано').waitFor();
  ok(true, 'ДЗ выдано классу');

  console.log('5. Ученик решает ДЗ в тренажёре');
  await signInAs('Ученик Пётр');
  await page.getByTestId('tutors').getByText('Репетитор Анна').waitFor();
  await page.getByTestId('homework').getByRole('link', { name: 'Вычисления к пятнице' }).click();
  await page.getByRole('link', { name: 'Решать' }).first().click();
  await page.waitForURL(/\/zadaniya\/8\/$/);
  await go('/zadaniya/8/trenazher/');
  await page
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
  await page.locator('.tsess__bar').first().waitFor();
  for (let at = 0; at < 2; at += 1) {
    const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY8);
    await page.locator('input.ttask__input, input.pc__input').first().fill(answer8(record, at));
    await page
      .locator('.tsess__body')
      .getByRole('button', { name: 'Проверить', exact: true })
      .first()
      .click();
    await page.waitForFunction(
      ([k, n]) =>
        Object.keys(JSON.parse(localStorage.getItem(k) ?? '{}')?.ui?.marks ?? {}).length >= n,
      [KEY8, at + 1],
    );
    if (at === 0) {
      await page
        .locator('.tsess__body')
        .getByRole('button', { name: /^Следующее задание|^Дальше/ })
        .first()
        .click();
    }
  }
  await go('/kabinet/');
  const openRow = page.getByTestId('open-sessions').locator('li').first();
  await openRow.waitFor();
  ok(
    (await openRow.textContent())?.includes('решено 2') === true,
    'незавершённая тренировка №8 в кабинете: решено 2',
  );
  await openRow.getByRole('button', { name: 'Поставить на паузу' }).click();
  await openRow.getByText('на паузе').waitFor();
  ok(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.paused === true,
      KEY8,
    ),
    'пауза записана в запись тренажёра',
  );
  await go('/zadaniya/8/trenazher/');
  await page.locator('.tsess__cover-title').first().waitFor();
  ok(true, 'тренажёр открылся на паузе — тренировка не сбросилась');
  await go('/kabinet/');
  await page
    .getByTestId('open-sessions')
    .getByRole('button', { name: 'Завершить тренировку' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Завершить тренировку' }).click();
  await page.getByTestId('finished-sessions').waitFor();
  ok(
    await page.evaluate((k) => localStorage.getItem(k) === null, KEY8),
    'запись тренажёра удалена после «Завершить тренировку»',
  );
  const cell8 = page.getByTestId('progress-grid').locator('li', { hasText: '№08' });
  await cell8.getByText('верно 2 из 2').waitFor();
  ok(true, 'прогресс №08: верно 2 из 2');
  ok(
    (await page.getByTestId('homework').textContent())?.includes('решено 2 из 2') === true,
    'ДЗ: решено 2 из 2',
  );

  console.log('5б. «Завершить тренировку» в самом тренажёре');
  await go('/zadaniya/8/trenazher/');
  await page
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
  await page.locator('.tsess__bar').first().waitFor();
  {
    const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY8);
    await page.locator('input.ttask__input, input.pc__input').first().fill(answer8(record, 0));
    await page
      .locator('.tsess__body')
      .getByRole('button', { name: 'Проверить', exact: true })
      .first()
      .click();
    await page.waitForFunction(
      (k) => Object.keys(JSON.parse(localStorage.getItem(k) ?? '{}')?.ui?.marks ?? {}).length >= 1,
      KEY8,
    );
  }
  await page
    .locator('.tsess__bar')
    .getByRole('button', { name: /Завершить/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    await dialog
      .getByRole('button', { name: /Завершить/ })
      .last()
      .click();
  }
  await page.waitForFunction((k) => localStorage.getItem(k) === null, KEY8);
  await go('/kabinet/');
  await page.getByTestId('finished-sessions').locator('li').nth(1).waitFor();
  await page
    .getByTestId('progress-grid')
    .locator('li', { hasText: '№08' })
    .getByText('верно 3 из 3')
    .waitFor();
  ok(true, 'тренировка, завершённая в тренажёре, записана: №08 верно 3 из 3');

  console.log('6. Сдача ДЗ');
  await page.getByTestId('homework').getByRole('link', { name: 'Вычисления к пятнице' }).click();
  await page.getByTestId('submit-homework').click();
  await page.getByText('Сдано ·').waitFor();
  await signInAs('Репетитор Анна');
  ok(
    (await page.getByTestId('tutor-homework').textContent())?.includes('сдали 1 из 1') === true,
    'репетитор видит: сдали 1 из 1',
  );

  console.log('7. Роли');
  await signInAs('Ученик Пётр');
  await go('/kabinet/vydat-dz/');
  await page.getByText('Раздел не для вашей роли').waitFor();
  ok(true, 'ученику экран выдачи ДЗ закрыт');

  const SHOTS = argOf('--shots');
  if (SHOTS !== null) {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const shot = async (name) =>
        page.screenshot({ path: path.join(SHOTS, `${name}-${width}.png`), fullPage: true });
      await signInAs('Ученик Пётр');
      await shot('uchenik');
      await signInAs('Репетитор Анна');
      await shot('repetitor');
      await go('/kabinet/vydat-dz/');
      await page.getByLabel('Название').waitFor();
      await shot('vydat-dz');
      await signInAs('Наталья');
      await shot('admin');
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    console.log(`  снимки: ${SHOTS}`);
  }

  console.log('8. Гость');
  /* Свой контекст: чистый браузер без кабинета. */
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`${BASE}/zadaniya/8/trenazher/`, { waitUntil: 'load' });
  await guest
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
  await guest.locator('.tsess__bar').first().waitFor();
  ok(
    await guest.evaluate(() => localStorage.getItem('budetege:kabinet:v1') === null),
    'у гостя кабинет не появляется',
  );
} catch (error) {
  problems.push(String(error?.message ?? error).split('\n')[0]);
  const shot = path.join(os.tmpdir(), 'kabinet-fail.png');
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  console.log(`  FAIL: ${problems.at(-1)} (снимок: ${shot})`);
} finally {
  await browser.close();
  server?.close();
}

if (problems.length > 0) {
  console.error(`\nКабинет: ${problems.length} проблем.\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('\nКабинет в браузере: все проверки прошли.');
