/* scripts/lib/sheet-shots.mjs — снимки страниц листа в PNG.

   Нужны для глазной проверки вёрстки: PDF так просто не рассмотреть,
   а снимок показывает ровно то, что печатает Chromium.

   Запуск: node scripts/lib/sheet-shots.mjs <файл.html> <куда> [страницы]
*/

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const GLOBAL = '/opt/node22/lib/node_modules/playwright';

async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* глобальный */ }
  return createRequire(import.meta.url)(GLOBAL);
}

export async function shoot(htmlFile, outDir, limit = 2) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1400 },
                                         deviceScaleFactor: 2 });
    await page.goto('file://' + path.resolve(htmlFile), { waitUntil: 'load' });
    await page.waitForFunction('window.sheetPagination !== undefined', null, { timeout: 60000 });

    fs.mkdirSync(outDir, { recursive: true });
    const pages = await page.locator('.sheet-page').all();
    const files = [];
    for (let i = 0; i < Math.min(pages.length, limit); i += 1) {
      const file = path.join(outDir, path.basename(htmlFile, '.html') + '-p' + (i + 1) + '.png');
      await pages[i].screenshot({ path: file });
      files.push(file);
    }
    return { pages: pages.length, files };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith('sheet-shots.mjs')) {
  const [, , html, out, limit] = process.argv;
  shoot(html, out, limit ? Number(limit) : 2).then((r) => {
    console.log('страниц ' + r.pages + ', снимков ' + r.files.length);
    r.files.forEach((f) => console.log('  ' + f));
  });
}
