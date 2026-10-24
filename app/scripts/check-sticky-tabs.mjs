#!/usr/bin/env node
/* scripts/check-sticky-tabs.mjs — меню раздела: плитки и липкая панель.

   Запуск: pnpm build && pnpm test:sticky-tabs

   Устройство — components/tasks/TabsRow.tsx: плитки стоят в потоке
   страницы, поверх неё у верха экрана — компактная панель с теми же
   вкладками (отчёт docs/layout/01-sticky-tabs.md).

   Собранный сайт открывается в Chromium и (если установлен) в WebKit —
   движке Safari — на ширине компьютера (1280×800) и телефона
   (профиль iPhone 13: 390×844, DPR 3). Каждая страница из списка
   прокручивается от начала до конца и обратно: около плиток — шагом
   50 px, дальше — крупнее. На каждом шаге:
     — прокрутка встала туда, куда просили (браузер её не откатил);
     — плитки и начало содержимого под ними стоят на своих местах в
       документе: сдвига макета нет, пустого блока на месте плиток нет;
     — панель показана ровно тогда, когда нижний край плиток ушёл под
       её нижний край, и спрятана, когда плитки вернулись (на самой
       границе, с точностью до полпикселя, годится любое состояние);
     — показанная панель — у верха окна, над плитками по горизонтали,
       её низ записан в --topic-sticky-top; активная вкладка в ней
       видна без прокрутки ленты;
     — фокусируемая и видимая скринридеру копия меню ровно одна:
       у другой inert и aria-hidden.
   В Chromium вдобавок считается Layout Shift API за всю прокрутку —
   сдвиги меню и блока сразу под ним.

   Отдельно:
     — панель проявляется только через opacity/transform, при
       «уменьшить движение» — без перехода; отступ сверху — безопасная
       зона экрана (env(safe-area-inset-top));
     — фокус на вкладке в плитках переезжает в панель и обратно;
     — переход по вкладке из панели: содержимое новой вкладки
       начинается сразу под панелью, а не под ней;
     — переход по подпункту «Содержания» теории №11: блок встаёт под
       панелью. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices, webkit } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

/* Баннер cookie в этой проверке не нужен: он перекрывает кнопки снизу. */
bezBanneraCookieVsyudu(chromium, webkit);

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

/* Адреса можно сузить префиксами: node scripts/check-sticky-tabs.mjs /zadaniya/11/ */
const ONLY = process.argv.slice(2).filter((arg) => arg.startsWith('/'));
const ALL_PAGES = [
  '/zadaniya/11/',
  '/zadaniya/11/teoriya/',
  '/zadaniya/11/opornye-zadachi/',
  '/zadaniya/11/opornye-zadachi/massa-veshchestva/',
  '/zadaniya/11/trenazher/',
  '/zadaniya/11/generator/',
  '/zadaniya/11/dlya-repetitorov/',
  '/zadaniya/1/',
  '/zadaniya/2/teoriya/',
  '/zadaniya/4/',
  '/zadaniya/5/teoriya/',
  '/zadaniya/8/',
  '/zadaniya/9/',
  '/zadaniya/13/',
  '/zadaniya/13/teoriya/',
  '/zadaniya/13/opornye-zadachi/',
  '/zadaniya/13/opornye-zadachi/tablitsa-dif/',
  '/zadaniya/16/',
  '/zadaniya/16/teoriya/',
  '/zadaniya/16/opornye-zadachi/',
  '/zadaniya/15/',
  /* №12: страница подтем — лента строкой (SectionTabs), подтемы — над
     лентой в той же строке плашка разделов (TopicTabs). */
  '/zadaniya/12/',
  '/zadaniya/12/irrational/',
  '/zadaniya/12/exponential/',
  '/zadaniya/12/logarithmic/',
  '/zadaniya/12/trigonometric/',
  '/zadaniya/12/quadratic/opornye-zadachi/',
  '/zadaniya/10/',
  '/zadaniya/10/teoriya/',
  '/zadaniya/10/opornye-zadachi/',
  '/zadaniya/10/trenazher/',
  '/zadaniya/10/generator/',
  '/zadaniya/10/dlya-repetitorov/',
  '/zadaniya/6/',
  '/zadaniya/6/teoriya/',
  '/zadaniya/6/opornye-zadachi/',
  '/zadaniya/6/trenazher/',
  '/zadaniya/6/generator/',
  '/zadaniya/7/',
  '/zadaniya/7/teoriya/',
  '/zadaniya/7/opornye-zadachi/',
  '/zadaniya/7/trenazher/',
  '/zadaniya/7/generator/',
  '/zadaniya/7/dlya-repetitorov/',
];
const PAGES =
  ONLY.length === 0 ? ALL_PAGES : ALL_PAGES.filter((url) => ONLY.some((p) => url.startsWith(p)));

const SIZES = [
  { name: 'компьютер', context: { viewport: { width: 1280, height: 800 } } },
  { name: 'телефон', context: devices['iPhone 13'] },
];

/* Переход по вкладке из панели: страница, вкладка, адрес после. */
const PANEL_CLICKS = [
  { url: '/zadaniya/11/generator/', tab: 'Тренажёр', path: '/zadaniya/11/trenazher/' },
  { url: '/zadaniya/10/teoriya/', tab: 'Опорные задачи', path: '/zadaniya/10/opornye-zadachi/' },
  { url: '/zadaniya/12/irrational/', tab: 'Теория', path: '/zadaniya/12/irrational/' },
];

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

/** Замер меню и страницы в браузере. */
function zamer(page) {
  return page.evaluate(() => {
    const tiles = document.querySelector('.topic-tabs-row:not(.topic-tabs-row--panel)');
    const panel = document.querySelector('.topic-tabs-row--panel');
    if (tiles === null || panel === null) {
      return null;
    }
    const sy = window.scrollY;
    const t = tiles.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const style = getComputedStyle(panel);
    const lineTop = parseFloat(style.top) || 0;
    const line = lineTop + panel.offsetHeight;
    let content = tiles.nextElementSibling;
    while (content !== null && (content === panel || content.getClientRects().length === 0)) {
      content = content.nextElementSibling;
    }
    const strip = panel.querySelector('.topic-tabs');
    const active = strip?.querySelector('[aria-selected="true"]') ?? null;
    const s = strip?.getBoundingClientRect();
    const a = active?.getBoundingClientRect();
    const page = tiles.parentElement;
    return {
      sy,
      max: document.documentElement.scrollHeight - window.innerHeight,
      tilesTopDoc: t.top + sy,
      tilesBottomDoc: t.bottom + sy,
      tilesBottom: t.bottom,
      tilesLeft: t.left,
      tilesWidth: t.width,
      tilesMargin: tiles.style.marginBottom,
      contentTopDoc: content === null ? null : content.getBoundingClientRect().top + sy,
      contentTop: content === null ? null : content.getBoundingClientRect().top,
      shown: panel.classList.contains('is-shown'),
      opacity: parseFloat(style.opacity),
      visibility: style.visibility,
      panelTop: p.top,
      panelBottom: p.bottom,
      panelLeft: p.left,
      panelWidth: p.width,
      lineTop,
      line,
      stickyVar: parseFloat(getComputedStyle(page).getPropertyValue('--topic-sticky-top')),
      tilesInert: tiles.inert === true,
      tilesAria: tiles.getAttribute('aria-hidden'),
      panelInert: panel.inert === true,
      panelAria: panel.getAttribute('aria-hidden'),
      liveRows: document.querySelectorAll('.topic-tabs-row:not([inert])').length,
      activeVisible:
        a === undefined || s === undefined ? true : a.left >= s.left - 1 && a.right <= s.right + 1,
      cls: window.__cls ?? 0,
    };
  });
}

/* Что не так на этом шаге; null — всё верно. */
function oshibka(z, want, base) {
  const at = `прокрутка ${Math.round(want)}`;
  const expected = Math.min(want, z.max);
  if (Math.abs(z.sy - expected) > 1.5) {
    return `${at}: страница встала на ${Math.round(z.sy)} — прокрутку откатило`;
  }
  if (Math.abs(z.tilesTopDoc - base.tilesTopDoc) > 1 || z.tilesMargin !== '') {
    return `${at}: плитки сдвинулись в документе на ${Math.round(z.tilesTopDoc - base.tilesTopDoc)}`;
  }
  if (base.contentTopDoc !== null && Math.abs(z.contentTopDoc - base.contentTopDoc) > 1) {
    return `${at}: содержимое под плитками сдвинулось на ${Math.round(z.contentTopDoc - base.contentTopDoc)}`;
  }
  /* Ровно на границе (низ плиток совпал с низом панели) IntersectionObserver
     считает касание пересечением — тут годится любое состояние. */
  const under = z.tilesBottom < z.line;
  if (Math.abs(z.tilesBottom - z.line) > 0.5 && z.shown !== under) {
    return `${at}: низ плиток на ${Math.round(z.tilesBottom)}, низ панели на ${Math.round(z.line)}, а панель ${z.shown ? 'показана' : 'скрыта'}`;
  }
  if (z.liveRows !== 1) {
    return `${at}: копий меню без inert — ${z.liveRows}`;
  }
  if (z.shown) {
    if (!z.tilesInert || z.tilesAria !== 'true' || z.panelInert || z.panelAria !== null) {
      return `${at}: у плиток под панелью нет inert/aria-hidden или они есть у панели`;
    }
    if (z.opacity < 0.99 || z.visibility !== 'visible') {
      return `${at}: панель показана, но не проявилась (opacity ${z.opacity})`;
    }
    if (Math.abs(z.panelTop - z.lineTop) > 1 || Math.abs(z.panelBottom - z.line) > 1) {
      return `${at}: панель на ${Math.round(z.panelTop)}–${Math.round(z.panelBottom)} вместо ${z.lineTop}–${z.line}`;
    }
    if (Math.abs(z.panelLeft - z.tilesLeft) > 1 || Math.abs(z.panelWidth - z.tilesWidth) > 1) {
      return `${at}: панель не над плитками по горизонтали`;
    }
    if (!z.activeVisible) {
      return `${at}: активная вкладка в панели за краем ленты`;
    }
  } else {
    if (z.tilesInert || z.tilesAria !== null || !z.panelInert || z.panelAria !== 'true') {
      return `${at}: скрытая панель без inert/aria-hidden или они у плиток`;
    }
    if (z.opacity > 0.01 || z.visibility !== 'hidden') {
      return `${at}: панель скрыта, но видна (opacity ${z.opacity})`;
    }
  }
  if (Math.abs(z.stickyVar - Math.round(z.line)) > 0.5) {
    return `${at}: --topic-sticky-top ${z.stickyVar} вместо ${Math.round(z.line)}`;
  }
  return null;
}

/* Шаги прокрутки: около плиток часто, дальше крупно, потом обратно. */
function shagi(base, vh) {
  const fine = Math.min(base.max, Math.round(base.tilesBottomDoc + vh * 0.3));
  const down = [];
  for (let y = 0; y <= fine; y += 50) {
    down.push(y);
  }
  for (let y = fine + Math.round(vh * 0.6); y < base.max; y += Math.round(vh * 0.6)) {
    down.push(y);
  }
  down.push(base.max);
  const up = [];
  for (let y = fine; y >= 0; y -= 50) {
    up.push(y);
  }
  return [...down, ...up];
}

/* Ждём, пока замер сойдётся: IntersectionObserver и отрисовка React
   приходят кадром позже, переход панели — 180 мс. Не дольше 1,5 с. */
async function dozhdatsya(page, want, base) {
  let z = null;
  let problem = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.waitForTimeout(50);
    z = await zamer(page);
    problem = oshibka(z, want, base);
    if (problem === null) {
      break;
    }
  }
  return { z, problem };
}

async function launch(engine, browserType) {
  try {
    return await browserType.launch(
      engine === 'Chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {},
    );
  } catch {
    console.log(`${engine} не установлен — пропущен (в CI он есть).`);
    return null;
  }
}

/* Сумма layout-shift без недавнего ввода (Chromium) — только тех, где
   сдвинулось меню или блок сразу под ним. Посторонние сдвиги (на
   теории №10 и №11 на компьютере догружается содержимое ниже по
   странице — они есть и без меню) сюда не входят. */
async function layoutShifts(context) {
  await context.addInitScript(() => {
    window.__cls = 0;
    const fromMenu = (node) => {
      const el = node instanceof Element ? node : node?.parentElement;
      if (el === null || el === undefined) {
        return false;
      }
      if (el.closest('.topic-tabs-row') !== null) {
        return true;
      }
      const tiles = document.querySelector('.topic-tabs-row:not(.topic-tabs-row--panel)');
      let content = tiles?.nextElementSibling ?? null;
      while (content !== null && content.classList.contains('topic-tabs-row--panel')) {
        content = content.nextElementSibling;
      }
      return content !== null && el === content;
    };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput && (entry.sources ?? []).some((s) => fromMenu(s.node))) {
            window.__cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* WebKit: layout-shift не поддерживается */
    }
  });
}

async function newContext(browser, size, engine, extra = {}) {
  const options = { ...size.context, ...extra };
  if (engine !== 'Chromium') {
    /* WebKit в Playwright не знает isMobile. */
    delete options.isMobile;
  }
  const context = await browser.newContext(options);
  await welcomeSeen(context);
  await layoutShifts(context);
  return context;
}

async function prokrutka(context, engine, size, url) {
  const page = await context.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const where = `${engine}, ${size.name}, ${url}`;
  const base = await zamer(page);
  check(base !== null, `${where}: нет плиток или панели`);
  if (base === null) {
    await page.close();
    return;
  }
  const bad = [];
  for (const y of shagi(base, size.context.viewport.height)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    const { problem } = await dozhdatsya(page, y, base);
    if (problem !== null) {
      bad.push(problem);
    }
  }
  check(bad.length === 0, `${where}: ${bad.slice(0, 3).join('; ')}`);
  if (engine === 'Chromium') {
    const end = await zamer(page);
    const shift = end.cls - base.cls;
    check(shift < 0.001, `${where}: Layout Shift за прокрутку ${shift.toFixed(4)}`);
  }
  await page.close();
}

/* Вид панели: только opacity/transform, отступ — безопасная зона. */
async function vid(browser, engine, size) {
  for (const reduce of [false, true]) {
    const context = await newContext(
      browser,
      size,
      engine,
      reduce ? { reducedMotion: 'reduce' } : {},
    );
    const page = await context.newPage();
    await page.goto(BASE + '/zadaniya/11/generator/', { waitUntil: 'networkidle' });
    const where = `${engine}, ${size.name}, вид панели${reduce ? ' (уменьшить движение)' : ''}`;
    const v = await page.evaluate(() => {
      const panel = document.querySelector('.topic-tabs-row--panel');
      const style = getComputedStyle(panel);
      /* Правило панели лежит в @layer components — обходим вглубь. */
      let top = '';
      const walk = (rules) => {
        for (const rule of rules) {
          if (rule.selectorText === '.topic-tabs-row.topic-tabs-row--panel' && rule.style.top) {
            top = rule.style.top;
          }
          if (rule.cssRules !== undefined) {
            walk(Array.from(rule.cssRules));
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(Array.from(sheet.cssRules));
        } catch {
          /* чужая таблица стилей */
        }
      }
      return {
        props: style.transitionProperty.split(',').map((x) => x.trim()),
        durations: style.transitionDuration.split(',').map((x) => parseFloat(x)),
        position: style.position,
        top,
      };
    });
    check(v.position === 'fixed', `${where}: панель не закреплена (position ${v.position})`);
    check(
      v.top.includes('safe-area-inset-top'),
      `${where}: отступ панели сверху не учитывает вырез экрана (${v.top})`,
    );
    check(
      v.props.every((p) => ['opacity', 'transform', 'visibility', 'none'].includes(p)),
      `${where}: переход не только opacity/transform: ${v.props.join(', ')}`,
    );
    if (reduce) {
      check(
        v.durations.every((d) => d <= 0.001),
        `${where}: при «уменьшить движение» переход есть (${v.durations.join(', ')})`,
      );
    } else {
      check(
        v.props.includes('opacity') && v.durations.some((d) => d >= 0.15 && d <= 0.2),
        `${where}: переход не 150–200 мс (${v.durations.join(', ')})`,
      );
      /* С анимацией панель доходит до полной видимости. */
      const base = await zamer(page);
      const deep = Math.round(base.tilesBottomDoc + 200);
      await page.evaluate((to) => window.scrollTo(0, to), deep);
      const { problem } = await dozhdatsya(page, deep, base);
      check(problem === null, `${where}: ${problem}`);
    }
    await context.close();
  }
}

/* Фокус на вкладке в плитках переезжает в панель и обратно. */
async function fokus(browser, engine, size) {
  const context = await newContext(browser, size, engine);
  const page = await context.newPage();
  await page.goto(BASE + '/zadaniya/11/generator/', { waitUntil: 'networkidle' });
  const where = `${engine}, ${size.name}, фокус`;
  await page.evaluate(() => {
    document
      .querySelector('.topic-tabs-row:not(.topic-tabs-row--panel) [aria-selected="true"]')
      .focus();
  });
  const base = await zamer(page);
  const gde = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      const row = el?.closest('.topic-tabs-row');
      return {
        inPanel: row?.classList.contains('topic-tabs-row--panel') === true,
        inTiles: row !== null && row?.classList.contains('topic-tabs-row--panel') === false,
        selected: el?.getAttribute('aria-selected') === 'true',
      };
    });
  await page.evaluate((to) => window.scrollTo(0, to), Math.round(base.tilesBottomDoc + 200));
  await dozhdatsya(page, Math.round(base.tilesBottomDoc + 200), base);
  const down = await gde();
  check(down.inPanel && down.selected, `${where}: фокус не переехал в панель`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await dozhdatsya(page, 0, base);
  const up = await gde();
  check(up.inTiles && up.selected, `${where}: фокус не вернулся в плитки`);
  await context.close();
}

/* Переход по вкладке из панели: начало новой вкладки — под панелью. */
async function perehod(browser, engine, size) {
  const context = await newContext(browser, size, engine);
  for (const item of PANEL_CLICKS) {
    const page = await context.newPage();
    await page.goto(BASE + item.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const where = `${engine}, ${size.name}, вкладка «${item.tab}» из панели на ${item.url}`;
    const base = await zamer(page);
    const deep = Math.min(base.max, Math.round(base.tilesBottomDoc + 900));
    await page.evaluate((to) => window.scrollTo(0, to), deep);
    await dozhdatsya(page, deep, base);
    const tab = page.locator('.topic-tabs-row--panel [role="tab"]', { hasText: item.tab });
    let clicked = false;
    for (let attempt = 0; attempt < 5 && !clicked; attempt += 1) {
      await tab.click();
      try {
        await page.waitForFunction(
          (name) =>
            document
              .querySelector('.topic-tabs-row--panel [aria-selected="true"]')
              ?.textContent?.includes(name) === true,
          item.tab,
          { timeout: 2000 },
        );
        clicked = true;
      } catch {
        /* страница ещё не ожила — жмём ещё раз */
      }
    }
    check(clicked, `${where}: вкладка не открылась`);
    await page.waitForTimeout(1200);
    const z = await zamer(page);
    const pathname = await page.evaluate(() => window.location.pathname);
    check(pathname === item.path, `${where}: адрес ${pathname} вместо ${item.path}`);
    check(z.shown, `${where}: после перехода панели нет`);
    check(
      z.contentTop !== null && z.contentTop >= z.line - 1 && z.contentTop <= z.line + 40,
      `${where}: начало вкладки на ${Math.round(z.contentTop)}, низ панели на ${Math.round(z.line)}`,
    );
    await page.close();
  }
  await context.close();
}

/* Подпункт содержания теории №11: блок встаёт под панелью. */
async function soderzhanie(browser, engine, size) {
  const context = await newContext(browser, size, engine);
  const page = await context.newPage();
  await page.goto(BASE + '/zadaniya/11/teoriya/', { waitUntil: 'networkidle' });
  const phone = size.name === 'телефон';
  /* Обработчики вешает React при гидратации. Тяжёлая страница в
     WebKit гидратируется позже networkidle, и ранний клик теряется:
     шторка не открывается, раздел не становится активным. Поэтому
     жмём, пока не наступит ожидаемое, — не больше пяти раз. */
  const nazhat = async (target, done, state = 'visible') => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await target.click();
      try {
        await done.waitFor({ state, timeout: 2000 });
        return;
      } catch {
        /* следующая попытка */
      }
    }
  };
  const where = `${engine}, ${size.name}, содержание теории №11`;
  const smesi = page.locator('.contents-item', { hasText: 'Смеси и сплавы' }).last();
  const sub = page.locator('.contents-sub__item', { hasText: 'Таблица' }).last();
  if (phone) {
    await nazhat(page.locator('.topic-open__btn'), smesi);
  }
  /* На телефоне выбор раздела закрывает шторку: подпункты есть в
     разметке, но скрыты до следующего открытия. */
  await nazhat(smesi, sub, 'attached');
  await page.waitForTimeout(900);
  if (phone && !(await sub.isVisible())) {
    await nazhat(page.locator('.topic-open__btn'), sub);
  }
  check((await sub.count()) > 0, `${where}: у открытого раздела нет подпунктов`);
  if ((await sub.count()) > 0) {
    await sub.click();
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const panel = document.querySelector('.topic-tabs-row--panel');
      const open = document.querySelector('.topic-open');
      const line =
        open !== null && getComputedStyle(open).position === 'sticky'
          ? open.getBoundingClientRect().bottom
          : panel.getBoundingClientRect().bottom;
      const node = document.getElementById('smesi-tablitsa').getBoundingClientRect();
      return { shown: panel.classList.contains('is-shown'), line, node: node.top };
    });
    check(r.shown, `${where}: после перехода панели нет`);
    check(
      r.node >= r.line - 1 && r.node < r.line + 160,
      `${where}: блок «Таблица» встал на ${Math.round(r.node)}, полосы над ним кончаются на ${Math.round(r.line)}`,
    );
  }
  await context.close();
}

async function proverit(engine, browserType) {
  const browser = await launch(engine, browserType);
  if (browser === null) {
    return;
  }
  for (const size of SIZES) {
    /* Состояния проверяются без анимации: проявление панели в
       безголовом WebKit изредка замирает на кадр-другой дольше
       ожидания. Сам переход проверяет vid(). */
    const context = await newContext(browser, size, engine, { reducedMotion: 'reduce' });
    for (const url of PAGES) {
      await prokrutka(context, engine, size, url);
    }
    await context.close();
    await vid(browser, engine, size);
    await fokus(browser, engine, size);
    await perehod(browser, engine, size);
    await soderzhanie(browser, engine, size);
  }
  await browser.close();
}

await proverit('Chromium', chromium);
await proverit('WebKit', webkit);
server.close();

console.log(`Меню раздела, плитки и липкая панель: проверок ${checks}, ошибок ${failures.length}.`);
for (const f of failures) {
  console.log(`  ✗ ${f}`);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
