#!/usr/bin/env node
/* scripts/galereya-planimetrii.mjs — все чертежи №1 на одной странице
   и её снимки: миниатюры плашек «О задании», условия и решения всех
   прототипов, рисунки теории и справочника. Нужна, чтобы смотреть
   правки стиля чертежей глазами: до и после.

   Запуск: node scripts/galereya-planimetrii.mjs <папка-для-снимков> [фильтр]
   Фильтр — подстрока раздела (mini, uchenik, uchitel, teoriya, spravochnik),
   после двоеточия — подписи рисунков через запятую: uchitel:№33,№49. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { requireSrc } from './lib/load-ts.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? 'galereya-1');
const FILTR = process.argv[3] ?? '';
fs.mkdirSync(OUT, { recursive: true });

const { renderPlan } = requireSrc('lib/planimetriya/render');
const { PL } = requireSrc('lib/planimetriya/stil');
const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny');
const { POROG } = requireSrc('lib/planimetriya/figury');
const { KLYUCHI_TEORII, risunokTeorii } = requireSrc('lib/planimetriya/teoriya');
const { O_ZADANII_1 } = requireSrc('content/zadanie1');
const { chertezhTemy, KARTOCHKI_S_CHERTEZHOM } = requireSrc(
  'lib/planimetriya/spravochnik-chertezhi',
);

const razdely = [];
const problemy = [];
const ris = (id, svg, otchet) => {
  if (otchet?.problems.length) problemy.push(`${id}: ${otchet.problems.join('; ')}`);
  return { id, svg };
};
const plan = (id, scena, optsii) => {
  const o = {};
  const svg = renderPlan(scena, optsii, o);
  return ris(id, svg, o);
};

razdely.push({
  id: 'mini',
  title: 'Миниатюры плашек «О задании»',
  items: O_ZADANII_1.tipy.map((t) => {
    const p = PROTOTIPY.find((x) => x.id === t.mini);
    return plan(`${t.blok} · ${t.id}`, p.stsena(p.primer, POROG), { ...PL.mini });
  }),
});
razdely.push({
  id: 'uchenik',
  title: 'Условия прототипов (лист ученика)',
  items: PROTOTIPY.map((p) => plan(`№${p.id}`, p.stsena(p.primer, POROG), {})),
});
razdely.push({
  id: 'uchitel',
  title: 'Решения прототипов (лист учителя, числа)',
  items: PROTOTIPY.map((p) =>
    plan(`№${p.id}`, p.stsena(p.primer, POROG), { rezhim: { rezhim: 'uchitel' }, chisla: true }),
  ),
});
razdely.push({
  id: 'teoriya',
  title: 'Рисунки теории',
  items: KLYUCHI_TEORII.map((k) => {
    const r = risunokTeorii(k);
    return plan(k, r.scena, r.optsii);
  }),
});
razdely.push({
  id: 'spravochnik',
  title: 'Справочник',
  items: KARTOCHKI_S_CHERTEZHOM.flatMap((k) => {
    const c = chertezhTemy(k);
    return (Array.isArray(c) ? c : [c]).map((r, i) =>
      plan(`${k}${i ? `·${i}` : ''}`, r.scena, r.optsii),
    );
  }),
});

const katexCss = path.join(APP, 'node_modules/katex/dist/katex.min.css');
const tokens = path.join(APP, 'src/styles/tokens.css');
const html = (items, title) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${katexCss}"><link rel="stylesheet" href="file://${tokens}">
<style>
body{margin:0;padding:16px;background:var(--color-bg,#f5f9ff);font:13px system-ui;color:#333}
h1{font-size:16px;margin:0 0 12px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--w),1fr));gap:12px}
figure{margin:0;background:var(--color-surface,#fff);border:1px solid #dde6f3;border-radius:12px;padding:12px}
figcaption{margin-top:6px;color:#889}
.pl{display:block;max-width:100%;height:auto;margin:0 auto}
</style></head><body><h1>${title}</h1><div class="g">${items
  .map((i) => `<figure>${i.svg}<figcaption>${i.id}</figcaption></figure>`)
  .join('')}</div>
<span style="font-family:KaTeX_Math;font-style:italic;position:absolute;opacity:0">ABC</span>
<span style="font-family:KaTeX_Main;position:absolute;opacity:0">123</span></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 800 },
  deviceScaleFactor: 2,
});
for (const r of razdely) {
  const [fR, fI = ''] = FILTR.split(':');
  if (fR && !r.id.includes(fR)) continue;
  if (fI)
    r.items = r.items.filter((i) =>
      fI.split(',').some((x) => i.id === x || i.id.startsWith(`${x}·`)),
    );
  /* Миниатюры — в карточку телефона, остальное — сеткой по ширине чертежа. */
  const w = r.id === 'mini' ? 200 : 300;
  const PO = 48;
  for (let i = 0; i < r.items.length; i += PO) {
    const chast = r.items.slice(i, i + PO);
    const file = path.join(OUT, `${r.id}-${String(i / PO + 1).padStart(2, '0')}.html`);
    fs.writeFileSync(file, html(chast, r.title).replace('var(--w)', `${w}px`));
    await page.goto(`file://${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file.replace(/\.html$/, '.png'), fullPage: true });
  }
}
await browser.close();
console.log(`рисунков: ${razdely.reduce((a, r) => a + r.items.length, 0)}`);
console.log(problemy.length ? problemy.join('\n') : 'проблем движка: 0');
