/* scripts/check-metody-5.mjs — ответы глав «Ключевые методы» задания №5.

   Каждая разобранная задача глав (content/veroyatnost5-metody-teoriya.ts)
   решается здесь заново: точными дробями из чисел условия, а где можно —
   перебором исходов (грани кости и пары граней при условии, все пары
   пирожков и тюбиков). Ответ сравнивается с ответом в тексте и с
   последней формулой решения; числа, которыми считает проверка, должны
   стоять в условии.

   Ещё проверяется:
   - 0 ≤ P ≤ 1, ответ — конечная десятичная дробь; в задачах «до первой
     удачи» ответ — натуральное число;
   - каждое числовое равенство в формулах глав («0{,}3+0{,}3-0{,}12=0{,}48»);
   - расчёты интерактивов: таблица костей при условии, лучи числовой
     прямой, число попыток до удачи.

   Падает с кодом 1 и списком расхождений. */

import { requireSrc } from './lib/load-ts.mjs';

const { GLAVY_METODOV_5 } = requireSrc('content/veroyatnost5-metody-teoriya');
const { kostiPriUslovii, BOLSHE_K_5, popytokDoUspeha, ZAPRETY_5, SUMMY_5 } = requireSrc(
  'lib/veroyatnost/metody5-interaktiv',
);

const oshibki = [];
const fail = (msg) => oshibki.push(msg);

/* ── Точные дроби ──────────────────────────────────────────────────── */

/** Дробь [числитель, знаменатель], сокращённая. */
function fr(m, n) {
  const d = nod(Math.abs(m), Math.abs(n)) || 1;
  return [m / d, n / d];
}
/** «0,35» → 35/100. */
function dec(s) {
  const [cel, dr = ''] = s.split(',');
  return fr(Number(cel + dr), 10 ** dr.length);
}
const add = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const sub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const mul = (...xs) => xs.reduce((a, b) => fr(a[0] * b[0], a[1] * b[1]), [1, 1]);
const ONE = [1, 1];

/** Доля исходов, где выполнено условие: [m, n]. */
function dolya(ishody, podhodit) {
  return [ishody.filter(podhodit).length, ishody.length];
}
const GRANI = [1, 2, 3, 4, 5, 6];
const PARY = GRANI.flatMap((a) => GRANI.map((b) => [a, b]));

/** Все неупорядоченные пары из набора. */
function paryIz(nabor) {
  const out = [];
  for (let i = 0; i < nabor.length; i += 1)
    for (let j = i + 1; j < nabor.length; j += 1) out.push([nabor[i], nabor[j]]);
  return out;
}
const nabor = (sostav) => Object.entries(sostav).flatMap(([k, v]) => Array(v).fill(k));

/** Наименьшее n с 1 − qⁿ ≥ порог — простым циклом по дробям. */
function doUspeha(q, porog) {
  let n = 1;
  let qn = q;
  while (sub(ONE, qn)[0] * porog[1] < porog[0] * sub(ONE, qn)[1]) {
    n += 1;
    qn = mul(qn, q);
  }
  return n;
}

/* Задача → { chisla: числа условия, reshenie: () => дробь | { n } }. */
const D = dec;
const RESHENIYA = {
  'primer-1a': { chisla: ['0,35', '0,4'], r: () => add(D('0,35'), D('0,4')) },
  'primer-1b': { chisla: ['0,35', '0,15'], r: () => add(D('0,35'), D('0,15')) },
  'primer-2a': { chisla: ['0,03'], r: () => sub(ONE, D('0,03')) },
  'primer-2b': { chisla: ['0,86', '38,5'], r: () => sub(ONE, D('0,86')) },
  'primer-3a': { chisla: ['0,6', '0,45'], r: () => sub(D('0,6'), D('0,45')) },
  'primer-3b': { chisla: ['0,92', '0,81'], r: () => sub(D('0,92'), D('0,81')) },
  'primer-4a': {
    chisla: ['0,3', '0,12'],
    r: () => sub(ONE, sub(add(D('0,3'), D('0,3')), D('0,12'))),
  },
  'primer-4b': { chisla: ['0,96', '0,82', '810', '790'], r: () => sub(add(D('0,96'), D('0,82')), ONE) },
  'primer-5a': {
    chisla: ['больше 2', 'больше 4'],
    r: () => dolya(GRANI.filter((g) => g > 2), (g) => g > 4),
  },
  'primer-5b': {
    chisla: ['шесть очков не выпало', 'равна 7'],
    r: () => dolya(PARY.filter(([a, b]) => a !== 6 && b !== 6), ([a, b]) => a + b === 7),
  },
  'primer-6a': { chisla: ['0,6', '0,4'], r: () => mul(D('0,6'), D('0,4')) },
  'primer-6b': {
    chisla: ['0,9', 'четырёх'],
    r: () => mul(D('0,9'), D('0,9'), D('0,9'), sub(ONE, D('0,9'))),
  },
  'primer-7a': { chisla: ['0,2', 'три'], r: () => sub(ONE, mul(D('0,2'), D('0,2'), D('0,2'))) },
  'primer-7b': {
    chisla: ['0,7'],
    r: () => {
      const q = sub(ONE, D('0,7'));
      return sub(ONE, mul(q, q, q));
    },
  },
  'primer-8a': {
    chisla: ['6', '3 с мясом', '3 с капустой'],
    r: () => dolya(paryIz(nabor({ m: 3, k: 3 })), ([x, y]) => x !== y),
  },
  'primer-8b': {
    chisla: ['3 синих', '3 красных', '4 зелёных'],
    r: () =>
      dolya(paryIz(nabor({ s: 3, k: 3, z: 4 })), ([x, y]) => [x, y].sort().join('') === 'ks'),
  },
  'primer-9a': {
    chisla: ['0,4', '0,5', '0,2'],
    r: () => add(mul(D('0,4'), D('0,5')), mul(sub(ONE, D('0,4')), D('0,2'))),
  },
  'primer-9b': {
    chisla: ['0,05', '0,9', '0,02'],
    r: () => add(mul(D('0,05'), D('0,9')), mul(sub(ONE, D('0,05')), D('0,02'))),
  },
  'primer-10a': { chisla: ['0,6', '0,9'], r: () => ({ n: doUspeha(sub(ONE, D('0,6')), D('0,9')) }) },
  'primer-10b': { chisla: ['0,4', '0,9'], r: () => ({ n: doUspeha(sub(ONE, D('0,4')), D('0,9')) }) },
};

/* ── Запись ответа ─────────────────────────────────────────────────── */

function nod(a, b) {
  return b === 0 ? a : nod(b, a % b);
}

function konechnaya(m, n) {
  let q = n / nod(m, n);
  for (const p of [2, 5]) while (q % p === 0) q /= p;
  return q === 1;
}

function zapis(m, n, okruglit) {
  const x = m / n;
  const s = okruglit ? (Math.round(x * 100) / 100).toFixed(2) : String(Number(x.toFixed(9)));
  return s.replace(/0+$/, (z) => (okruglit ? z : '')).replace('.', ',');
}

/* ── Числовые равенства в формулах ─────────────────────────────────── */

function vychislit(kusok) {
  let s = kusok
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;! ]/g, '')
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\s+/g, '');
  for (let i = 0; i < 5; i += 1) {
    s = s
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\\[dt]?frac(\d)(\d)/g, '(($1)/($2))')
      .replace(/\{([^{}]*)\}/g, '($1)');
  }
  if (!/^[0-9+\-*/().]+$/.test(s) || !/\d/.test(s)) return null;
  try {
    const v = Function(`"use strict";return (${s});`)();
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function proveritRavenstva(tex, gde) {
  for (const cep of tex.split(/\\Rightarrow|\\qquad|,\\ |\\text\{[^}]*\}/)) {
    const kuski = cep.split(/(=|\\approx)/);
    let prev = null;
    let znak = '=';
    for (const k of kuski) {
      if (k === '=' || k === '\\approx') {
        znak = k;
        continue;
      }
      const v = vychislit(k);
      if (v !== null && prev !== null) {
        const ok = znak === '=' ? Math.abs(v - prev) < 1e-9 : Math.abs(v - prev) <= 0.005 + 1e-9;
        if (!ok) fail(`${gde}: «${tex}» — ${prev} ${znak} ${v} неверно`);
      }
      prev = v;
    }
  }
}

function formulyTeksta(text) {
  return [...String(text).matchAll(/\$([^$]+)\$/g)].map((x) => x[1]);
}

function obhod(obj, gde, cb) {
  if (typeof obj === 'string') {
    cb(obj, gde);
  } else if (Array.isArray(obj)) {
    obj.forEach((x, i) => obhod(x, `${gde}[${i}]`, cb));
  } else if (obj !== null && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => obhod(v, `${gde}.${k}`, cb));
  }
}

/* ── Проверка глав ─────────────────────────────────────────────────── */

let zadach = 0;
for (const glava of GLAVY_METODOV_5) {
  obhod(glava, glava.metod, (s, gde) => {
    if (gde.endsWith('.formula')) proveritRavenstva(s, gde);
    else formulyTeksta(s).forEach((f) => proveritRavenstva(f, gde));
  });

  for (const z of glava.zadachi) {
    zadach += 1;
    const resh = RESHENIYA[z.id];
    if (resh === undefined) {
      fail(`${z.id}: нет решения — добавьте задачу в RESHENIYA`);
      continue;
    }
    for (const c of resh.chisla) {
      if (!z.uslovie.includes(c)) fail(`${z.id}: в условии нет «${c}», которым считает проверка`);
    }
    const otv = resh.r();
    let nado;
    if (Array.isArray(otv)) {
      const [m, n] = otv;
      if (!(m >= 0 && m <= n)) fail(`${z.id}: P=${m}/${n} вне [0; 1]`);
      if (!konechnaya(m, n)) fail(`${z.id}: ${m}/${n} — бесконечная дробь`);
      nado = zapis(m, n, false);
    } else {
      if (!/наименьшее/i.test(z.uslovie)) fail(`${z.id}: ответ-число, а в условии нет «наименьшее»`);
      nado = String(otv.n);
    }
    if (z.otvet !== nado) fail(`${z.id}: в тексте ответ ${z.otvet}, проверка даёт ${nado}`);
    const posledniy = [...z.shagi].reverse().find((s) => s.formula !== undefined);
    const vFormule = (posledniy?.formula ?? '').replace(/\{,\}/g, ',');
    if (!vFormule.endsWith(nado)) {
      fail(`${z.id}: последняя формула решения «${posledniy?.formula}» не заканчивается ответом ${nado}`);
    }
  }
}

/* ── Интерактивы ───────────────────────────────────────────────────── */

for (const zapret of ZAPRETY_5) {
  for (const s of SUMMY_5) {
    const ostalis = PARY.filter(([a, b]) => zapret === 0 || (a !== zapret && b !== zapret));
    const [m, n] = dolya(ostalis, ([a, b]) => a + b === s);
    const [m2, n2] = kostiPriUslovii(zapret, s);
    if (m !== m2 || n !== n2) fail(`кости: без ${zapret}, сумма ${s} — ${m2}/${n2}, перебор ${m}/${n}`);
  }
}
if (BOLSHE_K_5.length !== 11 || BOLSHE_K_5[0] !== 100 || BOLSHE_K_5[10] !== 0) {
  fail('прямая: P(X > k) задано не для k = 0…10 или концы не 1 и 0');
}
for (let k = 1; k < BOLSHE_K_5.length; k += 1) {
  if (BOLSHE_K_5[k] > BOLSHE_K_5[k - 1]) fail(`прямая: P(X > ${k}) больше P(X > ${k - 1})`);
}
for (const q of [10, 20, 30, 40, 50, 60, 70, 80, 90]) {
  for (const porog of [80, 90, 95, 99]) {
    const a = popytokDoUspeha(q, porog);
    const b = doUspeha(fr(q, 100), fr(porog, 100));
    if (a !== b) fail(`до удачи: q=${q}/100, порог ${porog}/100 — ${a}, проверка ${b}`);
  }
}

if (oshibki.length > 0) {
  console.error(`check-metody-5: расхождений ${oshibki.length}`);
  oshibki.forEach((o) => console.error(`  ✗ ${o}`));
  process.exit(1);
}
console.log(
  `check-metody-5: глав ${GLAVY_METODOV_5.length}, задач ${zadach} — ответы совпали с проверкой`,
);
