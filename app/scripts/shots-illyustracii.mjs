#!/usr/bin/env node
/* scripts/shots-illyustracii.mjs — снимки страниц для отчёта «было/стало».

   Запуск (после pnpm build):
     node scripts/shots-illyustracii.mjs <папка> <адрес> [адрес…] [--vysota 1600]
   ILL_OUT=<папка сборки> — снять другую сборку (снимок «было»).

   На каждый адрес — два PNG, 1440 и 375 px высотой не больше --vysota
   (по умолчанию 1600 px): верх страницы или, если адрес записан как
   «/путь/@имя-файла», область вокруг первой картинки с этим именем. */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { EKRANY, zapustitServer } from './lib/illyustracii.mjs';

bezBanneraCookieVsyudu(chromium);

const args = process.argv.slice(2);
const vi = args.indexOf('--vysota');
const vysota = vi >= 0 ? Number(args[vi + 1]) : 1600;
const rest = args.filter((_, i) => i !== vi && i !== vi + 1);
const [dir, ...urls] = rest;
if (dir === undefined || urls.length === 0) {
  console.error('node scripts/shots-illyustracii.mjs <папка> <адрес> [адрес…]');
  process.exit(2);
}
fs.mkdirSync(dir, { recursive: true });

const { server, base } = await zapustitServer();
const browser = await chromium.launch();
for (const shirina of EKRANY) {
  const context = await browser.newContext({ viewport: { width: shirina, height: 900 } });
  const page = await context.newPage();
  for (const zapis of urls) {
    const [url, fokus] = zapis.split('@');
    await page.goto(base + url, { waitUntil: 'load' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await Promise.race([
        Promise.all(
          [...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
    });
    /* Картинка-фокус — самая крупная с этим именем; свёрнутые блоки
       вокруг неё раскрываются, чтобы она была на снимке. */
    const y0 = fokus
      ? await page.evaluate(async (imya) => {
          const img = [...document.images]
            .filter((i) => (i.currentSrc || i.src).includes(imya))
            .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
          if (!img) return 0;
          for (let d = img.closest('details'); d; d = d.parentElement?.closest('details') ?? null) {
            d.open = true;
          }
          img.scrollIntoView({ block: 'center' });
          await Promise.race([
            img.decode().catch(() => {}),
            new Promise((r) => setTimeout(r, 3000)),
          ]);
          await new Promise((r) => setTimeout(r, 300));
          /* Верх области — на 160 px выше картинки. */
          return Math.max(0, img.getBoundingClientRect().top + window.scrollY - 160);
        }, fokus)
      : 0;
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const y = Math.max(0, Math.min(y0, h - vysota));
    const name =
      (url.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'glavnaya') +
      (fokus ? `--${fokus}` : '') +
      `-${shirina}.png`;
    await page.screenshot({
      path: path.join(dir, name),
      fullPage: true,
      clip: { x: 0, y, width: shirina, height: Math.min(h - y, vysota) },
    });
    console.log(name);
  }
  await context.close();
}
await browser.close();
server.close();
