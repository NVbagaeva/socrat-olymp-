#!/usr/bin/env node
/* scripts/build-og.mjs — картинки для ссылок в соцсетях (Open Graph).

   Запуск: pnpm build:og        (нужен Chromium из Playwright;
                                свой — PW_CHROMIUM=/путь/к/chrome)
           pnpm build:og --check — только сверить, что картинки свежие

   Картинка 1200×630 на каждый раздел задания и одна общая — её
   показывают ВКонтакте, Telegram и мессенджеры, когда отправляют
   ссылку. Стиль — как у сайта: шрифт Inter, синий бренда, иконка
   задания с плашки банка, светлый фон с полупрозрачным кругом.

   Файлы: public/og/zadanie-N.png и public/og/sayt.png. Подписи берутся
   из content/tasks.ts (название задания) и lib/seo.ts (год экзамена).

   Почему картинки коммитятся, а не рисуются на каждой выкладке:
   сборщик выкладки (deploy.yml) ставит только Node, браузера в нём
   нет — так же устроены герой главной и иконки разделов (pnpm
   build:hero, build:razdely). Чтобы картинка не отставала от
   названия, рядом лежит public/og/podpisi.json — подписи, из которых
   картинки нарисованы; pnpm build:og --check (он стоит в check.yml)
   сверяет их с текущими названиями и падает, если картинки устарели. */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { tasks } = requireSrc('content/tasks.ts');
const { EGE_GOD } = requireSrc('lib/seo.ts');
const { temaZadaniya } = requireSrc('content/seo.ts');

const OUT = path.join(APP, 'public', 'og');
const PODPISI = path.join(OUT, 'podpisi.json');

/** Что написано на каждой картинке: по этому и сверяется свежесть. */
const kartinki = [
  {
    file: 'sayt.png',
    nomer: '',
    zagolovok: 'Подготовка к ЕГЭ по профильной математике',
    podzagolovok: 'Теория, опорные задачи, тренажёр и генератор вариантов по каждому заданию',
    ikonka: null,
  },
  ...tasks
    .filter((t) => t.status === 'ready' || t.stub === true)
    .map((t) => ({
      file: `zadanie-${Number(t.no)}.png`,
      nomer: `Задание ${Number(t.no)}`,
      zagolovok: t.name,
      podzagolovok:
        t.status === 'ready'
          ? `ЕГЭ профиль ${EGE_GOD} · теория, прототипы, тренажёр`
          : `ЕГЭ профиль ${EGE_GOD} · раздел готовится`,
      ikonka: `images/task-${t.no}.${t.icon ?? 'webp'}`,
      tema: temaZadaniya(Number(t.no)),
    })),
];

const podpisi = Object.fromEntries(
  kartinki.map(({ file, nomer, zagolovok, podzagolovok, ikonka }) => [
    file,
    { nomer, zagolovok, podzagolovok, ikonka },
  ]),
);

if (process.argv.includes('--check')) {
  const bylo = fs.existsSync(PODPISI) ? JSON.parse(fs.readFileSync(PODPISI, 'utf8')) : {};
  const ustareli = kartinki.filter(
    (k) =>
      JSON.stringify(bylo[k.file]) !== JSON.stringify(podpisi[k.file]) ||
      !fs.existsSync(path.join(OUT, k.file)),
  );
  if (ustareli.length > 0) {
    console.error(
      `Картинки Open Graph устарели: ${ustareli.map((k) => k.file).join(', ')}.\n` +
        'Пересоберите: pnpm build:og — и закоммитьте public/og/.',
    );
    process.exit(1);
  }
  console.log(`Картинки Open Graph свежие: ${kartinki.length} шт.`);
  process.exit(0);
}

const font = fs
  .readFileSync(path.join(APP, 'src', 'fonts', 'inter-variable.woff2'))
  .toString('base64');

function dataUrl(rel) {
  const file = path.join(APP, 'public', rel);
  const ext = path.extname(file).slice(1);
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function html(k) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; font-family: Inter, sans-serif; color: #101728;
  background: linear-gradient(135deg, #f2f7fe 0%, #e8f0fc 55%, #dbe7fb 100%); overflow: hidden; position: relative; }
.krug { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(31,95,208,.16), rgba(31,95,208,0) 70%); }
.k1 { width: 760px; height: 760px; right: -220px; top: -260px; }
.k2 { width: 420px; height: 420px; left: -140px; bottom: -200px; }
.ram { position: absolute; inset: 56px 64px; display: grid; grid-template-columns: 1fr ${k.ikonka ? '360px' : '0'}; gap: 40px; align-items: center; }
.brand { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 600; color: #1f5fd0; letter-spacing: -.01em; }
.brand i { width: 18px; height: 18px; border-radius: 6px; background: #1f5fd0; display: inline-block; }
.nomer { margin-top: 44px; display: inline-block; padding: 10px 20px; border-radius: 999px; background: #1f5fd0; color: #fff; font-size: 30px; font-weight: 600; }
h1 { margin-top: ${k.nomer ? '24px' : '56px'}; font-size: ${k.zagolovok.length > 34 ? 58 : 70}px; line-height: 1.05; font-weight: 700; letter-spacing: -.025em; max-width: 720px; }
p { margin-top: 26px; font-size: 28px; line-height: 1.3; color: #3b4458; max-width: 700px; }
.ik { width: 360px; height: 360px; border-radius: 48px; background: rgba(255,255,255,.72); box-shadow: 0 24px 60px rgba(16,23,40,.12); display: grid; place-items: center; }
.ik img { width: 300px; height: 300px; object-fit: contain; }
.niz { position: absolute; left: 64px; bottom: 44px; font-size: 22px; color: #3b4458; }
</style></head><body>
<div class="krug k1"></div><div class="krug k2"></div>
<div class="ram"><div>
  <div class="brand"><i></i>Будет на ЕГЭ</div>
  ${k.nomer ? `<div class="nomer">${esc(k.nomer)}</div>` : ''}
  <h1>${esc(k.zagolovok)}</h1>
  <p>${esc(k.podzagolovok)}</p>
</div>${k.ikonka ? `<div class="ik"><img src="${dataUrl(k.ikonka)}" alt=""></div>` : ''}</div>
<div class="niz">budetege.ru</div>
</body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const k of kartinki) {
  await page.setContent(html(k), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  /* Палитровый PNG: картинка из плоских цветов и текста, качество то же, вес в 3–4 раза меньше. */
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).png({ palette: true, quality: 90, effort: 10 }).toFile(path.join(OUT, k.file));
}
await browser.close();
fs.writeFileSync(PODPISI, `${JSON.stringify(podpisi, null, 2)}\n`);
console.log(`build-og: ${kartinki.length} картинок в public/og/`);
