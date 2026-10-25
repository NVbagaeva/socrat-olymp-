#!/usr/bin/env node
/* scripts/check-intro.mjs — заставка первого визита на собранном сайте.

   Запуск: pnpm build && pnpm test:intro   (Chromium; Apache — как на хостинге)

   Сценарии (страница задания №12, ширина компьютера, если не сказано иначе):
     1. первый визит → заставка → «Пропустить» → окно → «Тур для
        репетитора» → тур стартует; контент страницы под заставкой в DOM;
        «уже видел» записан тем же ключом, что и раньше;
     2. второй визит — заставки нет;
     3. prefers-reduced-motion → сразу статичный кадр (слой A) с окном;
        режим «без WebGL» прототипа на сайте не нужен: WebGL заставка
        не использует, проверяется reduced-motion и слабое устройство
        (deviceMemory < 4);
     4. «Посмотреть приветствие» из меню «?» показывает заставку снова;
     5. ссылка с кодом комплекта (?kit=) и ссылка на тренажёр — заставки нет;
     6. в консоли нет ошибок;
     7. на 390 px нет горизонтальной прокрутки; нижний лист во всю ширину;
     8. CLS за время заставки = 0;
     9. память: куча JS после закрытия возвращается к значению до показа
        (с запасом на код заставки, который остаётся загруженным). */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startApache } from './lib/apache.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const PORT = 4187;
const PAGE = '/zadaniya/12/';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

const apache = await startApache(OUT, PORT);
const A = apache.url;
/* Apache и браузер закрываются и при упавшей проверке: иначе порт
   остаётся занятым следующим запуском. */
let browser = null;
try {
  browser = await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });

  /** Страница с ловушкой ошибок консоли и слоёв (CLS). */
  async function open(context, url) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    /* Сдвиги вёрстки с их моментом: сдвиги до появления заставки — свои у
       страницы (формулы KaTeX при загрузке шрифта), заставке не считаются. */
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__shifts.push([e.startTime, e.value]);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(A + url, { waitUntil: 'load' });
    return { page, errors };
  }

  const desktop = { viewport: { width: 1440, height: 900 } };
  const INTRO = '.intro';
  const CARD = '.intro[data-phase="card"]';

  /* ── 1. Первый визит ───────────────────────────────────────────── */
  console.log('1. Первый визит → заставка → «Пропустить» → окно → тур');
  {
    const context = await browser.newContext(desktop);
    const { page, errors } = await open(context, PAGE);
    const soon = await page.locator(INTRO).count();
    check(soon === 0, 'сразу после загрузки заставки ещё нет (задержка ≥ 1 с)');
    await page.waitForSelector(INTRO, { timeout: 15000 });
    const introAt = await page.evaluate(() => performance.now());
    const anim = await page.getAttribute(INTRO, 'data-mode');
    check(anim === 'animated', `режим анимации (${anim})`);
    check(
      (await page.locator('h1').count()) > 0 && (await page.locator('h1').first().isVisible()),
      'контент страницы остаётся в DOM под заставкой',
    );
    check(
      (await page.getAttribute(INTRO, 'role')) === 'dialog' &&
        (await page.getAttribute(INTRO, 'aria-modal')) === 'true',
      'role="dialog" и aria-modal',
    );
    await page.waitForSelector('.intro__skip[data-shown]', { timeout: 10000 });
    await page.locator('.intro__skip').evaluate((b) => b.click());
    await page.waitForSelector(CARD, { timeout: 10000 });
    check(true, '«Пропустить» → окно');
    await page.waitForTimeout(800);
    check(
      await page.evaluate(() => document.activeElement?.closest('.intro-card') !== null),
      'фокус внутри окна',
    );
    const shifts = await page.evaluate(() => window.__shifts);
    const own = shifts.filter(([t]) => t < introAt).reduce((a, [, v]) => a + v, 0);
    const cls = shifts.filter(([t]) => t >= introAt).reduce((a, [, v]) => a + v, 0);
    console.log(`     сдвиги страницы до заставки (её собственные): ${own.toFixed(5)}`);
    check(cls === 0, `CLS с появления заставки = ${cls}`);
    const seen = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('budetege:onboarding:v1') ?? '{}'),
    );
    check(seen.welcomeSeen === true, '«уже видел» записан в budetege:onboarding:v1');
    await page.getByRole('button', { name: 'Тур для репетитора' }).click();
    /* Обёртка тура без размера — ждём её в DOM, видна её карточка. */
    await page.waitForSelector('.tour', { state: 'attached', timeout: 15000 });
    check(true, '«Тур для репетитора» → тур стартует');
    check((await page.locator(INTRO).count()) === 0, 'заставка закрыта после выбора');
    check(errors.length === 0, 'в консоли нет ошибок' + (errors[0] ? `: ${errors[0]}` : ''));
    await context.close();
  }

  /* ── 2. Второй визит ───────────────────────────────────────────── */
  console.log('2. Второй визит');
  {
    const context = await browser.newContext(desktop);
    await welcomeSeen(context);
    const { page } = await open(context, PAGE);
    await page.waitForTimeout(3500);
    check((await page.locator(INTRO).count()) === 0, 'заставки нет');
    await context.close();
  }

  /* ── 3. Статичный режим ────────────────────────────────────────── */
  console.log('3. prefers-reduced-motion и слабое устройство → статичный кадр');
  {
    const context = await browser.newContext({ ...desktop, reducedMotion: 'reduce' });
    const { page, errors } = await open(context, PAGE);
    await page.waitForSelector(CARD, { timeout: 15000 });
    check(
      (await page.getAttribute(INTRO, 'data-mode')) === 'static' &&
        (await page.getAttribute(INTRO, 'data-reason')) === 'reduced-motion',
      'reduced-motion: статичный кадр, окно сразу',
    );
    check(
      (await page.locator('.intro__layer[data-layer="A"]').count()) === 1 &&
        (await page.locator('.intro__layer[data-layer="F"]').count()) === 0,
      'показан только собранный цветок A, слои анимации не грузились',
    );
    check(errors.length === 0, 'в консоли нет ошибок');
    await context.close();

    const weak = await browser.newContext(desktop);
    await weak.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
    });
    const w = await open(weak, PAGE);
    await w.page.waitForSelector(CARD, { timeout: 15000 });
    check(
      (await w.page.getAttribute(INTRO, 'data-reason')) === 'device-memory',
      'deviceMemory < 4: статичный кадр',
    );
    await weak.close();
  }

  /* ── 4. Повторный показ ────────────────────────────────────────── */
  console.log('4. «Посмотреть приветствие» из «?»');
  {
    const context = await browser.newContext(desktop);
    await welcomeSeen(context);
    const { page, errors } = await open(context, PAGE);
    await page.getByRole('button', { name: 'Помощь' }).click();
    await page.getByRole('menuitem', { name: 'Посмотреть приветствие' }).click();
    await page.waitForSelector(INTRO, { timeout: 10000 });
    check(true, 'заставка показана снова');
    await page.keyboard.press('Escape');
    await page.waitForSelector(CARD, { timeout: 10000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check((await page.locator(INTRO).count()) === 0, 'Esc → окно, Esc → закрыто');
    check(errors.length === 0, 'в консоли нет ошибок');
    await context.close();
  }

  /* ── 5. Ссылки, где заставка лишняя ────────────────────────────── */
  console.log('5. Ссылка с кодом комплекта и на тренажёр');
  for (const url of ['/zadaniya/11/generator/?kit=ABCD-EFGH', '/zadaniya/4/trenazher/']) {
    const context = await browser.newContext(desktop);
    const { page } = await open(context, url);
    await page.waitForTimeout(3500);
    check((await page.locator(INTRO).count()) === 0, `${url}: заставки нет`);
    await context.close();
  }

  /* ── 7. Телефон ────────────────────────────────────────────────── */
  console.log('7. Телефон 390 px');
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const { page, errors } = await open(context, PAGE);
    await page.waitForSelector(INTRO, { timeout: 15000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector(CARD, { timeout: 10000 });
    await page.waitForTimeout(1500);
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      'нет горизонтальной прокрутки',
    );
    const box = await page.locator('.intro-card').boundingBox();
    check(
      box !== null &&
        box.x === 0 &&
        Math.round(box.width) === 390 &&
        Math.round(box.y + box.height) === 844,
      `нижний лист во всю ширину (${box && [box.x, box.width, box.y + box.height].map(Math.round).join(', ')})`,
    );
    check(errors.length === 0, 'в консоли нет ошибок');
    await context.close();
  }

  /* ── 9. Память ─────────────────────────────────────────────────── */
  console.log('9. Куча JS до показа и после закрытия');
  {
    const context = await browser.newContext(desktop);
    await welcomeSeen(context);
    const { page } = await open(context, PAGE);
    const cdp = await context.newCDPSession(page);
    const heap = async () => {
      for (let i = 0; i < 3; i += 1) {
        await cdp.send('HeapProfiler.collectGarbage');
        await page.waitForTimeout(200);
      }
      return Math.round((await cdp.send('Runtime.getHeapUsage')).usedSize / 1024);
    };
    await page.waitForTimeout(1500);
    const before = await heap();
    /* Первый показ догружает код заставки — он остаётся; меряем второй. */
    for (let i = 0; i < 2; i += 1) {
      await page.getByRole('button', { name: 'Помощь' }).click();
      await page.getByRole('menuitem', { name: 'Посмотреть приветствие' }).click();
      await page.waitForSelector(INTRO, { timeout: 10000 });
      await page.keyboard.press('Escape');
      await page.waitForSelector(CARD, { timeout: 10000 });
      await page.getByRole('button', { name: 'Сначала осмотрюсь' }).click();
      await page.waitForTimeout(500);
      if (i === 0) {
        const loaded = await heap();
        console.log(`     до: ${before} КБ, после первого показа: ${loaded} КБ`);
      }
    }
    const after = await heap();
    check(
      (await page.locator(INTRO).count()) === 0 && (await page.locator('canvas').count()) === 0,
      'после закрытия нет ни заставки, ни холстов',
    );
    check(after - before < 2500, `куча после закрытия: ${after} КБ (до: ${before} КБ)`);
    await context.close();
  }
} finally {
  await browser?.close();
  apache.stop();
}

if (failures.length > 0) {
  console.error(
    `\nЗаставка: ${failures.length} из ${checks} проверок не прошли:\n  ${failures.join('\n  ')}`,
  );
  process.exit(1);
}
console.log(`\nЗаставка первого визита: ${checks} проверок, всё в порядке.`);
