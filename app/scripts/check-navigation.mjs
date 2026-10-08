/* scripts/check-navigation.mjs — переходы внутри сайта без белого экрана.

   Белый экран на iPhone: нижняя кнопка «Банк заданий» вела на /zadaniya
   (без «/»), Apache на хостинге отвечал 301 на http://…/zadaniya/, а Safari
   такой редирект при переходе внутри сайта блокировал. Чинится в трёх
   местах, и проверяется здесь всё три:

   A. public/.htaccess (настоящий Apache над out/, scripts/lib/apache.mjs):
      адрес папки без «/» → один 301 сразу на https://<хост>/…/ (запрос
      идёт с Host: budetege.ru, как на хостинге), строка запроса
      сохраняется; адрес с «/» — 200; список файлов папки не отдаётся;
      файлы и несуществующие адреса не перенаправляются; index.txt,
      открытый как страница, — 302 тоже на https.
   B. Браузер на ширине iPhone (WebKit и Chromium) через тот же Apache:
      с /zadaniya/4/trenazher/, /zadaniya/12/, /zadaniya/2/teoriya/ и
      с главной нижняя кнопка «Банк заданий» открывает банк — адрес
      /zadaniya/, на экране список заданий, не пустая страница и не экран
      ошибки (с главной — через меню сайта: нижней панели на лендинге
      нет). То же после того, как вкладка пролежала открытой 11 минут
      (часы страницы переводятся вперёд).
   C. Страховка components/NavigationGuard.tsx: ссылка без «/» уводит на
      адрес с «/»; переход, который так и не случился, через 12 с (не
      раньше и не сильно позже) открывает целевую страницу целиком.
      Отдельно: данные страницы банка не пришли вовсе — банк всё равно
      открывается (это делает сам Next.js, обычным переходом браузера,
      ещё до страховки).

   Запуск после pnpm build:  node scripts/check-navigation.mjs
   Нужны apache2 и браузеры Playwright (в CI ставятся). Без WebKit
   локально сценарии идут только в Chromium; в CI WebKit обязателен. */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { startApache } from './lib/apache.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const PORT = 4183;

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) {
    failures.push(what);
  }
}

/* fetch не даёт подменить Host, поэтому запрос — через node:http. */
function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: url, method: 'GET', headers },
      (res) => {
        res.resume();
        res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const apache = await startApache(OUT, PORT);
const A = apache.url;

/* ── A. Редиректы Apache ─────────────────────────────────────── */
console.log('A. Косая черта на конце: Apache + public/.htaccess');
{
  const host = { Host: 'budetege.ru' };
  for (const [from, to] of [
    ['/zadaniya', 'https://budetege.ru/zadaniya/'],
    ['/zadaniya/12', 'https://budetege.ru/zadaniya/12/'],
    ['/zadaniya/4/trenazher', 'https://budetege.ru/zadaniya/4/trenazher/'],
    ['/zadaniya?part=2', 'https://budetege.ru/zadaniya/?part=2'],
  ]) {
    const r = await request(from, host);
    check(r.status === 301 && r.location === to, `${from} → 301 ${to} (${r.status} ${r.location})`);
  }
  for (const url of ['/', '/zadaniya/', '/zadaniya/12/', '/zadaniya/4/trenazher/']) {
    const r = await request(url, host);
    check(r.status === 200, `${url} → 200 (${r.status})`);
  }
  const dir = await request('/_next', host);
  check(
    dir.status === 301 && dir.location === 'https://budetege.ru/_next/',
    `/_next → 301 https (${dir.status} ${dir.location})`,
  );
  const listing = await request('/_next/', host);
  /* 403 — список запрещён (Options -Indexes), 404 — модуля списков нет. */
  check(
    listing.status === 403 || listing.status === 404,
    `/_next/ — список файлов не отдаётся (${listing.status})`,
  );
  const file = await request('/favicon.ico', host);
  check(file.status === 200, `файл /favicon.ico — 200 без перенаправления (${file.status})`);
  const missing = await request('/net-takoy-stranicy', host);
  check(missing.status === 404, `несуществующий адрес — 404, не редирект (${missing.status})`);
  const txt = await request('/zadaniya/4/index.txt?_rsc=x', {
    ...host,
    'Sec-Fetch-Dest': 'document',
    Accept: 'text/html',
  });
  check(
    txt.status === 302 && txt.location === 'https://budetege.ru/zadaniya/4/',
    `index.txt как страница → 302 https (${txt.status} ${txt.location})`,
  );
  /* Проверки в CI ходят на 127.0.0.1 по http: туда и уводим. */
  const local = await request('/zadaniya');
  check(
    local.status === 301 && local.location === `http://127.0.0.1:${PORT}/zadaniya/`,
    `локальный сервер проверок → http (${local.location})`,
  );
}

/* ── B, C. Браузер ──────────────────────────────────────────── */
const browsers = [];
try {
  browsers.push(['WebKit', await webkit.launch()]);
} catch {
  if (process.env.CI) {
    failures.push('WebKit не запустился — в CI он обязателен');
  } else {
    console.log('\nWebKit не установлен — сценарии только в Chromium (в CI WebKit есть).');
  }
}
/* CHROMIUM_PATH — свой Chromium, если версия Playwright с ним не совпадает. */
browsers.push([
  'Chromium',
  await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  ),
]);

const FROM = ['/zadaniya/4/trenazher/', '/zadaniya/12/', '/zadaniya/2/teoriya/', '/'];

/* В кабинете — нижняя панель; на главной (лендинг) её нет, там банк —
   в меню сайта под кнопкой «Открыть меню». */
async function openBank(page, from = '') {
  if (from === '/') {
    await page.getByRole('button', { name: 'Открыть меню' }).click();
    await page
      .getByRole('navigation', { name: 'Разделы сайта' })
      .getByRole('link', { name: 'Банк заданий' })
      .click();
  } else {
    await page
      .getByRole('navigation', { name: 'Основная навигация' })
      .getByRole('link', { name: /Банк заданий|Задания/ })
      .click();
  }
  await page.waitForURL((u) => u.pathname === '/zadaniya/', { timeout: 20000 });
  await page.getByRole('heading', { name: 'Банк заданий ЕГЭ' }).waitFor({ timeout: 20000 });
  const text = await page.innerText('body');
  return text.trim().length > 200 && !/Не удалось открыть страницу/.test(text);
}

for (const [name, browser] of browsers) {
  console.log(`\nB. ${name}, ширина iPhone: нижняя кнопка «Банк заданий»`);
  for (const idle of [false, true]) {
    for (const from of FROM) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: name !== 'Firefox',
        hasTouch: true,
      });
      /* Окно «Впервые здесь?» уже закрыто: иначе через 2,5 с (а при
         переводе часов — сразу) оно ложится поверх нижней панели.
         Проверяется навигация, не онбординг. */
      await context.addInitScript(() =>
        localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true })),
      );
      const page = await context.newPage();
      const requested = [];
      page.on('request', (r) => requested.push(new URL(r.url()).pathname));
      if (idle) {
        await page.clock.install();
      }
      await page.goto(A + from, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      if (idle) {
        /* Вкладка пролежала открытой: таймеры и Date уходят на 11 минут. */
        await page.clock.fastForward('11:00');
        await page.clock.resume();
      }
      let ok = false;
      try {
        ok = await openBank(page, from);
      } catch (error) {
        console.log(`     ${error.message.split('\n')[0]}`);
      }
      const noSlash = requested.filter((p) => /^\/zadaniya$|^\/zadaniya\.txt$/.test(p));
      check(
        ok && noSlash.length === 0,
        `${from}${idle ? ' (вкладка открыта 11 мин)' : ''} → банк заданий открыт` +
          (noSlash.length ? `; запрос без «/»: ${noSlash.join(', ')}` : ''),
      );
      await context.close();
    }
  }

  console.log(`\nC. ${name}: страховка NavigationGuard`);
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(A + '/zadaniya/12/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    /* Ссылка без «/», как раньше в нижней панели. */
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/zadaniya';
      a.id = 'bez-kosoy';
      a.textContent = 'Банк без косой';
      document.body.prepend(a);
    });
    /* Страховка уводит сразу на /zadaniya/: запроса на адрес без «/»
       (и редиректа сервера с него) быть не должно. */
    const bezKosoy = [];
    page.on('request', (r) => {
      if (/^\/zadaniya(\.txt)?$/.test(new URL(r.url()).pathname)) {
        bezKosoy.push(new URL(r.url()).pathname);
      }
    });
    await page.click('#bez-kosoy');
    await page.waitForURL((u) => u.pathname === '/zadaniya/', { timeout: 15000 }).catch(() => {});
    check(
      new URL(page.url()).pathname === '/zadaniya/' && bezKosoy.length === 0,
      `ссылка /zadaniya → открыт /zadaniya/ без запроса на адрес без «/» (${page.url()}` +
        (bezKosoy.length ? `; запросы: ${bezKosoy.join(', ')}` : '') +
        ')',
    );
    await context.close();
  }
  {
    /* Данные страницы банка не приходят вовсе. Next.js сам уходит в
       обычный переход браузера — страховке тут делать нечего. */
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(/\/zadaniya\/index\.txt\?_rsc=/, () => {});
    await page.goto(A + '/zadaniya/4/trenazher/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    let ok = false;
    try {
      ok = await openBank(page);
    } catch (error) {
      console.log(`     ${error.message.split('\n')[0]}`);
    }
    check(ok, 'запрос данных повис → банк всё равно открыт');
    await context.close();
  }
  {
    /* Переход не случился вовсе: ссылку нажали, а адрес не сменился
       (так выглядел белый экран). Страховка ставит таймер на стадии
       перехвата, а обработчик самой ссылки после неё гасит переход. */
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(A + '/zadaniya/12/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/zadaniya/';
      a.id = 'zavis';
      a.textContent = 'Переход, который не случится';
      a.addEventListener('click', (event) => event.preventDefault());
      document.body.prepend(a);
    });
    const start = Date.now();
    await page.click('#zavis');
    await page.waitForTimeout(10_000);
    const still = new URL(page.url()).pathname;
    check(still === '/zadaniya/12/', `страховка не торопится: через 10 с ещё ${still}`);
    let opened = true;
    await page
      .waitForURL((u) => u.pathname === '/zadaniya/', { timeout: 10_000 })
      .catch(() => {
        opened = false;
      });
    const seconds = (Date.now() - start) / 1000;
    check(
      opened && seconds >= 11.5 && seconds <= 16,
      `переход не случился → страховка открыла банк через ${seconds.toFixed(1)} с (ждём 12)`,
    );
    await context.close();
  }
  await browser.close();
}

const log = apache.stop();
if (/\[(alert|crit|emerg)\]|Invalid command/.test(log)) {
  failures.push('ошибки в журнале Apache:\n' + log);
}

console.log(`\nПроверок навигации: ${checks}`);
if (failures.length > 0) {
  console.error('Не прошло:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('Расхождений нет.');
