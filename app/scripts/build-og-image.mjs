/* scripts/build-og-image.mjs — картинка для ссылки в соцсетях.

   Open Graph (og:image) показывается, когда ссылку на сайт кидают в
   мессенджер или соцсеть: 1200×630, бренд «Будет на ЕГЭ», тема сайта
   и домен. Собирается из HTML-разметки браузером Playwright, шрифт —
   тот же Inter, что на сайте (src/fonts). Готовый файл коммитится в
   public/og/budetege-og.png и попадает в экспорт как есть; ссылка на
   него — из корневого layout через assetUrl().

   Запуск:  pnpm build:og
   CHROMIUM_PATH — для своего Chromium, как у preview-shots.mjs. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'public', 'og', 'budetege-og.png');
const WIDTH = 1200;
const HEIGHT = 630;

function font(file) {
  const data = fs.readFileSync(path.join(app, 'src', 'fonts', file)).toString('base64');
  return `url(data:font/woff2;base64,${data}) format('woff2')`;
}

/* Цвета — примитивы палитры из src/styles/tokens.css. */
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<style>
  @font-face { font-family: Inter; font-weight: 500; src: ${font('inter-500.woff2')}; }
  @font-face { font-family: Inter; font-weight: 700; src: ${font('inter-700.woff2')}; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    font-family: Inter, system-ui, sans-serif;
    color: #0f172a;
    background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
    position: relative;
  }
  .lines { position: absolute; right: -40px; top: -20px; width: 560px; height: 680px; }
  .lines path { stroke: #1f5fd0; stroke-opacity: .18; stroke-width: 3; fill: none; }
  .lines circle { fill: #1f5fd0; fill-opacity: .35; }
  .in { position: absolute; inset: 0; padding: 88px 96px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 20px; font-weight: 700; font-size: 44px; letter-spacing: -0.01em; }
  .logo svg { width: 64px; height: 64px; }
  .title { font-weight: 700; font-size: 66px; line-height: 1.1; letter-spacing: -0.02em; max-width: 760px; }
  .sub { font-weight: 500; font-size: 30px; color: #475569; max-width: 760px; margin-top: 22px; }
  .domain { font-weight: 600; font-size: 32px; color: #1f5fd0; }
</style></head>
<body>
  <svg class="lines" viewBox="0 0 640 760" aria-hidden="true">
    <path d="M118 96 A 316 316 0 0 1 474 624"/>
    <path d="M44 624 H 612"/><path d="M118 96 L 474 624"/><path d="M118 96 L 44 624"/>
    <path d="M296 232 L 296 624"/><path d="M118 96 L 296 232"/>
    <path d="M296 596 h 28 v 28"/>
    <circle cx="118" cy="96" r="6"/><circle cx="296" cy="232" r="6"/><circle cx="44" cy="624" r="6"/>
    <circle cx="296" cy="624" r="6"/><circle cx="474" cy="624" r="6"/>
  </svg>
  <div class="in">
    <div class="logo">
      <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1F5FD0"/><g stroke="#FFF" stroke-width="3" stroke-linecap="round" fill="none"><line x1="7" y1="24" x2="25" y2="24"/><line x1="7" y1="24" x2="25" y2="9"/></g></svg>
      Будет на ЕГЭ
    </div>
    <div>
      <div class="title">Подготовка к ЕГЭ по профильной математике</div>
      <div class="sub">Теория, задания, тренажёры и генератор задач по темам экзамена</div>
    </div>
    <div class="domain">budetege.ru</div>
  </div>
</body></html>`;

const svoy = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(svoy === undefined ? {} : { executablePath: svoy });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const shot = await page.screenshot({ type: 'png' });
await browser.close();
/* Плоская картинка с несколькими цветами: палитровый PNG втрое легче
   без заметной потери. */
await sharp(shot).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(OUT);
console.log(
  `${path.relative(app, OUT)}: ${WIDTH}×${HEIGHT}, ${Math.round(fs.statSync(OUT).size / 1024)} КБ`,
);
