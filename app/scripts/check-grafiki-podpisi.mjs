#!/usr/bin/env node
/* scripts/check-grafiki-podpisi.mjs — шрифты и подписи графиков №9 и №12.

   Запуск: pnpm test:grafiki-podpisi [--partiy=N]

   Обходит рисунки ученика и учителя заданий №9 (движок proizvodnaya) и
   №12 (движок graph): все готовые «Варианты повышенной сложности», все
   версии, и «Собрать вариант» — N партий по 10 задач на разных seed.

   Без браузера:
     1. Шрифты: каждый font-family в рисунке — из lib/risunki/shrifty
        (KaTeX_Main для чисел, KaTeX_Math для букв); начертание обычное.
     2. Минус типографский: в подписях нет дефиса перед цифрой;
        греческие буквы — шрифтом KaTeX_Math (в KaTeX_Main их нет);
        нижние индексы — настоящие (x₁₃, не «x13»); ось x сплошная.

   В браузере (настоящие прямоугольники текста со шрифтами KaTeX):
     3. Подписи не налезают друг на друга.
     4. Подписи и знаки не лежат на кривой.
     5. Разметка учителя: подписи нулей и концов отрезка — под осью, не
        больше двух рядов, каждый ряд на одной высоте; знаки — над осью,
        в один ряд на одной высоте (знак над горбом — отдельно).
     6. Ничего не выходит за viewBox: подписи, точки, кружки концов.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { requireSrc, SRC, APP } from './lib/load-ts.mjs';
import { indeksyStrokoy, osShtrihom } from './lib/indeksy-check.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const { buildVariantSet } = requireSrc('lib/variant/build');
const { povSetIz } = requireSrc('lib/povyshennye/set');
const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const { RAZRESHENNYE } = requireSrc('lib/risunki/shrifty.js');

const PARTIY = Number(process.argv.find((a) => /^--partiy=/.test(a))?.slice(9) ?? 12);
const NOMERA = [9, 12];
/* --dump папка: рисунки с ошибками — в отдельную HTML-страницу. */
const DUMP = process.argv.includes('--dump')
  ? process.argv[process.argv.indexOf('--dump') + 1]
  : null;
const plokhie = [];

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 80) console.error(`  ✗ ${where}: ${message}`);
}

/* ── Сбор рисунков ──────────────────────────────────────────────── */

const risunki = [];
const vidennye = new Set();
function dobavit(where, fig) {
  if (fig === null || fig === undefined) return;
  if (vidennye.has(fig.svg)) return;
  vidennye.add(fig.svg);
  risunki.push({ where, svg: fig.svg });
}
function obkhod(label, set) {
  set.variants.forEach((v, vi) => {
    for (const t of v.tasks) {
      if (!NOMERA.includes(t.egeNumber)) continue;
      const where = `${label}, версия ${vi + 1}, №${t.egeNumber}`;
      dobavit(`${where} (ученик)`, t.figure);
      dobavit(`${where} (учитель)`, t.figureTeacher);
    }
  });
}

for (const k of GOTOVY) {
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  obkhod(`вариант ${k}`, povSetIz(k, VARIANT.versii));
}
for (const n of NOMERA) {
  const dir = `lib/variant/adapters/z${String(n).padStart(2, '0')}`;
  const { section } = requireSrc(`${dir}/index`);
  const dataFile = `lib/variant/data/z${String(n).padStart(2, '0')}`;
  const data = fs.existsSync(path.join(SRC, `${dataFile}.ts`))
    ? requireSrc(dataFile).dannye()
    : null;
  const adapter = section.init(data === undefined ? null : JSON.parse(JSON.stringify(data)));
  const map = new Map([[n, adapter]]);
  for (let k = 0; k < PARTIY; k += 1) {
    const config = {
      tasks: [n],
      subtypes: {},
      source: ['mix', 'fipi', 'own'][k % 3],
      stars: [],
      count: 10,
      parallel: false,
    };
    const set = buildVariantSet(
      { config, seed: `GP${k}`, zameny: {}, version: '00', code: '' },
      map,
    );
    obkhod(`«Собрать вариант» №${n}, партия ${k}`, set);
  }
}

/* ── 1–2. Шрифты и минус ────────────────────────────────────────── */

const norm = (s) =>
  s
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const RAZR = new Set(RAZRESHENNYE.map(norm));
for (const r of risunki) {
  const semeystva = [
    ...[...r.svg.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1]),
    ...[...r.svg.matchAll(/font-family:\s*([^;"]+)/g)].map((m) => m[1]),
  ].map(norm);
  const chuzhie = [...new Set(semeystva.filter((f) => !RAZR.has(f)))];
  if (chuzhie.length > 0) fail(r.where, `чужой шрифт: ${chuzhie.join(' | ')}`);
  if (semeystva.length === 0 && /<text\b/.test(r.svg)) fail(r.where, 'у подписей не задан шрифт');
  const zhirnye = r.svg.match(/font-weight="(bold|[6-9]00)"|font-weight:\s*(bold|[6-9]00)/g);
  if (zhirnye !== null) fail(r.where, `жирные подписи (${zhirnye[0]})`);
  /* Строчные греческие (α, β…) есть только в KaTeX_Math: набранные
     KaTeX_Main, они уходят в запасной шрифт. */
  for (const m of r.svg.matchAll(/<(text|tspan)\b([^>]*)>([^<]*[α-ω][^<]*)</g)) {
    if (!/KaTeX_Math/.test(m[2])) {
      fail(r.where, `«${m[3]}» не шрифтом KaTeX_Math — греческой буквы нет в KaTeX_Main`);
      break;
    }
  }
  const strokoy = indeksyStrokoy(r.svg);
  if (strokoy.length > 0) fail(r.where, `индекс строкой, без нижнего: «${strokoy[0]}»`);
  if (osShtrihom(r.svg)) fail(r.where, 'ось x штрихом');
  for (const m of r.svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    const text = m[1].replace(/<[^>]+>/g, '');
    if (/(^|[^\p{L}\d])-\s?\d/u.test(text)) {
      fail(r.where, `дефис вместо минуса: «${text}»`);
      break;
    }
  }
}

/* ── 3–6. В браузере ────────────────────────────────────────────── */

const katexCss = path.join(APP, 'node_modules', 'katex', 'dist', 'katex.min.css');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
await page.setContent(
  `<!doctype html><html><head><link rel="stylesheet" href="file://${katexCss}"></head><body><div id="k" style="width:640px"></div></body></html>`,
);
/* Шрифты KaTeX грузятся по первому символу: даём им прийти до замеров. */
await page.evaluate(async () => {
  document.getElementById('k').innerHTML =
    '<span style="font-family:KaTeX_Main">0</span><span style="font-family:KaTeX_Math;font-style:italic">x</span>';
  await document.fonts.ready;
});

const PORCIYA = 40;
let izmereno = 0;
const itogi = { nalozheniy: 0, naKrivoy: 0, ryady: 0, zaRamkoy: 0 };
for (let i = 0; i < risunki.length; i += PORCIYA) {
  const chast = risunki.slice(i, i + PORCIYA);
  const otvety = await page.evaluate(
    (svgs) => {
      const host = document.getElementById('k');
      return svgs.map((svgText) => {
        host.innerHTML = svgText;
        const svg = host.querySelector('svg');
        const out = [];
        const vb = svg.viewBox.baseVal;
        const engine = svg.getAttribute('data-engine');
        /* Подписи: <text> верхнего уровня (tspan — части подписи). */
        const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim() !== '');
        const box = (t) => {
          const b = t.getBBox();
          /* getBBox текста — по метрикам шрифта (с выносными); буква
           занимает середину: срезаем по 18 % сверху и снизу. */
          return {
            x: b.x + 0.5,
            y: b.y + b.height * 0.18,
            w: Math.max(0, b.width - 1),
            h: b.height * 0.64,
            t: t.textContent.trim(),
            k: t.getAttribute('class') ?? '',
            y0: Number(t.getAttribute('y')),
          };
        };
        /* Знаки разметки учителя №9 нарисованы линиями (<g class="pr-znak">,
           у отмеченных точек — pr-znak-tochka):
           это тоже подписи — рамка группы, текст — сам знак. */
        const znakBox = (g) => {
          const b = g.getBBox();
          /* getBBox — по средней линии штриха: добавляем половину самой
             толстой линии (белая подложка) — это и есть видимый знак. */
          const r =
            Math.max(
              0,
              ...[...g.querySelectorAll('path')].map((p) => Number(p.getAttribute('stroke-width'))),
            ) / 2;
          return {
            x: b.x - r,
            y: b.y - r,
            w: b.width + 2 * r,
            h: b.height + 2 * r,
            t: g.getAttribute('data-znak') ?? '',
            k: g.getAttribute('class') ?? '',
            y0: Number(g.getAttribute('data-y')),
          };
        };
        const B = [
          ...texts.map(box),
          ...[...svg.querySelectorAll('g.pr-znak, g.pr-znak-tochka')].map(znakBox),
        ];
        /* 6. Рамка. */
        for (const b of B) {
          if (
            b.x < vb.x - 0.5 ||
            b.y < vb.y - 0.5 ||
            b.x + b.w > vb.x + vb.width + 0.5 ||
            b.y + b.h > vb.y + vb.height + 0.5
          )
            out.push(['zaRamkoy', `подпись «${b.t}» за рамкой`]);
        }
        for (const c of svg.querySelectorAll('circle')) {
          const bb = c.getBBox();
          if (
            bb.x < vb.x - 0.5 ||
            bb.y < vb.y - 0.5 ||
            bb.x + bb.width > vb.x + vb.width + 0.5 ||
            bb.y + bb.height > vb.y + vb.height + 0.5
          )
            out.push(['zaRamkoy', 'точка за рамкой']);
        }
        /* 3. Подпись на подписи. */
        for (let a = 0; a < B.length; a += 1) {
          for (let c = a + 1; c < B.length; c += 1) {
            const p = B[a];
            const q = B[c];
            if (p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y)
              out.push(['nalozheniy', `подписи «${p.t}» и «${q.t}» налезают`]);
          }
        }
        /* 4. Подпись на кривой. */
        const krivye = [...svg.querySelectorAll('path.pr-curve, path.graph-curve')];
        for (const k of krivye) {
          const L = k.getTotalLength();
          const pts = [];
          for (let s = 0; s <= L; s += 1.5) pts.push(k.getPointAtLength(s));
          for (const b of B) {
            if (pts.some((p) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h))
              out.push(['naKrivoy', `подпись «${b.t}» на кривой`]);
          }
        }
        /* 5. Ряды разметки учителя (движок proizvodnaya). */
        if (engine === 'proizvodnaya') {
          const os = /M[-\d.]+ ([-\d.]+)H/.exec(
            svg.querySelector('path.pr-axes')?.getAttribute('d') ?? '',
          );
          if (os !== null) {
            const ay = Number(os[1]);
            const nuli = B.filter((b) => /\bpr-nul-label\b/.test(b.k));
            const znaki = B.filter(
              (b) => /(^|\s)pr-znak(\s|$)/.test(b.k) && !/pr-znak-nad/.test(b.k),
            );
            const vysoty = (xs) => [...new Set(xs.map((b) => b.y0.toFixed(1)))];
            if (nuli.some((b) => b.y < ay)) out.push(['ryady', 'подпись нуля над осью']);
            if (vysoty(nuli).length > 2)
              out.push(['ryady', `подписи нулей в ${vysoty(nuli).length} рядах`]);
            if (znaki.some((b) => b.y + b.h > ay)) out.push(['ryady', 'знак под осью']);
            if (vysoty(znaki).length > 1)
              out.push(['ryady', `знаки на ${vysoty(znaki).length} высотах`]);
          }
        }
        return out;
      });
    },
    chast.map((r) => r.svg),
  );
  otvety.forEach((spisok, j) => {
    izmereno += 1;
    const seen = new Set();
    for (const [vid, msg] of spisok) {
      if (seen.has(msg)) continue;
      seen.add(msg);
      itogi[vid] += 1;
      fail(chast[j].where, msg);
      if (seen.size === 1) plokhie.push({ ...chast[j], msg });
    }
  });
}
await browser.close();
if (DUMP !== null) {
  fs.mkdirSync(DUMP, { recursive: true });
  fs.writeFileSync(
    path.join(DUMP, 'plokhie.html'),
    `<html><head><link rel="stylesheet" href="file://${katexCss}"></head><body>${plokhie
      .map(
        (r) =>
          `<div style="display:inline-block;width:620px;margin:6px;border:1px solid #ccc"><b>${r.where}: ${r.msg}</b>${r.svg}</div>`,
      )
      .join('')}</body></html>`,
  );
}

console.log(
  `  рисунков №9 и №12: ${risunki.length} (измерено в браузере ${izmereno}); ` +
    `наложений ${itogi.nalozheniy}, на кривой ${itogi.naKrivoy}, ряды ${itogi.ryady}, за рамкой ${itogi.zaRamkoy}`,
);
if (failures > 0) {
  console.error(`\nШрифты и подписи графиков: ошибок ${failures}`);
  process.exit(1);
}
console.log('\nШрифты и подписи графиков: шрифты KaTeX, минусы, ряды и рамка — в порядке');
