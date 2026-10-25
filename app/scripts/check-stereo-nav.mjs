#!/usr/bin/env node
/* scripts/check-stereo-nav.mjs — каркас стереометрии (№3 и №15).

   Запуск: pnpm build && pnpm test:stereo-nav

   Без браузера (данные, docs/stereometry-plan.md):
     — каждый прототип банка №3 разобран ровно в одной главе теории и
       относится ровно к одному типу «О задании»; ссылаться на
       прототип, которого нет в банке, можно только на запланированный
       P03-92;
     — тип ведёт в существующую главу.

   В собранном сайте (Chromium, телефон 390 с касаниями и компьютер 1440):
     — у №3 и №15 одна и та же лента из шести вкладок, каждая открывается
       по своему адресу и подсвечена, лента прилипает при прокрутке;
     — плашка «Задание №… ▾» стоит в липкой строке, нажимается (≥ 44 px),
       открывает меню «Все разделы стереометрии»: два задания, текущее
       отмечено, внизу — ссылки к спискам заданий части 1 и части 2;
     — переход из меню в другое задание сохраняет вкладку;
     — теория: все главы на странице, номера №3 — с нуля; на телефоне
       «Содержание» открывается шторкой, на компьютере — колонка;
     — прежние адреса фигур №3 уводят на новые места;
     — живой чертёж в теории: движок грузится по касанию, чертёж
       поворачивается (мышью и пальцем вбок), при замедлении процессора
       ×4 кадры идут, шаги выделяют свои элементы, кнопки ≥ 44 px;
     — страница целиком не уезжает вбок, ошибок в консоли нет. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

/* Баннер cookie и окно «Впервые здесь?» в этой проверке не нужны: окно
   закрывает страницу целиком. */
bezBanneraCookieVsyudu(chromium);

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

/* ── Данные ─────────────────────────────────────────────────────── */

const { GLAVY_3, GLAVY_15, FIGURA_GLAVA } = requireSrc('content/stereo/glavy.ts');
const { TIPY_3, TIPY_15 } = requireSrc('content/stereo/tipy.ts');
const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');
const { RAZBORY_15 } = requireSrc('lib/stereo/razbory15.ts');
const { BANK } = requireSrc('lib/zadanie3/index.ts');
const { SOLID_THEME } = requireSrc('lib/solid/render.ts');
const HL = SOLID_THEME.width.hl;
const HL_HIDDEN = SOLID_THEME.width.hlHidden;

const PLAN = new Set([92]);
const bank = BANK.map((proto) => Number(proto.id.slice(4)));

function pokrytie(spisok, what) {
  const count = new Map();
  spisok.forEach((item) =>
    (item.prototipy ?? []).forEach((n) => count.set(n, (count.get(n) ?? 0) + 1)),
  );
  bank.forEach((n) =>
    check(count.get(n) === 1, `${what}: прототип P03-${n} встречается ${count.get(n) ?? 0} раз`),
  );
  [...count.keys()]
    .filter((n) => !bank.includes(n))
    .forEach((n) => check(PLAN.has(n), `${what}: прототипа P03-${n} нет в банке`));
}
pokrytie(GLAVY_3, 'главы №3');
pokrytie(TIPY_3, 'типы №3');
TIPY_3.forEach((tip) =>
  check(
    GLAVY_3.some((g) => g.id === tip.glava),
    `тип №3 ${tip.id}: нет главы ${tip.glava}`,
  ),
);
TIPY_15.forEach((tip) =>
  check(
    GLAVY_15.some((g) => g.id === tip.glava),
    `тип №15 ${tip.id}: нет главы ${tip.glava}`,
  ),
);
check(GLAVY_3[0]?.nomer === 0, 'главы №3 начинаются не с нуля');
Object.values(FIGURA_GLAVA).forEach((id) =>
  check(
    GLAVY_3.some((g) => g.id === id),
    `редирект фигуры ведёт в несуществующую главу ${id}`,
  ),
);

/* ── Сайт ───────────────────────────────────────────────────────── */

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const VKLADKI = [
  ['', 'О задании'],
  ['teoriya/', 'Теория'],
  ['opornye-zadachi/', 'Опорные задачи'],
  ['trenazher/', 'Тренажёр'],
  ['generator/', 'Генератор'],
  ['dlya-repetitorov/', 'Для репетиторов'],
];
const ZADANIYA = [
  { no: '3', glavy: GLAVY_3 },
  { no: '15', glavy: GLAVY_15 },
];
const SIZES = [
  { name: 'телефон', width: 390, height: 844, isMobile: true },
  { name: 'компьютер', width: 1440, height: 900, isMobile: false },
];

/* Прежние адреса фигур: редирект в разметке (статический экспорт). */
for (const [figura, glava] of Object.entries(FIGURA_GLAVA)) {
  const file = (tail) => path.join(OUT, 'zadaniya', '3', figura, tail, 'index.html');
  const html = fs.existsSync(file('')) ? fs.readFileSync(file(''), 'utf8') : '';
  check(
    html.includes(`url=/zadaniya/3/teoriya/#teoriya-${glava}`),
    `/zadaniya/3/${figura}/ не уводит в главу ${glava}`,
  );
  for (const [tail, kuda] of [
    ['trenazher', '/zadaniya/3/trenazher/'],
    ['opornye-zadachi', '/zadaniya/3/opornye-zadachi/'],
    ['podgotovka', '/zadaniya/3/opornye-zadachi/'],
  ]) {
    const h = fs.existsSync(file(tail)) ? fs.readFileSync(file(tail), 'utf8') : '';
    check(h.includes(`url=${kuda}`), `/zadaniya/3/${figura}/${tail}/ не уводит на ${kuda}`);
  }
}

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    isMobile: size.isMobile,
    hasTouch: size.isMobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const { no, glavy } of ZADANIYA) {
    for (const [tail, label] of VKLADKI) {
      const url = `/zadaniya/${no}/${tail}`;
      const where = (what) => `${size.name}, ${url}: ${what}`;
      await page.goto(BASE + url, { waitUntil: 'networkidle' });

      const tabs = await page
        .locator('.topic-tabs-row:not([inert]) .topic-tabs [role=tab]')
        .allInnerTexts();
      check(
        tabs.map((t) => t.trim()).join('|') === VKLADKI.map((v) => v[1]).join('|'),
        where(`вкладки: ${tabs.join(', ')}`),
      );
      const active = await page.locator('[role=tab][aria-selected=true]').first().innerText();
      check(active.trim() === label, where(`подсвечена «${active.trim()}»`));

      const wide = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      check(wide <= 1, where(`страница шире окна на ${wide}px`));

      if (tail !== '') {
        continue;
      }

      /* Над страницей появляется липкая панель вкладок (TabsRow). */
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(300);
      const stuck = await page.evaluate(() => {
        const row = document.querySelector('.topic-tabs-row--panel');
        return (
          row !== null && row.classList.contains('is-shown') && row.getBoundingClientRect().top <= 1
        );
      });
      check(stuck, where('лента вкладок не прилипла'));
      await page.evaluate(() => window.scrollTo(0, 0));

      /* Плашка и меню. */
      const plate = await page.evaluate(() => {
        const node = document.querySelector('.razdely-plashka');
        if (node === null) {
          return null;
        }
        return {
          inRow: node.closest('.topic-tabs-row') !== null,
          height: node.getBoundingClientRect().height,
          text: node.textContent ?? '',
        };
      });
      check(plate !== null, where('нет плашки задания'));
      if (plate === null) {
        continue;
      }
      check(plate.inRow, where('плашка не в строке ленты'));
      check(plate.height >= 44, where(`высота плашки ${plate.height} < 44`));
      check(plate.text.includes(`Задание №${no}`), where('на плашке нет номера задания'));

      await page.locator('.topic-tabs-row:not([inert]) .razdely-plashka').click();
      await page.waitForSelector('.razdely-menu');
      await page.waitForTimeout(400);
      const menu = await page.evaluate(() => {
        const node = document.querySelector('.razdely-menu');
        return {
          dialog: node?.getAttribute('role') === 'dialog',
          title: node?.querySelector('.razdely-menu__title')?.textContent ?? '',
          cards: node?.querySelectorAll('.razdel-karta').length ?? 0,
          current: node?.querySelector('.razdel-karta.is-current')?.textContent ?? '',
          chasti: Array.from(node?.querySelectorAll('.stereo-chasti a') ?? []).map((a) =>
            a.getAttribute('href'),
          ),
          height: node?.getBoundingClientRect().height ?? 0,
        };
      });
      check(menu.dialog, where('меню не диалог'));
      check(menu.title.includes('стереометрии'), where(`заголовок меню «${menu.title}»`));
      check(menu.cards === 2, where(`в меню ${menu.cards} карточек, а не 2`));
      check(menu.current.includes(`Задание №${no}`), where('текущее задание не отмечено'));
      check(
        menu.chasti.join(' ') === '/zadaniya/ /zadaniya/?part=2',
        where(`ссылки к частям: ${menu.chasti.join(' ')}`),
      );
      check(menu.height <= size.height * 0.85 + 1, where('меню выше 85% экрана'));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      check((await page.locator('.razdely-menu').count()) === 0, where('Escape не закрыл меню'));
    }

    /* Переход в другое задание сохраняет вкладку. */
    const drugoe = no === '3' ? '15' : '3';
    await page.goto(BASE + `/zadaniya/${no}/teoriya/`, { waitUntil: 'networkidle' });
    await page.locator('.topic-tabs-row:not([inert]) .razdely-plashka').click();
    await page.waitForSelector('.razdely-menu');
    await page.locator('.razdely-menu a.razdel-karta').click();
    await page.waitForURL(`**/zadaniya/${drugoe}/teoriya/`, { timeout: 5000 }).catch(() => {});
    check(
      new URL(page.url()).pathname === `/zadaniya/${drugoe}/teoriya/`,
      `${size.name}: из №${no} на «Теории» попали на ${new URL(page.url()).pathname}`,
    );

    /* Теория: все главы, номера, «Содержание». */
    await page.goto(BASE + `/zadaniya/${no}/teoriya/`, { waitUntil: 'networkidle' });
    const teoriya = await page.evaluate(
      (ids) => ({
        est: ids.filter((id) => document.getElementById(`teoriya-${id}`) !== null).length,
        pervyy: document.querySelector('.vteor-razdel__no')?.textContent?.trim() ?? '',
      }),
      glavy.map((g) => g.id),
    );
    check(teoriya.est === glavy.length, `${size.name}: №${no}: глав на странице ${teoriya.est}`);
    check(
      teoriya.pervyy === String(glavy[0].nomer),
      `${size.name}: №${no}: первая глава с номером ${teoriya.pervyy}`,
    );
    if (size.isMobile) {
      await page.locator('.topic-open__btn').click();
      await page.waitForTimeout(400);
      const items = await page
        .locator('.contents-sheet .topic-contents__item, .contents-sheet li')
        .count();
      check(items >= glavy.length, `${size.name}: №${no}: в шторке «Содержание» ${items} пунктов`);
      await page.keyboard.press('Escape');
    } else {
      const side = await page.locator('.topic-side').isVisible();
      check(side, `${size.name}: №${no}: нет колонки «Содержание»`);
    }
  }

  check(errors.length === 0, `${size.name}: ошибки на странице: ${errors.join('; ')}`);
  await context.close();
}

/* Живой чертёж в теории: движок приезжает по касанию, чертёж
   поворачивается, шаги выделяют свои элементы; при замедлении
   процессора в 4 раза кадры продолжают идти. */
for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    isMobile: size.isMobile,
    hasTouch: size.isMobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const js = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.js')) {
      js.push(r.url());
    }
  });
  const where = (what) => `${size.name}, живой чертёж: ${what}`;
  await page.goto(BASE + '/zadaniya/3/teoriya/', { waitUntil: 'networkidle' });
  const vid = page.locator('.z3d__vid').first();
  check((await vid.count()) === 1, where('нет на странице'));
  await vid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const svg0 = await page.locator('.z3d__kholst').first().innerHTML();
  check(svg0.includes('<svg'), where('нет первого кадра со сборки'));
  const jsDo = js.length;

  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    const node = document.querySelector('.z3d__kholst');
    window.__kadrov = 0;
    new MutationObserver(() => {
      window.__kadrov += 1;
    }).observe(node, { childList: true });
  });
  const box = await vid.boundingBox();
  const x0 = box.x + box.width / 2;
  const y0 = box.y + box.height / 2;
  if (size.isMobile) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: x0, y: y0 }],
    });
    for (let i = 1; i <= 30; i += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x0 - i * 5, y: y0 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    for (let i = 1; i <= 30; i += 1) {
      await page.mouse.move(x0 + i * 6, y0 + i * 2);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  check(js.length > jsDo, where('движок не догрузился по касанию'));
  const kadrov = await page.evaluate(() => window.__kadrov);
  check(kadrov >= 5, where(`при замедлении ×4 за поворот всего ${kadrov} кадров`));
  const svg1 = await page.locator('.z3d__kholst').first().innerHTML();
  check(svg1 !== svg0, where('не повернулся'));

  for (let k = 1; k <= 3; k += 1) {
    await page.locator('.z3d').first().getByRole('button', { name: 'Далее' }).click();
    await page.waitForTimeout(250);
    const shag = await page.locator('.z3d__shag').first().innerText();
    check(shag.trim() === `Шаг ${k} из 3`, where(`после «Далее» ${k} раз: «${shag}»`));
    const svg = await page.locator('.z3d__kholst').first().innerHTML();
    /* Выделенная линия — толщины выделения из оформления движка: видимая
       и скрытая (внутри куба, пунктиром). */
    check(
      svg.includes(`stroke-width="${HL}"`) || svg.includes(`stroke-width="${HL_HIDDEN}"`),
      where(`шаг ${k} не выделен`),
    );
  }
  const knopki = await page
    .locator('.z3d button')
    .evaluateAll((list) => list.map((b) => b.getBoundingClientRect().height));
  check(
    knopki.every((h) => h >= 44),
    where(`кнопки ниже 44px: ${knopki.join(', ')}`),
  );
  check(errors.length === 0, where(`ошибки: ${errors.join('; ')}`));
  await context.close();
}

/* Разборы типов («О задании» → карточка): лента на «О задании»,
   чертёж на месте, «Начать решение» выделяет первый шаг в тексте и на
   чертеже, страница не уезжает вбок; карточки «О задании» ведут сюда. */
for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    isMobile: size.isMobile,
    hasTouch: size.isMobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [no, razbory] of [
    ['3', RAZBORY_3],
    ['15', RAZBORY_15],
  ]) {
    await page.goto(BASE + `/zadaniya/${no}/`, { waitUntil: 'networkidle' });
    const ssylki = await page
      .locator('.stereo-tip--razbor')
      .evaluateAll((list) => list.map((a) => a.getAttribute('href')));
    check(
      ssylki.length === razbory.length,
      `${size.name}, №${no}: карточек с разбором ${ssylki.length}, разборов ${razbory.length}`,
    );
    for (const r of razbory) {
      const url = `/zadaniya/${no}/razbor/${r.tip}/`;
      const where = (what) => `${size.name}, ${url}: ${what}`;
      check(ssylki.includes(url), where('нет карточки на «О задании»'));
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      const active = await page.locator('[role=tab][aria-selected=true]').first().innerText();
      check(active.trim() === 'О задании', where(`подсвечена вкладка «${active.trim()}»`));
      check(
        (await page.locator('.stereo-razbor .z3d__kholst svg').count()) === 1,
        where('нет чертежа'),
      );
      const wide = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      check(wide <= 1, where(`страница шире окна на ${wide}px`));
      await page.locator('.stereo-razbor__nav .btn--primary').click();
      await page.waitForTimeout(400);
      check(
        (await page.locator('.stereo-razbor__step.is-active').count()) === 1,
        where('после «Начать решение» шаг не выделен'),
      );
      const svg = await page.locator('.stereo-razbor .z3d__kholst').innerHTML();
      /* Чертёж без шагов (ступенчатое тело) только вращается. */
      const m = r.model();
      const sShagami = [
        ...(m.lines ?? []),
        ...(m.sections ?? []),
        ...(m.angles ?? []),
        ...(m.marks ?? []),
      ].some((x) => x.shag !== undefined);
      check(
        !sShagami ||
          [HL, HL_HIDDEN, SOLID_THEME.width.hlMarker].some((x) =>
            svg.includes(`stroke-width="${x}"`),
          ) ||
          svg.includes('data-hl="1"'),
        where('на чертеже шаг 1 не выделен'),
      );
    }
  }
  check(errors.length === 0, `${size.name}, разборы: ошибки ${errors.join('; ')}`);
  await context.close();
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`check-stereo-nav: ${failures.length} из ${checks} проверок не прошли`);
  failures.forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`check-stereo-nav: ok (${checks} проверок)`);
