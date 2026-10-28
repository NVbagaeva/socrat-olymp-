#!/usr/bin/env node
/* scripts/check-stereo-vrashchenie-site.mjs — вращение чертежей стереометрии в браузере.

   Запуск после pnpm build: pnpm test:stereo-vrashchenie-site

   Chromium, компьютер (1280) и телефон (390, касания):
     1. Перетаскивание по чертежу (мышь, палец) поворачивает фигуру —
        кадр меняется, «Сбросить вид» включается и возвращает исходный
        кадр. Вертикальный жест пальцем по чертежу страницу не листает.
     2. Жест пальцем вне чертежа листает страницу как обычно.
     3. Масштаб: «+» и колесо мыши увеличивают, «−» уменьшает.
     4. Подсказка «Крутите фигуру…» есть до первого поворота и пропадает
        после него.
     5. «Нажмите на чертеже»: короткое касание выбирает цель,
        перетаскивание — нет.
     6. Плавность: при 4-кратном замедлении процессора кадр поворота в
        среднем не дольше 16 мс; чертежи, которые не трогали, не
        перерисовываются.
     7. Один набор кнопок вида у каждого чертежа страницы: «+», «−»,
        «Сбросить вид», «Сверху».

   Страницы: теория №3, разбор №3, опорные задачи (блок «Читаю
   чертёж»), разбор №15. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const OUT = path.join(APP, 'out');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
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

const STRANICY = [
  ['теория №3', '/zadaniya/3/teoriya/'],
  ['разбор №3', '/zadaniya/3/razbor/diagonali/'],
  ['разбор №15', '/zadaniya/15/razbor/ploshchad-secheniya/'],
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

const SIZES = [
  { name: 'компьютер', opts: { viewport: { width: 1280, height: 900 } }, touch: false },
  {
    name: 'телефон',
    opts: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    touch: true,
  },
];

/** Перетащить по точке (x, y) на (dx, dy) мышью или пальцем. */
async function tyanut(page, cdp, touch, x, y, dx, dy, shagov = 20) {
  if (touch) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= shagov; i += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / shagov, y: y + (dy * i) / shagov }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= shagov; i += 1) {
      await page.mouse.move(x + (dx * i) / shagov, y + (dy * i) / shagov);
    }
    await page.mouse.up();
  }
}

async function kadrHtml(oblast) {
  return oblast.evaluate((el) => el.querySelector('.vr__kholst')?.innerHTML ?? '');
}

for (const size of SIZES) {
  for (const [imya, url] of STRANICY) {
    const where = (w) => `${size.name}, ${imya}: ${w}`;
    const context = await browser.newContext({ ...size.opts, hasTouch: size.touch });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const otvet = await page.goto(BASE + url, { waitUntil: 'networkidle' });
    check(otvet?.ok() === true, where(`страница не открылась (${otvet?.status()})`));
    const vr = page.locator('.vr');
    const n = await vr.count();
    check(n > 0, where('нет вращаемого чертежа'));
    if (n === 0) {
      await context.close();
      continue;
    }
    /* 7. Один набор кнопок у каждого чертежа. */
    const nabory = await vr.evaluateAll((list) =>
      list.map((el) =>
        [...el.querySelectorAll('.vr__knopki button')].map((b) => b.getAttribute('aria-label')),
      ),
    );
    check(
      nabory.every(
        (k) => k[0] === 'Крупнее' && k[1] === 'Мельче' && k[2] === 'Сбросить вид' && k.length <= 4,
      ),
      where(`кнопки вида не те: ${JSON.stringify(nabory[0])}`),
    );
    const staryeKnopki = await page.locator('.z3d__knopki, .ch3__btn, .o3-zum').count();
    check(staryeKnopki === 0, where('остались прежние кнопки вида'));

    const first = vr.first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const oblast = first.locator('.vr__oblast');
    const podskazka = first.locator('.vr__podskazka');
    check(
      (await podskazka.count()) === 1 &&
        !(await podskazka.evaluate((el) => el.classList.contains('is-hidden'))),
      where('нет подсказки «Крутите фигуру» до первого поворота'),
    );
    const do_ = await kadrHtml(oblast);
    const box = await oblast.boundingBox();
    const cdp = await context.newCDPSession(page);
    const scroll0 = await page.evaluate(() => window.scrollY);
    /* 1. Поворот: вбок и вверх-вниз. */
    await tyanut(page, cdp, size.touch, box.x + box.width * 0.4, box.y + box.height * 0.5, 90, 60);
    await page.waitForTimeout(700);
    const posle = await kadrHtml(oblast);
    check(posle !== do_ && posle.includes('<svg'), where('перетаскивание не повернуло фигуру'));
    if (size.touch) {
      const scroll1 = await page.evaluate(() => window.scrollY);
      check(Math.abs(scroll1 - scroll0) < 2, where('жест по чертежу пролистал страницу'));
    }
    check(
      await podskazka.evaluate((el) => el.classList.contains('is-hidden')),
      where('подсказка не пропала после поворота'),
    );
    const sbros = first.getByRole('button', { name: 'Сбросить вид' });
    check(await sbros.isEnabled(), where('«Сбросить вид» не включился после поворота'));
    await sbros.click();
    await page.waitForTimeout(500);
    check((await kadrHtml(oblast)) === do_, where('«Сбросить вид» не вернул исходный кадр'));

    /* 3. Масштаб. */
    const zum = () =>
      oblast.evaluate((el) => {
        const t = el.querySelector('.vr__kholst')?.style.transform ?? '';
        return Number(/scale\(([\d.]+)\)/.exec(t)?.[1] ?? 1);
      });
    await first.getByRole('button', { name: 'Крупнее' }).click();
    await page.waitForTimeout(150);
    const z1 = await zum();
    check(z1 > 1.1, where(`«+» не увеличил (${z1})`));
    await first.getByRole('button', { name: 'Мельче' }).click();
    await page.waitForTimeout(150);
    check((await zum()) < z1, where('«−» не уменьшил'));
    if (!size.touch) {
      const z2 = await zum();
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(200);
      check((await zum()) > z2, where('колесо мыши не увеличило'));
    }

    /* 2. Вне чертежа страница листается пальцем. */
    if (size.touch) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      await tyanut(page, cdp, true, 20, 600, 0, -300, 10);
      await page.waitForTimeout(600);
      check(
        (await page.evaluate(() => window.scrollY)) > 50,
        where('жест пальцем вне чертежа не листает страницу'),
      );
    }

    /* 6. Плавность: поворот жестом внутри страницы — 60 движений по
       кадру экрана; время кадра — между перерисовками самого чертежа.
       Чертежи, которые не трогали, не перерисовываются. */
    if (!size.touch) {
      await first.scrollIntoViewIfNeeded();
      const povernut = () =>
        page.evaluate(
          () =>
            new Promise((resolve) => {
              const all = [...document.querySelectorAll('.vr__kholst')];
              const oblast = all[0].closest('.vr__oblast');
              const kadry = [];
              let chuzhie = 0;
              all.forEach((k, i) =>
                new MutationObserver(() => {
                  if (i === 0) kadry.push(performance.now());
                  else chuzhie += 1;
                }).observe(k, { childList: true, subtree: true }),
              );
              const r = oblast.getBoundingClientRect();
              const x = r.left + r.width * 0.4;
              const y = r.top + r.height * 0.5;
              const ev = (type, dx) =>
                oblast.dispatchEvent(
                  new PointerEvent(type, {
                    bubbles: true,
                    pointerId: 7,
                    pointerType: 'mouse',
                    button: 0,
                    clientX: x + dx,
                    clientY: y,
                  }),
                );
              ev('pointerdown', 0);
              let i = 0;
              const t0 = performance.now();
              const shag = () => {
                i += 1;
                ev('pointermove', i * 4);
                if (i < 60) requestAnimationFrame(shag);
                else {
                  ev('pointerup', i * 4);
                  setTimeout(() => resolve({ kadry, chuzhie, dlit: performance.now() - t0 }), 300);
                }
              };
              requestAnimationFrame(shag);
            }),
        );
      /* Без замедления — кадр экрана (60 в секунду); при 4-кратном
         замедлении процессора (слабый телефон) — чертёж не застревает. */
      const zamer = await povernut();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const medlenno = await povernut();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const n = zamer.kadry.length;
      check(n >= 10, where(`за поворот всего ${n} кадров`));
      check(
        zamer.chuzhie === 0,
        where(`перерисовались чертежи, которые не трогали (${zamer.chuzhie})`),
      );
      const naKadr = zamer.dlit / Math.max(1, n);
      const naKadr4 = medlenno.dlit / Math.max(1, medlenno.kadry.length);
      console.log(
        `  ${where('кадр')} ${naKadr.toFixed(1)} мс, при 4× замедлении ${naKadr4.toFixed(1)} мс`,
      );
      check(
        naKadr <= 22,
        where(`кадр поворота ${naKadr.toFixed(1)} мс (нужно 60 кадров в секунду)`),
      );
      check(naKadr4 <= 90, where(`кадр поворота ${naKadr4.toFixed(1)} мс при 4× замедлении`));
    }

    check(errors.length === 0, where(`ошибки страницы: ${errors.slice(0, 2).join(' | ')}`));
    await context.close();
  }

  /* 5. «Нажмите на чертеже»: касание выбирает, перетаскивание — нет. */
  {
    const where = (w) => `${size.name}, «Нажмите на чертеже»: ${w}`;
    const context = await browser.newContext({ ...size.opts, hasTouch: size.touch });
    const page = await context.newPage();
    await page.goto(BASE + '/zadaniya/3/opornye-zadachi/chitayu-chertezh/', {
      waitUntil: 'networkidle',
    });
    for (let i = 0; i < 10 && (await page.locator('.o3-nazhmi').count()) === 0; i += 1) {
      await page.getByRole('button', { name: 'Следующая задача' }).first().click();
      await page.waitForTimeout(300);
    }
    const nazhmi = page.locator('.o3-nazhmi').first();
    check((await nazhmi.count()) === 1, where('нет задачи «нажми» в блоке'));
    if ((await nazhmi.count()) === 1) {
      await nazhmi.scrollIntoViewIfNeeded();
      const cel = nazhmi.locator('[data-cel]').first();
      const cb = await cel.boundingBox();
      /* Выбранная цель подсвечена слоем .solid-cel-on (lib/solid/render.ts). */
      const vybrano = () => nazhmi.locator('.solid-cel-on').count();
      const html0 = await nazhmi.innerHTML();
      const cdp = await context.newCDPSession(page);
      /* Перетаскивание с цели — поворот, не выбор. */
      await tyanut(page, cdp, size.touch, cb.x + cb.width / 2, cb.y + cb.height / 2, 80, 0);
      await page.waitForTimeout(500);
      const html1 = await nazhmi.innerHTML();
      check(html1 !== html0, where('перетаскивание не повернуло чертёж'));
      check((await vybrano()) === 0, where('перетаскивание выбрало цель'));
      /* Касание — выбор. */
      const cel2 = nazhmi.locator('[data-cel]').first();
      if (size.touch) await cel2.tap({ force: true });
      else await cel2.click({ force: true });
      await page.waitForTimeout(400);
      check((await vybrano()) > 0, where('касание по цели её не выбрало'));
    }
    await context.close();
  }
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`check-stereo-vrashchenie-site: не прошли ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`check-stereo-vrashchenie-site: ok (${checks} проверок)`);
