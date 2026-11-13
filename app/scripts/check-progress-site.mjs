#!/usr/bin/env node
/* scripts/check-progress-site.mjs — перенос прежнего прогресса раздела
   с банком задач (№7, №6, №10) в браузере, на собранном сайте.

   Ученик решал раздел до редизайна: в localStorage лежат прежние ключи
   (образец — scripts/fixtures/progress-N-prezhniy.json, записан прежним
   кодом хранилища). Он открывает новый тренажёр:

     1. «Мой прогресс» показывает прежние числа — решено и верно;
     2. «Работа над ошибками» доступна и открывает задачу того же типа,
        что прежняя ошибка, но не саму эту задачу;
     3. журнал попыток создан под новым ключом;
     4. прежние ключи тренажёра и опорных задач лежат на месте
        нетронутыми (запасной вариант);
     5. опорные задачи показывают прежний прогресс блока;
     6. без входа ничего не уходит в сеть: гость остаётся в браузере;
     7. на страницах нет ошибок.

   У №10 прежний тренажёр уже писал в журнал (тот же ключ): переносить
   нечего, проверяется, что прежний журнал читается как есть. Образец
   №10 — ещё и sessionStorage с прежней незаконченной тренировкой: она
   не мешает открыть тренажёр.

   Запуск: node scripts/check-progress-site.mjs 7 (после pnpm build). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(APP, 'out');
const N = process.argv[2];
if (N !== '6' && N !== '7' && N !== '10') {
  console.error('Укажите раздел: node scripts/check-progress-site.mjs 7 (или 6, 10)');
  process.exit(2);
}
if (!fs.existsSync(path.join(OUT, 'zadaniya', N, 'index.html'))) {
  console.error('Нет сборки: сначала pnpm build (в app/).');
  process.exit(1);
}

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`  ${ok ? 'ok ' : 'НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const put = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, put);
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404).end('404');
    return;
  }
  res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

const OLD = `budetege:zadanie-${N}:v1`;
const OLD_OPORNYE = `budetege:zadanie-${N}:opornye:v1`;
const NEW = `budetege:zadanie-${N}:log:v1`;
const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', `progress-${N}-prezhniy.json`), 'utf8'),
);
/* №10: образец — содержимое localStorage и sessionStorage целиком. */
const ZHURNAL = N === '10';
const local = ZHURNAL
  ? obrazec.localStorage
  : { [OLD]: obrazec[OLD], [OLD_OPORNYE]: obrazec[OLD_OPORNYE] };
const session = ZHURNAL ? obrazec.sessionStorage : {};
const staroe = ZHURNAL ? null : obrazec[OLD];
const popytki = ZHURNAL ? local[NEW].attempts : [];
const resheno = ZHURNAL
  ? new Set(popytki.map((a) => a.task)).size
  : Object.values(staroe.kinds).reduce((sum, t) => sum + t.done, 0);
const verno = ZHURNAL
  ? popytki.filter((a) => a.outcome === 'right').length
  : Object.values(staroe.kinds).reduce((sum, t) => sum + t.right, 0);
const prezhnieOshibki = ZHURNAL
  ? popytki.filter((a) => a.outcome === 'wrong' || a.outcome === 'revealed').map((a) => a.task)
  : staroe.mistakes;

const { BANK } = requireSrc(`lib/zadanie${N}/bank/index.ts`);
const { BLOKI_OPORNYH } = requireSrc(`lib/zadanie${N}/opornye.ts`);
/* Блок опорных задач из образца, сколько в нём задач и сколько решено. */
const opornye = local[OLD_OPORNYE];
const blok = ZHURNAL
  ? BLOKI_OPORNYH.find((b) => b.zadachi.some((z) => z.id === Object.keys(opornye)[0]))
  : BLOKI_OPORNYH.find((b) => b.id === Object.keys(opornye.kinds)[0]);
const zadachVBloke = blok?.zadachi.length;
const reshenoOp = ZHURNAL
  ? blok.zadachi.filter((z) => opornye[z.id] === true).length
  : Object.values(opornye.outcomes).filter((x) => x === 'right').length;
const prototipOf = (id) => BANK.find((z) => z.id === id)?.prototypeId;

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(
    ([localValues, sessionValues]) => {
      /* Только при первом заходе: дальше хранилище — как у ученика. */
      if (window.localStorage.getItem('proverka:zalito') === null) {
        for (const [key, value] of Object.entries(localValues)) {
          window.localStorage.setItem(key, value);
        }
        for (const [key, value] of Object.entries(sessionValues)) {
          window.sessionStorage.setItem(key, value);
        }
        window.localStorage.setItem('proverka:zalito', '1');
      }
    },
    [
      Object.fromEntries(Object.entries(local).map(([k, v]) => [k, JSON.stringify(v)])),
      Object.fromEntries(Object.entries(session).map(([k, v]) => [k, JSON.stringify(v)])),
    ],
  );
  const page = await context.newPage();
  const oshibki = [];
  const vSet = [];
  page.on('pageerror', (error) => oshibki.push(String(error)));
  page.on('request', (request) => {
    if (!request.url().startsWith(BASE)) vSet.push(request.url());
  });

  await page.goto(`${BASE}/zadaniya/${N}/trenazher/`, { waitUntil: 'networkidle' });

  /* 1. «Мой прогресс». */
  const progress = page.locator('.trn-progress').first();
  await progress.waitFor({ timeout: 15000 });
  const tekst = (await progress.innerText()).replace(/\s+/g, ' ');
  check(
    tekst.includes(`решено ${resheno}`) && tekst.includes(`верно ${verno}`),
    `«Мой прогресс» показывает прежние числа: решено ${resheno}, верно ${verno} («${tekst.slice(0, 60)}»)`,
  );

  /* 3 и 4. Ключи. */
  const klyuchi = await page.evaluate(
    ([oldKey, opKey, newKey]) => ({
      old: window.localStorage.getItem(oldKey),
      op: window.localStorage.getItem(opKey),
      log: window.localStorage.getItem(newKey),
    }),
    [OLD, OLD_OPORNYE, NEW],
  );
  if (ZHURNAL) {
    check(
      klyuchi.log === JSON.stringify(local[NEW]),
      'прежний журнал читается под тем же ключом и не изменён',
    );
  } else {
    check(klyuchi.log !== null, 'журнал попыток создан под новым ключом');
    check(klyuchi.old === JSON.stringify(staroe), 'прежний ключ тренажёра на месте и не изменён');
    const log = JSON.parse(klyuchi.log ?? '{}');
    check(
      Array.isArray(log.legacyMistakes) && log.legacyMistakes.length === staroe.mistakes.length,
      `прежние ошибки перенесены: ${staroe.mistakes.length}`,
    );
  }
  check(klyuchi.op === JSON.stringify(opornye), 'прежний ключ опорных задач на месте и не изменён');

  /* 2. «Работа над ошибками». */
  const rabota = page.getByRole('button', { name: /^Работа над ошибками/ }).first();
  check(await rabota.isEnabled(), '«Работа над ошибками» доступна');
  await rabota.click();
  const zadacha = page.locator('.trn-zadacha');
  await zadacha.waitFor({ timeout: 20000 });
  const id = await zadacha.getAttribute('data-task');
  /* Стили тренажёра подключены: экран задачи — сетка с отступами, а не
     голый текст (общие компоненты берутся из своих файлов, стили — из
     trening.css). */
  const vid = await zadacha.evaluate((el) => {
    const s = getComputedStyle(el);
    return { display: s.display, padding: parseFloat(s.paddingLeft) };
  });
  check(
    vid.display === 'grid' && vid.padding > 0,
    `экран задачи оформлен стилями тренажёра (display: ${vid.display}, отступ ${vid.padding}px)`,
  );
  const tipyOshibok = new Set(prezhnieOshibki.map(prototipOf));
  check(
    id !== null && !prezhnieOshibki.includes(id) && tipyOshibok.has(prototipOf(id)),
    `в «Работе над ошибками» — другая задача того же типа (${id}, тип ${prototipOf(id)})`,
  );

  /* 5. Опорные задачи: прежний прогресс блока. */
  await page.goto(`${BASE}/zadaniya/${N}/opornye-zadachi/`, { waitUntil: 'networkidle' });
  const kartochki = (await page.locator('.op-blok').allInnerTexts()).join(' | ');
  check(
    new RegExp(`решено ${reshenoOp} из ${zadachVBloke}`).test(kartochki),
    `опорные задачи показывают прежний прогресс блока: решено ${reshenoOp} из ${zadachVBloke}`,
  );

  /* 6 и 7. */
  check(vSet.length === 0, `гость: запросов наружу нет (${vSet.slice(0, 2).join(', ')})`);
  check(oshibki.length === 0, `на страницах нет ошибок (${oshibki.slice(0, 2).join('; ')})`);
} finally {
  await browser.close();
  server.close();
}

if (failures.length > 0) {
  console.error(`\nПеренос прогресса №${N}: не прошло ${failures.length} из ${checks}.`);
  process.exit(1);
}
console.log(`\nПеренос прогресса №${N} на сайте: проверок ${checks}, не прошло 0.`);
