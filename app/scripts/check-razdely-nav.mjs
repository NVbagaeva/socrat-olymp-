#!/usr/bin/env node
/* scripts/check-razdely-nav.mjs — навигация между разделами задания №12:
   плашка над вкладками, меню «Все разделы задания №12», блок «Другие
   разделы №12» внизу вкладки.

   Запуск: pnpm build && pnpm test:razdely-nav

   Собранный сайт открывается в Chromium на ширине телефона (390, с
   касаниями) и компьютера (1440). Проверяется:
     — плашка стоит в липкой строке над лентой, зона нажатия ≥ 44px;
     — сценарий: иррациональная → «Теория» → плашка → «Квадратичная функция» →
       открылась «Теория» параболы без перезагрузки → «Назад» вернул в
       иррациональную на «Теорию»;
     — с «Опорных задач» переход ведёт на «Опорные задачи» раздела;
     — меню: role="dialog", aria-modal, фокус внутри, страница под ним
       не прокручивается, высота не больше 85 % экрана;
     — закрытие крестиком, Escape, тапом по затемнению, «Назад»
       браузера и (на телефоне) свайпом вниз; фокус возвращается туда,
       откуда меню открыли;
     — «Скоро» — не ссылки и не нажимаются; текущий раздел отмечен;
     — кнопка «‹ Все разделы №12» открывает то же меню;
     — метка «тренировка не завершена» по записи тренажёра;
     — при prefers-reduced-motion панель без анимации;
     — в «Других разделах» нет текущего раздела и разделов «Скоро»;
     — иконки загрузились. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

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

/* Какие разделы открыты, а какие «Скоро», — из data/functionTypes.ts:
   флаг снимается одной строкой, и тест не надо править вместе с ним. */
const TYPES_SRC = fs.readFileSync(path.join(APP, 'src', 'data', 'functionTypes.ts'), 'utf8');
const RAZDELY = Array.from(
  TYPES_SRC.matchAll(/id: '([a-z]+)',\n\s+no: '\d+',[\s\S]*?status: '(active|soon)'/g),
).map((m) => ({ id: m[1], open: m[2] === 'active' }));
const SOON = RAZDELY.filter((r) => !r.open).length;
const OPEN = RAZDELY.filter((r) => r.open).length;
if (RAZDELY.length !== 7) {
  console.error(`В data/functionTypes.ts найдено разделов ${RAZDELY.length}, ожидалось 7`);
  process.exit(1);
}

const SIZES = [
  { name: 'телефон', width: 390, height: 844, isMobile: true },
  { name: 'компьютер', width: 1440, height: 900, isMobile: false },
];

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

const MENU = '.razdely-menu';

async function menuOpen(page) {
  return (await page.locator(MENU).count()) > 0;
}

/* Меню закрылось (с анимацией ухода — ждём её конца). */
async function waitClosed(page) {
  for (let i = 0; i < 30; i += 1) {
    if (!(await menuOpen(page))) {
      return true;
    }
    await page.waitForTimeout(50);
  }
  return false;
}

async function openByPlate(page) {
  await page.locator('.razdely-plashka').click();
  await page.waitForSelector(MENU);
  await page.waitForTimeout(400);
}

async function activeTab(page) {
  return (await page.locator('[role=tab][aria-selected=true]').first().innerText()).trim();
}

async function focusClass(page) {
  return page.evaluate(() => document.activeElement?.className ?? '');
}

/* Свайп вниз по панели: касания через протокол браузера. */
async function swipeDown(page) {
  const box = await page.locator('.razdely-menu__head').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y0 = box.y + 10;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let dy = 20; dy <= 200; dy += 20) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y0 + dy }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
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
  const where = (what) => `${size.name}: ${what}`;

  await page.goto(BASE + '/zadaniya/12/irrational/', { waitUntil: 'networkidle' });

  /* Плашка: в липкой строке над лентой, нажимается, иконка на месте. */
  const plate = await page.evaluate(() => {
    const node = document.querySelector('.razdely-plashka');
    if (node === null) {
      return null;
    }
    const row = node.closest('.topic-tabs-row');
    const box = node.getBoundingClientRect();
    const img = node.querySelector('img');
    return {
      inRow: row !== null && node.nextElementSibling?.classList.contains('topic-tabs') === true,
      height: box.height,
      text: node.textContent ?? '',
      img: img !== null && img.complete && img.naturalWidth > 0,
      imgHidden: img?.getAttribute('aria-hidden') === 'true',
      alt: img?.getAttribute('alt'),
    };
  });
  check(plate !== null, where('нет плашки раздела'));
  if (plate === null) {
    continue;
  }
  check(plate.inRow, where('плашка не в липкой строке над лентой вкладок'));
  check(plate.height >= 44, where(`высота плашки ${plate.height} < 44`));
  check(plate.text.includes('Иррациональная функция'), where('на плашке нет названия раздела'));
  check(plate.img, where('иконка на плашке не загрузилась'));
  check(plate.imgHidden && plate.alt === '', where('иконка не декоративная (alt / aria-hidden)'));

  /* Шапка: название функции под H1 видно на любой ширине, под ним —
     «График — …» (правило названий сайта). */
  const head = await page.evaluate(() => {
    const sub = document.querySelector('.topic-head__subtitle');
    const graph = document.querySelector('.topic-head__graph');
    const shown = (node) => node !== null && node.getBoundingClientRect().height > 0;
    return {
      sub: shown(sub) ? sub.textContent : null,
      graph: shown(graph) ? graph.textContent : null,
      order:
        sub !== null && graph !== null
          ? sub.getBoundingClientRect().bottom <= graph.getBoundingClientRect().top + 1
          : false,
    };
  });
  check(
    head.sub === 'Иррациональная функция',
    where(`под H1 не видно названия функции: «${head.sub}»`),
  );
  check(
    head.graph === 'График — ветвь параболы' && head.order,
    where(`под названием функции нет «График — …»: «${head.graph}»`),
  );

  /* Сценарий: «Теория» → меню → «Квадратичная функция». */
  await page.getByRole('tab', { name: 'Теория' }).click();
  await page.waitForTimeout(300);
  const historyBefore = await page.evaluate(() => history.length);
  await openByPlate(page);
  const dialog = await page.evaluate((sel) => {
    const node = document.querySelector(sel);
    return {
      role: node.getAttribute('role'),
      modal: node.getAttribute('aria-modal'),
      focusInside: node.contains(document.activeElement),
      overflow: document.body.style.overflow,
      height: node.getBoundingClientRect().height,
      vh: window.innerHeight,
      history: history.length,
      soonLinks: node.querySelectorAll('.razdel-karta.is-soon[href], a.razdel-karta.is-soon')
        .length,
      soon: node.querySelectorAll('.razdel-karta.is-soon[aria-disabled="true"]').length,
      current: node.querySelector('.razdel-karta[aria-current]')?.textContent ?? '',
      icons: Array.from(node.querySelectorAll('img')).every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
      captions: Array.from(node.querySelectorAll('.razdel-karta__caption')).map(
        (c) => c.textContent,
      ),
      titles: Array.from(node.querySelectorAll('.razdel-karta__title')).map((c) => c.textContent),
    };
  }, MENU);
  check(
    dialog.role === 'dialog' && dialog.modal === 'true',
    where('меню не role="dialog" aria-modal'),
  );
  check(dialog.focusInside, where('фокус не перешёл в меню'));
  check(dialog.overflow === 'hidden', where('страница под меню прокручивается'));
  check(dialog.height <= dialog.vh * 0.85 + 1, where(`меню выше 85 % экрана: ${dialog.height}`));
  check(dialog.history === historyBefore + 1, where('открытие меню не добавило запись в историю'));
  check(
    dialog.soon === SOON && dialog.soonLinks === 0,
    where(`«Скоро»: ${dialog.soon}, ссылок ${dialog.soonLinks}`),
  );
  check(dialog.current.includes('Сейчас здесь'), where('текущий раздел не отмечен «Сейчас здесь»'));
  check(dialog.icons, where('не все иконки в меню загрузились'));
  /* Подписи и названия не обрезаны многоточием: переносятся. */
  const cut = await page.evaluate(
    (sel) =>
      Array.from(
        document.querySelectorAll(
          `${sel} .razdel-karta__title, ${sel} .razdel-karta__caption, .razdely-plashka__text`,
        ),
      )
        .filter(
          (n) =>
            getComputedStyle(n).textOverflow === 'ellipsis' || n.scrollWidth > n.clientWidth + 1,
        )
        .map((n) => n.textContent),
    MENU,
  );
  check(cut.length === 0, where(`названия обрезаны: ${JSON.stringify(cut)}`));
  check(
    JSON.stringify(dialog.titles) ===
      JSON.stringify([
        'Линейная функция',
        'Квадратичная функция',
        'Дробно-линейная функция',
        'Иррациональная функция',
        'Показательная функция',
        'Логарифмическая функция',
        'Тригонометрические функции',
      ]),
    where(`названия в меню ${JSON.stringify(dialog.titles)}`),
  );
  check(
    JSON.stringify(dialog.captions) ===
      JSON.stringify([
        'График — прямая',
        'График — парабола',
        'График — гипербола',
        'График — ветвь параболы',
        'График — экспонента',
        'График — логарифмическая кривая',
        'Графики — синусоида, косинусоида, тангенсоида',
      ]),
    where(`подписи в меню ${JSON.stringify(dialog.captions)}`),
  );

  /* «Скоро» не нажимается: меню на месте, адрес тот же. Когда открыты
     все разделы, проверять нечего. */
  if (SOON > 0) {
    const urlBefore = page.url();
    await page.locator(`${MENU} .razdel-karta.is-soon`).first().click({ force: true });
    await page.waitForTimeout(300);
    check((await menuOpen(page)) && page.url() === urlBefore, where('карточка «Скоро» нажимается'));
  }

  /* Переход без перезагрузки: метка в окне переживает навигацию. */
  await page.evaluate(() => {
    window.__bezPerezagruzki = true;
  });
  await page.locator(`${MENU} a.razdel-karta`, { hasText: 'Квадратичная функция' }).click();
  await page.waitForURL(/\/zadaniya\/12\/quadratic\//);
  await page.waitForTimeout(600);
  check(
    page.url().endsWith('/zadaniya/12/quadratic/?vkladka=theory'),
    where(`адрес параболы ${page.url()}`),
  );
  check(
    (await activeTab(page)) === 'Теория',
    where(`у параболы открыта «${await activeTab(page)}», а не «Теория»`),
  );
  check(!(await menuOpen(page)), where('меню осталось открытым после перехода'));
  check(
    await page.evaluate(() => window.__bezPerezagruzki === true),
    where('переход перезагрузил страницу'),
  );
  check(
    await page.evaluate(() => document.body.style.overflow === ''),
    where('прокрутка не вернулась'),
  );

  await page.goBack();
  await page.waitForURL(/\/zadaniya\/12\/irrational\//);
  await page.waitForTimeout(600);
  check(
    (await page.locator('.razdely-plashka', { hasText: 'Иррациональная' }).count()) === 1,
    where('«Назад» не вернул в иррациональную'),
  );
  check(
    (await activeTab(page)) === 'Теория',
    where(`после «Назад» открыта «${await activeTab(page)}»`),
  );
  check(!(await menuOpen(page)), where('после «Назад» снова открыто меню'));

  /* Способы закрыть меню. Фокус каждый раз возвращается на плашку. */
  const ways = [
    ['крестик', async () => page.locator('.razdely-menu__x').click()],
    ['Escape', async () => page.keyboard.press('Escape')],
    ['затемнение', async () => page.mouse.click(size.width / 2, 20)],
    ['«Назад» браузера', async () => page.goBack()],
    ...(size.isMobile ? [['свайп вниз', async () => swipeDown(page)]] : []),
  ];
  for (const [name, act] of ways) {
    const url = page.url();
    const length = await page.evaluate(() => history.length);
    await openByPlate(page);
    await act();
    const closed = await waitClosed(page);
    check(closed, where(`меню не закрылось: ${name}`));
    await page.waitForTimeout(150);
    check(page.url() === url, where(`${name}: адрес сменился на ${page.url()}`));
    check(
      (await focusClass(page)).includes('razdely-plashka'),
      where(`${name}: фокус не вернулся на плашку`),
    );
    const state = await page.evaluate(() => (history.state ?? {}).razdelyMenu === true);
    check(!state, where(`${name}: в истории осталась запись меню`));
    /* Запись меню снята: следующая открывается на той же глубине. */
    check(
      (await page.evaluate(() => history.length)) <= length + 1,
      where(`${name}: история растёт`),
    );
  }

  /* Кнопка «‹ Все разделы №12» над заголовком. */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.razdely-vse').click();
  await page.waitForSelector(MENU);
  await page.waitForTimeout(400);
  check(await menuOpen(page), where('«Все разделы №12» не открыла меню'));
  await page.keyboard.press('Escape');
  await waitClosed(page);
  await page.waitForTimeout(150);
  check(
    (await focusClass(page)).includes('razdely-vse'),
    where('фокус не вернулся на «Все разделы №12»'),
  );

  /* С «Опорных задач» — на «Опорные задачи» другого раздела. */
  await page.goto(BASE + '/zadaniya/12/irrational/opornye-zadachi/', { waitUntil: 'networkidle' });
  await openByPlate(page);
  await page.locator(`${MENU} a.razdel-karta`, { hasText: 'Дробно-линейная функция' }).click();
  await page.waitForURL(/\/zadaniya\/12\/rational\//);
  await page.waitForTimeout(400);
  check(
    page.url().endsWith('/zadaniya/12/rational/opornye-zadachi/'),
    where(`с опорных задач попали на ${page.url()}`),
  );

  /* Блок «Другие разделы №12». */
  await page.goto(BASE + '/zadaniya/12/irrational/', { waitUntil: 'networkidle' });
  const drugie = await page.evaluate(() => {
    const block = document.querySelector('.drugie-razdely');
    return block === null
      ? null
      : {
          title: block.querySelector('h2')?.textContent ?? '',
          links: Array.from(block.querySelectorAll('a')).map((a) => a.getAttribute('href')),
        };
  });
  check(
    drugie !== null && drugie.title === 'Другие разделы №12',
    where('нет блока «Другие разделы №12»'),
  );
  if (drugie !== null) {
    check(
      JSON.stringify(drugie.links) ===
        JSON.stringify(
          RAZDELY.filter((r) => r.open && r.id !== 'irrational').map((r) => `/zadaniya/12/${r.id}/`),
        ),
      where(`в «Других разделах» ${JSON.stringify(drugie.links)}`),
    );
  }

  /* Незавершённая тренировка: запись тренажёра есть — метка есть. */
  await page.evaluate(() => localStorage.setItem('budetege:trainer:12:quadratic:session', '{}'));
  await page.reload({ waitUntil: 'networkidle' });
  await openByPlate(page);
  const metki = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.razdely-menu .razdel-karta'))
      .filter((card) => card.textContent.includes('тренировка не завершена'))
      .map((card) => card.querySelector('.razdel-karta__title')?.textContent),
  );
  check(
    JSON.stringify(metki) === '["Квадратичная функция"]',
    where(`метка тренировки у ${JSON.stringify(metki)}`),
  );
  await page.keyboard.press('Escape');
  await waitClosed(page);
  await page.evaluate(() => localStorage.removeItem('budetege:trainer:12:quadratic:session'));

  /* Уменьшенное движение: панель появляется без анимации. */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openByPlate(page);
  const anim = await page.evaluate(
    () => getComputedStyle(document.querySelector('.razdely-menu')).animationName,
  );
  check(anim === 'none', where(`при reduced-motion анимация «${anim}»`));
  await page.keyboard.press('Escape');
  check(await waitClosed(page), where('при reduced-motion меню не закрылось'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  /* Самое длинное название на плашке: помещается, без многоточия. */
  await page.goto(BASE + '/zadaniya/12/trigonometric/', { waitUntil: 'networkidle' });
  const longName = await page.evaluate(() => {
    const node = document.querySelector('.razdely-plashka__text');
    return {
      cut:
        getComputedStyle(node).textOverflow === 'ellipsis' ||
        node.scrollWidth > node.clientWidth + 1,
      text: node.textContent,
    };
  });
  check(!longName.cut, where(`название на плашке обрезано: ${longName.text}`));

  /* Иконки разделов на странице «Подтемы»: одна на раздел, из общего
     компонента, декоративные, с размерами и srcset; «Скоро» — бледные. */
  await page.goto(BASE + '/zadaniya/12/', { waitUntil: 'networkidle' });
  const podtemy = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.subtopic'));
    return {
      cards: cards.length,
      withIcon: cards.filter((c) => c.querySelector('picture.razdel-ico img') !== null).length,
      oldCharts: document.querySelectorAll('.subtopic-card__chart').length,
      bad: Array.from(document.querySelectorAll('.subtopic picture.razdel-ico img')).filter(
        (img) =>
          img.getAttribute('alt') !== '' ||
          img.getAttribute('aria-hidden') !== 'true' ||
          !img.getAttribute('width') ||
          !img.getAttribute('height') ||
          !/96w.*192w.*384w/.test(img.getAttribute('srcset') ?? '') ||
          !img.complete ||
          img.naturalWidth === 0,
      ).length,
      soonDim: document.querySelectorAll('.subtopic--soon picture.razdel-ico--soon').length,
      soonCards: document.querySelectorAll('.subtopic--soon').length,
      overlap: cards.filter((c) => {
        const go = c.querySelector('.subtopic__go')?.getBoundingClientRect();
        const ico = c.querySelector('picture')?.getBoundingClientRect();
        return (
          go &&
          ico &&
          !(
            go.bottom <= ico.top ||
            go.top >= ico.bottom ||
            go.right <= ico.left ||
            go.left >= ico.right
          )
        );
      }).length,
    };
  });
  check(
    podtemy.cards === 7 && podtemy.withIcon === 7,
    where(`«Подтемы»: иконок ${podtemy.withIcon} из ${podtemy.cards}`),
  );
  check(
    podtemy.bad === 0,
    where(
      `«Подтемы»: у ${podtemy.bad} иконок нет alt="", aria-hidden, размеров, srcset или файл не загрузился`,
    ),
  );
  check(
    podtemy.soonCards === SOON && podtemy.soonDim === SOON,
    where('«Подтемы»: иконки «Скоро» не бледные'),
  );
  check(podtemy.overlap === 0, where('«Подтемы»: стрелка налезает на иконку'));

  /* Окно выбора типа функции: иконки на месте, старых схем нет, названия
     не рвутся по слову (на телефоне), отметки: галочка у открытых. */
  await page.goto(BASE + '/zadaniya/', { waitUntil: 'networkidle' });
  await page
    .locator('.tasks-grid button, .tasks-grid [role=button]')
    .filter({ hasText: /Графики функций/ })
    .first()
    .click();
  await page.waitForSelector('.subtopic-modal');
  await page.waitForTimeout(500);
  const okno = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.subtopic-card'));
    const title = (name) =>
      Array.from(document.querySelectorAll('.subtopic-card__title')).find(
        (t) => t.textContent === name,
      );
    const quad = title('Квадратичная функция');
    return {
      cards: cards.length,
      icons: document.querySelectorAll('.subtopic-card picture.razdel-ico img').length,
      oldCharts: document.querySelectorAll('.subtopic-card__chart').length,
      checks: document.querySelectorAll('.subtopic-card__check:not(.subtopic-card__check--empty)')
        .length,
      soonDim: document.querySelectorAll('.subtopic-card--soon picture.razdel-ico--soon').length,
      quadLines:
        quad === undefined
          ? -1
          : Math.round(
              quad.getBoundingClientRect().height /
                parseFloat(getComputedStyle(quad).lineHeight || '20'),
            ),
      quadSize: quad === undefined ? 0 : parseFloat(getComputedStyle(quad).lineHeight),
    };
  });
  check(
    okno.cards === 7 && okno.icons === 7,
    where(`окно выбора: иконок ${okno.icons} из ${okno.cards}`),
  );
  check(okno.oldCharts === 0, where('в окне выбора остались старые схематичные значки'));
  check(
    okno.checks === OPEN,
    where(`окно выбора: галочек ${okno.checks}, нужно ${OPEN} (открытые разделы)`),
  );
  check(okno.soonDim === SOON, where('окно выбора: иконки «Скоро» не бледные'));
  if (size.isMobile) {
    check(okno.quadLines === 1, where('в окне выбора «Квадратичная функция» переносится по слову'));
  }

  /* Статистика тренажёра: иконка раздела и только свои наборы. Счётчики
     всех разделов лежат в одной записи budetege:trainer:v1. */
  await page.goto(BASE + '/zadaniya/12/quadratic/trenazher/', { waitUntil: 'networkidle' });
  await page.evaluate(() =>
    localStorage.setItem(
      'budetege:trainer:v1',
      JSON.stringify({
        kinds: {
          '12.A': { done: 5, right: 5, seconds: 50 },
          '12Q.A': { done: 2, right: 1, seconds: 20 },
        },
        mistakes: ['12.A-01', '12Q.A-02'],
      }),
    ),
  );
  await page.reload({ waitUntil: 'networkidle' });
  const stats = await page.evaluate(() => {
    const box = document.querySelector('.tstats');
    const img = box?.querySelector('.tstats__razdel img');
    return {
      counter: box?.querySelector('.tstats__counter b')?.textContent ?? null,
      razdel: box?.querySelector('.tstats__razdel')?.textContent?.trim() ?? null,
      img: img
        ? {
            alt: img.getAttribute('alt'),
            hidden: img.getAttribute('aria-hidden'),
            w: img.getAttribute('width'),
            h: img.getAttribute('height'),
          }
        : null,
      mistakes: box?.querySelectorAll('.tstats__mistakes li').length ?? 0,
    };
  });
  check(
    stats.counter === '2',
    where(`статистика параболы считает чужие наборы: «${stats.counter}» вместо 2`),
  );
  check(stats.mistakes === 1, where(`в ошибках параболы ${stats.mistakes} задач вместо 1`));
  check(
    stats.razdel === 'Квадратичная функция',
    where(`в статистике нет названия раздела: «${stats.razdel}»`),
  );
  check(
    stats.img !== null &&
      stats.img.alt === '' &&
      stats.img.hidden === 'true' &&
      stats.img.w !== null &&
      stats.img.h !== null,
    where('в статистике нет иконки раздела с alt="", aria-hidden и размерами'),
  );
  await page.getByRole('button', { name: 'Сбросить' }).click();
  const left = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('budetege:trainer:v1') ?? '{}'),
  );
  check(
    left.kinds?.['12.A']?.done === 5 &&
      left.kinds?.['12Q.A'] === undefined &&
      left.mistakes?.join() === '12.A-01',
    where('«Сбросить» на параболе стёр счётчики линейной или оставил свои'),
  );
  await page.evaluate(() => localStorage.removeItem('budetege:trainer:v1'));

  /* Закрытый раздел: страница «Скоро» с той же плашкой. */
  const closed = RAZDELY.find((r) => !r.open);
  if (closed) {
    await page.goto(BASE + '/zadaniya/12/' + closed.id + '/', { waitUntil: 'networkidle' });
    check(
      (await page.locator('.razdely-plashka').count()) === 1,
      where('на странице закрытого раздела нет плашки'),
    );
  }

  check(errors.length === 0, where(`ошибки на странице: ${errors.slice(0, 3).join('; ')}`));
  await context.close();
}

await browser.close();
server.close();

/* Один ключ тренировки на раздел: budetege:trainer:<раздел>:session.
   Меню читает ключи сам (razdely/trenirovki.ts), тренажёр пишет их через
   lib/trainerSession/store.ts (PR #131). Когда хранилище в проекте,
   приставка и окончание ключа обязаны совпадать. */
{
  const read = (rel) => {
    const file = path.join(APP, rel);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const part = (src, name) => src?.match(new RegExp(`const ${name} = '([^']*)'`))?.[1] ?? null;
  const menu = read('src/components/tasks/razdely/trenirovki.ts');
  check(
    part(menu, 'PREFIX') === 'budetege:trainer:' && part(menu, 'SUFFIX') === ':session',
    'ключ тренировки в меню не budetege:trainer:<раздел>:session',
  );
  const store = read('src/lib/trainerSession/store.ts');
  if (store !== null) {
    check(
      part(store, 'PREFIX') === part(menu, 'PREFIX') &&
        part(store, 'SUFFIX') === part(menu, 'SUFFIX'),
      'ключ тренировки в меню и в хранилище тренажёра разный',
    );
  }
}

console.log(`Навигация по разделам №12: проверок ${checks}, ошибок ${failures.length}.`);
for (const f of failures) {
  console.log(`  ✗ ${f}`);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
