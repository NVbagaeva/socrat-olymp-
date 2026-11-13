#!/usr/bin/env node
/* scripts/check-progress-site.mjs — перенос прежнего прогресса раздела
   на общем тренажёре (№7, №6, №9) в браузере, на собранном сайте.

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
     7. на страницах нет ошибок;
     8. (№9) незаконченная тренировка прежнего тренажёра из sessionStorage
        продолжается в новом на той же задаче.

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
if (N !== '6' && N !== '7' && N !== '9') {
  console.error('Укажите раздел: node scripts/check-progress-site.mjs 7 (или 6, 9)');
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

/* У №9 прежние ключи названы по разделу «proizvodnaya-9», опорные — «prep»
   (блок → номера решённых), задачи — «прототип|seed» без банка-файла. */
const PREZHNIY = N === '9' ? 'proizvodnaya-9' : `zadanie-${N}`;
const OLD = `budetege:${PREZHNIY}:v1`;
const OLD_OPORNYE = `budetege:${PREZHNIY}:${N === '9' ? 'prep' : 'opornye'}:v1`;
const NEW = `budetege:${PREZHNIY}:log:v1`;
const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', `progress-${N}-prezhniy.json`), 'utf8'),
);
const staroe = obrazec[OLD];
const resheno = Object.values(staroe.kinds).reduce((sum, t) => sum + t.done, 0);
const verno = Object.values(staroe.kinds).reduce((sum, t) => sum + t.right, 0);

/* Блок опорных задач из образца, сколько в нём задач и сколько решено. */
let zadachVBloke;
let reshenoOp;
let prototipOf;
if (N === '9') {
  const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks.ts');
  const [blok, nomera] = Object.entries(obrazec[OLD_OPORNYE])[0];
  zadachVBloke = PREP_BLOCKS.find((b) => b.id === blok)?.zadachi.length;
  reshenoOp = nomera.length;
  prototipOf = (id) => id?.split('|')[0];
} else {
  const { BANK } = requireSrc(`lib/zadanie${N}/bank/index.ts`);
  const { BLOKI_OPORNYH } = requireSrc(`lib/zadanie${N}/opornye.ts`);
  const blokObrazca = Object.keys(obrazec[OLD_OPORNYE].kinds)[0];
  zadachVBloke = BLOKI_OPORNYH.find((b) => b.id === blokObrazca)?.zadachi.length;
  reshenoOp = Object.values(obrazec[OLD_OPORNYE].outcomes).filter((x) => x === 'right').length;
  prototipOf = (id) => BANK.find((z) => z.id === id)?.prototypeId;
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(
    ([oldKey, oldValue, opKey, opValue]) => {
      /* Только при первом заходе: дальше хранилище — как у ученика. */
      if (window.localStorage.getItem('proverka:zalito') === null) {
        window.localStorage.setItem(oldKey, oldValue);
        window.localStorage.setItem(opKey, opValue);
        window.localStorage.setItem('proverka:zalito', '1');
      }
    },
    [OLD, JSON.stringify(staroe), OLD_OPORNYE, JSON.stringify(obrazec[OLD_OPORNYE])],
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
  check(klyuchi.log !== null, 'журнал попыток создан под новым ключом');
  check(klyuchi.old === JSON.stringify(staroe), 'прежний ключ тренажёра на месте и не изменён');
  check(
    klyuchi.op === JSON.stringify(obrazec[OLD_OPORNYE]),
    'прежний ключ опорных задач на месте и не изменён',
  );
  const log = JSON.parse(klyuchi.log ?? '{}');
  check(
    Array.isArray(log.legacyMistakes) && log.legacyMistakes.length === staroe.mistakes.length,
    `прежние ошибки перенесены: ${staroe.mistakes.length}`,
  );

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
  const tipyOshibok = new Set(staroe.mistakes.map(prototipOf));
  check(
    id !== null && !staroe.mistakes.includes(id) && tipyOshibok.has(prototipOf(id)),
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

  /* 8. №9: прежняя незаконченная тренировка (sessionStorage) продолжается. */
  if (N === '9') {
    const KLYUCH = 'budetege:proizvodnaya-9:session:v1';
    const prezhnyaya = obrazec.sessionStorage[KLYUCH];
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(
      ([key, value]) => {
        if (window.sessionStorage.getItem('proverka:zalito') === null) {
          window.sessionStorage.setItem(key, value);
          window.sessionStorage.setItem('proverka:zalito', '1');
        }
      },
      [KLYUCH, JSON.stringify(prezhnyaya)],
    );
    const p2 = await ctx.newPage();
    const oshibki2 = [];
    p2.on('pageerror', (error) => oshibki2.push(String(error)));
    await p2.goto(`${BASE}/zadaniya/9/trenazher/`, { waitUntil: 'networkidle' });
    const zapis = await p2.evaluate(() => localStorage.getItem('budetege:trainer:9:session'));
    const z = zapis === null ? null : JSON.parse(zapis);
    check(
      z !== null && z.payload?.tasks?.map((t) => t.id).join() === prezhnyaya.taskIds.join(),
      'прежняя незаконченная тренировка перенесена в запись общего тренажёра',
    );
    check(z?.payload?.control === true, '«Контроль» стал «Без подсказок и решений»');
    /* Оболочка открывает незаконченную тренировку сразу; если спросит —
       «Продолжить». */
    const ekran = p2.locator('.trn-zadacha');
    const dalshe = p2.getByRole('button', { name: /Продолжить/ }).first();
    await ekran.or(dalshe).first().waitFor({ timeout: 20000 });
    if (!(await ekran.isVisible())) {
      await dalshe.click();
      await ekran.waitFor({ timeout: 20000 });
    }
    check(
      (await ekran.getAttribute('data-task')) === prezhnyaya.taskIds[prezhnyaya.index],
      'тренировка продолжена на той же задаче',
    );
    check(
      (await p2.evaluate((key) => sessionStorage.getItem(key), KLYUCH)) ===
        JSON.stringify(prezhnyaya),
      'прежняя запись тренировки на месте',
    );
    check(oshibki2.length === 0, `нет ошибок (${oshibki2.slice(0, 2).join('; ')})`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length > 0) {
  console.error(`\nПеренос прогресса №${N}: не прошло ${failures.length} из ${checks}.`);
  process.exit(1);
}
console.log(`\nПеренос прогресса №${N} на сайте: проверок ${checks}, не прошло 0.`);
