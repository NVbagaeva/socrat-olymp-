#!/usr/bin/env node
/* scripts/check-pechat-webkit.mjs — печать листов движком Safari (WebKit).

   Запуск (после pnpm build, сайт отдаётся с out/):
     npx serve out -l 8765 &   (или python3 -m http.server 8765 -d out)
     node scripts/check-pechat-webkit.mjs http://localhost:8765 [адрес листа ...]

   Нужны WebKitGTK для Python и виртуальный экран:
     apt-get install gir1.2-webkit2-4.1 python3-gi xvfb poppler-utils

   Для каждого листа: сколько страниц разложил paginate.js (Playwright,
   WebKit), затем настоящая печать движком WebKit в PDF (WebKitGTK — тот
   же движок раскладки страниц, что у Safari) на A4 и US Letter с разными
   полями принтера, как их ставит Safari. Страниц в PDF должно быть ровно
   столько же: лишняя страница — это пустая (подвал, уехавший с листа).
   До исправления в sheet.css на Letter выходило 12 страниц вместо 6.

   Ненулевой код возврата — есть лишние страницы. */

import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const [base = 'http://localhost:8765', ...own] = process.argv.slice(2);
const LISTY =
  own.length > 0
    ? own
    : [
        /* №11: 1, 6, 25 задач; варианты; клетка; рамки теории; лист учителя. */
        '/zadaniya/11/pechat/?m=o&i=n&ps=2&s=VD-05:1&seed=t1',
        '/zadaniya/11/pechat/?m=o&i=n&ps=2&s=VD-05:6&seed=t6',
        '/zadaniya/11/pechat/?m=v&i=m&ps=2&s=PR-04:5,SM-04:5,DP-07:5,VD-05:5,RB-01:5&seed=t25',
        '/zadaniya/11/pechat/?m=v&i=n&ps=2&s=PR-04:4,SM-04:4,DP-07:4,VD-05:4&v=3&seed=abc',
        '/zadaniya/11/pechat/?m=o&i=n&ps=2&s=VD-05:6,PR-04:6&seed=kl&sp=9&tr=1',
        '/zadaniya/11/pechat/otvety/?m=v&i=m&ps=2&s=PR-04:5,SM-04:5,DP-07:5,VD-05:5,RB-01:5&seed=t25&tr=1',
      ];
const BUMAGA = [
  ['a4', '0'],
  ['a4', '6.35'],
  ['a4', '3,5,17'],
  ['a4', '6.35,19,19'],
  ['letter', '0'],
  ['letter', '6.35'],
  ['letter', '12.7'],
  ['letter', '3,5,17'],
];

/* Python с модулем gi (WebKitGTK): PYTHON_GI=/usr/bin/python3.12, если python3 другой версии. */
const PYTHON = process.env.PYTHON_GI ?? 'python3';
const dir = mkdtempSync(join(tmpdir(), 'pechat-webkit-'));
const browser = await webkit.launch();
const problems = [];
for (const path of LISTY) {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(base + path);
  await page.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 90000 });
  const ozhid = await page.evaluate(() => window.sheetPagination.pages);
  await page.emulateMedia({ media: 'print' });
  /* В печати видны только страницы листа. */
  const lishnee = await page.evaluate(() => {
    const sp = document.getElementById('sheet-pages');
    return [...document.body.querySelectorAll('*')]
      .filter((e) => {
        if (sp.contains(e) || e.contains(sp) || e.closest('script,style')) return false;
        const r = e.getBoundingClientRect();
        return getComputedStyle(e).display !== 'none' && (r.width > 0 || r.height > 0);
      })
      .map((e) => `${e.tagName}.${e.className}`);
  });
  if (lishnee.length > 0)
    problems.push(`${path}: в печати видно лишнее: ${lishnee.slice(0, 5).join(', ')}`);
  await page.close();
  const stroka = [];
  for (const [paper, margin] of BUMAGA) {
    const pdf = join(dir, `${paper}-${margin}.pdf`);
    execFileSync(
      'xvfb-run',
      ['-a', PYTHON, join(here, 'pechat-webkit/wkprint.py'), base + path, pdf, paper, margin, '15'],
      { stdio: 'ignore', timeout: 180000 },
    );
    const info = execFileSync('pdfinfo', [pdf]).toString();
    const n = Number(/Pages:\s+(\d+)/.exec(info)?.[1]);
    stroka.push(`${paper} ${margin}: ${n}`);
    if (n !== ozhid)
      problems.push(`${path}: ${paper}, поля ${margin} мм — ${n} стр. вместо ${ozhid}`);
  }
  console.log(`${path}\n  страниц листа ${ozhid}; печать WebKit — ${stroka.join(' · ')}`);
}
await browser.close();
if (problems.length > 0) {
  console.error(`\nПроблемы (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('\nОК: в печати WebKit ни одной лишней страницы.');
