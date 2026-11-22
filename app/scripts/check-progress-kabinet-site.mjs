#!/usr/bin/env node
/* scripts/check-progress-kabinet-site.mjs — экраны прогресса в браузере.

   Запуск после сборки со входом, подставным сервером и флагами экранов:
     NEXT_PUBLIC_AUTH_ENABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
     NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key NEXT_PUBLIC_ZHURNAL=1 \
     NEXT_PUBLIC_PROGRESS_UCHITEL=1 NEXT_PUBLIC_PROGRESS_UCHENIK=1 LEGAL_DRAFT=1 pnpm build
     pnpm test:progress-kabinet-site [--shots папка]

   Сервер подставной: функции базы uchitel_* и moya_* отвечают заготовкой,
   чужому ученику и чужому классу — отказом, как база. Сами права
   проверяет pnpm test:kabinet-sql (supabase/tests/zhurnal-prava.test.sql).

   Учитель, 1280 и 375 px:
     • класс: тепловая карта «ученики × задания» с числом в каждой
       клетке, активность за 7 дней, «давно не заходили», «не начали ДЗ»,
       фильтр задания, файл Excel;
     • ученик: сводка, точность по заданиям, пять слабых типов, тестовый
       балл по вариантам, календарь, лента с мягкой пометкой «очень быстро»
       без обвинительных слов; активное время, общее — в подсказке;
     • задача: условие №8 набрано формулами, ответы как введены, верный
       ответ, подсказки; вариант: ответ ученика и верный ответ по задачам;
     • лист для печати; чужой ученик и чужой класс — сообщение, без данных.
   Ученик: «Моя статистика» без пометок для учителя, функции учителя не
   вызываются; на экран учителя ученик не попадает.
   375 px: страница не прокручивается вбок, таблица — внутри своей рамки. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';

const OUT = path.join(APP, 'out');
const SHOTS = process.argv.includes('--shots')
  ? (process.argv[process.argv.indexOf('--shots') + 1] ?? 'snimki-progress')
  : null;
const API = 'http://127.0.0.1:54321';

if (!fs.existsSync(path.join(OUT, 'kabinet', 'klass-progress', 'index.html'))) {
  console.error('Нет out/kabinet/klass-progress/ — нужна сборка с флагами экранов (см. начало файла).');
  process.exit(1);
}

const { sobrat8 } = requireSrc('lib/vychisleniya/zhurnal8.ts');
const { otpechatokUsloviya } = requireSrc('lib/zhurnal/model.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

/* ── Заготовка «базы» ──────────────────────────────────────────── */

const K1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const S1 = 'c1000000-0000-4000-8000-000000000001';
const S2 = 'c1000000-0000-4000-8000-000000000002';
const S3 = 'c1000000-0000-4000-8000-000000000003';
const CHUZHOY = 'c9000000-0000-4000-8000-000000000009';
const TUTOR = 'b1000000-0000-4000-8000-000000000001';
const Z8 = 'd1000000-0000-4000-8000-000000000008';
const Z5 = 'd1000000-0000-4000-8000-000000000005';
const V1 = 'e1000000-0000-4000-8000-000000000001';

const MSK = 3 * 3600_000;
const den = (nazad) => new Date(Date.now() + MSK - nazad * 86_400_000).toISOString().slice(0, 10);
const chas = (nazad) => new Date(Date.now() - nazad * 3_600_000).toISOString();

const REF8 = '8.A|8.A#2|advanced';
const zadacha8 = sobrat8(REF8);
if (zadacha8 === null) {
  console.error(`Генератор №8 не собрал задачу ${REF8}`);
  process.exit(1);
}

const z = (extra) => ({
  verified: false,
  attempts_n: 1,
  hint_steps: 0,
  hint_wrong: [],
  shown_fact: false,
  shown_solution: false,
  skipped: false,
  total_ms: 0,
  ...extra,
});
const LENTA = [
  z({ id: Z8, task_no: 8, kind: '8.A', task_ref: REF8, place: 'trenazher', outcome: 'right', level: 2,
    active_ms: 4_000, total_ms: 5_000, started_at: chas(1), last_answer: zadacha8.otvet.replace('.', ','), bystro: true }),
  z({ id: 'd1000000-0000-4000-8000-000000000081', task_no: 8, kind: '8.B', task_ref: '8.B|8.B#1|base', place: 'trenazher',
    outcome: 'wrong', attempts_n: 2, hint_steps: 1, active_ms: 95_000, total_ms: 400_000, started_at: chas(2), last_answer: '12' }),
  z({ id: Z5, task_no: 5, kind: '5:P03', task_ref: 'p5-03:2', place: 'opornye', outcome: 'hinted', hint_steps: 3,
    hint_wrong: [2], active_ms: 180_000, total_ms: 200_000, started_at: chas(26), last_answer: '0,25' }),
  z({ id: 'd1000000-0000-4000-8000-000000000051', task_no: 5, kind: 'protivopolozhnye', task_ref: '5-protivopolozhnye',
    place: 'kartochki', outcome: 'right', active_ms: 8_000, total_ms: 9_000, started_at: chas(27), last_answer: 'знаю' }),
  z({ id: 'd1000000-0000-4000-8000-000000000082', task_no: 8, kind: '8.C', task_ref: '8.C|8.C#3|base', place: 'variant',
    place_ref: V1, outcome: 'skipped', attempts_n: 0, skipped: true, active_ms: 0, started_at: chas(50) }),
  z({ id: 'd1000000-0000-4000-8000-000000000083', task_no: 8, kind: '8.D', task_ref: '8.D|8.D#1|base', place: 'trenazher',
    attempts_n: 0, active_ms: 30_000, total_ms: 31_000, started_at: chas(51) }),
];
const POPYTKI8 = [
  { n: 1, answer: '1/4', ok: false, vid: 'fraction', at: chas(1.02) },
  { n: 2, answer: zadacha8.otvet.replace('.', ','), ok: true, vid: 'answer', at: chas(1) },
];
const VARIANT = {
  id: V1, source: 'sobrat', title: 'Вариант 1', set_code: 'AB12-CD', variant_no: 1,
  started_at: chas(52), finished_at: chas(50), primary_score: 9, max_score: 12, test_score: 64,
  active_ms: 3_600_000, total_ms: 4_200_000,
};
const SVODKA = {
  active_ms: 4_500_000, total_ms: 6_300_000, solved: 40, right: 31,
  po_zadaniyam: [
    { task_no: 5, solved: 12, right: 8, active_ms: 1_500_000 },
    { task_no: 8, solved: 28, right: 23, active_ms: 3_000_000 },
  ],
  dni: [
    { day: den(5), solved: 9, active_ms: 500_000 },
    { day: den(3), solved: 14, active_ms: 1_900_000 },
    { day: den(1), solved: 6, active_ms: 300_000 },
    { day: den(0), solved: 11, active_ms: 1_800_000 },
  ],
  slabye: [
    { task_no: 5, kind: '5:P03', solved: 5, right: 1 },
    { task_no: 8, kind: '8.F', solved: 4, right: 1 },
    { task_no: 8, kind: '8.B', solved: 6, right: 3 },
    { task_no: 5, kind: '5:P07', solved: 3, right: 2 },
    { task_no: 8, kind: '8.H', solved: 7, right: 5 },
  ],
  varianty: [
    VARIANT,
    { ...VARIANT, id: 'e1000000-0000-4000-8000-000000000002', source: 'povyshennye',
      title: 'Вариант повышенной сложности №7', finished_at: chas(20), primary_score: 10, test_score: 70 },
  ],
};
const KLASS = {
  class: { id: K1, name: '11 «А»' },
  ucheniki: [
    { id: S1, name: 'Аня Белова', s: den(60), last_day: den(0), nedelya: { solved: 34, active_ms: 4_200_000, dni: 4 } },
    { id: S2, name: 'Борис Константинопольский-Задунайский', s: den(60), last_day: den(12),
      nedelya: { solved: 0, active_ms: 0, dni: 0 },
      ne_nachal_dz: [{ id: 'f1000000-0000-4000-8000-000000000001', title: 'ДЗ №3: степени', due_at: null }] },
    { id: S3, name: 'Вера Громова', s: den(2), nedelya: { solved: 0, active_ms: 0, dni: 0 } },
  ],
  karta: [
    { id: S1, task_no: 5, solved: 12, right: 8, active_ms: 1_500_000 },
    { id: S1, task_no: 8, solved: 28, right: 26, active_ms: 3_000_000 },
    { id: S2, task_no: 8, solved: 10, right: 3, active_ms: 900_000 },
  ],
  skryto: 1,
};

/** Ответ подставной базы: [status, body]. Отказы — как у функций базы. */
function baza(name, args, role) {
  const otkaz = (text) => [403, { code: '42501', message: text, details: null, hint: null }];
  const uchitel = name.startsWith('uchitel_');
  if (uchitel && role !== 'tutor') return otkaz('forbidden');
  if (!uchitel && role !== 'student') return otkaz('forbidden');
  const svoy = args.p_student === S1 || args.p_student === S2 || args.p_student === S3;
  switch (name) {
    case 'uchitel_klass':
      return args.p_class === K1 ? [200, KLASS] : otkaz('forbidden');
    case 'uchitel_uchenik':
      return svoy
        ? [200, { id: args.p_student, name: KLASS.ucheniki.find((u) => u.id === args.p_student).name,
            s: den(60), progress_allowed: true,
            svodka: args.p_task_no === null || args.p_task_no === undefined
              ? SVODKA
              : { ...SVODKA, po_zadaniyam: SVODKA.po_zadaniyam.filter((t) => t.task_no === args.p_task_no) } }]
        : otkaz('not_your_student');
    case 'uchitel_lenta':
      return svoy ? [200, args.p_before ? [] : LENTA] : otkaz('not_your_student');
    case 'uchitel_zadacha':
      if (!svoy) return otkaz('not_your_student');
      if (args.p_id === Z8) {
        return [200, { ...LENTA[0], gen_hash: otpechatokUsloviya(zadacha8.uslovie), uslovie_tex: zadacha8.uslovie,
          popytki: POPYTKI8, attempts_n: 1 }];
      }
      if (args.p_id === Z5) {
        return [200, { ...LENTA[2], uslovie_tex: '<p>В случайном эксперименте бросают две игральные кости. Найдите вероятность того, что в сумме выпадет 8 очков. Результат округлите до сотых.</p>',
          answer_key: '0,14', popytki: [{ n: 1, answer: '0,25', ok: false, vid: 'answer', at: chas(26.1) },
            { n: 2, answer: '0,14', ok: true, vid: 'answer', at: chas(26) }] }];
      }
      return [406, { code: 'P0002', message: 'not_found', details: null, hint: null }];
    case 'uchitel_variant':
      return svoy
        ? [200, { ...VARIANT, zadachi: [
            { ...LENTA[4], uslovie_tex: '8^{\\frac{1}{3}} \\cdot 2', answer_key: '4', popytki: [] },
            z({ id: 'd1000000-0000-4000-8000-000000000055', task_no: 5, kind: '5:P01', task_ref: 'p5-01:4', place: 'variant',
              place_ref: V1, outcome: 'wrong', active_ms: 240_000, total_ms: 240_000, started_at: chas(52),
              last_answer: '0,3', answer_key: '0,25', verified: false,
              uslovie_tex: '<p>Найдите вероятность того, что при двух бросках монеты орёл выпадет ровно один раз.</p>',
              popytki: [{ n: 1, answer: '0,3', ok: false, vid: 'answer', at: chas(50) }] }),
          ] }]
        : otkaz('not_your_student');
    case 'moya_statistika':
      return [200, SVODKA];
    case 'moya_lenta':
      /* Ученику база пометку «очень быстро» не отдаёт. */
      return [200, LENTA.map(({ bystro: _bystro, ...rest }) => rest)];
    default:
      return null;
  }
}

/* ── Статический сервер над out/ ───────────────────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(OUT)) return void res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return void res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const SITE = `http://127.0.0.1:${server.address().port}`;

/* ── Браузер ───────────────────────────────────────────────────── */

const browser = bezBanneraCookie(
  await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  }),
);
if (SHOTS !== null) fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

async function newPage(role, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 812 : 900 },
    acceptDownloads: true,
    ...(width < 500 ? { hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  await welcomeSeen(context);
  const mock = { calls: [] };
  const session = {
    access_token: 'mock-access', refresh_token: 'mock-refresh', token_type: 'bearer',
    expires_in: 360000, expires_at: Math.floor(Date.now() / 1000) + 360000,
    user: { id: role === 'tutor' ? TUTOR : S1, email: `${role}@x.ru`,
      user_metadata: { role, name: role === 'tutor' ? 'Учитель' : 'Аня Белова' } },
  };
  await context.addInitScript((value) => {
    try {
      if (localStorage.getItem('budetege-auth') === null) localStorage.setItem('budetege-auth', value);
    } catch {
      /* about:blank */
    }
  }, JSON.stringify(session));
  await context.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    const rpc = /^\/rest\/v1\/rpc\/(.+)$/.exec(url.pathname)?.[1];
    if (rpc !== undefined) {
      const args = req.postDataJSON() ?? {};
      const otvet = baza(rpc, args, role);
      if (otvet !== null) {
        mock.calls.push({ rpc, args, status: otvet[0] });
        return route.fulfill({
          status: otvet[0],
          headers: { ...CORS, 'content-type': 'application/json' },
          body: JSON.stringify(otvet[1]),
        });
      }
    }
    return route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json', 'content-range': '*/0' },
      body: rpc === undefined ? '[]' : 'null',
    });
  });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    /* Отказ базы чужому ученику — ожидаемый ответ 403. */
    if (/status of 40[36]/.test(m.text())) return;
    errors.push(`${page.url()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return { context, page, mock };
}

const noScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const gotovo = (page) =>
  page.waitForFunction(() => {
    const grid = document.querySelector('.pr2__grid');
    return grid !== null && grid.getAttribute('aria-busy') !== 'true';
  });
async function shot(page, name, fullPage = true) {
  if (SHOTS === null) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
}
const OBVINENIYA = /спис|подозр|жульн|обман|читер/i;

/* ── Учитель ───────────────────────────────────────────────────── */

for (const width of [1280, 375]) {
  console.log(`\nУчитель, ${width} px:`);
  const { context, page, mock } = await newPage('tutor', width);

  /* Класс. */
  await page.goto(`${SITE}/kabinet/klass-progress/?id=${K1}`, { waitUntil: 'networkidle' });
  await gotovo(page);
  const stroki = page.locator('.pr2-karta tbody tr');
  check((await stroki.count()) === 3, 'класс: строка на каждого ученика');
  check((await page.locator('.pr2-karta thead th').allInnerTexts()).join('|').includes('№5|№7'), 'класс: столбцы — задания по номерам экзамена');
  const kletka = stroki.nth(0).locator('.pr2-karta__kletka');
  check((await kletka.nth(0).innerText()).includes('67%') && (await kletka.nth(0).getAttribute('data-l')) === '3',
    'класс: в клетке точность числом и цвет по успешности');
  check((await kletka.nth(1).getAttribute('data-l')) === '5' && (await stroki.nth(1).locator('.pr2-karta__kletka').nth(1).getAttribute('data-l')) === '1',
    'класс: высокая и низкая точность — разные ступени');
  check((await stroki.nth(2).locator('.pr2-karta__kletka').nth(0).getAttribute('data-l')) === '0', 'класс: не решал — пустая клетка');
  check((await stroki.nth(0).innerText()).includes('34 зад.'), 'класс: активность за 7 дней');
  const davno = await page.locator('[data-section="davno"]').innerText();
  check(davno.includes('Борис') && davno.includes('12 дней назад') && !davno.includes('Вера'), 'класс: давно не заходил — больше 7 дней; новичок не считается');
  const dz = await page.locator('[data-section="dz"]').innerText();
  check(dz.includes('Борис') && dz.includes('ДЗ №3'), 'класс: кто не начал текущее ДЗ');
  check((await page.locator('[data-section="karta"]').innerText()).includes('без доступа к журналу: 1'), 'класс: сказано про учеников без доступа');
  check(mock.calls[0]?.rpc === 'uchitel_klass' && mock.calls[0].args.p_class === K1 && mock.calls[0].args.p_to === den(0),
    'класс: запрос функции учителя с периодом по Москве');
  if (width === 375) {
    check(await noScroll(page), 'класс на 375 px: страница не прокручивается вбок');
    const ramka = await page.locator('.pr2-tabl').evaluate((el) => ({ vnutri: el.scrollWidth, vidno: el.clientWidth }));
    check(ramka.vnutri >= ramka.vidno, 'класс на 375 px: таблица прокручивается внутри своей рамки');
    const imya = await page.locator('.pr2-karta tbody th').first().evaluate((el) => getComputedStyle(el).position);
    check(imya === 'sticky', 'класс на 375 px: столбец имён закреплён');
  } else {
    /* Фильтр задания и выгрузка. */
    await page.locator('.pr2-razdel__select').selectOption('5');
    check((await page.locator('.pr2-karta thead th').count()) === 4, 'класс: фильтр задания оставляет один столбец');
    await page.locator('.pr2-razdel__select').selectOption('');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Скачать Excel")').click(),
    ]);
    const fajl = await download.path();
    const bytes = fs.readFileSync(fajl);
    check(download.suggestedFilename().endsWith('.xlsx') && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.length > 500,
      `класс: выгрузка в Excel — файл ${download.suggestedFilename()}`);
    await page.locator('.pr2-period__btn:has-text("7 дней")').click();
    await gotovo(page);
    check(mock.calls.at(-1).args.p_from === den(6), 'класс: смена периода — новый запрос');
  }
  await shot(page, `klass-${width}`);

  /* Ученик. */
  await page.locator('.pr2-karta tbody th a').first().click();
  await page.waitForURL(/\/kabinet\/uchenik\/\?id=/);
  await gotovo(page);
  const uchenik = await page.locator('[data-page="uchenik-progress"]').innerText();
  check(uchenik.includes('Аня Белова') && uchenik.includes('1 ч 15 мин') && uchenik.includes('78%'), 'ученик: сводка — время, точность');
  check((await page.locator('[data-section="itogi"] [title^="Общее время: 1 ч 45 мин"]').count()) === 1, 'ученик: общее время — во всплывающей подсказке');
  check((await page.locator('[data-section="zadaniya"] .pr2-zadaniya__row').count()) === 2, 'ученик: точность по каждому заданию');
  check((await page.locator('[data-section="slabye"] li').count()) === 5, 'ученик: пять самых слабых типов');
  check((await page.locator('[data-section="varianty"] .pr2-varianty__row').count()) === 2 && uchenik.includes('64') && uchenik.includes('70'),
    'ученик: тестовый балл по вариантам');
  check((await page.locator('.pr2-dni__den:not([data-l="0"])').count()) === 4, 'ученик: календарь активности');
  check((await page.locator('.pr2-lenta__row').count()) === LENTA.length, 'ученик: лента задач');
  check((await page.locator('.pr2-bystro').count()) === 1 && (await page.locator('.pr2-bystro').getAttribute('title')).includes('быстрее, чем обычно'),
    'ученик: мягкая пометка «очень быстро» у одной задачи');
  check(!OBVINENIYA.test(uchenik), 'ученик: обвинительных слов нет');
  check(uchenik.includes('не закончено'), 'ученик: незаконченная задача так и названа');
  check(uchenik.includes('Записи видны с'), 'ученик: сказано, с какого дня видны записи');
  if (width === 375) check(await noScroll(page), 'ученик на 375 px: без горизонтальной прокрутки');
  if (width === 1280) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Скачать Excel")').click(),
    ]);
    check(download.suggestedFilename().includes('Аня Белова'), 'ученик: выгрузка в Excel по ученику');
    await page.locator('.pr2-razdel__select').selectOption('5');
    await gotovo(page);
    check(mock.calls.filter((c) => c.rpc === 'uchitel_uchenik').at(-1).args.p_task_no === 5, 'ученик: фильтр задания уходит в запрос');
    await page.locator('.pr2-razdel__select').selectOption('');
    await gotovo(page);
  }
  await shot(page, `uchenik-${width}`);

  /* Задача №8: те же числа, формулы, ответы как введены. */
  await page.locator('.pr2-lenta__row a').first().click();
  await page.waitForURL(/\/kabinet\/uchenik\/zadacha\//);
  await page.waitForSelector('[data-section="hod"]');
  check((await page.locator('[data-section="uslovie"] .katex').count()) > 0, 'задача: условие набрано формулами');
  const hod = await page.locator('[data-section="hod"]').innerText();
  check(hod.includes('1/4') && hod.includes('попытка не засчитана'), 'задача: ответ записан как введён, неверная запись помечена');
  check(hod.includes(zadacha8.otvet.replace('.', ',')) && hod.includes('Верный ответ'), 'задача: верный ответ — тем же генератором по id задачи');
  check(hod.includes('очень быстро') && !OBVINENIYA.test(hod), 'задача: пометка есть, обвинений нет');
  check(hod.includes('считал браузер ученика'), 'задача: сказано, кто проверял ответ');
  if (width === 375) check(await noScroll(page), 'задача на 375 px: без горизонтальной прокрутки');
  await shot(page, `zadacha-${width}`);

  /* Задача №5 из опорных: подсказка и вопрос с ошибкой. */
  await page.goto(`${SITE}/kabinet/uchenik/zadacha/?id=${Z5}&uchenik=${S1}&klass=${K1}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-section="hod"]');
  const hod5 = await page.locator('[data-page="zadacha-uchenika"]').innerText();
  check(hod5.includes('игральные кости') && hod5.includes('открыто шагов: 3') && hod5.includes('ошибка на шаге 2'),
    'задача №5: условие из журнала, шаги подсказки и шаг с ошибкой');
  check(hod5.includes('0,14') && hod5.includes('0,25'), 'задача №5: ответы ученика и верный ответ');

  /* Вариант. */
  await page.goto(`${SITE}/kabinet/uchenik/variant/?id=${V1}&uchenik=${S1}&klass=${K1}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-section="zadachi"]');
  const variant = await page.locator('[data-page="variant-uchenika"]').innerText();
  check(variant.includes('9 из 12') && variant.includes('64'), 'вариант: первичный и тестовый балл');
  check((await page.locator('.pr2-zv__item').count()) === 2 && variant.includes('0,3') && variant.includes('0,25'),
    'вариант: по каждой задаче — ответ ученика и верный ответ');
  await page.locator('.pr2-zv__row').nth(1).click();
  check((await page.locator('.pr2-zv__item').nth(1).innerText()).includes('монеты'), 'вариант: задача раскрывается с условием');
  if (width === 375) check(await noScroll(page), 'вариант на 375 px: без горизонтальной прокрутки');
  await shot(page, `variant-${width}`);

  if (width === 1280) {
    /* Лист для печати. */
    await page.goto(`${SITE}/kabinet/uchenik/pechat/?id=${S1}&s=${den(29)}&po=${den(0)}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-page="uchenik-pechat"]');
    const list = await page.locator('[data-page="uchenik-pechat"]').innerText();
    check(list.includes('Аня Белова') && (await page.locator('.pr2-list__tabl').count()) === 4 && list.includes('Сохранить PDF'),
      'лист для печати: сводка, задания, варианты, лента');
    check(!list.includes('очень быстро'), 'лист для печати: без пометок');
    await shot(page, 'pechat-1280');

    /* Чужой ученик и чужой класс: сообщение, данных нет. */
    await page.goto(`${SITE}/kabinet/uchenik/?id=${CHUZHOY}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pr2-oshibka');
    check((await page.locator('.pr2-oshibka').innerText()).includes('нет среди ваших учеников') && (await page.locator('.pr2__grid').count()) === 0,
      'чужой ученик: отказ базы показан, данных на экране нет');
    await page.goto(`${SITE}/kabinet/klass-progress/?id=aaaaaaaa-0000-4000-8000-00000000dead`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pr2-oshibka');
    check((await page.locator('.pr2-karta').count()) === 0, 'чужой класс: таблицы нет');
  }
  await context.close();
}

/* ── Ученик ────────────────────────────────────────────────────── */

for (const width of [375, 1280]) {
  console.log(`\nУченик, ${width} px:`);
  const { context, page, mock } = await newPage('student', width);
  await page.goto(`${SITE}/kabinet/statistika/`, { waitUntil: 'networkidle' });
  await gotovo(page);
  const text = await page.locator('[data-page="moya-statistika"]').innerText();
  check(text.includes('1 ч 15 мин') && text.includes('40') && text.includes('78%'), 'моя статистика: время, решено, точность');
  check((await page.locator('.pr2-lenta__row').count()) === LENTA.length, 'моя статистика: последние задачи');
  check((await page.locator('.pr2-bystro').count()) === 0 && !/очень быстро/.test(text) && !OBVINENIYA.test(text),
    'моя статистика: пометок для учителя нет');
  check((await page.locator('.pr2-lenta__row a').count()) === 0, 'моя статистика: ссылок на экраны учителя нет');
  check(mock.calls.every((c) => c.rpc.startsWith('moya_')) && mock.calls.length >= 2, 'ученик вызывает только свои функции');
  if (width === 375) {
    check(await noScroll(page), 'моя статистика на 375 px: без горизонтальной прокрутки');
    const nizkie = await page.locator('.pr2-period__btn').evaluateAll((b) => b.filter((x) => x.getBoundingClientRect().height < 40).length);
    check(nizkie === 0, 'моя статистика на 375 px: кнопки периода не ниже 40 px');
    check((await page.locator('table').count()) === 0, 'моя статистика на 375 px: таблиц нет');
  }
  await shot(page, `moya-statistika-${width}`, width >= 500);

  if (width === 1280) {
    /* На экран учителя ученик не попадает: функций учителя не зовёт. */
    mock.calls.length = 0;
    await page.goto(`${SITE}/kabinet/klass-progress/?id=${K1}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Экран для учителя');
    check(mock.calls.length === 0 && (await page.locator('.pr2-karta').count()) === 0, 'ученик на экране учителя: данных нет и запросов нет');
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    check((await page.locator('[data-section="statistika"] a[href="/kabinet/statistika/"]').count()) === 1, 'кабинет ученика: ссылка «Моя статистика»');
  }
  await context.close();
}

check(errors.length === 0, `ошибок в консоли нет${errors.length > 0 ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);

await browser.close();
server.close();
if (failures.length > 0) {
  console.error(`\nЭкраны прогресса: не прошло ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\nЭкраны прогресса: ${checks} проверок прошли.`);
