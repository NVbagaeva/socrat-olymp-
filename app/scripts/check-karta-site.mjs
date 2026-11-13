#!/usr/bin/env node
/* scripts/check-karta-site.mjs — «Карта ЕГЭ» на собранном сайте.

   Запуск: pnpm test:karta-site (после pnpm build); с --shots <папка> —
   снимки трёх тестовых учеников на 375, 390, 768, 1280 и 1440 px и
   отладочный снимок контуров (?debug=1).

   Проверяется в Chromium и WebKit (телефон — WebKit, как iPhone):
     • гость: карта из данных браузера, плашка «Войдите…», 20 областей,
       «Освоено 0 из 20»; с журналами «середина» — 4 из 20, прогноз, путь
       через 1–4 и 8, маячок на №8;
     • нажатие по №8 — окошко с темами и панель с полосками, кнопки;
       тема «Логарифмы» ведёт в тренажёр №8; стрелка — на «О задании»;
     • пролив — карточка «Переход ко второй части», «Посмотреть часть 2»;
     • табличка «Часть 1» — сводка «Освоено 4 из 13»;
     • вода и Esc закрывают; Tab + Enter открывают область, Esc закрывает;
     • телефон: короткое касание выбирает, движение пальцем двигает карту
       и не выбирает, щипок меняет масштаб; кнопка «?» не перекрыта;
     • решённая задача в тренажёре №8 → на карте №8 «в процессе». */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);
bezBanneraCookieVsyudu(webkit);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'karta', 'index.html'))) {
  console.error('Нет сборки app/out/karta: сначала pnpm build');
  process.exit(1);
}
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const SHOTS = shotsAt >= 0 ? args[shotsAt + 1] : null;
/* --tolko-telefon — только часть в WebKit (для отладки). */
const TOLKO_TELEFON = args.includes('--tolko-telefon');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const D = requireSrc('lib/karta/demo.ts');
const C = requireSrc('lib/karta/katalog.ts');

/** Журналы тестового ученика → записи localStorage. */
function zapisi(uchenik) {
  const zh = D.demoZhurnaly(uchenik);
  return Object.entries(zh).map(([no, log]) => [C.KARTA_ZHURNALY[Number(no)], JSON.stringify(log)]);
}

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
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}
const text = async (page, sel) =>
  (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');

async function otkryt(
  browser,
  { width, height = 900, uchenik = 'pusto', mobile = false, url = '/karta/' },
) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: SHOTS ? 2 : 1,
    hasTouch: mobile,
    isMobile: mobile,
  });
  await welcomeSeen(ctx);
  await ctx.addInitScript((list) => {
    for (const [key, value] of list) localStorage.setItem(key, value);
    /* Освоенное уже видели: без анимации «света», чтобы снимки были одинаковыми. */
    localStorage.setItem(
      'budetege:karta:videl:v1',
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18]),
    );
  }, zapisi(uchenik));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  try {
    await page.waitForSelector('.karta-holst[data-gotov]');
  } catch (e) {
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'oshibka-zagruzki.png') });
    console.error(
      'Карта не загрузилась:',
      errors.join(' | ') || 'ошибок сценариев нет',
      await page.evaluate(() => document.querySelector('.karta-holst')?.outerHTML.slice(0, 200)),
    );
    throw e;
  }
  /* Плавный подъезд к области длится 480 мс. */
  const dozhdatsya = () => page.waitForTimeout(600);
  return { ctx, page, errors, dozhdatsya };
}

/** Нажать на остров: короткое касание по центру контура на экране. */
async function nazhat(page, cel) {
  const box = await page
    .locator(
      `.karta-ostrov__kontur[data-cel="${cel}"], .karta-proliv__polosa[data-cel="${cel}"], .karta-tablichka[data-cel="${cel}"]`,
    )
    .first()
    .boundingBox();
  /* Маячок на той же области: берём контур, не маячок. */
  const sloy = await page.locator('.karta-holst').boundingBox();
  if (box === null || sloy === null) throw new Error(`нет ${cel}`);
  /* Центр подписи острова — там, где стоит номер (середина рамки). */
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/* ── Chromium, компьютер ────────────────────────────────────────── */
if (!TOLKO_TELEFON) {
  const browser = await chromium.launch();

  /* Гость без прогресса. */
  {
    const { page, errors, ctx } = await otkryt(browser, { width: 1280 });
    check(errors.length === 0, `гость: без ошибок сценариев ${errors.join(' | ')}`);
    check((await page.locator('.karta-ostrov').count()) === 20, 'гость: 20 областей');
    check(
      (await text(page, '.karta-shapka__itog')).includes('Освоено 0 из 20'),
      'гость: «Освоено 0 из 20»',
    );
    check(
      (await text(page, '.karta-shapka__itog')).includes('Решите ещё немного'),
      'гость: прогноза нет',
    );
    check(
      (await page.locator('.karta-gost').count()) === 1,
      'гость: плашка «Войдите, чтобы карта запоминала прогресс»',
    );
    check(
      (await page
        .locator('.karta-ostrov.is-sleduyushchaya .karta-ostrov__kontur[data-cel="oblast:1"]')
        .count()) === 1,
      'гость: рекомендуем №1',
    );
    check(
      (await page.locator('.karta-ostrov--skoro').count()) === 2,
      'гость: две неоткрытые земли (№17, №20)',
    );
    check(
      (await page.locator('.karta-ostrov--pozzhe').count()) === 2,
      'гость: №15 и №16 — «прогресс появится позже»',
    );
    const podpisi = await page
      .locator('.karta-ostrov__kontur')
      .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    check(
      podpisi.every((p) => /^Задание \d+, .+\. .+\.$/.test(p ?? '')),
      `гость: у каждой области текстовый статус (${podpisi[0]})`,
    );
    check(
      podpisi.some((p) => p.includes('Задание 18, Планиметрия')),
      'гость: №18 «Планиметрия» на карте',
    );
    /* Клавиатура: Tab до области, Enter — окошко, Esc — закрыть. */
    await page.locator('.karta-ostrov__kontur[data-cel="oblast:1"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.karta-okoshko');
    check(
      (await page.locator('.karta-panel.is-otkryta').count()) === 1,
      'клавиатура: Enter открывает окошко и панель',
    );
    await page.keyboard.press('Escape');
    await page.waitForSelector('.karta-okoshko', { state: 'detached' });
    check(
      (await page.locator('.karta-panel.is-otkryta').count()) === 0,
      'клавиатура: Esc закрывает',
    );
    check(
      (await page.evaluate(() => document.activeElement?.getAttribute('data-cel'))) === 'oblast:1',
      'клавиатура: фокус вернулся на область',
    );
    await ctx.close();
  }

  /* «Середина»: состояния, окошко, панель, пролив, табличка. */
  {
    const { page, errors, ctx, dozhdatsya } = await otkryt(browser, {
      width: 1280,
      uchenik: 'seredina',
    });
    check(errors.length === 0, `середина: без ошибок сценариев ${errors.join(' | ')}`);
    check(
      (await text(page, '.karta-shapka__itog')).includes('Освоено 4 из 20'),
      'середина: «Освоено 4 из 20»',
    );
    check(
      /≈ \d+ балл/.test(await text(page, '.karta-shapka__itog')),
      'середина: прогноз «≈ N баллов»',
    );
    for (const no of [1, 2, 3, 4]) {
      check(
        (await page.locator(`.karta-ostrov--osvoeno [data-cel="oblast:${no}"]`).count()) === 1,
        `середина: №${no} освоена`,
      );
    }
    const o8 = page.locator('.karta-ostrov:has([data-cel="oblast:8"])');
    check(
      (await o8.locator('.karta-podpis__kolco').count()) === 1 &&
        (await o8.locator('.karta-podpis__flag').count()) === 0,
      'середина: у №8 кольцо, флажка нет',
    );
    check(
      (await o8.locator('.karta-podpis__procent').textContent()) === '38 %',
      'середина: кольцо №8 — 38 %',
    );
    check(
      (await o8.locator('.karta-podpis__povtorit').count()) === 1,
      'середина: у №8 терракотовая метка',
    );
    check(
      (await page.locator('.karta-mayak').count()) === 1 &&
        (await page
          .locator('.karta-ostrov.is-sleduyushchaya .karta-ostrov__kontur[data-cel="oblast:8"]')
          .count()) === 1,
      'середина: маячок на №8',
    );
    check(
      (await page.locator('.karta-put').count()) === 1,
      'середина: рекомендуемый путь нарисован',
    );
    check(
      (await page.locator('.karta-ostrov--osvoeno .karta-podpis__kolco').count()) === 0,
      'флажок и кольцо не вместе',
    );

    /* «?» у прогноза. */
    await page.locator('.karta-prognoz__chto').click();
    check(
      (await text(page, '.karta-prognoz__podskazka')).includes('оценка'),
      '«?»: пояснение, что это оценка, а не обещание',
    );
    await page.locator('.karta-prognoz__podskazka button').click();

    /* Нажатие по №8. */
    await nazhat(page, 'oblast:8');
    await page.waitForSelector('.karta-okoshko');
    await dozhdatsya();
    const okoshko = await text(page, '.karta-okoshko');
    check(okoshko.includes('№8 Вычисления'), 'окошко: название раздела');
    const goroda = await page
      .locator('.karta-gorod')
      .evaluateAll((els) => els.map((e) => e.className.replace(/\s+/g, ' ')));
    check(goroda.length === 5, `окошко: 5 тем (${goroda.length})`);
    check(
      goroda[0].includes('karta-gorod--osvoeno') && goroda[1].includes('karta-gorod--osvoeno'),
      'окошко: степени и корни — оранжевые галочки',
    );
    check(goroda[2].includes('karta-gorod--tekushchaya'), 'окошко: логарифмы — текущая');
    check(goroda[3].includes('karta-gorod--pusto'), 'окошко: тригонометрия — пустой кружок');
    const logHref = await page.locator('.karta-gorod--tekushchaya a').getAttribute('href');
    check(
      logHref === '/zadaniya/8/trenazher/?tip=8.H',
      `окошко: «Логарифмы» → тренажёр с темой (${logHref})`,
    );
    check(
      (await page.locator('.karta-okoshko a.karta-okoshko__nazvanie').getAttribute('href')) ===
        '/zadaniya/8/',
      'окошко: стрелка → «О задании»',
    );
    const panel = page.locator('.karta-panel.is-otkryta');
    check((await panel.count()) === 1, 'панель: открыта');
    const polosy = await panel
      .locator('.karta-polosa')
      .evaluateAll((els) =>
        els.map((e) => [
          e.querySelector('.karta-polosa__imya')?.textContent,
          e.querySelector('.karta-polosa__procent')?.textContent,
          e.classList.contains('is-osvoeno'),
        ]),
      );
    check(
      JSON.stringify(polosy.slice(0, 4)) ===
        JSON.stringify([
          ['Степени', '100 %', true],
          ['Корни', '100 %', true],
          ['Логарифмы', '60 %', false],
          ['Тригонометрия', '0 %', false],
        ]),
      `панель: полоски ${JSON.stringify(polosy)}`,
    );
    check(
      (await text(page, '.karta-panel__povtorit')).includes('логарифмы'),
      'панель: «Стоит повторить: логарифмы»',
    );
    check(
      (await panel.locator('a.karta-knopka--glavnaya').getAttribute('href')) ===
        '/zadaniya/8/trenazher/?tip=8.H',
      'панель: «Продолжить тренировку» — с логарифмами',
    );
    check(
      (await panel.locator('a:has-text("Опорные задачи")').getAttribute('href')) ===
        '/zadaniya/8/opornye-zadachi/',
      'панель: «Опорные задачи»',
    );
    const zakladka = panel.locator('.karta-panel__zakladka');
    await zakladka.click();
    check((await zakladka.getAttribute('aria-pressed')) === 'true', 'панель: закладка добавлена');
    const zak = await page.evaluate(() => localStorage.getItem('budetege:zakladki:v1') ?? '');
    check(
      zak.includes('"place":"razdel"') && zak.includes('"section":"8"'),
      'закладка раздела записана в хранилище закладок',
    );
    await zakladka.click();
    check((await zakladka.getAttribute('aria-pressed')) === 'false', 'панель: закладка снята');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'seredina-1280-8.png') });

    /* Вода закрывает. */
    {
      const h = await page.locator('.karta-holst').boundingBox();
      await page.mouse.click(h.x + 48, h.y + 40);
    }
    await page.waitForSelector('.karta-okoshko', { state: 'detached' });
    check(
      (await page.locator('.karta-panel.is-otkryta').count()) === 0,
      'вода: окошко и панель закрылись',
    );

    /* Пролив. */
    await page.locator('.karta-ves-mir').click();
    await dozhdatsya();
    await nazhat(page, 'proliv');
    await dozhdatsya();
    const proliv = await text(page, '.karta-panel');
    check(
      proliv.includes('Переход ко второй части') &&
        proliv.includes('Что подтянуть перед второй частью'),
      'пролив: карточка «Что подтянуть…»',
    );
    check(proliv.includes('Освоено 4 из 13'), 'пролив: «Освоено 4 из 13»');
    check(/№14 Уравнение подтянуть: №7, №8/.test(proliv), `пролив: №14 — подтянуть №7, №8`);
    check(/№15 Стереометрия готово/.test(proliv), 'пролив: №15 — готово');
    check(proliv.includes('Для тех, кто уверенно решает всё остальное'), 'пролив: №20 без связок');
    const kBefore = await page.locator('.karta-holst').evaluate((e) => ({
      k: e.style.getPropertyValue('--k'),
      y: e.style.getPropertyValue('--y'),
    }));
    await page.locator('.karta-panel button:has-text("Посмотреть часть 2")').click();
    await dozhdatsya();
    const kAfter = await page.locator('.karta-holst').evaluate((e) => ({
      k: e.style.getPropertyValue('--k'),
      y: e.style.getPropertyValue('--y'),
    }));
    check(
      kAfter.y !== kBefore.y || kAfter.k !== kBefore.k,
      'пролив: «Посмотреть часть 2» переезжает к материку',
    );
    check((await text(page, '.karta-panel')).includes('Часть 2'), 'пролив → сводка «Часть 2»');

    /* Табличка «Часть 1». */
    await page.locator('.karta-ves-mir').click();
    await dozhdatsya();
    await nazhat(page, 'chast:1');
    await dozhdatsya();
    check(
      (await text(page, '.karta-panel')).includes('Освоено 4 из 13'),
      'табличка «Часть 1»: сводка «Освоено 4 из 13»',
    );
    await page.keyboard.press('Escape');
    await ctx.close();
  }

  /* Отладочный снимок контуров и три ученика на компьютере. */
  if (SHOTS) {
    const { page, ctx } = await otkryt(browser, {
      width: 1440,
      height: 980,
      url: '/karta/?debug=1',
    });
    await page.locator('.karta-holst').screenshot({ path: path.join(SHOTS, 'debug-kontury.png') });
    await ctx.close();
    for (const uchenik of ['pusto', 'seredina', 'pochti-vsyo']) {
      for (const width of [1280, 1440]) {
        const { page, ctx } = await otkryt(browser, { width, height: 980, uchenik });
        await page.screenshot({ path: path.join(SHOTS, `${uchenik}-${width}.png`) });
        await ctx.close();
      }
    }
  }

  /* Тренажёр №8 → карта: прогресс обновился. */
  {
    const { page, ctx } = await otkryt(browser, {
      width: 1280,
      url: '/zadaniya/8/trenazher/?tip=8.H',
    });
    await page.waitForSelector('.trn-zadacha[data-task]');
    const { generate } = requireSrc('lib/vychisleniya/generate.ts');
    const { parseTaskId } = requireSrc('lib/vychisleniya/ids.ts');
    const { ru } = requireSrc('lib/vychisleniya/numbers.ts');
    for (let i = 0; i < 3; i += 1) {
      const id = await page.locator('.trn-zadacha[data-task]').first().getAttribute('data-task');
      const p = parseTaskId(id);
      const otvet = generate(p.prototype, p.seed, p.level).otvet;
      await page.fill('.trn-ekran .otvet-input__field', ru(otvet));
      await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
      await page.locator('.trn-knopki button:has-text("Дальше")').click();
      await page.waitForFunction(
        (prev) =>
          document.querySelector('.trn-ekran [data-task]')?.getAttribute('data-task') !== prev,
        id,
      );
    }
    await page.goto(BASE + '/karta/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.karta-holst[data-gotov]');
    check(
      (await page
        .locator('.karta-ostrov--v-processe .karta-ostrov__kontur[data-cel="oblast:8"]')
        .count()) === 1,
      'после трёх задач в тренажёре №8 — на карте «в процессе»',
    );
    await nazhat(page, 'oblast:8');
    await page.waitForSelector('.karta-okoshko');
    const polosa = await text(page, '.karta-polosa:has-text("Логарифмы") .karta-polosa__procent');
    check(polosa === '20 %', `логарифмы: один тип из пяти освоен — 20 % (${polosa})`);
    await ctx.close();
  }
  await browser.close();
}

/* ── WebKit, телефон ─────────────────────────────────────────────── */
{
  const browser = await webkit.launch();
  const { page, ctx, errors, dozhdatsya } = await otkryt(browser, {
    width: 390,
    height: 844,
    uchenik: 'seredina',
    mobile: true,
  });
  check(errors.length === 0, `телефон: без ошибок сценариев ${errors.join(' | ')}`);
  const holst = await page.locator('.karta-holst').boundingBox();
  const vid = () =>
    page.locator('.karta-holst').evaluate((e) => ({
      k: Number(e.style.getPropertyValue('--k')),
      x: parseFloat(e.style.getPropertyValue('--x')),
      y: parseFloat(e.style.getPropertyValue('--y')),
    }));
  const v0 = await vid();
  check(v0.k > 0 && v0.k < 1, `телефон: вид «Весь мир» (k = ${v0.k.toFixed(3)})`);
  const bezProkrutki = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  check(bezProkrutki, 'телефон: горизонтальной прокрутки нет');

  /* Движение пальцем: карта двигается, область не выбирается. */
  const cdp = page;
  const x0 = holst.x + holst.width / 2;
  const y0 = holst.y + holst.height / 2;
  await cdp.touchscreen.tap(x0, y0); // первое касание — по воде/острову: закроем
  await dozhdatsya();
  await page.keyboard.press('Escape').catch(() => {});
  /* Перетаскивание через Pointer Events: эмулируем серией touch-событий. */
  const dragged = await page.evaluate(
    ([x, y]) => {
      const el = document.querySelector('.karta-holst');
      const before = el.style.getPropertyValue('--x');
      const fire = (type, cx, cy) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: cx,
            clientY: cy,
            bubbles: true,
            isPrimary: true,
            button: 0,
          }),
        );
      fire('pointerdown', x, y);
      for (let i = 1; i <= 8; i += 1) fire('pointermove', x + i * 12, y + i * 6);
      fire('pointerup', x + 96, y + 48);
      return {
        before,
        after: el.style.getPropertyValue('--x'),
        vybor: document.querySelector('.karta-panel.is-otkryta') !== null,
      };
    },
    [x0, y0],
  );
  check(
    dragged.before !== dragged.after,
    `телефон: движение пальцем двигает карту (${dragged.before} → ${dragged.after})`,
  );
  check(dragged.vybor === false, 'телефон: движение пальцем не выбирает область');
  /* Щипок: масштаб растёт. */
  const pinched = await page.evaluate(
    ([x, y]) => {
      const el = document.querySelector('.karta-holst');
      const k0 = Number(el.style.getPropertyValue('--k'));
      const fire = (type, id, cx, cy) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            clientX: cx,
            clientY: cy,
            bubbles: true,
            isPrimary: id === 1,
            button: 0,
          }),
        );
      fire('pointerdown', 1, x - 30, y);
      fire('pointerdown', 2, x + 30, y);
      for (let i = 1; i <= 6; i += 1) {
        fire('pointermove', 1, x - 30 - i * 10, y);
        fire('pointermove', 2, x + 30 + i * 10, y);
      }
      fire('pointerup', 1, x - 90, y);
      fire('pointerup', 2, x + 90, y);
      return {
        k0,
        k1: Number(el.style.getPropertyValue('--k')),
        vybor: document.querySelector('.karta-panel.is-otkryta') !== null,
      };
    },
    [x0, y0],
  );
  check(
    pinched.k1 > pinched.k0 * 1.5,
    `телефон: щипок приближает (${pinched.k0.toFixed(3)} → ${pinched.k1.toFixed(3)})`,
  );
  check(pinched.vybor === false, 'телефон: щипок не выбирает область');
  await page.locator('.karta-ves-mir').click();
  await dozhdatsya();

  /* Короткое касание выбирает: шторка снизу, окошко, кнопка «?» видна и не перекрыта. */
  const box8 = await page.locator('.karta-ostrov__kontur[data-cel="oblast:8"]').boundingBox();
  await page.touchscreen.tap(box8.x + box8.width / 2, box8.y + box8.height / 2);
  await page.waitForSelector('.karta-okoshko');
  await dozhdatsya();
  const panel = page.locator('.karta-panel.is-otkryta');
  check((await panel.count()) === 1, 'телефон: касание открывает шторку');
  const pb = await panel.boundingBox();
  check(
    pb.y + pb.height >= holst.y + holst.height - 2 && pb.height < holst.height * 0.5,
    'телефон: шторка снизу, не выше половины карты',
  );
  const fab = await page
    .locator('.help-fab')
    .boundingBox()
    .catch(() => null);
  const fabHidden = await page
    .locator('.help-fab')
    .evaluate(
      (e) => getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).opacity === '0',
    )
    .catch(() => true);
  check(
    fab === null || fabHidden || fab.y + fab.height <= pb.y || fab.x >= pb.x + pb.width,
    'телефон: кнопка «?» не перекрыта шторкой',
  );
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'seredina-390-8.png') });
  /* Касание по теме ведёт в тренажёр. */
  check(
    (await page.locator('.karta-gorod--tekushchaya a').getAttribute('href')) ===
      '/zadaniya/8/trenazher/?tip=8.H',
    'телефон: тема → тренажёр',
  );
  /* Вода над материками: карта на телефоне стоит посередине холста. */
  await page.touchscreen.tap(holst.x + holst.width / 2, holst.y + 40);
  await page.waitForSelector('.karta-okoshko', { state: 'detached' });
  check(
    (await page.locator('.karta-panel.is-otkryta').count()) === 0,
    'телефон: касание по воде закрывает',
  );

  if (SHOTS) {
    await ctx.close();
    for (const uchenik of ['pusto', 'seredina', 'pochti-vsyo']) {
      for (const [width, height] of [
        [375, 812],
        [390, 844],
        [768, 1024],
      ]) {
        const { page, ctx } = await otkryt(browser, { width, height, uchenik, mobile: true });
        await page.screenshot({ path: path.join(SHOTS, `${uchenik}-${width}.png`) });
        await ctx.close();
      }
    }
  } else {
    await ctx.close();
  }
  await browser.close();
}

server.close();
console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
