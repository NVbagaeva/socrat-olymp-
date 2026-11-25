#!/usr/bin/env node
/* scripts/check-verhnee-menu.mjs — одно верхнее меню на весь сайт.

   Запуск: pnpm build && pnpm test:verhnee-menu

   Страницы сайта и кабинета на 1024, 1280, 1366, 1440, 1600, 1920 и
   на телефоне 360, 375, 390 px. Проверяется:
   - видимые пункты верхнего меню (тексты и порядок) одинаковые на всех
     страницах при одной ширине окна;
   - высота шапки 64 px, шапка в одну строку, ничего не налезает и не
     выходит за край;
   - у текущего пункта aria-current="page", и вид текущего пункта на
     /tarify/ и «Как пользоваться» совпадает;
   - на телефоне состав шапки одинаковый, области нажатия ≥ 44 px.
   Скриншоты — в app/out-shapka/ (SHOTS=1). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const { href, ZADANIYA, USTNYY } = requireSrc('lib/paths.ts');
const { HOWTO_HREF } = requireSrc('content/howto.ts');
const { TARIFY_HREF } = requireSrc('lib/tarify/href.ts');
const { EZH_HREF } = requireSrc('content/ezhemesyachnye.ts');
const { VARIANT_ONLAYN_HREF } = requireSrc('content/variant.ts');
const { AUTH_HREF } = requireSrc('lib/auth/config.ts');

const PAGES = [
  ['главная', '/'],
  ['тарифы', TARIFY_HREF],
  ['об авторе', '/about/'],
  ['вход', AUTH_HREF.voyti],
  ['банк заданий', href(ZADANIYA)],
  ['№1 О задании', href(ZADANIYA, 1)],
  ['№4 тренажёр', href(ZADANIYA, 4, 'trenazher')],
  ['устный счёт', href(USTNYY)],
  ['как пользоваться', HOWTO_HREF],
  ['онлайн-вариант', VARIANT_ONLAYN_HREF],
  ['варианты месяца', EZH_HREF],
];
const WIDE = [1024, 1280, 1366, 1440, 1600, 1920];
const PHONE = [360, 375, 390];

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const SHOTS = process.env.SHOTS === '1' ? path.join(APP, 'out-shapka') : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
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

const failures = [];
let checks = 0;
const check = (ok, what) => {
  checks += 1;
  if (!ok) failures.push(what);
};

/* Состояние шапки в окне: всё, что видно, и где стоит. */
function zamer() {
  const head = document.querySelector('header.site-head');
  if (!head) return null;
  const box = (el) => el.getBoundingClientRect();
  const vidno = (el) => {
    const s = getComputedStyle(el);
    const r = box(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  const punkty = [...head.querySelectorAll('.verh-menu__p, .verh-menu .nav-drop__button')]
    .filter(vidno)
    .map((el) => ({
      text: el.textContent.trim(),
      current: el.getAttribute('aria-current') === 'page' || el.classList.contains('is-current'),
      ...(() => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, weight: s.fontWeight, h: box(el).height };
      })(),
    }));
  /* Видимые блоки строки шапки слева направо — для проверки налезания. */
  const bloki = [
    ...head.querySelectorAll(
      '.logo, .site-head__level, .verh-menu__p, .verh-menu .nav-drop__button, .site-head__cta > *, .site-head .tema-switch',
    ),
  ]
    .filter(vidno)
    .map((el) => {
      const r = box(el);
      return {
        cls: el.className.toString().split(' ')[0],
        l: r.left,
        r: r.right,
        t: r.top,
        b: r.bottom,
        w: r.width,
        h: r.height,
      };
    });
  const hr = box(head);
  return {
    h: hr.height,
    vw: document.documentElement.clientWidth,
    scrollW: document.documentElement.scrollWidth,
    punkty,
    bloki,
    sostav: bloki.map((b) => b.cls),
  };
}

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const poShirine = new Map();

for (const w of [...WIDE, ...PHONE]) {
  const phone = PHONE.includes(w);
  const ctx = await browser.newContext({
    viewport: { width: w, height: phone ? 800 : 900 },
    ...(phone ? { hasTouch: true, isMobile: true } : {}),
  });
  const page = await ctx.newPage();
  for (const [name, url] of PAGES) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    const z = await page.evaluate(zamer);
    const gde = `${name} ${w}`;
    check(z !== null, `${gde}: нет шапки .site-head`);
    if (z === null) continue;
    check(Math.round(z.h) === 64, `${gde}: высота шапки ${z.h}, нужна 64`);
    check(z.scrollW <= z.vw, `${gde}: страница шире окна (${z.scrollW} > ${z.vw})`);
    for (const b of z.bloki) {
      check(b.t >= 0 && b.b <= 64.5, `${gde}: ${b.cls} не в строке шапки`);
      check(b.r <= z.vw + 0.5, `${gde}: ${b.cls} за правым краем`);
    }
    const sorted = [...z.bloki].sort((a, b) => a.l - b.l);
    for (let i = 1; i < sorted.length; i += 1) {
      check(
        sorted[i].l >= sorted[i - 1].r - 0.5,
        `${gde}: ${sorted[i - 1].cls} налезает на ${sorted[i].cls}`,
      );
    }
    for (const p of z.punkty)
      check(Math.round(p.h) === 40, `${gde}: пункт «${p.text}» высотой ${p.h}`);
    const key = phone ? z.sostav.join(' | ') : z.punkty.map((p) => p.text).join(' · ');
    const prev = poShirine.get(w);
    if (prev === undefined) poShirine.set(w, { key, name });
    else check(prev.key === key, `${gde}: шапка «${key}» ≠ «${prev.key}» (${prev.name})`);
    if (phone) {
      for (const b of z.bloki.filter((x) => x.cls !== 'logo')) {
        check(b.h >= 44 || b.cls === 'site-head__level', `${gde}: ${b.cls} ниже 44 px (${b.h})`);
      }
    }
    if (
      SHOTS &&
      [1440, 1280, 390].includes(w) &&
      ['тарифы', 'как пользоваться', '№1 О задании'].includes(name)
    ) {
      await page.screenshot({
        path: path.join(SHOTS, `${name}-${w}.png`),
        clip: { x: 0, y: 0, width: w, height: 120 },
      });
    }
  }
  await ctx.close();
}

/* Текущий пункт: /tarify/ и «Как пользоваться» на 1440. */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const vid = {};
  for (const [name, url, label] of [
    ['тарифы', TARIFY_HREF, 'Тарифы'],
    ['как пользоваться', HOWTO_HREF, 'Как пользоваться'],
    ['№1', href(ZADANIYA, 1), 'Банк заданий'],
  ]) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    const z = await page.evaluate(zamer);
    const cur = z.punkty.filter((p) => p.current);
    check(
      cur.length === 1 && cur[0].text === label,
      `${name}: текущий пункт «${cur.map((c) => c.text)}», нужен «${label}»`,
    );
    if (cur[0]) vid[name] = `${cur[0].bg} ${cur[0].color} ${cur[0].weight}`;
  }
  check(
    vid['тарифы'] === vid['как пользоваться'],
    `вид текущего пункта: ${vid['тарифы']} ≠ ${vid['как пользоваться']}`,
  );
  if (SHOTS) {
    for (const [name, url] of [
      ['сайт', TARIFY_HREF],
      ['кабинет', HOWTO_HREF],
    ]) {
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.locator('.verh-menu .nav-drop__button').focus();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(SHOTS, `varianty-${name}.png`),
        clip: { x: 0, y: 0, width: 1440, height: 420 },
      });
    }
  }
  await ctx.close();
}

await browser.close();
server.close();

for (const [w, { key }] of poShirine) console.log(`${w}: ${key}`);
if (failures.length > 0) {
  console.error(`\nПроблемы (${failures.length} из ${checks}):`);
  for (const f of failures.slice(0, 80)) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`\nВерхнее меню одинаковое: проверок ${checks}.`);
