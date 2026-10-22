#!/usr/bin/env node
/* scripts/check-proverka-edinic-site.mjs — «Проверь себя» в теории
   единиц на собранном сайте (после pnpm build).

   Запуск: pnpm test:proverka-edinic-site [--snimki <папка>]

   Теория №10, блок «Как переводить единицы», на 1440 и 390:
   - «Проверить» неактивна, пока вариант не выбран; варианты — группа
     radio: стрелки переводят выбор, Enter проверяет;
   - верный ответ: карточка в зелёном свечении, «Верно!» озвучено
     (aria-live), фокус на разборе, остальные плитки приглушены,
     счётчик «Решено: 1 из 7», кнопки «Ещё такое же» и «Следующая»;
   - «Ещё такое же» меняет числа;
   - неверный: «Не совсем», подсказка именно к этой ошибке, плитка
     больше не выбирается, «Попробовать ещё»; после второй ошибки —
     «Показать разбор», разбор открывается;
   - все семь задач решены → «Решено: 7 из 7», счёт переживает
     перезагрузку;
   - зоны нажатия не меньше 44 px; без движения
     (prefers-reduced-motion) — ни пульсации, ни встряхивания, свечение
     остаётся.
   Блоки «Проверь себя» есть во всех трёх частях теории №10 и в двух
   частях теории №11.

   С --snimki — снимки состояний (покой, выбран вариант, верно,
   неверно, разбор) на 390 и 1440. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const iSnimki = process.argv.indexOf('--snimki');
const SNIMKI = iSnimki > 0 ? process.argv[iSnimki + 1] : null;
if (SNIMKI) fs.mkdirSync(SNIMKI, { recursive: true });

const { zadachiProverki } = requireSrc('lib/teoriya/proverka-server');
const { vernyVariant, otkryt } = requireSrc('lib/teoriya/proverka-seal');
const ZADACHI = zadachiProverki('kak-perevodit');

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
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
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

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

const problems = [];
const check = (ok, what) => {
  if (!ok) problems.push(what);
};

/** Индексы верного и неверных вариантов экземпляра (порядок кнопок — порядок id). */
function indeksy(z, n) {
  const e = z.ekzemplyary[n];
  const verny = e.varianty.findIndex((v) => vernyVariant(e, v.id));
  const nevernye = e.varianty.map((_, i) => i).filter((i) => i !== verny);
  return { e, verny, nevernye };
}

const tekst = (html) =>
  html
    .replace(/<annotation[^>]*>.*?<\/annotation>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '');

async function snimok(page, imya, w) {
  if (!SNIMKI) return;
  const blok = page.locator('#ed-kak-perevodit .prv');
  await blok.screenshot({ path: path.join(SNIMKI, `${imya}-${w}.png`) });
}

for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/zadaniya/10/teoriya/`, { waitUntil: 'networkidle' });
  const g = (s) => `@${w}: ${s}`;

  check((await page.locator('.prv').count()) === 3, g('в теории №10 не три блока «Проверь себя»'));
  const prv = page.locator('#ed-kak-perevodit .prv');
  await prv.scrollIntoViewIfNeeded();
  const schet = prv.locator('.prv__schet > span');
  check((await schet.textContent()).includes('Решено: 0 из 7'), g('счётчик не «Решено: 0 из 7»'));
  const proverit = prv.getByRole('button', { name: 'Проверить' });
  check(await proverit.isDisabled(), g('«Проверить» активна без выбора'));
  check((await prv.getByRole('radiogroup').count()) === 1, g('варианты — не группа radio'));
  await snimok(page, 'pokoy', w);

  /* Зоны нажатия. */
  for (const el of await prv.locator('.vvar__btn, .prv__tochka, .prv__knopki button').all()) {
    const b = await el.boundingBox();
    if (b && (b.height < 44 || b.width < 44))
      problems.push(g(`зона нажатия ${Math.round(b.width)}×${Math.round(b.height)}`));
  }

  /* Задача 1: верный ответ с клавиатуры. */
  {
    const { verny } = indeksy(ZADACHI[0], 0);
    const radios = prv.getByRole('radio');
    await radios.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    check(
      (await radios.nth(0).getAttribute('aria-checked')) === 'true',
      g('стрелки не выбирают вариант'),
    );
    for (let i = 0; i < verny; i += 1) await page.keyboard.press('ArrowDown');
    check(
      (await radios.nth(verny).getAttribute('aria-checked')) === 'true',
      g('стрелка не дошла до варианта'),
    );
    check(!(await proverit.isDisabled()), g('«Проверить» не активна после выбора'));
    await snimok(page, 'vybran', w);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(950);
    const zad = prv.locator('.prv-zad');
    check(
      (await zad.getAttribute('class')).includes('is-verno'),
      g('после верного нет зелёного состояния'),
    );
    const ten = await zad.evaluate((el) => getComputedStyle(el).boxShadow);
    check(ten !== 'none', g('нет свечения box-shadow'));
    check(
      (await prv.locator('[aria-live] .prv-itog--verno').textContent()).includes('Верно!'),
      g('нет «Верно!» в aria-live'),
    );
    check(
      await page.evaluate(() => document.activeElement?.classList.contains('prv-itog')),
      g('фокус не на разборе'),
    );
    check(
      (await prv.locator('.vvar__btn--priglushen').count()) === 3,
      g('остальные плитки не приглушены'),
    );
    check((await schet.textContent()).includes('Решено: 1 из 7'), g('счётчик не вырос до 1'));
    check(
      (await prv.getByRole('button', { name: 'Ещё такое же' }).count()) === 1,
      g('нет «Ещё такое же»'),
    );
    check(
      (await prv.getByRole('button', { name: 'Следующая' }).count()) === 1,
      g('нет «Следующая»'),
    );
    await snimok(page, 'verno', w);

    /* «Ещё такое же» — новые числа. */
    const bylo = await prv.locator('.prv-zad__uslovie').textContent();
    await prv.getByRole('button', { name: 'Ещё такое же' }).click();
    const stalo = await prv.locator('.prv-zad__uslovie').textContent();
    check(bylo !== stalo, g('«Ещё такое же» не поменяло числа'));
    check(
      await prv.getByRole('button', { name: 'Проверить' }).isDisabled(),
      g('после «Ещё такое же» не сброшен выбор'),
    );
  }

  /* Задача 2 (экземпляр 0): две ошибки → подсказки → разбор. */
  {
    await prv.locator('.prv__tochka').nth(1).click();
    const { e, nevernye } = indeksy(ZADACHI[1], 0);
    const radios = prv.getByRole('radio');
    const [o1, o2] = nevernye;
    await radios.nth(o1).click();
    await prv.getByRole('button', { name: 'Проверить' }).click();
    const itog = prv.locator('.prv-itog');
    check((await itog.textContent()).includes('Не совсем'), g('после неверного нет «Не совсем»'));
    const ozhid = tekst(otkryt(e.varianty[o1].otklik, e, e.varianty[o1].id));
    check(
      tekst(await itog.innerHTML()).includes(ozhid.slice(0, 40)),
      g('подсказка не к этой ошибке'),
    );
    check(
      (await radios.nth(o1).getAttribute('class')).includes('vvar__btn--incorrect'),
      g('нет терракотовой плитки'),
    );
    check(await radios.nth(o1).isDisabled(), g('неверный вариант можно выбрать снова'));
    check(
      (await prv.getByRole('button', { name: 'Попробовать ещё' }).count()) === 1,
      g('нет «Попробовать ещё»'),
    );
    check(
      (await prv.getByRole('button', { name: 'Показать разбор' }).count()) === 0,
      g('«Показать разбор» после первой ошибки'),
    );
    await snimok(page, 'neverno', w);
    await prv.getByRole('button', { name: 'Попробовать ещё' }).click();
    await radios.nth(o2).click();
    await prv.getByRole('button', { name: 'Проверить' }).click();
    check(
      (await prv.getByRole('button', { name: 'Показать разбор' }).count()) === 1,
      g('нет «Показать разбор» после двух ошибок'),
    );
    await prv.getByRole('button', { name: 'Показать разбор' }).click();
    check(
      (await prv.locator('.prv-itog--razbor').textContent()).includes('Разбор'),
      g('разбор не открылся'),
    );
    check(
      (await prv.locator('.vvar__btn--answer').count()) === 1,
      g('верный вариант не подсвечен в разборе'),
    );
    check(
      (await schet.textContent()).includes('Решено: 1 из 7'),
      g('разбор засчитался как решённая'),
    );
    await snimok(page, 'razbor', w);
  }

  /* Решаем все семь — счётчик и сохранение. */
  for (let i = 0; i < ZADACHI.length; i += 1) {
    await prv.locator('.prv__tochka').nth(i).click();
    if ((await prv.getByRole('button', { name: 'Проверить' }).count()) === 0) {
      await prv.getByRole('button', { name: 'Ещё такое же' }).click();
    }
    const klyuch = await prv.locator('.prv-zad').getAttribute('data-klyuch');
    const k = ZADACHI[i].ekzemplyary.findIndex((e) => e.klyuch === klyuch);
    const { verny } = indeksy(ZADACHI[i], k);
    await prv.getByRole('radio').nth(verny).click();
    await prv.getByRole('button', { name: 'Проверить' }).click();
  }
  check(
    (await schet.textContent()).includes('Решено: 7 из 7'),
    g(`после семи задач: ${await schet.textContent()}`),
  );
  await page.reload({ waitUntil: 'networkidle' });
  /* Счёт приходит из хранилища после гидратации: ждём, а не читаем сразу. */
  const perezhil = await page
    .waitForFunction(
      () =>
        document
          .querySelector('#ed-kak-perevodit .prv__schet > span')
          ?.textContent?.includes('Решено: 7 из 7'),
      null,
      { timeout: 5000 },
    )
    .then(() => true)
    .catch(() => false);
  check(perezhil, g('счёт не пережил перезагрузку'));
  await ctx.close();
}

/* Без движения: свечение есть, анимаций нет. */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/zadaniya/10/teoriya/`, { waitUntil: 'networkidle' });
  const prv = page.locator('#ed-kak-perevodit .prv');
  const { verny } = indeksy(ZADACHI[0], 0);
  await prv.getByRole('radio').nth(verny).click();
  await prv.getByRole('button', { name: 'Проверить' }).click();
  const anim = await prv
    .locator('.prv-zad')
    .evaluate((el) => getComputedStyle(el, '::after').animationName);
  check(anim === 'none', `reduced-motion: пульсация осталась (${anim})`);
  const ten = await prv.locator('.prv-zad').evaluate((el) => getComputedStyle(el).boxShadow);
  check(ten !== 'none', 'reduced-motion: пропало свечение');
  await ctx.close();
}

/* №11: блоки в разделе «Единицы измерения». */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${BASE}/zadaniya/11/teoriya/`, { waitUntil: 'networkidle' });
  check(
    (await page.locator('#ed-kak-perevodit .prv').count()) === 1,
    '№11: нет «Проверь себя» в «Как переводить единицы»',
  );
  check(
    (await page.locator('#ed-sostavnye .prv').count()) === 1,
    '№11: нет «Проверь себя» в «км/ч ↔ м/с»',
  );
  await page.close();
}

await browser.close();
server.close();
if (problems.length > 0) {
  console.error(`Проблем: ${problems.length}`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log(
  '«Проверь себя» на сайте: 1440 и 390 — выбор, проверка, подсказки, разбор, «Ещё такое же», счёт, клавиатура и aria-live в порядке.',
);
