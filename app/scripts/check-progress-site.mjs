#!/usr/bin/env node
/* scripts/check-progress-site.mjs — перенос прежнего прогресса раздела
   на общем тренажёре «Стеклянной сцены» (№7, №6, №2, №13, №1, №9, №11, №4, №5) в
   браузере, на собранном сайте.

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
     8. (№1) незаконченная тренировка прежнего тренажёра (панель
        фильтров) открывается в новом на той же задаче;
     9. (№9) незаконченная тренировка прежнего тренажёра из sessionStorage
        продолжается в новом на той же задаче.
     10. (№4, №5) незаконченная тренировка прежнего тренажёра открывается
        на той же задаче с тем же введённым ответом.

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
/* №4 и №5 — вероятность: прежние ключи свои, задачи — «прототип:вариант». */
const VEROYATNOST = N === '4' || N === '5';
if (!['6', '7', '2', '13', '1', '9', '11'].includes(N) && !VEROYATNOST) {
  console.error(
    'Укажите раздел: node scripts/check-progress-site.mjs 7 (или 6, 2, 13, 1, 9, 11, 4, 5)',
  );
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

/* Ключи раздела: №7 и №6 — budetege:zadanie-N:…, у №1 — прежние
   ключи планиметрии. Прототип задачи и блоки опорных — у каждого свои. */
function razdel() {
  if (VEROYATNOST) {
    /* №4 и №5: в хранилище опорных — сами задачи; «блок» образца — по
       первой задаче образца; ключ задачи тренажёра — «прототип:вариант». */
    const bloki = requireSrc('lib/veroyatnost/index.ts')[`PODGOTOVKA_${N}`];
    const blokZadachi = (id) => bloki.find((b) => b.zadachi.some((z) => z.id === id));
    return {
      OLD: `budetege:veroyatnost-${N}:v2`,
      OLD_OPORNYE: `budetege:veroyatnost-${N}:prep:v1`,
      NEW: `budetege:veroyatnost-${N}:log:v1`,
      prototipOf: (id) => id?.slice(0, id.lastIndexOf(':')),
      zadachVBloke: (zadacha) => blokZadachi(zadacha)?.zadachi.length,
      vBloke: (zadacha, key) => blokZadachi(zadacha)?.zadachi.some((z) => z.id === key) === true,
    };
  }
  if (N === '1') {
    const { BLOKI } = requireSrc('lib/planimetriya/prep/bloki.ts');
    return {
      OLD: 'budetege:planimetriya-1:v1',
      OLD_OPORNYE: 'budetege:planimetriya-1:opornye:v1',
      NEW: 'budetege:planimetriya-1:log:v1',
      prototipOf: (id) => id.split('|')[0],
      zadachVBloke: (blok) => BLOKI.find((b) => b.id === blok)?.zadachi.length,
      /* Исход задачи блока — «P1-1:3». */
      vBloke: (blok, key) => key.startsWith(`${blok}:`),
    };
  }
  if (N === '9') {
    /* У №9 прежние ключи — «proizvodnaya-9», опорные — «prep» (блок →
       номера решённых), задачи — «прототип|seed». */
    const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks.ts');
    return {
      OLD: 'budetege:proizvodnaya-9:v1',
      OLD_OPORNYE: 'budetege:proizvodnaya-9:prep:v1',
      NEW: 'budetege:proizvodnaya-9:log:v1',
      prototipOf: (id) => id?.split('|')[0],
      zadachVBloke: (blok) => PREP_BLOCKS.find((b) => b.id === blok)?.zadachi.length,
      vBloke: () => true,
    };
  }
  if (N === '2') {
    /* У №2 прежние ключи назывались по разделу «vektory-2»; банка нет:
       ключ задачи — «прототип|seed». */
    const { BLOKI } = requireSrc('lib/vektory/prep/bloki.ts');
    return {
      OLD: 'budetege:vektory-2:v1',
      OLD_OPORNYE: 'budetege:vektory-2:opornye:v1',
      NEW: 'budetege:vektory-2:log:v1',
      prototipOf: (id) => id?.split('|')[0],
      zadachVBloke: (blok) => BLOKI.find((b) => b.id === blok)?.zadachi.length,
      vBloke: () => true,
    };
  }
  if (N === '13') {
    /* У №13 банка задач нет: ключ задачи — «прототип|seed»; задача
       опорного блока — «блок:номер», в образце несколько блоков. */
    const { BLOKI_13, zadachiBloka } = requireSrc('lib/zadanie13/opornye/bloki.ts');
    return {
      OLD: 'budetege:zadanie-13:v1',
      OLD_OPORNYE: 'budetege:zadanie-13:opornye:v1',
      NEW: 'budetege:zadanie-13:log:v1',
      prototipOf: (id) => id?.split('|')[0],
      zadachVBloke: (blok) => {
        const b = BLOKI_13.find((x) => x.id === blok);
        return b === undefined ? undefined : zadachiBloka(b).length;
      },
      vBloke: (blok, key) => key.startsWith(`${blok}:`),
    };
  }
  if (N === '11') {
    /* У №11 банк — файлы подтипов: ключ задачи «подтип|откуда»; задача
       опорного блока — «блок:номер». */
    const { BLOKI } = requireSrc('lib/zadanie11/prep/bloki.ts');
    return {
      OLD: 'budetege:zadanie-11:v1',
      OLD_OPORNYE: 'budetege:zadanie-11:opornye:v1',
      NEW: 'budetege:zadanie-11:log:v1',
      prototipOf: (id) => id?.split('|')[0],
      zadachVBloke: (blok) => BLOKI.find((b) => b.id === blok)?.zadachi.length,
      vBloke: (blok, key) => key.startsWith(`${blok}:`),
    };
  }
  const { BANK } = requireSrc(`lib/zadanie${N}/bank/index.ts`);
  const { BLOKI_OPORNYH } = requireSrc(`lib/zadanie${N}/opornye.ts`);
  return {
    OLD: `budetege:zadanie-${N}:v1`,
    OLD_OPORNYE: `budetege:zadanie-${N}:opornye:v1`,
    NEW: `budetege:zadanie-${N}:log:v1`,
    prototipOf: (id) => BANK.find((z) => z.id === id)?.prototypeId,
    zadachVBloke: (blok) => BLOKI_OPORNYH.find((b) => b.id === blok)?.zadachi.length,
    vBloke: () => true,
  };
}
const R = razdel();
const { OLD, OLD_OPORNYE, NEW, prototipOf } = R;
const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', `progress-${N}-prezhniy.json`), 'utf8'),
);
const staroe = obrazec[OLD];
const resheno = Object.values(staroe.kinds).reduce((sum, t) => sum + t.done, 0);
const verno = Object.values(staroe.kinds).reduce((sum, t) => sum + t.right, 0);

/* Блок опорных задач из образца и сколько в нём задач. */
const blokObrazca = Object.keys(N === '9' ? obrazec[OLD_OPORNYE] : obrazec[OLD_OPORNYE].kinds)[0];
const zadachVBloke = R.zadachVBloke(blokObrazca);

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
  const reshenoOp =
    N === '9'
      ? obrazec[OLD_OPORNYE][blokObrazca].length
      : Object.entries(obrazec[OLD_OPORNYE].outcomes).filter(
          ([key, x]) => x === 'right' && R.vBloke(blokObrazca, key),
        ).length;
  const kartochki = (await page.locator('.op-blok').allInnerTexts()).join(' | ');
  check(
    new RegExp(`решено ${reshenoOp} из ${zadachVBloke}`).test(kartochki),
    `опорные задачи показывают прежний прогресс блока: решено ${reshenoOp} из ${zadachVBloke}`,
  );

  /* 8. №1: незаконченная тренировка прежнего тренажёра. */
  const SESSION = `budetege:trainer:${N}:session`;
  if (N === '1' && obrazec[SESSION] !== undefined) {
    const sPage = await context.newPage();
    sPage.on('pageerror', (error) => oshibki.push(String(error)));
    await sPage.goto(`${BASE}/zadaniya/${N}/`, { waitUntil: 'networkidle' });
    await sPage.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [SESSION, obrazec[SESSION]],
    );
    await sPage.goto(`${BASE}/zadaniya/${N}/trenazher/`, { waitUntil: 'networkidle' });
    const dalshe = sPage.getByRole('button', { name: /^Продолжить/ }).first();
    if (await dalshe.isVisible().catch(() => false)) await dalshe.click();
    const z = sPage.locator('.trn-zadacha');
    await z.waitFor({ timeout: 20000 }).catch(() => {});
    const idS = await z.getAttribute('data-task').catch(() => null);
    const ui = JSON.parse(obrazec[SESSION]).ui;
    const prezhnyaya = JSON.parse(obrazec[SESSION]).payload.items[ui.index].k;
    check(
      idS === prezhnyaya,
      `прежняя тренировка открылась на той же задаче (${idS}, ждали ${prezhnyaya})`,
    );
    await sPage.close();
  }

  /* 10. №4, №5: незаконченная тренировка прежнего тренажёра открывается
     на той же задаче, с тем же введённым ответом. */
  if (VEROYATNOST && obrazec[SESSION] !== undefined) {
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [SESSION, JSON.stringify(obrazec[SESSION])],
    );
    await page.goto(`${BASE}/zadaniya/${N}/trenazher/`, { waitUntil: 'networkidle' });
    const ui = obrazec[SESSION].ui;
    const [kind, n] = obrazec[SESSION].payload.tasks[ui.index];
    const ekran = page.locator('.trn-zadacha');
    await ekran.waitFor({ timeout: 20000 });
    check(
      (await ekran.getAttribute('data-task')) === `${kind}:${n}`,
      `прежняя тренировка открылась на той же задаче (${kind}:${n})`,
    );
    const pole = page.locator('.trn-pole input').first();
    check(
      (await pole.inputValue()) === ui.card.value,
      `введённый ответ на месте («${ui.card.value}»)`,
    );
    check(
      (await page.locator('.trn-zadacha__nomer').first().innerText()).startsWith(
        `${ui.index + 1} `,
      ),
      `номер задачи тот же: ${ui.index + 1}`,
    );
  }

  /* 9. №9: прежняя незаконченная тренировка (sessionStorage) продолжается. */
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
    /* Экран может сначала показать первую задачу и затем встать на
       сохранённую: ждём до 15 с. */
    const nuzhna = prezhnyaya.taskIds[prezhnyaya.index];
    let otkryta = null;
    for (let i = 0; i < 30; i += 1) {
      otkryta = await ekran.getAttribute('data-task');
      if (otkryta === nuzhna) break;
      await p2.waitForTimeout(500);
    }
    check(
      otkryta === nuzhna,
      `тренировка продолжена на той же задаче (${otkryta}, ждали ${nuzhna})`,
    );
    check(
      (await p2.evaluate((key) => sessionStorage.getItem(key), KLYUCH)) ===
        JSON.stringify(prezhnyaya),
      'прежняя запись тренировки на месте',
    );
    check(oshibki2.length === 0, `нет ошибок (${oshibki2.slice(0, 2).join('; ')})`);
    await ctx.close();
  }

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
