#!/usr/bin/env node
/* scripts/check-trenazher-filtry-site.mjs — тренажёр с фильтрами сверху
   в браузере, по статической сборке (out/).

   Запуск: pnpm build && pnpm test:trenazher-filtry-site [--snimki]

   1. Фильтры из ссылки — 1:1: чипы, уровни, «Сколько», режим, порядок,
      «Мои задачи» нажаты те, что в ссылке; адрес не меняется; «Найдено N»
      равно числу, посчитанному в Node тем же кодом.
   2. Числа на чипах на странице равны посчитанным в Node.
   3. «Только с ошибками» берёт задачи из статистики ученика.
   4. Пусто: сообщение и «Расширить фильтры», после него задачи есть.
   5. Пауза: «К фильтрам» → подтверждение → плашка «Тренировка на паузе»,
      запись на паузе; «Продолжить тренировку» — та же задача, пауза снята.
   6. Старая тренировка №12 (рецепты прежнего экрана) открывается:
      отметка «верно» на месте, панель «решено 1».
   7. Телефон 320, 375 и 390 px: прокрутки страницы вбок нет — фильтры,
      нижний лист, пусто, тренировка, итоги; липкая «Начать» не закрывает
      содержимое.
   --snimki — снимки для PR в docs/trenazher-filtry/snimki/. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
const SNIMKI = process.argv.includes('--snimki')
  ? path.join(APP, '..', 'docs', 'trenazher-filtry', 'snimki')
  : null;
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки: сначала pnpm build.');
  process.exit(1);
}
if (SNIMKI !== null) fs.mkdirSync(SNIMKI, { recursive: true });

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  console.log(`  ${ok ? 'ok' : 'НЕТ'}  ${what}`);
  return ok;
}

const F = requireSrc('lib/trenazher/filtr.ts');
const T12 = requireSrc('lib/ves12/trenazher12.ts');
const TS = requireSrc('lib/trainerSession.ts');

/* ── Статический сервер ─────────────────────────────────────── */

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
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const DESKTOP = { width: 1440, height: 900 };
const PROGRESS = 'budetege:trainer:v1';

async function context(viewport, progress = null) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: SNIMKI === null ? 1 : 2 });
  await welcomeSeen(ctx);
  if (progress !== null) {
    await ctx.addInitScript(
      ([key, value]) => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
      },
      [PROGRESS, JSON.stringify(progress)],
    );
  }
  return ctx;
}

async function page(ctx, url) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(20_000);
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.goto(BASE + url, { waitUntil: 'load' });
  await p.locator('.flt').first().waitFor({ state: 'visible' });
  return p;
}

/** Прокрутить так, чтобы элемент встал под липкой лентой вкладок. */
async function kElementu(p, selector) {
  await p.evaluate((sel) => {
    const top = document.querySelector(sel)?.getBoundingClientRect().top ?? 0;
    window.scrollTo(0, window.scrollY + top - 250);
  }, selector);
}

async function snimok(p, name, full = false) {
  if (SNIMKI === null) return;
  await p.waitForTimeout(300);
  await p.screenshot({
    path: path.join(SNIMKI, `${name}.jpg`),
    type: 'jpeg',
    quality: 82,
    fullPage: full,
  });
}

async function naydenoNaStranice(p) {
  const text = (await p.locator('.flt-count b').first().textContent()) ?? '';
  return Number(/\d+/.exec(text)?.[0] ?? NaN);
}

async function bezProkrutki(p) {
  return p.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

const nazhat = (loc) => loc.getAttribute('aria-pressed').then((v) => v === 'true');

/* Статистика ученика: ошибки в 12Q.B и 12Q.E, часть решена. */
const QREFS = T12.zadachi12('quadratic');
const QCONFIG = T12.trenazherConfig12('quadratic');
const mistakes = QREFS.filter((r) => ['12Q.B', '12Q.E'].includes(r.podtip))
  .filter((_, i) => i % 3 === 0)
  .map((r) => r.key);
const solved = QREFS.filter((_, i) => i % 4 === 0).map((r) => r.key);
const PROGRESS_Q = { kinds: {}, mistakes, solved };
const stat = { resheno: new Set(solved), oshibki: new Set(mistakes) };

/* ── 1–3. Ссылка, чипы, «только с ошибками» ─────────────────── */

console.log('1–3. Фильтры из ссылки, числа на чипах, «только с ошибками»');
{
  const ctx = await context(DESKTOP, PROGRESS_Q);
  const q = 't=12Q.B,12Q.E&ur=2&n=5&rezh=bez&por=prostye&moi=oshibki&s=t,ur,moi';
  const url = `/zadaniya/12/quadratic/trenazher/?${q}`;
  const p = await page(ctx, url);
  const card = p.locator('.flt-card');
  await p.waitForFunction(() =>
    document.querySelector('.flt-chip[aria-pressed="true"] .flt-chip__code'),
  );
  const f = F.izSsylki(new URLSearchParams(q), QCONFIG);
  const want = F.naydeno(QREFS, f, stat).length;
  check((await naydenoNaStranice(p)) === want, `«Найдено» по ссылке = ${want}`);
  for (const code of ['12Q.B', '12Q.E']) {
    check(
      await nazhat(
        card.locator('.flt-chip', { has: p.locator('.flt-chip__code', { hasText: code }) }),
      ),
      `чип ${code} нажат`,
    );
  }
  check(
    !(await nazhat(
      card.locator('.flt-chip', { has: p.locator('.flt-chip__code', { hasText: '12Q.A' }) }),
    )),
    'чип 12Q.A не нажат',
  );
  check(await nazhat(card.getByRole('button', { name: /: ★★$/ })), 'уровень ★★ нажат');
  check(await nazhat(card.getByRole('button', { name: '5', exact: true })), '«Сколько» — 5');
  check(await nazhat(card.getByRole('button', { name: 'Без подсказок' })), 'режим — без подсказок');
  check(
    await nazhat(card.getByRole('button', { name: 'От простых к сложным' })),
    'порядок — от простых к сложным',
  );
  check(
    await nazhat(card.getByRole('button', { name: 'Только с ошибками' })),
    '«Мои задачи» — только с ошибками',
  );
  check((await p.evaluate(() => location.search.slice(1))) === q, 'адрес не изменился');
  const oshibok = F.naydeno(QREFS, F.izmenit(F.NACHALNYY, { moi: 'oshibki' }), stat).length;
  check(
    oshibok === mistakes.length,
    `«только с ошибками» без других фильтров — ${mistakes.length} задач статистики`,
  );

  /* Снять ★★ крестиком — счётчик живой, адрес обновился. */
  await p.locator('.flt-active__chip', { hasText: '★★' }).getByRole('button').click();
  const f2 = F.snyat(f, 'urovni');
  check(
    (await naydenoNaStranice(p)) === F.naydeno(QREFS, f2, stat).length,
    'после снятия ★★ счётчик обновился',
  );
  check(
    (await p.evaluate(() => location.search.slice(1))) === F.vSsylku(f2),
    'после снятия ★★ адрес обновился',
  );

  /* 2. Числа на чипах при фильтре по умолчанию. */
  await p.locator('.flt-active .flt-link', { hasText: 'Сбросить' }).click();
  const chisla = F.chislaChipov(QCONFIG, QREFS, F.sbrositVse(f2), stat);
  const shown = await card
    .locator('.flt-chips .flt-chip')
    .evaluateAll((els) =>
      els.map((el) => [
        el.querySelector('.flt-chip__code')?.textContent ?? 'Все',
        el.querySelector('.flt-chip__n')?.textContent ?? '',
      ]),
    );
  let ok = true;
  for (const [code, n] of shown) {
    if (code === 'Все') continue;
    const c = chisla[code];
    const text = c.resheno > 0 ? `${c.resheno}/${c.n}` : String(c.n);
    if (n !== text) {
      ok = false;
      console.log(`     ${code}: на странице «${n}», посчитано «${text}»`);
    }
  }
  check(
    ok && shown.length === QCONFIG.temy[0].podtipy.length + 1,
    `числа на ${shown.length - 1} чипах совпадают с посчитанными`,
  );
  check(p.errors.length === 0, `без ошибок на странице (${p.errors.join('; ')})`);
  /* Снимок: панель целиком под липкой лентой вкладок. */
  await p.evaluate(() => {
    const top = document.querySelector('.trainer__head')?.getBoundingClientRect().top ?? 0;
    window.scrollTo(0, window.scrollY + top - 240);
  });
  await snimok(p, 'desktop-1-filtry');
  await ctx.close();
}

/* ── 4. Пусто ───────────────────────────────────────────────── */

console.log('4. Пустой результат');
{
  const ctx = await context(DESKTOP);
  const p = await page(ctx, '/zadaniya/12/quadratic/trenazher/?t=12Q.A&moi=oshibki');
  await p.locator('.flt-empty').waitFor({ state: 'visible' });
  check((await naydenoNaStranice(p)) === 0, 'найдено 0 — сообщение «Таких задач нет»');
  check(
    await p
      .getByRole('button', { name: /^Начать тренировку/ })
      .first()
      .isDisabled(),
    '«Начать» неактивна',
  );
  await snimok(p, 'desktop-3-pusto');
  await p.getByRole('button', { name: 'Расширить фильтры' }).click();
  check((await naydenoNaStranice(p)) > 0, '«Расширить фильтры» — задачи нашлись');
  check(
    !(await p.evaluate(() => location.search.includes('moi='))),
    '«Расширить» сняло последний фильтр («Мои задачи»)',
  );
  check(await p.evaluate(() => location.search.includes('t=12Q.A')), 'выбор типа остался');
  await ctx.close();
}

/* ── 5. Пауза ───────────────────────────────────────────────── */

console.log('5. Пауза и возобновление');
const KEY = (scope) => `budetege:trainer:${scope}:session`;
async function record(p, scope) {
  return p.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY(scope));
}
async function otvet(p, scope, at) {
  const rec = await record(p, scope);
  const { seedZadaniya } = requireSrc('lib/trenazher/sessiya.ts');
  const t = TS.zadachaShablona(
    rec.payload.items[at].k,
    seedZadaniya(rec.payload, at, 0),
    new Map(),
  );
  return t;
}
async function dat(p, task) {
  if (task.options === null) {
    await p.locator('.tsess__body input.ttask__input').fill(String(task.answer));
  } else {
    await p
      .locator('.tsess__body .popt')
      .filter({ has: p.locator('.popt__no', { hasText: new RegExp(`^${task.answer}$`) }) })
      .click();
  }
  await p.locator('.tsess__body').getByRole('button', { name: 'Проверить', exact: true }).click();
}
{
  const ctx = await context(DESKTOP);
  const p = await page(ctx, '/zadaniya/12/linear/trenazher/');
  await p
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
  await p.locator('.tsess__bar').waitFor({ state: 'visible' });
  await p.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
  await dat(p, await otvet(p, '12:linear', 0));
  await p.locator('.trz-verdict--right').waitFor({ state: 'visible' });
  await p.getByRole('button', { name: /^Дальше/ }).click();
  await kElementu(p, '.trz-svodka');
  await snimok(p, 'desktop-4-trenirovka');
  const question = await p.locator('.tsess__body .ptask__question').innerHTML();
  await p.locator('.trz-svodka').getByRole('button', { name: 'К фильтрам' }).click();
  const dialog = p.getByRole('dialog');
  check(
    /встанет на паузу/.test((await dialog.textContent()) ?? ''),
    'подтверждение: «тренировка встанет на паузу»',
  );
  await dialog.getByRole('button', { name: 'К фильтрам' }).click();
  await p.locator('.flt-pause').waitFor({ state: 'visible' });
  check(
    /Решено 1 из 10/.test((await p.locator('.flt-pause').textContent()) ?? ''),
    'плашка «Тренировка на паузе: решено 1 из 10»',
  );
  const paused = await record(p, '12:linear');
  check(paused?.paused === true && paused?.ui?.index === 1, 'запись на паузе, открыта задача 2');
  await p.getByRole('button', { name: 'Продолжить тренировку' }).click();
  await p.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
  check(
    (await p.locator('.tsess__body .ptask__question').innerHTML()) === question,
    'после «Продолжить» — та же задача 2',
  );
  await p.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.paused === false,
    KEY('12:linear'),
  );
  check(true, 'пауза снята в записи');
  check(p.errors.length === 0, `без ошибок на странице (${p.errors.join('; ')})`);
  await ctx.close();
}

/* ── 6. Старая тренировка ───────────────────────────────────── */

console.log('6. Старая тренировка прежнего экрана');
{
  const old = TS.buildSession({
    skills: ['12.A', '12.B'],
    level: null,
    count: 5,
    mode: 'practice',
    mistakes: [],
  });
  const payload = {
    recipe: 1,
    control: false,
    tasks: old.tasks.map((t) => ({
      set: t.kind,
      seed: t.origin.seed,
      id: t.id,
      sig: t.origin.sig,
    })),
  };
  const ui = {
    index: 1,
    marks: { 0: 'right' },
    tried: {},
    order: [0, 1, 2, 3, 4],
    value: '',
    checked: null,
  };
  const raw = JSON.stringify({
    schemaVersion: 2,
    scope: '12:linear',
    id: 'old-run',
    createdAt: 1,
    updatedAt: 1,
    rev: 1,
    writer: 'test',
    paused: false,
    activeMs: 1000,
    total: 5,
    ui,
    payload,
  });
  const ctx = await context(DESKTOP);
  const p0 = await ctx.newPage();
  await p0.goto(`${BASE}/zadaniya/`, { waitUntil: 'load' });
  await p0.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY('12:linear'), raw]);
  await p0.goto(`${BASE}/zadaniya/12/linear/trenazher/`, { waitUntil: 'load' });
  await p0.locator('.tsess__bar').waitFor({ state: 'visible', timeout: 30_000 });
  await p0.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
  check(
    (await p0.locator('.tsess__solved b').first().textContent())?.trim() === '1',
    'старая тренировка: в панели «решено 1»',
  );
  check(
    (await p0.locator('.trz-no').first().getAttribute('class'))?.includes('trz-no--right'),
    'старая тренировка: задача 1 «верно» на ленте',
  );
  check(
    (await p0.locator('.tsess__body .ptask__question').innerHTML()).includes(
      old.tasks[1].questionHtml.slice(0, 40),
    ),
    'старая тренировка: открыта та же задача 2',
  );
  await ctx.close();
}

/* ── 7. Телефон ─────────────────────────────────────────────── */

console.log('7. Телефон: прокрутки вбок нет');
for (const width of [320, 375, 390]) {
  const ctx = await context({ width, height: 800 }, PROGRESS_Q);
  for (const url of ['/zadaniya/12/quadratic/trenazher/', '/zadaniya/12/trenazher/']) {
    const p = await page(ctx, url);
    const tag = `${width} px ${url}`;
    check(await bezProkrutki(p), `${tag}: фильтры`);
    /* Липкая «Начать» не закрывает содержимое: под ней место. */
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const cover = await p.evaluate(() => {
      const go = document.querySelector('.flt-go')?.getBoundingClientRect();
      const last = [...document.querySelectorAll('.flt > :not(.flt-go)')]
        .filter((el) => el.getBoundingClientRect().height > 0)
        .pop()
        ?.getBoundingClientRect();
      return go === undefined || last === undefined ? false : last.bottom <= go.top + 1;
    });
    check(cover, `${tag}: липкая «Начать» не закрывает фильтры`);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.locator('.flt-phone__btn').click();
    await p.locator('.gen-sheet').waitFor({ state: 'visible' });
    check(await bezProkrutki(p), `${tag}: нижний лист`);
    if (width === 390 && url.includes('quadratic')) {
      await snimok(p, 'phone-2-shtorka');
    }
    await p.locator('.gen-sheet__foot').getByRole('button').click();
    if (width === 390 && url.includes('quadratic')) {
      await snimok(p, 'phone-1-filtry');
    }
    await p
      .getByRole('button', { name: /^Начать тренировку/ })
      .first()
      .click();
    await p.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
    check(await bezProkrutki(p), `${tag}: тренировка`);
    if (width === 390 && url.includes('quadratic')) await snimok(p, 'phone-4-trenirovka');
    await p
      .locator('.tsess__bar')
      .getByRole('button', { name: /Завершить/ })
      .click();
    await p.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
    await p.locator('.tdone__rows').waitFor({ state: 'visible' });
    check(await bezProkrutki(p), `${tag}: итоги`);
    if (width === 390 && url.includes('quadratic')) await snimok(p, 'phone-5-itogi', true);
    await p.close();
  }
  const pe = await page(ctx, '/zadaniya/12/quadratic/trenazher/?t=12Q.A&moi=oshibki');
  await pe.locator('.flt-empty').waitFor({ state: 'visible' });
  check(await bezProkrutki(pe), `${width} px: пусто`);
  if (width === 390) await snimok(pe, 'phone-3-pusto');
  await ctx.close();
}

/* ── Снимки итогов на компьютере ─────────────────────────────── */

if (SNIMKI !== null) {
  const ctx = await context(DESKTOP, PROGRESS_Q);
  const p = await page(ctx, '/zadaniya/12/quadratic/trenazher/?n=5');
  await p
    .getByRole('button', { name: /^Начать тренировку/ })
    .first()
    .click();
  await p.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
  await dat(p, await otvet(p, '12:quadratic', 0));
  await p.getByRole('button', { name: /^Дальше/ }).click();
  await p.locator('.tsess__body .ptask__question').waitFor({ state: 'visible' });
  const t = await otvet(p, '12:quadratic', 1);
  if (t.options === null) {
    await p.locator('.tsess__body input.ttask__input').fill('987654');
  } else {
    const wrong = t.options.find((o) => o.number !== t.answer)?.number ?? '';
    await p.locator('.tsess__body .popt').filter({ has: p.locator('.popt__no', { hasText: new RegExp(`^${wrong}$`) }) }).click();
  }
  await p.locator('.tsess__body').getByRole('button', { name: 'Проверить', exact: true }).click();
  await kElementu(p, '.trz-svodka');
  await snimok(p, 'desktop-4b-oshibka');
  await p
    .locator('.tsess__bar')
    .getByRole('button', { name: /Завершить/ })
    .click();
  await p.getByRole('dialog').getByRole('button', { name: 'Завершить', exact: true }).click();
  await p.locator('.tdone__rows').waitFor({ state: 'visible' });
  await snimok(p, 'desktop-5-itogi', true);
  const all = await page(
    ctx,
    '/zadaniya/12/trenazher/?t=12Q.A,12Q.B,12Q.C,12Q.D,12Q.E,12Q.F,12Q.G,12Q.H,12Q.I,12R.A',
  );
  await snimok(all, 'desktop-6-vse-tipy');
  await ctx.close();
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(
    `\ncheck-trenazher-filtry-site: ${failures.length} из ${checks} проверок не прошли`,
  );
  failures.forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`\ncheck-trenazher-filtry-site: ok (${checks} проверок)`);
