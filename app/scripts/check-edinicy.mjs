#!/usr/bin/env node
/* scripts/check-edinicy.mjs — общая теория «Единицы измерения» и
   «Степени десяти» (№10 и №11) и шаги перевода единиц в решениях.

   Запуск: pnpm test:edinicy

   1. Теория (content/teoriya-edinicy.ts): каждая формула собирается
      KaTeX в строгом режиме; каждая цепочка «a = b = c» пересчитана с
      учётом единиц (scripts/lib/schet-edinic.mjs) — у каждого примера
      и каждого шага разбора есть хотя бы одна сверенная пара; вне $…$
      нет формул обычным текстом.
   2. Пример из банка №10 (звезда, F103): шаги собираются, температура
      совпадает с решателем банка, степени в шагах пересчитаны.
   3. Решения: банк и аналоги №10, опорные №10, банк, разминка и
      генератор №11 (по 30 задач на подтип), опорные блоки №11 — все
      формулы с единицами (\text{ мин}, \text{ км/ч}…) пересчитаны.
      В решениях нет готовых множителей «·3,6» / «:3,6».
   4. Слоты иллюстраций stepeni-*: у заполненного есть PNG, в папке нет
      чужих файлов. Пустой слот — не ошибка (картинки пришлёт автор).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';
import { formulyStroki, proveritFormulu } from './lib/schet-edinic.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const problems = [];
const add = (where, what) => problems.push(`${where}: ${what}`);

function nabrat(where, tex, display = false) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'error', displayMode: display });
  } catch (e) {
    add(where, `KaTeX: ${e.message.split('\n')[0]} в «${tex}»`);
  }
}

/** Строки выкладки: «=…» продолжает предыдущую строку. */
function skleit(tex) {
  const out = [];
  for (const t of tex) {
    if (t.startsWith('=') && out.length > 0) out[out.length - 1] += t;
    else out.push(t);
  }
  return out;
}

/** Пересчёт формулы; возвращает число сверенных пар. */
function schet(where, tex) {
  const r = proveritFormulu(tex);
  r.oshibki.forEach((o) => add(where, `неверно: ${o}`));
  return r.proverok;
}

/** Текст с $…$: KaTeX, пересчёт и формулы вне $…$. */
function tekst(where, s) {
  for (const f of formulyStroki(s)) nabrat(where, f);
  const plain = stripDollarMath(s).replace(/\*\*/g, '');
  for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
    add(where, `вне KaTeX (${f.rule}): «${f.match}»`);
  }
  return formulyStroki(s).reduce((n, f) => n + schet(where, f), 0);
}

function stroki(where, list) {
  let n = 0;
  for (const s of list) {
    if (typeof s === 'string') n += tekst(where, s);
    else {
      nabrat(where, s.f, true);
      n += schet(where, s.f);
    }
  }
  return n;
}

/* Буквы вне \text — символьная формула (a^m · a^n), числа в ней не считаются. */
const simvolnaya = (tex) => /(?<!\\)\b[a-zA-Z]\b/.test(tex.replace(/\\text\{[^}]*\}/g, ''));

/* ── 1. Теория ─────────────────────────────────────────────────── */

const { CHASTI_EDINIC } = requireSrc('content/teoriya-edinicy');
let teoriyaPar = 0;
let primerov = 0;
for (const c of CHASTI_EDINIC) {
  tekst(`${c.id} заголовок`, c.title);
  c.bloki.forEach((b, i) => {
    const w = `${c.id}[${i}] ${b.vid}`;
    switch (b.vid) {
      case 'tekst':
        teoriyaPar += stroki(w, b.paras);
        break;
      case 'ramka':
        if (b.title) tekst(w, b.title);
        teoriyaPar += stroki(w, b.stroki);
        break;
      case 'strelki':
        b.strelki.forEach((s) =>
          [s.otkuda, s.kuda, s.deystvie, s.pochemu].forEach((t) => tekst(w, t)),
        );
        break;
      case 'fakty':
        for (const g of b.gruppy) {
          for (const f of g.fakty) {
            nabrat(w, f);
            const n = schet(w, f);
            if (n === 0) add(w, `опорный факт не пересчитан: «${f}»`);
            teoriyaPar += n;
          }
        }
        break;
      case 'primery':
        for (const p of b.primery) {
          primerov += 1;
          p.tex.forEach((t) => nabrat(w, t, true));
          let n = skleit(p.tex).reduce((k, t) => k + schet(w, t), 0);
          n += tekst(w, p.podpis);
          if (n === 0 && !p.tex.some(simvolnaya))
            add(w, `пример не пересчитан: «${p.tex.join('')}»`);
          teoriyaPar += n;
        }
        break;
      case 'razbor':
        tekst(w, b.title);
        if (b.vyvod) tekst(w, b.vyvod);
        for (const s of b.shagi) {
          primerov += 1;
          tekst(w, s.podpis);
          s.tex.forEach((t) => nabrat(w, t, true));
          const n = skleit(s.tex).reduce((k, t) => k + schet(w, t), 0);
          if (n === 0) add(w, `шаг «${s.podpis}» не пересчитан`);
          teoriyaPar += n;
        }
        break;
      case 'dveKolonki':
        tekst(w, b.title);
        if (b.vvod) tekst(w, b.vvod);
        teoriyaPar += tekst(w, b.vyvod);
        for (const k of b.kolonki) teoriyaPar += stroki(w, k.stroki);
        break;
      case 'pristavki':
        tekst(w, b.title);
        tekst(w, b.vvod);
        for (const r of b.rows) {
          nabrat(w, r.mnozhitel);
          nabrat(w, r.primer);
          if (schet(w, r.primer) === 0) add(w, `приставка не пересчитана: «${r.primer}»`);
          /* Множитель в таблице и в примере — одно число. */
          const m = r.primer.match(/=\s*(10\^\{?[-0-9]+\}?)/);
          if (!m || m[1].replace(/[{}]/g, '') !== r.mnozhitel.replace(/[{}]/g, '')) {
            add(w, `${r.pristavka}: множитель ${r.mnozhitel} не совпадает с примером ${r.primer}`);
          }
          teoriyaPar += 1;
        }
        if (b.posle) teoriyaPar += stroki(w, b.posle);
        break;
      case 'gde':
        b.punkty.forEach((p) => {
          teoriyaPar += tekst(w, p.tekst);
          if (p.href && !p.href.endsWith('/') && !/\/#[\w-]+$/.test(p.href)) {
            add(w, `ссылка без «/» на конце: ${p.href}`);
          }
        });
        break;
      case 'izBanka':
        break;
      default:
        add(w, 'неизвестный блок');
    }
  });
}

/* Единицы в обычном тексте теории — только внутри формул: «км/ч» вне
   $…$ рвётся на телефоне. Заголовки частей — тоже. */
const SOSTAVNAYA = /(?<![\p{L}])(?:км|м|см|мин|ч|с)\/(?:ч|с|мин)(?![\p{L}])/u;
const vseStroki = JSON.stringify(CHASTI_EDINIC);
for (const s of vseStroki.match(/"(?:[^"\\]|\\.)*"/g) ?? []) {
  const t = JSON.parse(s);
  const tolkoTex = !t.includes('$') && /\\/.test(t);
  if (!tolkoTex && SOSTAVNAYA.test(stripDollarMath(t))) {
    add('теория', `составная единица вне формулы: «${t.slice(0, 80)}»`);
  }
}
/* Готового множителя «3,6» как правила в теории нет — только в «Важно». */

/* ── 2. Пример из банка №10 ────────────────────────────────────── */

const { BANK: BANK10 } = requireSrc('lib/zadanie10/bank/index');
const { prototype: proto10 } = requireSrc('lib/zadanie10/prototypes');
const { primerStefana } = requireSrc('lib/zadanie10/teoriya-stepeni');
let zvezd = 0;
for (const z of BANK10.filter((b) => b.prototypeId === 'P20' || b.prototypeId === 'P30')) {
  const pr = primerStefana(z.params);
  const otvet = proto10(z.prototypeId).solve(z.params).answer;
  if (Math.abs(pr.T - otvet) > 1e-9) add(z.id, `звезда: в теории T=${pr.T}, решатель ${otvet}`);
  for (const s of pr.shagi) {
    tekst(`${z.id} «${s.podpis}»`, s.podpis);
    s.tex.forEach((t) => nabrat(z.id, t, true));
    skleit(s.tex).forEach((t) => schet(`${z.id} «${s.podpis}»`, t));
  }
  zvezd += 1;
}

/* ── 3. Решения ────────────────────────────────────────────────── */

const S_EDINICEY = /\\text\{\s*(?:км|м|см|мм|мин|ч|с|сут|г|кг|т|кВ|В|МГц|Гц|мкФ|Ф)/;
let formulReshenij = 0;
let sverenoReshenij = 0;
function reshenie(where, lines) {
  for (const l of lines) {
    if (
      /км\/ч|м\/с/.test(l) &&
      /\\cdot\s*3\{,\}6(?!\d)|:\s*3\{,\}6(?!\d)|\\dfrac\{[^}]*\}\{3\{,\}6\}/.test(l)
    ) {
      add(where, `готовый множитель 3,6 вместо перевода дробью: «${l.slice(0, 90)}»`);
    }
    for (const f of formulyStroki(l)) {
      if (!S_EDINICEY.test(f)) continue;
      formulReshenij += 1;
      sverenoReshenij += schet(where, f);
    }
  }
}

for (const z of BANK10) {
  const s = proto10(z.prototypeId).solve(z.params);
  reshenie(z.id, [
    ...s.etapy.flatMap((e) => e.lines),
    ...s.vychisleniya.flatMap((v) => [v.tekst, `$${v.tex}$`]),
    ...s.hints.flatMap((h) => [h.question, h.comment ?? '', ...h.options]),
  ]);
}
const { BLOKI_OPORNYH } = requireSrc('lib/zadanie10/opornye');
for (const b of BLOKI_OPORNYH) {
  for (const z of b.zadachi) reshenie(`№10 опорные ${z.id}`, [z.podskazka, ...z.razbor]);
  reshenie(`№10 опорные ${b.id}`, [b.zapomni]);
}

const { BANK: BANK11, RAZMINKA } = requireSrc('lib/zadanie11/bank');
const { subtype, SUBTYPES } = requireSrc('lib/zadanie11/prototypes');
const { generate } = requireSrc('lib/zadanie11/gen');
const linii11 = (s) => [
  ...s.etapy.flatMap((e) => e.lines),
  ...(s.hints ?? []).flatMap((h) => [h.question, h.comment ?? '', ...h.options]),
];
for (const z of [...BANK11, ...RAZMINKA]) {
  reshenie(`№11 ${z.id}`, linii11(subtype(z.id).solve(z.params)));
}
let generirovano = 0;
for (const st of SUBTYPES) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const g = generate(st.id, `edinicy-${i}`);
      reshenie(`№11 ${st.id} seed ${i}`, linii11(g.solved));
      generirovano += 1;
    } catch {
      /* Подтип без генератора — его проверяет test:zadanie11. */
    }
  }
}
const { BLOKI } = requireSrc('lib/zadanie11/prep/bloki');
const { rngOf } = requireSrc('lib/vychisleniya/rng');
for (const b of BLOKI) {
  reshenie(`№11 блок ${b.slug}`, b.zapomni);
  for (const m of b.zadachi) {
    for (let i = 0; i < 20; i += 1) {
      const z = m.generate(rngOf(`edinicy|${m.id}|${i}`));
      if (z) reshenie(`№11 ${m.id}`, z.razbor);
    }
  }
}
if (sverenoReshenij === 0) add('решения', 'ни одной формулы с единицами не сверено');

/* ── 4. Слоты иллюстраций ──────────────────────────────────────── */

const { SLOTY_STEPENI } = requireSrc('content/teoriya-edinicy');
const { faylyStepeni, PAPKA_STEPENI } = requireSrc('lib/teoriya/illyustracii-stepeni');
const dir = path.join(APP, 'public', PAPKA_STEPENI);
const nuzhnye = new Set();
const pustye = [];
for (const slot of Object.keys(SLOTY_STEPENI)) {
  const f = faylyStepeni(slot);
  nuzhnye.add(f.png);
  f.webp.forEach((w) => nuzhnye.add(w));
  const png = fs.existsSync(path.join(dir, f.png));
  const webp = f.webp.filter((w) => fs.existsSync(path.join(dir, w)));
  if (!png) {
    pustye.push(`stepeni-${slot} (${SLOTY_STEPENI[slot]})`);
    if (webp.length > 0) add(`stepeni-${slot}`, 'есть WebP, но нет PNG — слот не выведется');
  } else {
    const buf = fs.readFileSync(path.join(dir, f.png));
    if (buf.toString('ascii', 1, 4) !== 'PNG') add(f.png, 'не PNG');
  }
}
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  if (f.startsWith('stepeni-') && !nuzhnye.has(f)) add(f, 'файл не относится ни к одному слоту');
}

console.log(
  `Теория: частей ${CHASTI_EDINIC.length}, примеров и шагов ${primerov}, пересчитано пар ${teoriyaPar}.`,
);
console.log(`Звезда (Стефан — Больцман): задач ${zvezd}, ответ совпадает с решателем.`);
console.log(
  `Решения: формул с единицами ${formulReshenij}, пересчитано пар ${sverenoReshenij}; задач генератора №11: ${generirovano}.`,
);
console.log(`Слоты stepeni-*: ${Object.keys(SLOTY_STEPENI).length}, пустых ${pustye.length}.`);
pustye.forEach((s) => console.log(`  пусто: ${s}`));

if (problems.length > 0) {
  console.error(`\nПроблем: ${problems.length}`);
  problems.slice(0, 80).forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('Единицы и степени: все проверки пройдены.');
