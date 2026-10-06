#!/usr/bin/env node
/* scripts/check-error-boundaries.mjs — ошибка в одном блоке не роняет
   страницу, сбой загрузки кода лечится одной перезагрузкой.

   Запуск: pnpm build && pnpm test:error-boundaries

   1. Логика lib/chunkReload.ts: какие ошибки считаются сбоем загрузки
      кода и что вторая перезагрузка в течение минуты не запускается.
   2. Собранный сайт в Chromium на ширине телефона:
      - опорные задачи гиперболы: разбор задачи не раскрывается
        (подставлен сбой при чтении закрытой части) — на месте задач
        сообщение с кнопками «Обновить страницу» и «На главную»,
        шапка и вкладки раздела целы, страница не пустая;
      - после «Обновить страницу» задачи снова решаются;
      - сбой загрузки кода: страница перезагружается ровно один раз,
        повторный сбой в течение минуты её не перезагружает. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

/* ── 1. Логика перезагрузки ─────────────────────────────────── */
const {
  isChunkLoadError,
  isNetworkLoadError,
  isRecoverableLoadError,
  takeReloadTurn,
  CHUNK_RELOAD_KEY,
  CHUNK_RELOAD_WINDOW_MS,
} = requireSrc('lib/chunkReload.ts');

const named = Object.assign(new Error('x'), { name: 'ChunkLoadError' });
check(isChunkLoadError(named), 'ChunkLoadError по имени');
check(isChunkLoadError(new Error('Loading chunk 123 failed.')), 'Chrome: Loading chunk … failed');
check(isChunkLoadError(new Error('Loading CSS chunk 7 failed')), 'CSS-кусок');
check(
  isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://x/a.js')),
  'динамический import в Chrome',
);
check(
  isChunkLoadError(new Error('Importing a module script failed.')),
  'динамический import в Safari',
);
check(isChunkLoadError('ChunkLoadError'), 'строка');
check(
  !isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'x')")),
  'обычная ошибка кода — не сбой загрузки',
);
check(
  !isChunkLoadError(null) && !isChunkLoadError(undefined) && !isChunkLoadError(42),
  'не ошибки',
);

check(
  isNetworkLoadError(new TypeError('Load failed')),
  'Safari: TypeError Load failed — обрыв сети',
);
check(isNetworkLoadError(new TypeError('Failed to fetch')), 'Chrome: Failed to fetch');
check(isNetworkLoadError(new TypeError('network error')), 'Chrome: обрыв посреди тела ответа');
check(
  isNetworkLoadError(new TypeError('NetworkError when attempting to fetch resource.')),
  'Firefox',
);
check(!isNetworkLoadError(new Error('Load failed')), 'не TypeError — это не сеть');
check(
  !isNetworkLoadError(new TypeError("Cannot read properties of undefined (reading 'x')")),
  'TypeError в коде — не сеть',
);
check(!isNetworkLoadError(new TypeError('Load failed for the image')), 'похожая фраза — не сеть');
check(
  isRecoverableLoadError(named) && isRecoverableLoadError(new TypeError('Load failed')),
  'лечится перезагрузкой: код и сеть',
);

function fakeMemory(initial) {
  const data = new Map(initial ? [[CHUNK_RELOAD_KEY, initial]] : []);
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}
const t0 = 1_000_000;
const memory = fakeMemory();
check(takeReloadTurn(memory, t0) === true, 'первая перезагрузка разрешена');
check(takeReloadTurn(memory, t0 + 1000) === false, 'вторая в течение минуты запрещена');
check(
  takeReloadTurn(memory, t0 + CHUNK_RELOAD_WINDOW_MS - 1) === false,
  'граница окна: ещё нельзя',
);
check(takeReloadTurn(memory, t0 + CHUNK_RELOAD_WINDOW_MS + 1) === true, 'после окна снова можно');
check(takeReloadTurn(null, t0) === false, 'нет хранилища — автоперезагрузки нет');
check(takeReloadTurn(fakeMemory('мусор'), t0) === true, 'мусор в пометке не мешает');
check(
  takeReloadTurn(
    {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {},
    },
    t0,
  ) === false,
  'хранилище бросает — перезагрузки нет',
);

/* ── 2. Сайт в браузере ─────────────────────────────────────── */
const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
/* Обрыв посреди ответа: отдаём половину тела и рвём соединение. */
const cuts = [];
const server = http.createServer((req, res) => {
  const cut = cuts.find((rule) => rule.left > 0 && rule.match.test(req.url));
  if (cut !== undefined) {
    cut.left -= 1;
  }
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (cut !== undefined) {
    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      'content-length': body.length,
    });
    res.write(body.subarray(0, Math.floor(body.length / 2)));
    setTimeout(() => req.socket.destroy(), 50);
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});

const SKILLS = path.join(OUT, 'zadaniya', '12', 'rational', 'opornye-zadachi');
const skill = fs.readdirSync(SKILLS).find((name) => !name.includes('.'));
const TASKS = `${BASE}/zadaniya/12/rational/opornye-zadachi/${skill}/`;

/* Сбой при чтении закрытой части задачи: разбор лежит в JSON с ключом
   steps, его читает экран после «Проверить». */
async function breakSolutionDecode(context) {
  await context.addInitScript(() => {
    if (window.localStorage.getItem('__fix') === '1') {
      return;
    }
    const parse = JSON.parse.bind(JSON);
    JSON.parse = (text, reviver) => {
      if (typeof text === 'string' && text.includes('"steps"')) {
        throw new Error('тестовый сбой чтения разбора');
      }
      return parse(text, reviver);
    };
  });
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await breakSolutionDecode(context);
  const page = await context.newPage();
  await page.goto(TASKS);
  await page.waitForSelector('.ptask');
  check((await page.locator('.ptask').count()) === 1, 'до сбоя экран задач есть');

  const option = page.locator('.popt').first();
  if ((await option.count()) > 0) {
    await option.click();
  } else {
    await page.locator('.ptask__input').fill('123456');
  }
  await page.getByRole('button', { name: 'Проверить' }).click();
  await page.waitForTimeout(300);

  const text = await page.innerText('body');
  check(text.length > 300, 'страница не пустая после сбоя');
  check(text.includes('Не удалось показать задачи'), 'на месте задач — сообщение по-русски');
  check(
    (await page.getByRole('button', { name: 'Обновить страницу' }).count()) === 1,
    'кнопка «Обновить страницу»',
  );
  check(
    (await page.getByRole('link', { name: 'На главную' }).count()) === 1,
    'кнопка «На главную»',
  );
  check(
    (await page.locator('.topic-tabs, [role="tablist"], nav').count()) > 0,
    'оболочка и навигация на месте',
  );
  check((await page.locator('.ptask').count()) === 0, 'сломанный экран задач убран');
  check(
    (await page.getByRole('link', { name: 'На главную' }).getAttribute('href')) === '/',
    '«На главную» ведёт на /',
  );

  /* «Обновить страницу»: после перезагрузки (сбой снят) задачи работают. */
  await page.evaluate(() => window.localStorage.setItem('__fix', '1'));
  await page.getByRole('button', { name: 'Обновить страницу' }).click();
  await page.waitForSelector('.ptask');
  check(
    (await page.locator('.ptask').count()) === 1,
    'после «Обновить страницу» задачи снова открыты',
  );
  await context.close();
}

{
  /* Сбой загрузки кода: одна перезагрузка и ни одной лишней. */
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/zadaniya/12/rational/`);
  await page.waitForLoadState('load');
  await page.evaluate(() => {
    window.__marker = 'до';
  });

  const failChunk = () =>
    page.evaluate(() => {
      Promise.reject(
        Object.assign(new Error('Loading chunk 42 failed.'), { name: 'ChunkLoadError' }),
      );
    });

  const reloaded = page.waitForEvent('load', { timeout: 5000 }).then(
    () => true,
    () => false,
  );
  await failChunk();
  check(await reloaded, 'сбой загрузки кода: страница перезагрузилась');
  check(
    (await page.evaluate(() => window.__marker)) === undefined,
    'после перезагрузки состояние страницы новое',
  );
  check(
    (await page.evaluate((key) => window.sessionStorage.getItem(key), CHUNK_RELOAD_KEY)) !== null,
    'перезагрузка записана в sessionStorage',
  );

  await page.evaluate(() => {
    window.__marker = 'после';
  });
  await failChunk();
  await page.waitForTimeout(1500);
  check(
    (await page.evaluate(() => window.__marker)) === 'после',
    'повторный сбой в течение минуты страницу не перезагружает',
  );

  /* Обычная ошибка кода автоперезагрузку не запускает. */
  const context2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await context2.newPage();
  await page2.goto(`${BASE}/zadaniya/12/rational/`);
  await page2.evaluate(() => {
    window.__marker = 'жив';
    Promise.reject(new TypeError('обычная ошибка'));
  });
  await page2.waitForTimeout(1200);
  check(
    (await page2.evaluate(() => window.__marker)) === 'жив',
    'обычная ошибка страницу не перезагружает',
  );
  await context.close();
  await context2.close();
}

/* Обрыв сети посреди ответа при переходе на вкладку и на страницу навыка:
   без перехвата Safari/LTE давали белый экран. Страница должна открыться
   сама после одной перезагрузки. Нужен WebKit (в CI он ставится). */
let safari = null;
try {
  safari = await webkit.launch();
} catch {
  console.log('WebKit не установлен — сценарий обрыва сети пропущен (в CI он есть).');
}
if (safari !== null) {
  for (const [what, match, target] of [
    ['на вкладку «Опорные задачи»', /opornye-zadachi\/index\.txt\?_rsc=/, 'a.prep-card'],
    ['на страницу навыка', new RegExp(`opornye-zadachi/${skill}/index\\.txt\\?_rsc=`), '.ptask'],
  ]) {
    const context = await safari.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    cuts.length = 0;
    await page.goto(`${BASE}/zadaniya/12/rational/`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    if (target === '.ptask') {
      await page.getByRole('tab', { name: /Опорные задачи/ }).click();
      await page.waitForSelector('a.prep-card');
    }
    cuts.push({ match, left: 1 });
    if (target === '.ptask') {
      await page.locator(`a.prep-card[href*="/${skill}/"]`).first().click();
    } else {
      await page.getByRole('tab', { name: /Опорные задачи/ }).click();
    }
    let opened = true;
    await page.waitForSelector(target, { timeout: 20000 }).catch(() => {
      opened = false;
    });
    const text = await page.innerText('body');
    check(opened, `обрыв ответа при переходе ${what}: страница открылась сама`);
    check(
      !/Что-то пошло не так/.test(text),
      `обрыв ответа при переходе ${what}: экран ошибки не остался`,
    );
    check(cuts[0].left === 0, `обрыв ответа при переходе ${what}: обрыв действительно был`);
    await context.close();
  }
  await safari.close();
}

await browser.close();
server.close();

console.log('Проверок границ ошибок: ' + checks);
if (failures.length > 0) {
  console.error('Не прошло:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('Расхождений нет.');
