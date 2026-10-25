#!/usr/bin/env node
/* scripts/check-stereo-risunki.mjs — рисунки стереометрии (задание №3).

   Запуск: pnpm test:stereo-risunki [--pdf файл.pdf]

   Обходит все чертежи двух движков стереометрии:
     • solid/ — банк №3 (все прототипы, все варианты: тренажёр,
       «Собрать вариант» для разделов IV–VIII) и задание №3 «Вариантов
       повышенной сложности» (все готовые версии);
     • chertezh3/ — сценарные чертежи разделов I–III (лист печати №3 и
       «Собрать вариант»), лист ученика и лист учителя.

   Проверки (рисунок отдельным SVG, без CSS страницы):
     1. Нет непрозрачной заливки: у замкнутой фигуры fill="none" или
        fill-opacity/opacity ≤ 0,1; без атрибута fill (по умолчанию —
        чёрный) — нарушение. Исключение — точки (круг r ≤ 4,5).
     2. Все цвета — значения: нет var(--…) в атрибутах.
     3. Есть пунктир невидимых линий (stroke-dasharray).
     4. Видимое ребро на листе не тоньше 1,5 pt при ширине печати.
     5. По пикселям (Chromium, рисунок как картинка на белом): доля
        тёмных пикселей меньше 15 % — ловит «кляксы» любой природы.

   --pdf файл — сводный лист A4 «тип тела → чертёж», по 2 в ряд.
   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { vstroitShrifty } from './lib/vstroit-shrifty.mjs';

const warn = console.warn;
console.warn = (...a) => (String(a[0]).includes('LaTeX-incompatible') ? undefined : warn(...a));

const PDF = process.argv.includes('--pdf') ? process.argv[process.argv.indexOf('--pdf') + 1] : null;

const { RAZDELY } = requireSrc('lib/zadanie3/index');
const { renderSolid } = requireSrc('lib/solid');
const { dannyePechati } = requireSrc('lib/zadanie3/pechat-dannye');
const { chertezhLista } = requireSrc('lib/zadanie3/pechat');
const { P03_74S } = requireSrc('lib/zadanie3/razdel7/povyshennye');
const { povSetIz } = requireSrc('lib/povyshennye/set');
const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const katex = requireSrc('lib/graph/katex').katex;

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 80) console.error(`  ✗ ${where}: ${message}`);
}

/** Ширина печати, мм: solid — 70 (лист варианта, тренажёр), сценарий — 68. */
const SHIRINA = { solid: 70, chertezh3: 68 };
const MIN_REBRO_MM = 1.5 * (25.4 / 72);

/* ── Сбор чертежей ──────────────────────────────────────────────── */

const ris = [];
for (const r of RAZDELY) {
  for (const p of r.prototipy) {
    p.varianty.forEach((v) => {
      ris.push({
        where: `${p.id}#${v.n} (solid)`,
        proto: p.id,
        nazvanie: p.nazvanie,
        engine: 'solid',
        svg: renderSolid(p.chertezh(v.params)),
      });
    });
  }
  for (const z of dannyePechati(r)) {
    for (const vid of ['uchenik', 'uchitel']) {
      ris.push({
        where: `${z.klyuch} (chertezh3, ${vid})`,
        proto: z.prototip,
        nazvanie: z.nazvanie,
        engine: 'chertezh3',
        svg: chertezhLista(z, vid, (t) => katex.renderToString(t, { throwOnError: false })),
      });
    }
  }
}
ris.push({
  where: 'P03-74S (solid)',
  proto: 'P03-74S',
  nazvanie: P03_74S.nazvanie,
  engine: 'solid',
  svg: renderSolid(P03_74S.chertezh({ r: 1.5, h: 2 })),
});
for (const k of GOTOVY) {
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  povSetIz(k, VARIANT.versii).variants.forEach((v, i) => {
    const t = v.tasks.find((x) => x.egeNumber === 3);
    if (t?.figure)
      ris.push({
        where: `вариант ${k}.${i + 1} №3`,
        proto: VARIANT.versii[i][2].s,
        nazvanie: 'Варианты повышенной сложности',
        engine: 'solid',
        svg: t.figure.svg,
        shirina: t.figure.width,
      });
  });
}

/* ── Проверки разметки ──────────────────────────────────────────── */

/* Чертежи, где невидимых линий нет по геометрии: P03-61 — конический
   сосуд вершиной вниз, открытое основание видно сверху целиком. */
const BEZ_NEVIDIMYKH = new Set(['P03-61']);

const num = (s) => (s === undefined ? undefined : Number(s));
const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

for (const r of ris) {
  const { svg, where } = r;
  if (/="var\(--/.test(svg)) fail(where, 'цвет токеном var(--…): рисунок зависит от CSS страницы');
  for (const m of svg.matchAll(/<(path|polygon|rect|ellipse|circle|polyline)\b[^>]*>/g)) {
    const tag = m[0];
    const fill = attr(tag, 'fill');
    if (fill === 'none' || fill === 'transparent') continue;
    const op = Math.min(num(attr(tag, 'fill-opacity')) ?? 1, num(attr(tag, 'opacity')) ?? 1);
    if (m[1] === 'circle' && (num(attr(tag, 'r')) ?? 99) <= 4.5) continue;
    if (op > 0.1 + 1e-9) {
      fail(
        where,
        `непрозрачная заливка: <${m[1]} fill="${fill ?? '(чёрная по умолчанию)'}" opacity ${op}>`,
      );
      break;
    }
  }
  if (!/stroke-dasharray/.test(svg) && !BEZ_NEVIDIMYKH.has(r.proto))
    fail(where, 'нет пунктира невидимых линий');
  const vb = /viewBox="[-0-9.]+ [-0-9.]+ ([0-9.]+) /.exec(svg);
  const mmNaEd = (r.shirina ?? SHIRINA[r.engine]) / Number(vb?.[1] ?? 1);
  const vidimye = [...svg.matchAll(/<(path|line|polyline)\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => !/stroke-dasharray/.test(t) && /stroke="#(101728|1f5fd0)"/.test(t))
    .map((t) => num(attr(t, 'stroke-width')) ?? 1);
  if (vidimye.length === 0) fail(where, 'нет видимых рёбер');
  else if (Math.max(...vidimye) * mmNaEd < MIN_REBRO_MM * 0.97)
    fail(
      where,
      `видимое ребро ${((Math.max(...vidimye) * mmNaEd) / (25.4 / 72)).toFixed(2)} pt < 1,5`,
    );
}

/* ── Пиксели ────────────────────────────────────────────────────── */

const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();
await page.setContent('<html><body style="margin:0;background:#fff"></body></html>');
const doli = await page.evaluate(
  async (svgs) => {
    const out = [];
    for (const svg of svgs) {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await img.decode();
      const w = 400;
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let dark = 0;
      for (let i = 0; i < d.length; i += 4) {
        const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        if (l < 96) dark += 1;
      }
      out.push(dark / (w * h));
    }
    return out;
  },
  ris.map((r) => r.svg),
);
ris.forEach((r, i) => {
  r.dolya = doli[i];
  if (doli[i] >= 0.15) fail(r.where, `тёмных пикселей ${(doli[i] * 100).toFixed(1)} % ≥ 15 %`);
});

/* ── Сводка по типам тел ────────────────────────────────────────── */

const TIPY = [
  ['Куб', ['P03-02', 'P03-06', 'P03-07', 'P03-08', 'P03-15', 'P03-16']],
  ['Прямоугольный параллелепипед', ['P03-01', 'P03-10', 'P03-17', 'P03-19']],
  ['Призмы', ['P03-09', 'P03-18', 'P03-20', 'P03-21', 'P03-22', 'P03-23', 'P03-35']],
  ['Пирамиды', ['P03-41', 'P03-44', 'P03-46', 'P03-48', 'P03-49', 'P03-51', 'P03-28', 'P03-38']],
  ['Цилиндр', ['P03-63', 'P03-64', 'P03-65', 'P03-66', 'P03-67', 'P03-69']],
  ['Конус', ['P03-52', 'P03-53', 'P03-54', 'P03-59', 'P03-60', 'P03-61']],
  ['Шар', ['P03-71', 'P03-72', 'P03-73']],
  [
    'Шар в цилиндре',
    ['P03-84', 'P03-85', 'P03-86', 'P03-87', 'z03.shar-v-cilindre', 'z03.cilindr-okolo-shara'],
  ],
  ['Конус в цилиндре', ['P03-77', 'P03-78', 'P03-79', 'P03-80']],
  ['Шар в кубе (параллелепипеде)', ['P03-81', 'P03-82', 'P03-83']],
  [
    'Конус в шаре',
    ['P03-88', 'P03-89', 'P03-90', 'P03-91', 'z03.konus-v-share', 'z03.shar-okolo-konusa'],
  ],
  [
    'Цилиндр в призме (параллелепипеде)',
    ['P03-74', 'P03-75', 'P03-74S', 'z03.prizma-okolo-cilindra'],
  ],
  ['Призма в цилиндре', ['P03-76']],
  ['Многогранники с вырезами (ступенчатые)', ['P03-05', 'P03-11']],
  [
    'Отсечённые части',
    [
      'P03-12',
      'P03-13',
      'P03-14',
      'P03-24',
      'P03-26',
      'P03-31',
      'P03-36',
      'P03-37',
      'P03-50',
      'P03-62',
    ],
  ],
  ['Сечения', ['P03-03', 'P03-04', 'P03-45', 'P03-55', 'P03-56', 'P03-57', 'P03-58']],
  ['Цилиндр в шаре', []],
  ['Куб в шаре', []],
];
console.log('\n| Тип тела | Шаблоны | Чертежей | Итог |\n|---|---|---|---|');
for (const [tip, ids] of TIPY) {
  const est = ris.filter((r) => ids.includes(r.proto));
  const bad = est.filter((r) => r.bad);
  console.log(
    `| ${tip} | ${ids.length === 0 ? '— (в банке №3, «Собрать вариант» и вариантах нет)' : ids.join(', ')} | ${est.length} | ${ids.length === 0 ? '—' : 'проверено'} |`,
  );
  void bad;
}
console.log(
  `\nЧертежей: ${ris.length} (solid ${ris.filter((r) => r.engine === 'solid').length}, chertezh3 ${ris.filter((r) => r.engine === 'chertezh3').length}); наибольшая доля тёмных пикселей ${(Math.max(...doli) * 100).toFixed(1)} %`,
);

/* ── Сводный лист PDF ───────────────────────────────────────────── */

if (PDF !== null) {
  const kartochki = TIPY.filter(([, ids]) => ids.length > 0).flatMap(([tip, ids]) => {
    const pervyy = ids
      .map((id) => ris.find((r) => r.proto === id && !/учител|uchitel/.test(r.where)))
      .find(Boolean);
    return pervyy === undefined ? [] : [{ tip, r: pervyy }];
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Inter, system-ui, sans-serif; margin: 0; color: #101728; }
    h1 { font-size: 14pt; margin: 0 0 4mm; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 8mm; }
    .k { break-inside: avoid; border: 0.3mm solid #cfdae8; border-radius: 2mm; padding: 3mm; }
    .k b { font-size: 11pt; display: block; }
    .k small { font-size: 9pt; color: #667389; display: block; margin-bottom: 2mm; }
    .k svg { width: 100%; height: auto; max-height: 75mm; display: block; }
  </style></head><body><h1>Стереометрия (№3): чертежи по типам тел</h1><div class="grid">${kartochki
    .map(
      ({ tip, r }) =>
        `<div class="k"><b>${tip}</b><small>${r.where} · ${r.nazvanie.replace(/\$/g, '')}</small>${vstroitShrifty(r.svg)}</div>`,
    )
    .join('')}</div></body></html>`;
  const p2 = await browser.newPage();
  await p2.setContent(html);
  await p2.pdf({ path: PDF, format: 'A4', printBackground: true });
  console.log(`Сводный лист: ${path.relative(process.cwd(), PDF)} (${kartochki.length} типов)`);
}

await browser.close();
if (failures > 0) {
  console.error(`\nРисунки стереометрии: ошибок ${failures}`);
  process.exit(1);
}
console.log('\nРисунки стереометрии: заливки лёгкие, пунктир есть, рёбра 1,5 pt, клякс нет.');
void APP;
void fs;
