#!/usr/bin/env node
/* scripts/check-ustnyy-schet.mjs — движок устного счёта (src/lib/ustnyySchet).

   Запуск: pnpm test:ustnyy-schet (сборка не нужна).

   Для каждого генератора, уровня и набора выключателей — 1000 примеров:
     1. ответ верный: выражение пересчитывается здесь же, своим
        вычислителем на дробях BigInt (не тем, что в движке);
     2. пример подходит под свой приём и уровень (свои правила здесь,
        не из движка);
     3. повторов нет, пока набор не начался заново (круг);
     4. шаги разбора: все звенья каждой цепочки равны, последнее звено
        разбора — ответ; формулы набираются KaTeX без ошибок;
     5. выключатели: без десятичных — нет десятичных, без отрицательных —
        нет отрицательных.
   Отдельно: ввод ответа нормализуется (запятая/точка, «−», лишние
   нули), формулы очков рейтинга, примеры из теории
   (content/ustnyySchet.ts) считаются и совпадают с подписанным ответом,
   форматы рейтинга держат свои диапазоны (formatyCases.json).
   Квадратные уравнения (Виет): по каждому приёму, уровню и режиму
   (оба корня, «Как в ЕГЭ» — меньший, больший) — 500 уравнений: корни
   точно удовлетворяют уравнению, конечные дроби, коэффициенты целые,
   запись стандартная, правило знаков в разборе — как на деле; ответ
   двумя полями принимается в любом порядке.

   Ненулевой код возврата — расхождение, оно печатается. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SRC, requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');

const { VSE, PRIYOMY } = requireSrc('lib/ustnyySchet/registry.ts');
const { sozdatGenerator } = requireSrc('lib/ustnyySchet/nabor.ts');
const { tex: texOf } = requireSrc('lib/ustnyySchet/chislo.ts');
const sessiya = requireSrc('lib/ustnyySchet/sessiya.ts');
const ochki = requireSrc('lib/ustnyySchet/ochki.ts');
const { FORMATY, KVADRATY_PUL, primerIzServera } = requireSrc('lib/ustnyySchet/formaty.ts');
const model = requireSrc('lib/ustnyySchet/statistika/model.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok && failures.length < 200) failures.push(what);
}

/* ── Независимый вычислитель: дроби num/den на BigInt ─────────── */

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function R(n, d = 1n) {
  if (d === 0n) throw new Error('деление на ноль');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
}
const radd = (a, b) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const rsub = (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const rmul = (a, b) => R(a[0] * b[0], a[1] * b[1]);
const rdiv = (a, b) => R(a[0] * b[1], a[1] * b[0]);
function rpow(a, n) {
  let r = [1n, 1n];
  for (let i = 0; i < n; i += 1) r = rmul(r, a);
  return r;
}
function isqrt(n) {
  if (n < 0n) throw new Error('корень из отрицательного');
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x -= 1n;
  while ((x + 1n) * (x + 1n) <= n) x += 1n;
  return x;
}
function rsqrt(a) {
  const n = isqrt(a[0]);
  const d = isqrt(a[1]);
  if (n * n !== a[0] || d * d !== a[1]) throw new Error('корень не извлекается');
  return [n, d];
}
function parseNum(s) {
  const [w, f = ''] = s.split('.');
  return R(BigInt(w + f), 10n ** BigInt(f.length));
}

/** Вычислить выражение (рекурсивный спуск, своя реализация). */
function evalExpr(src) {
  const t = src.replace(/\s+/g, '');
  let i = 0;
  const peek = () => t[i];
  function num() {
    const m = /^\d+(\.\d+)?/.exec(t.slice(i));
    if (!m) throw new Error(`число ожидалось в «${src}» @${i}`);
    i += m[0].length;
    return parseNum(m[0]);
  }
  function prim() {
    if (t.startsWith('sqrt(', i)) {
      i += 5;
      const v = sum();
      if (t[i++] !== ')') throw new Error(')');
      return rsqrt(v);
    }
    if (peek() === '(') {
      i += 1;
      const v = sum();
      if (t[i++] !== ')') throw new Error(`) в «${src}»`);
      return v;
    }
    return num();
  }
  function pw() {
    const b = prim();
    if (peek() === '^') {
      i += 1;
      const e = un();
      if (e[1] !== 1n) throw new Error('дробная степень');
      return rpow(b, Number(e[0]));
    }
    return b;
  }
  function un() {
    if (peek() === '-') {
      i += 1;
      const v = un();
      return [-v[0], v[1]];
    }
    return pw();
  }
  function prod() {
    let v = un();
    while (peek() === '*' || peek() === '/') {
      const op = t[i++];
      const w = un();
      v = op === '*' ? rmul(v, w) : rdiv(v, w);
    }
    return v;
  }
  function sum() {
    let v = prod();
    while (peek() === '+' || peek() === '-') {
      const op = t[i++];
      const w = prod();
      v = op === '+' ? radd(v, w) : rsub(v, w);
    }
    return v;
  }
  const v = sum();
  if (i !== t.length) throw new Error(`лишнее в «${src}»`);
  return v;
}

/** Дробь → нормальная запись, если конечная; иначе null. */
function rstr([n, d]) {
  let k = 0;
  let dd = d;
  while (dd % 2n === 0n) {
    dd /= 2n;
    k += 1;
  }
  let j = 0;
  while (dd % 5n === 0n) {
    dd /= 5n;
    j += 1;
  }
  if (dd !== 1n) return null;
  const e = Math.max(k, j);
  const m = (n * 10n ** BigInt(e)) / d;
  const neg = m < 0n;
  let s = (neg ? -m : m).toString().padStart(e + 1, '0');
  let w = s.slice(0, s.length - e);
  let f = s.slice(s.length - e).replace(/0+$/, '');
  const body = f ? `${w}.${f}` : w;
  return neg && body !== '0' ? `-${body}` : body;
}

const zv = (z) => (typeof z === 'string' ? z : z.e);
const zvTex = (z) => (typeof z === 'string' ? texOf(z) : z.tex);

const katexKesh = new Map();
function katexOk(tex) {
  if (katexKesh.has(tex)) return katexKesh.get(tex);
  let r = true;
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    r = String(e.message ?? e);
  }
  katexKesh.set(tex, r);
  return r;
}
function tekstOk(s) {
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    const r = katexOk(m[1]);
    if (r !== true) return r;
  }
  return (s.match(/\$/g) ?? []).length % 2 === 0 ? true : 'непарный $';
}

/* ── Правила «пример подходит под приём» (независимо от движка) ─ */

const N = (s) => Number(s);
const isDec = (s) => s.includes('.');
const between = (x, a, b) => x >= a && x <= b;
const digitsSum = (n) =>
  String(n)
    .split('')
    .reduce((s, c) => s + Number(c), 0);
const pair = (p) => [N(p.d[0]), N(p.d[1])];

/** Корни ax² + bx + c = 0 своим счётом: дроби [num, den], по возрастанию. */
function vietaKorni(p) {
  const [a, b, c] = p.d.map((x) => BigInt(x));
  const D = b * b - 4n * a * c;
  if (D < 0n) return null;
  const s = isqrt(D);
  if (s * s !== D) return null;
  const r1 = R(-b - s, 2n * a);
  const r2 = R(-b + s, 2n * a);
  return r1[0] * r2[1] <= r2[0] * r1[1] ? [r1, r2] : [r2, r1];
}
const vietaCelye = (p) => {
  const k = vietaKorni(p);
  return k === null ? null : k.every((r) => r[1] === 1n) ? k.map((r) => Number(r[0])) : null;
};
const VIETA_IDS = [
  'vieta-privedennoe',
  'vieta-delim-na-a',
  'vieta-summa-koefficientov',
  'vieta-perebroska',
];

const PODHODIT = {
  'vieta-privedennoe': (p, u) => {
    const k = vietaCelye(p);
    if (p.d[0] !== '1' || k === null) return false;
    const [x, y] = k;
    const m = Math.max(Math.abs(x), Math.abs(y));
    if (u === 1) return x !== y && x >= 1 && y <= 10;
    if (u === 2) return x * y < 0 && m <= 15;
    return m <= 25 && x !== 0 && y !== 0;
  },
  'vieta-delim-na-a': (p, u) => {
    const [a, b, c] = p.d.map(N);
    const k = vietaCelye(p);
    if (k === null || ![2, 3, 4, 5, -1, -2].includes(a) || b % a !== 0 || c % a !== 0) return false;
    if (u === 1) return a > 0 && k[0] >= 1 && k[1] <= 9;
    return k.every((x) => x !== 0 && Math.abs(x) <= 15);
  },
  'vieta-summa-koefficientov': (p, u) => {
    const [a, b, c] = p.d.map(N);
    const plus = a + b + c === 0;
    const minus = a - b + c === 0;
    if (!between(a, 2, 9) || (!plus && !minus) || vietaKorni(p) === null) return false;
    return u === 3 || plus;
  },
  'vieta-perebroska': (p, u) => {
    const a = N(p.d[0]);
    const k = vietaKorni(p);
    if (![2, 4, 5].includes(a) || k === null) return false;
    /* y = ax — целые: уравнение y² + by + ac = 0 решается подбором. */
    if (!k.every((r) => (r[0] * BigInt(a)) % r[1] === 0n)) return false;
    return u !== 1 || a === 2;
  },
  'kvadraty-11-30': (p, u) => {
    const n = N(p.d[0]);
    return u === 1 ? between(n, 11, 20) : u === 2 ? between(n, 21, 30) : between(n, 11, 30);
  },
  'kvadrat-na-5': (p, u) => {
    const a = N(p.d[0]);
    if (p.v === 'dec') return u === 3 && between(a, 0, 9) && p.expr === `${a}.5^2`;
    const n = 10 * a + 5;
    return (
      p.expr === `${n}^2` &&
      (u === 1 ? between(n, 15, 95) : u === 2 ? between(n, 105, 195) : between(n, 205, 995))
    );
  },
  'kvadrat-okolo-kruglyh': (p, u) => {
    const [Rr, b] = pair(p);
    const round = Rr % 10 === 0;
    const lim = u === 1 ? 1 : u === 2 ? 3 : 5;
    return (
      round &&
      b !== 0 &&
      Math.abs(b) <= lim &&
      (u !== 2 || Rr === 50 || Rr === 100) &&
      (u < 3 || Rr >= 100)
    );
  },
  'kvadrat-okolo-50': (p, u) => {
    const b = N(p.d[0]);
    const base = p.v === '500' ? 500 : 50;
    return b !== 0 && Math.abs(b) <= (u === 1 ? 4 : 9) && (u === 3) === (base === 500);
  },
  'kvadrat-cherez-raznost': (p, u) => {
    const a = N(p.d[0]);
    return (
      a % 10 !== 0 &&
      (u === 1 ? between(a, 21, 39) : u === 2 ? between(a, 41, 79) : between(a, 81, 99))
    );
  },
  'raznost-kvadratov': (p, u) => {
    const [x, y] = pair(p);
    const m = (x + y) / 2;
    const b = Math.abs(x - y) / 2;
    if (!Number.isInteger(m) || b === 0) return false;
    return u === 3 ? m % 50 === 0 && b <= 9 : m % 10 === 0 && (u === 1 ? b <= 2 : b <= 5);
  },
  'desyatki-edinicy-10': (p, u) => {
    const [x, y] = pair(p);
    const t = Math.floor(x / 10);
    return (
      t === Math.floor(y / 10) &&
      (x % 10) + (y % 10) === 10 &&
      (u === 1 ? between(t, 1, 4) : u === 2 ? between(t, 5, 9) : between(t, 10, 19))
    );
  },
  'okolo-100': (p, u) => {
    const [x, y] = pair(p);
    const lim = u === 3 ? 15 : 9;
    if (x === 100 || y === 100) return false;
    if (u === 1) return between(x, 91, 99) && between(y, 91, 99);
    if (u === 2) return Math.abs(100 - x) <= 9 && Math.abs(100 - y) <= 9 && (x > 100 || y > 100);
    return (
      Math.abs(100 - x) <= lim &&
      Math.abs(100 - y) <= lim &&
      (x > 100 || y > 100) &&
      Math.min(x, y) >= 85
    );
  },
  'na-11': (p, u) => {
    const [x, y] = pair(p);
    const n = x === 11 ? y : x;
    if (x !== 11 && y !== 11) return false;
    if (u === 3) return between(n, 101, 999);
    if (!between(n, 12, 99)) return false;
    const s = digitsSum(n);
    return u === 1 ? s <= 9 : s >= 10;
  },
  'na-5-25-50-125': (p, u) => {
    const ms = { 1: ['5', '50'], 2: ['25'], 3: ['125', '0.5', '0.25'] }[u];
    return p.d.some((x) => ms.includes(x));
  },
  'okruglenie-umnozhenie': (p, u) => {
    const x = N(p.v);
    if (!p.d.includes(p.v)) return false;
    if (u === 1) return between(x, 18, 99) && [8, 9].includes(x % 10);
    if (u === 2) return x === 9 || x === 99;
    return [199, 299, 399, 198, 98, 999].includes(x);
  },
  razlozhenie: (p, u) => {
    const [x, k] = pair(p);
    if (u === 1) return between(x, 12, 99) && between(k, 3, 9);
    if (u === 2) return between(x, 12, 99) && between(k, 12, 19);
    return between(x, 101, 999) && between(k, 3, 9);
  },
  'gruppirovka-mnozhiteley': (p, u) => {
    const [a, b] = p.v.split(',').map(Number);
    const prod = a * b;
    return (
      /^[1-9]0+$/.test(String(prod)) &&
      p.d.includes(String(a)) &&
      p.d.includes(String(b)) &&
      p.d.length === (u === 3 ? 4 : 3)
    );
  },
  'desyatichnye-umnozhenie': (p) => p.d.some(isDec),
  'delenie-na-5': (p, u) => {
    const n = N(p.d[0]);
    if (p.expr !== `${p.d[0]}/5`) return false;
    const naCelo = Number.isInteger(n) && n % 5 === 0;
    if (u === 1) return naCelo && between(n, 15, 200);
    if (u === 2)
      return (naCelo && between(n, 205, 995)) || (Number.isInteger(n) && between(n, 11, 99));
    return (
      (naCelo && between(n, 1000, 9995)) ||
      isDec(p.d[0]) ||
      (Number.isInteger(n) && between(n, 101, 999) && !naCelo)
    );
  },
  'delenie-na-5-25': (p, u) => {
    const m = p.d[1];
    const ms = { 1: ['5', '25'], 2: ['0.5', '0.25', '25', '50'], 3: ['0.2', '0.125', '125'] }[u];
    return ms.includes(m);
  },
  'delenie-po-chastyam': (p, u) => {
    const [n, d] = pair(p);
    const q = n / d;
    const [dl, dh, ql, qh] =
      u === 1 ? [11, 19, 12, 20] : u === 2 ? [12, 25, 21, 49] : [12, 35, 51, 99];
    return Number.isInteger(q) && q % 10 !== 0 && between(d, dl, dh) && between(q, ql, qh);
  },
  'obratnaya-tablica': (p, u) => {
    const [n, b] = pair(p);
    const a = n / b;
    if (!Number.isInteger(a)) return false;
    return u === 1
      ? between(b, 2, 5) && between(a, 2, 9)
      : u === 2
        ? between(b, 6, 9) && between(a, 2, 9)
        : between(b, 2, 12) && between(a, 2, 12);
  },
  'okruglenie-s-popravkoy': (p) => {
    const Rr = N(p.v.slice(1));
    const near = (s) => Math.abs(N(s) - Rr) <= 3 && Math.abs(N(s) - Rr) > 0;
    return p.v[0] === '-' ? near(p.d[1]) : near(p.d[0]) || near(p.d[1]);
  },
  'po-razryadam': (p, u) => {
    const [a, b] = pair(p);
    const [lo, hi] = u === 1 ? [10, 99] : u === 2 ? [100, 999] : [1000, 9999];
    return between(a, lo, hi) && between(b, lo, hi) && (p.v !== '-' || a > b);
  },
  'dopolnenie-do-kruglogo': (p, u) => {
    const Rr = p.d[0];
    const x = N(p.d[1]);
    return { 1: ['100'], 2: ['1000'], 3: ['10000', '1'] }[u].includes(Rr) && x > 0 && x < N(Rr);
  },
  'gruppirovka-slagaemyh': (p, u) => {
    const nums = p.d.map(N);
    const n = nums.length;
    if (n !== (u === 1 ? 4 : 5)) return false;
    /* Есть две пары с суммой 100 (по модулю). */
    const abs = nums.map(Math.abs);
    let pary = 0;
    const used = new Set();
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        if (
          !used.has(i) &&
          !used.has(j) &&
          abs[i] + abs[j] === 100 &&
          Math.sign(nums[i]) === Math.sign(nums[j])
        ) {
          used.add(i);
          used.add(j);
          pary += 1;
        }
      }
    }
    return pary >= 2 && (u < 3 || nums.some((x) => x < 0));
  },
  otricatelnye: (p, u) => {
    const lim = u === 1 ? 9 : u === 2 ? 50 : 99;
    const nums = pair(p);
    if (['umn', 'umm'].includes(p.v)) return u === 3 && nums[0] <= 12 && nums[1] <= 9;
    if (p.v === 'del') return u === 3;
    return nums.every((x) => between(x, 1, lim)) && /-/.test(p.expr);
  },
  'doli-procenty': (p, u) => {
    const [a, b] = pair(p);
    return (
      { 1: [2, 4, 5, 10], 2: [4, 5, 8, 20], 3: [8, 20, 25, 40, 50] }[u].includes(b) &&
      a > 0 &&
      a < b &&
      gcd(BigInt(a), BigInt(b)) === 1n
    );
  },
  'procent-ot-chisla': (p, u) => {
    const pr = p.d[0];
    return (
      {
        1: ['10', '50', '25', '20'],
        2: ['15', '5', '30', '40', '60', '75'],
        3: ['12', '35', '45', '120', '2.5', '7.5'],
      }[u].includes(pr) && /^\d+$/.test(p.otvet)
    );
  },
  'stepeni-kuby-korni': (p, u) => {
    if (p.v === 'koren') return u === 3 && between(N(p.d[0]), 11, 30);
    const [a, n] = pair(p);
    if (u === 1)
      return (
        (a === 2 && between(n, 2, 10)) ||
        (a === 3 && between(n, 2, 5)) ||
        (a === 5 && between(n, 2, 4))
      );
    if (u === 2) return (n === 3 && between(a, 2, 10)) || (a === 4 && between(n, 2, 5));
    return a === 2 && between(n, 11, 12);
  },
  tablica: (p, u) => {
    const [a, b] = pair(p);
    const rows = u === 1 ? [2, 3, 4, 5] : u === 2 ? [6, 7, 8, 9] : [2, 3, 4, 5, 6, 7, 8, 9];
    return rows.includes(a) && between(b, 2, 9);
  },
};

/* ── 1–5. Генераторы ─────────────────────────────────────────── */

function proverkaPrimera(p, what) {
  let v;
  try {
    v = rstr(evalExpr(p.expr));
  } catch (e) {
    check(false, `${what}: выражение «${p.expr}» не считается: ${e.message}`);
    return;
  }
  check(v !== null, `${what}: ответ «${p.expr}» — бесконечная дробь`);
  check(v === p.otvet, `${what}: «${p.expr}» = ${v}, а у движка ${p.otvet}`);
  check(/^-?\d+(\.\d+)?$/.test(p.otvet), `${what}: ответ ${p.otvet} не в нормальной записи`);
  const kt = katexOk(p.tex);
  check(kt === true, `${what}: TeX вопроса «${p.tex}»: ${kt}`);
  let shagi;
  try {
    shagi = VSE.find((x) => x.id === p.priyom).razbor(p);
  } catch (e) {
    check(false, `${what}: разбор упал: ${e.message}`);
    return;
  }
  check(shagi.length > 0, `${what}: пустой разбор`);
  for (const [i, s] of shagi.entries()) {
    check(
      s.cep.length >= 2 || (s.cep.length === 0 && s.tekst !== undefined),
      `${what}: шаг ${i + 1} — цепочка короче двух звеньев`,
    );
    let first = null;
    for (const z of s.cep) {
      let zz;
      try {
        zz = rstr(evalExpr(zv(z)));
      } catch (e) {
        check(false, `${what}: шаг ${i + 1}: «${zv(z)}» не считается: ${e.message}`);
        continue;
      }
      if (first === null) first = zz;
      check(
        zz === first,
        `${what}: шаг ${i + 1}: «${zv(z)}» = ${zz}, а первое звено = ${first} (${p.expr})`,
      );
      let t;
      try {
        t = katexOk(zvTex(z));
      } catch (e) {
        t = e.message;
      }
      check(t === true, `${what}: шаг ${i + 1}: TeX «${zv(z)}»: ${t}`);
    }
    if (s.tekst !== undefined) {
      const t = tekstOk(s.tekst);
      check(t === true, `${what}: текст шага «${s.tekst}»: ${t}`);
    }
  }
  const last = shagi[shagi.length - 1].cep;
  const lastV = zv(last[last.length - 1]);
  if (p.otvety !== undefined) {
    /* Оба корня: разбор кончается проверкой подстановкой «… = 0». */
    check(lastV === '0', `${what}: разбор уравнения кончается на ${lastV}, а не проверкой`);
  } else {
    check(lastV === p.otvet, `${what}: разбор кончается на ${lastV}, а ответ ${p.otvet}`);
  }
}

const VYKL = [
  { desyatichnye: true, otricatelnye: true },
  { desyatichnye: false, otricatelnye: false },
];

for (const pr of VSE) {
  for (const u of [1, 2, 3]) {
    for (const vk of VYKL) {
      const nast = { uroven: u, ...vk, predel: null };
      const gen = sozdatGenerator({ tip: 'priyomy', ids: [pr.id] }, nast, {
        seed: `${pr.id}-${u}-${vk.desyatichnye}`,
      });
      const what0 = `${pr.id} ур.${u}${vk.desyatichnye ? '' : ' без дес./отр.'}`;
      let seen = new Set();
      let krug = 0;
      let count = 0;
      for (let i = 0; i < 1000; i += 1) {
        const p = gen.next();
        if (p === null) break;
        count += 1;
        if (gen.krugi !== krug) {
          krug = gen.krugi;
          seen = new Set();
        }
        const what = `${what0} #${i} «${p.text}»`;
        check(!seen.has(p.key), `${what}: повтор в одной тренировке`);
        seen.add(p.key);
        check(p.priyom === pr.id && p.uroven === u, `${what}: чужой приём или уровень`);
        check(
          PODHODIT[pr.id](p, u),
          `${what}: пример не подходит под приём (d=${p.d.join(',')} v=${p.v ?? ''})`,
        );
        if (!vk.desyatichnye)
          check(![p.otvet, ...p.d].some(isDec), `${what}: десятичные при выключенных`);
        if (!vk.otricatelnye)
          check(
            ![p.otvet, ...p.d].some((x) => x.startsWith('-')) ||
              pr.id === 'okolo-100' ||
              pr.id === 'kvadrat-okolo-kruglyh' ||
              pr.id === 'kvadrat-okolo-50' ||
              pr.id === 'gruppirovka-slagaemyh' ||
              VIETA_IDS.includes(pr.id),
            `${what}: отрицательные при выключенных`,
          );
        proverkaPrimera(p, what);
      }
      const mozhetPusto =
        !vk.desyatichnye && ['desyatichnye-umnozhenie', 'otricatelnye'].includes(pr.id);
      check(mozhetPusto ? true : count === 1000, `${what0}: выдано ${count} из 1000`);
      if (mozhetPusto)
        check(count === 0, `${what0}: при выключенных должно быть пусто, а выдано ${count}`);
      /* Набор не слишком мал: хотя бы 8 разных примеров до нового круга. */
      if (count > 0) {
        const g2 = sozdatGenerator({ tip: 'priyomy', ids: [pr.id] }, nast, {
          seed: `pool-${pr.id}-${u}`,
        });
        const keys = new Set();
        while (g2.krugi === 0 && keys.size < 5000) {
          const p = g2.next();
          if (p === null) break;
          keys.add(p.key);
        }
        check(keys.size >= 8, `${what0}: в наборе всего ${keys.size} разных примеров`);
      }
    }
  }
}

/* Миксы по действию: каждый пример — нужного действия. */
for (const d of [
  'slozhenie',
  'vychitanie',
  'umnozhenie',
  'delenie',
  'kvadraty',
  'tablica',
  'doli',
  'uravneniya',
]) {
  const gen = sozdatGenerator(
    { tip: 'deystviya', ids: [d] },
    { uroven: 2, desyatichnye: true, otricatelnye: true, predel: null },
    { seed: `d-${d}` },
  );
  for (let i = 0; i < 300; i += 1) {
    const p = gen.next();
    check(p !== null, `микс ${d}: пусто`);
    if (p === null) break;
    const ok =
      d === 'kvadraty'
        ? ['kvadraty', 'doli'].includes(p.deystvie)
        : d === 'tablica'
          ? p.priyom === 'tablica'
          : p.deystvie === d || (d === 'umnozhenie' && p.priyom === 'tablica');
    check(ok, `микс ${d}: пример «${p.text}» с действием ${p.deystvie}`);
  }
}

/* Предел чисел. */
{
  const gen = sozdatGenerator(
    { tip: 'deystviya', ids: ['slozhenie', 'vychitanie'] },
    { uroven: 1, desyatichnye: false, otricatelnye: false, predel: 100 },
    { seed: 'predel' },
  );
  for (let i = 0; i < 300; i += 1) {
    const p = gen.next();
    if (p === null) break;
    check(
      [p.otvet, ...p.d].every((x) => Math.abs(N(x)) <= 100),
      `предел 100: «${p.text}» = ${p.otvet}`,
    );
  }
}

/* Таблица по порядку и обратная. */
{
  const gen = sozdatGenerator(
    { tip: 'tablica', stroki: [7, 8], obratnaya: 'da', poryadok: 'po-poryadku' },
    { uroven: 1, desyatichnye: false, otricatelnye: false, predel: null },
    { seed: 't' },
  );
  const got = [];
  for (let i = 0; i < 16; i += 1) got.push(gen.next());
  check(
    got.every((p) => p.v === 'obr' && ['7', '8'].includes(p.d[0])),
    'таблица: обратная форма и выбранные строки',
  );
  check(
    got.map((p) => p.d.join('·')).join(' ') ===
      [7, 8].flatMap((a) => [2, 3, 4, 5, 6, 7, 8, 9].map((b) => `${a}·${b}`)).join(' '),
    'таблица по порядку: строка за строкой',
  );
  for (const p of got) proverkaPrimera(p, `таблица обратная ${p.text}`);
}

/* ── Нормализация ввода ─────────────────────────────────────── */

const varianty = (otvet) => {
  const out = [otvet, otvet.replace('.', ','), `0${otvet}`.replace(/^0-/, '-0')];
  if (otvet.startsWith('-')) out.push(`−${otvet.slice(1)}`, `–${otvet.slice(1)}`);
  if (otvet.includes('.')) out.push(`${otvet}0`, `${otvet.replace('.', ',')}00`);
  else out.push(`${otvet},0`, ` ${otvet} `);
  return out;
};
{
  const gen = sozdatGenerator(
    { tip: 'priyomy', ids: PRIYOMY.map((p) => p.id) },
    { uroven: 3, desyatichnye: true, otricatelnye: true, predel: null },
    { seed: 'norm' },
  );
  for (let i = 0; i < 500; i += 1) {
    const s0 = sessiya.nachat(gen, { tip: 'svobodnyy' }, 0);
    const p = s0.tekushiy;
    const [k1 = '', k2 = k1] = p.otvety ?? [];
    const pole = (v) => (p.otvety === undefined ? v : [v, k2]);
    for (const v of varianty(p.otvety === undefined ? p.otvet : k1)) {
      const r = sessiya.otvetit(s0, pole(v), 1000);
      check(r.kind === 'hod' && r.hod.verno, `ввод «${v}» на ответ ${p.otvet} не засчитан`);
    }
    const r = sessiya.otvetit(s0, pole(`${p.otvet}1`), 1000);
    check(r.kind === 'hod' && !r.hod.verno, `ввод «${p.otvet}1» засчитан как верный`);
    check(sessiya.otvetit(s0, 'абв', 1000).kind === 'format', 'буквы — не попытка');
    check(sessiya.otvetit(s0, '', 1000).kind === 'format', 'пусто — не попытка');
  }
}

/* ── Режимы ──────────────────────────────────────────────────── */
{
  const nast = { uroven: 1, desyatichnye: false, otricatelnye: false, predel: null };
  const gen = sozdatGenerator({ tip: 'priyomy', ids: ['tablica'] }, nast, { seed: 'rezh' });
  let s = sessiya.nachat(gen, { tip: 'seriya', n: 10 }, 0);
  let t = 0;
  for (let i = 0; i < 10; i += 1) {
    t += 900;
    const r = sessiya.otvetit(s, i === 3 ? '0' : s.tekushiy.otvet, t);
    s = r.s;
    if (!s.konec) s = sessiya.dalee(s, gen, t);
  }
  const it = sessiya.itogi(s, t);
  check(
    s.konec && it.vsego === 10 && it.verno === 9 && it.oshibki === 1,
    `серия 10: ${JSON.stringify([it.vsego, it.verno])}`,
  );
  check(
    it.srednee === 900 && it.luchshayaSeriya === 6,
    `серия: среднее ${it.srednee}, серия ${it.luchshayaSeriya}`,
  );
  check(it.spisokOshibok.length === 1 && it.medlennye.length === 3, 'серия: ошибки и медленные');

  const gen2 = sozdatGenerator({ tip: 'priyomy', ids: ['tablica'] }, nast, { seed: 'vrem' });
  let v = sessiya.nachat(gen2, { tip: 'vremya', sek: 60 }, 0);
  for (let tt = 1000; tt <= 61_000; tt += 1000) {
    const r = sessiya.otvetit(v, v.tekushiy?.otvet ?? '0', tt);
    if (r.kind === 'pozdno') break;
    v = r.s;
    v = sessiya.dalee(v, gen2, tt);
    if (v.konec) break;
  }
  check(
    v.konec && v.hody.length === 60,
    `на время: засчитано ${v.hody.length} (ждали 60: ответ ровно на 60 с ещё в лимите)`,
  );
  check(sessiya.otvetit(v, '1', 60_500).kind === 'pozdno', 'на время: ответ после конца не принят');

  /* Работа над ошибками: неверный возвращается через 3 примера. */
  const gen3 = sozdatGenerator(
    { tip: 'priyomy', ids: ['tablica'] },
    { ...nast, uroven: 3 },
    { seed: 'vozvr' },
  );
  let w = sessiya.nachat(gen3, { tip: 'svobodnyy' }, 0);
  const first = w.tekushiy;
  w = sessiya.otvetit(w, '0', 100).s;
  const pokaz = [];
  for (let i = 0; i < 5; i += 1) {
    w = sessiya.dalee(w, gen3, 200 + i, { vozvrashchat: true });
    pokaz.push(w.tekushiy.key);
    w = sessiya.otvetit(w, w.tekushiy.otvet, 300 + i).s;
  }
  check(pokaz.indexOf(first.key) === 3, `возврат ошибки: на позиции ${pokaz.indexOf(first.key)}`);
}

/* ── Очки ───────────────────────────────────────────────────── */
{
  const r = (verno, vsego, ms, at = 0) => ({ verno, vsego, ms, at });
  const { sravnit, prohodit, itogMs, tochnostProc, novyyRekord } = ochki;
  check(itogMs(r(18, 20, 40_000)) === 50_000, 'серия: 40 с + 2 ошибки = 50 с');
  check(prohodit(r(16, 20, 0)) && !prohodit(r(15, 20, 0)), 'порог 80 %: 16/20 проходит, 15/20 нет');
  check(prohodit(r(4, 5, 0)) && !prohodit(r(0, 0, 0)), 'порог: 4/5 проходит, 0/0 нет');
  check(tochnostProc(r(2, 3, 0)) === 66, 'точность 2/3 = 66 %');
  check(sravnit('vremya', r(30, 31, 0), r(29, 29, 0)) < 0, 'на время: больше верных — выше');
  check(sravnit('vremya', r(30, 30, 0), r(30, 32, 0)) < 0, 'на время: при равенстве — точность');
  check(
    sravnit('vremya', r(30, 32, 0, 5), r(30, 32, 0, 9)) < 0,
    'на время: при равной точности — раньше',
  );
  check(sravnit('vremya', r(30, 32, 0, 5), r(15, 16, 0, 9)) < 0, 'на время: 30 верных выше 15');
  check(
    sravnit('seriya', r(20, 20, 41_000), r(19, 20, 37_000)) < 0,
    'серия: 41 с без ошибок лучше 37 + 5',
  );
  check(
    sravnit('seriya', r(19, 20, 36_000, 1), r(20, 20, 41_000, 2)) < 0,
    'серия: 36 + 5 = 41 — равно, но раньше',
  );
  check(!novyyRekord('seriya', r(15, 20, 1000), null), 'рекорд: ниже 80 % не рекорд');
  check(novyyRekord('vremya', r(31, 33, 0), r(30, 30, 0)), 'рекорд: больше верных — рекорд');
}

/* ── Таймер: что показывать (общее для 3D и SVG) ────────────── */
{
  const { taymerKadr, vspyshka, VSPYSHKA_MS } = requireSrc('lib/ustnyySchet/taymer.ts');
  const k0 = taymerKadr(0, 60_000);
  check(
    k0.dolya === 1 && k0.cifry === '1:00' && !k0.poslednie && k0.otmetka === null,
    'таймер: старт — полное кольцо, 1:00, без объявления',
  );
  const k1 = taymerKadr(30_000, 60_000);
  check(
    Math.abs(k1.dolya - 0.5) < 1e-12 && k1.otmetka === 30,
    `таймер: середина — половина кольца, отметка 30 (${k1.otmetka})`,
  );
  const k2 = taymerKadr(50_500, 60_000);
  check(
    k2.poslednie && k2.teplo > 0 && k2.puls >= 0 && k2.puls <= 1 && k2.otmetka === 10,
    'таймер: последние 10 с — тепло, пульс, отметка 10',
  );
  const k3 = taymerKadr(60_000, 60_000);
  check(
    k3.nol && k3.dolya === 0 && k3.teplo === 1 && k3.otmetka === 0 && k3.cifry === '0:00',
    'таймер: ноль — пусто, вспышка, «время вышло»',
  );
  check(taymerKadr(70_000, 120_000).otmetka === 60, 'таймер 2 мин: отметка 60 с');
  check(
    taymerKadr(49_999, 60_000).puls === 0 && !taymerKadr(49_999, 60_000).poslednie,
    'таймер: до последних 10 с пульса нет',
  );
  /* Пульс — функция времени, а не кадров: одно время — один пульс. */
  check(
    taymerKadr(55_250, 60_000).puls === taymerKadr(55_250, 60_000).puls,
    'таймер: пульс зависит только от времени',
  );
  const pulsy = Array.from({ length: 41 }, (_, i) => taymerKadr(50_000 + i * 250, 60_000).puls);
  check(
    Math.max(...pulsy) > 0.95 && Math.min(...pulsy.slice(1, -1)) < 0.05,
    'таймер: пульс мягко ходит от 0 до 1 раз в секунду',
  );
  const s0 = taymerKadr(15_000, null);
  check(
    !s0.vniz && Math.abs(s0.dolya - 0.25) < 1e-12 && s0.cifry === '0:15' && s0.otmetka === null,
    'секундомер: за 15 с — четверть круга',
  );
  check(
    taymerKadr(60_000, null).dolya === 0 && Math.abs(taymerKadr(300_000, null).oborot - 180) < 1e-9,
    'секундомер: круг за минуту, оборот за 10 минут',
  );
  check(
    vspyshka(0) === 1 &&
      vspyshka(VSPYSHKA_MS) === 0 &&
      vspyshka(VSPYSHKA_MS / 2) === 0.5 &&
      vspyshka(-1) === 0,
    'вспышка гаснет за свою длительность',
  );
}

/* ── Статистика: запись и слияние двух устройств ────────────── */
{
  const gen = sozdatGenerator(
    { tip: 'priyomy', ids: ['tablica'] },
    { uroven: 3, desyatichnye: false, otricatelnye: false, predel: null },
    { seed: 's' },
  );
  const hody = Array.from({ length: 20 }, (_, i) => {
    const p = gen.next();
    return { primer: p, vvod: p.otvet, verno: i !== 0, ms: 1500 };
  });
  const it = {
    id: 'a1',
    at: 1000,
    nabor: 't',
    rezhim: { tip: 'seriya', n: 20 },
    uroven: 3,
    hody,
    ms: 30_000,
    seriya: 19,
  };
  const z1 = model.zapisat(model.PUSTO, it);
  check(z1.rekord === 't|seriya-20' && z1.prezhniy === null, 'статистика: первая серия — рекорд');
  const z2 = model.zapisat(z1.stat, { ...it, id: 'a2', at: 2000, ms: 40_000 });
  check(z2.rekord === null, 'статистика: медленнее — не рекорд');
  const other = model.zapisat(model.PUSTO, { ...it, id: 'b1', at: 1500, ms: 20_000 });
  const m = model.mergeStat(z2.stat, other.stat);
  check(
    m.sessii.map((s) => s.id).join(',') === 'a1,b1,a2',
    `слияние: тренировки ${m.sessii.map((s) => s.id)}`,
  );
  check(m.rekordy['t|seriya-20'].sessiya === 'b1', 'слияние: лучший рекорд с другого устройства');
  const m2 = model.mergeStat(m, m);
  check(JSON.stringify(m2) === JSON.stringify(m), 'слияние с самим собой ничего не меняет');
  check(model.svodkaPriyoma(m, 'tablica').n === 60, 'сводка по приёму без двойного счёта');
  check(
    JSON.stringify(model.parseStat(JSON.parse(JSON.stringify(m)))) === JSON.stringify(m),
    'разбор сохранённого — то же',
  );
  check(
    model.parseStat({ v: 1, sessii: [{ id: 1 }], tablica: { x: 1 } }).sessii.length === 0,
    'мусор отбрасывается',
  );
}

/* ── Форматы рейтинга: диапазоны ─────────────────────────────── */
{
  const cases = JSON.parse(
    fs.readFileSync(path.join(SRC, 'lib/ustnyySchet/formatyCases.json'), 'utf8'),
  );
  for (const f of FORMATY) {
    const c = cases[f.id];
    check(c !== undefined, `formatyCases.json: нет формата ${f.id}`);
    if (c === undefined) continue;
    check(
      c.tip === f.tip && (c.sek ?? null) === (f.sek ?? null) && (c.n ?? null) === (f.n ?? null),
      `${f.id}: тип и лимит расходятся с таблицей`,
    );
    const gen = sozdatGenerator(
      { tip: 'format', id: f.id },
      { uroven: 2, desyatichnye: true, otricatelnye: true, predel: null },
      { seed: `f-${f.id}`, istochnik: f.istochnik },
    );
    const priyomy = new Set();
    for (let i = 0; i < 1000; i += 1) {
      const p = gen.next();
      check(p !== null, `${f.id}: пусто`);
      if (p === null) break;
      priyomy.add(p.priyom);
      proverkaPrimera(p, `${f.id} «${p.text}»`);
      /* Пример целиком задаётся (priyom, d, v) — так его присылает сервер. */
      const s = primerIzServera({ priyom: p.priyom, d: p.d, v: p.v ?? null });
      check(
        s !== null && s.otvet === p.otvet && s.tex === p.tex,
        `${f.id}: из (приём, d, v) не тот пример «${p.text}»`,
      );
      const nums = [...p.d, p.otvet].map(N);
      check(
        nums.every((x) => x >= c.min && x <= c.max),
        `${f.id}: «${p.text}» = ${p.otvet} вне [${c.min}; ${c.max}]`,
      );
      check(
        String(p.otvet).replace(/^-/, '').replace('.', '').length <= c.cifrOtveta,
        `${f.id}: в ответе ${p.otvet} больше ${c.cifrOtveta} цифр`,
      );
    }
    check(
      c.priyomy.every((id) => priyomy.has(id)) &&
        [...priyomy].every((id) => c.priyomy.includes(id)),
      `${f.id}: приёмы ${[...priyomy]} ≠ ${c.priyomy}`,
    );
  }
  check(KVADRATY_PUL.length === new Set(KVADRATY_PUL).size, 'пул квадратов без повторов');
}

/* ── Разминки на страницах заданий ──────────────────────────── */
{
  const { RAZMINKI, razminkaHref, razminkaBazy } = requireSrc('lib/ustnyySchet/razminka.ts');
  const { prochitat } = requireSrc('lib/ustnyySchet/zapros.ts');
  for (const [id, r] of Object.entries(RAZMINKI)) {
    check(
      r.ids.length > 0 && r.ids.every((x) => PRIYOMY.some((p) => p.id === x)),
      `разминка ${id}: приёмы существуют`,
    );
    const url = razminkaHref(id);
    check(
      url.startsWith('/ustnyy-schet/trenirovka/?'),
      `разминка ${id}: адрес тренировки (${url})`,
    );
    const z = prochitat(new URLSearchParams(url.split('?')[1]));
    check(
      z.go &&
        z.nabor.tip === 'priyomy' &&
        z.nabor.ids.join() === r.ids.join() &&
        z.rezhim.tip === 'seriya' &&
        z.rezhim.n === 10,
      `разминка ${id}: ссылка открывает серию из 10 этих приёмов`,
    );
  }
  check(
    razminkaBazy('14') === 'baza-14' && razminkaBazy('5') === null,
    'разминка базы — по номеру задания',
  );
}

/* ── Квадратные уравнения: Виет ──────────────────────────────── */
{
  const rStr = (r) => rstr(r);
  /** Значение a·x² + b·x + c в точке x (дроби). */
  const f = ([a, b, c], x) => radd(radd(rmul(R(a), rmul(x, x)), rmul(R(b), x)), R(c));
  const REZHIMY = [undefined, 'men', 'bol'];
  for (const id of VIETA_IDS) {
    const pr = VSE.find((x) => x.id === id);
    check(pr !== undefined && pr.gruppa === 'uravneniya', `Виет: нет приёма ${id}`);
    if (pr === undefined) continue;
    for (const u of [1, 2, 3]) {
      for (const ege of REZHIMY) {
        for (const desyatichnye of [true, false]) {
          const nast = { uroven: u, desyatichnye, otricatelnye: true, predel: null };
          if (ege !== undefined) nast.ege = ege;
          const gen = sozdatGenerator({ tip: 'priyomy', ids: [id] }, nast, {
            seed: `vieta-${id}-${u}-${ege}-${desyatichnye}`,
          });
          const w0 = `Виет ${id} ур.${u} ${ege ?? 'оба'}${desyatichnye ? '' : ' без дес.'}`;
          const seen = new Set();
          let krug = 0;
          for (let i = 0; i < 500; i += 1) {
            const p = gen.next();
            check(p !== null, `${w0}: генератор пуст`);
            if (p === null) break;
            if (gen.krugi !== krug) {
              krug = gen.krugi;
              seen.clear();
            }
            const what = `${w0} #${i} «${p.text}»`;
            check(!seen.has(p.key), `${what}: повтор в серии`);
            seen.add(p.key);
            /* Коэффициенты: целые, a ≠ 0. */
            check(p.d.length === 3 && p.d.every((x) => /^-?\d+$/.test(x)), `${what}: коэффициенты`);
            const [a, b, c] = p.d.map((x) => BigInt(x));
            check(a !== 0n, `${what}: a = 0`);
            /* Запись: стандартный вид. */
            check(
              !/\+ -|- -|(^|[^\d])1x|\+ 0(?!\d)|- 0(?!\d)/.test(p.tex) && p.tex.endsWith('= 0'),
              `${what}: запись «${p.tex}» не в стандартном виде`,
            );
            /* Корни: свой счёт по дискриминанту, точно. */
            const k = vietaKorni(p);
            check(k !== null, `${what}: нет рациональных корней`);
            if (k === null) continue;
            const ks = k.map(rStr);
            check(
              ks.every((x) => x !== null),
              `${what}: корень — бесконечная дробь`,
            );
            for (const r of k) {
              const v = f([a, b, c], r);
              check(v[0] === 0n, `${what}: корень ${rStr(r)} не обращает уравнение в 0`);
            }
            if (ege === undefined) {
              check(
                p.otvety !== undefined && p.otvety.join('|') === ks.join('|'),
                `${what}: корни движка ${p.otvety?.join(', ')}, а своим счётом ${ks.join(', ')}`,
              );
              check(p.otvet === ks[0], `${what}: otvet не меньший корень`);
            } else {
              check(p.otvety === undefined, `${what}: в режиме ЕГЭ два поля`);
              check(
                p.otvet === (ege === 'men' ? ks[0] : ks[1]),
                `${what}: в ответе ${p.otvet}, а ${ege === 'men' ? 'меньший' : 'больший'} — ${ege === 'men' ? ks[0] : ks[1]}`,
              );
            }
            if (!desyatichnye)
              check(
                ks.every((x) => !x.includes('.')),
                `${what}: дробный корень без десятичных`,
              );
            check(PODHODIT[id](p, u), `${what}: не подходит под приём и уровень`);
            /* Разбор: цепочки и правило знаков. */
            proverkaPrimera(p, what);
            const shagi = pr.razbor(p);
            const znak = shagi.find((s) => /одного знака|знаки разные/.test(s.tekst ?? ''));
            if (id !== 'vieta-summa-koefficientov') {
              check(znak !== undefined, `${what}: в разборе нет правила знаков`);
              if (znak !== undefined) {
                const odin = k[0][0] * k[1][0] > 0n;
                check(
                  /одного знака/.test(znak.tekst) === odin,
                  `${what}: правило знаков «${znak.tekst}», а корни ${ks.join(', ')}`,
                );
                const big = Math.abs(Number(ks[0])) > Math.abs(Number(ks[1])) ? ks[0] : ks[1];
                const ozhid = odin ? k[0][0] > 0n : !big.startsWith('-');
                check(
                  /положительн/.test(znak.tekst) === ozhid,
                  `${what}: знак в правиле «${znak.tekst}», а корни ${ks.join(', ')}`,
                );
              }
            }
          }
        }
      }
    }
  }

  /* Ответ двумя полями. */
  const pr = VSE.find((x) => x.id === 'vieta-privedennoe');
  const st = (p) => ({ ...sessiya.nachat({ next: () => p, krugi: 0 }, { tip: 'svobodnyy' }, 0) });
  const p1 = pr.iz(['1', '-7', '12'], 1);
  const otv = (p, v) => sessiya.otvetit(st(p), v, 500);
  check(otv(p1, ['3', '4']).hod?.verno === true, 'Виет: 3 и 4 — верно');
  check(otv(p1, ['4', '3']).hod?.verno === true, 'Виет: 4 и 3 — тоже верно (любой порядок)');
  check(otv(p1, ['3', '5']).hod?.verno === false, 'Виет: неверный корень отклонён');
  check(
    otv(p1, ['3', '3']).hod?.verno === false,
    'Виет: один корень дважды при двух разных — неверно',
  );
  check(otv(p1, ['3', '']).kind === 'format', 'Виет: пустое поле — не попытка');
  check(otv(p1, '3').kind === 'format', 'Виет: одно число на два корня — не попытка');
  const p2 = VSE.find((x) => x.id === 'vieta-perebroska').iz(['2', '-9', '7'], 1);
  check(p2.otvety.join('|') === '1|3.5', `Виет: корни 2x²−9x+7 — ${p2.otvety}`);
  for (const v of [
    ['3,5', '1'],
    ['3.5', '1'],
    ['1', '3,50'],
    ['01', '3.5'],
  ]) {
    check(otv(p2, v).hod?.verno === true, `Виет: ввод ${v.join(' и ')} на корни 1 и 3,5`);
  }
  /* «7/2» — запись дробью, normalizeAnswer её не принимает как ответ: не попытка. */
  check(otv(p2, ['7/2', '1']).kind === 'format', 'Виет: «7/2» — не попытка, нужна десятичная');
  const p3 = pr.iz(['1', '10', '25'], 3);
  check(p3.otvety.join('|') === '-5|-5', `Виет: равные корни ${p3.otvety}`);
  check(otv(p3, ['-5', '-5']).hod?.verno === true, 'Виет: равные корни — одно число в обоих полях');
  check(otv(p3, ['-5', '5']).hod?.verno === false, 'Виет: равные корни, второе неверное');
  const p4 = pr.iz(['1', '-7', '12'], 1, 'men');
  check(otv(p4, '3').hod?.verno === true && otv(p4, '4').hod?.verno === false, 'Виет ЕГЭ: меньший');
  const p5 = pr.iz(['1', '-7', '12'], 1, 'bol');
  check(otv(p5, '4').hod?.verno === true && otv(p5, '3').hod?.verno === false, 'Виет ЕГЭ: больший');
  /* Старые приёмы: один ответ, массив — не попытка. */
  const t = VSE.find((x) => x.id === 'tablica').iz(['7', '8'], 1);
  check(
    otv(t, '56').hod?.verno === true && otv(t, ['56', '56']).kind === 'format',
    'один ответ — как раньше',
  );
  check(t.otvety === undefined, 'у таблицы нет otvety');
  /* Старая запись статистики (без vvody и новых приёмов) читается. */
  const old = model.parseStat({
    v: 1,
    sessii: [
      {
        id: 'a',
        at: 1,
        nabor: 'p:na-11',
        rezhim: 'svobodnyy',
        uroven: 1,
        verno: 3,
        vsego: 4,
        ms: 9000,
        seriya: 2,
        po: { 'na-11': [4, 3, 6000] },
      },
    ],
    rekordy: {},
    tablica: {},
  });
  check(
    old.sessii.length === 1 && old.sessii[0].po['na-11'][1] === 3,
    'старая статистика читается',
  );
}

/* ── Примеры из теории ──────────────────────────────────────── */
{
  const file = path.join(SRC, 'content/ustnyySchet.ts');
  if (fs.existsSync(file)) {
    const { USTNYY } = requireSrc('content/ustnyySchet.ts');
    for (const [id, t] of Object.entries(USTNYY.priyomy)) {
      const pr = VSE.find((x) => x.id === id);
      check(pr !== undefined, `теория: нет приёма ${id}`);
      if (pr === undefined) continue;
      check(
        t.primery.length >= (id === 'tablica' ? 0 : 2) && t.primery.length <= 3,
        `теория ${id}: примеров ${t.primery.length}`,
      );
      for (const ex of t.primery) {
        const p = pr.iz(ex.d, ex.uroven ?? 1, ex.v);
        check(
          p.otvet === ex.otvet,
          `теория ${id}: «${p.text}» = ${p.otvet}, а подписано ${ex.otvet}`,
        );
        check(
          rstr(evalExpr(p.expr)) === ex.otvet,
          `теория ${id}: пересчёт «${p.expr}» ≠ ${ex.otvet}`,
        );
        check(
          PODHODIT[id](p, ex.uroven ?? 1),
          `теория ${id}: «${p.text}» не подходит под приём на уровне ${ex.uroven ?? 1}`,
        );
        proverkaPrimera(p, `теория ${id} «${p.text}»`);
      }
      for (const s of [t.pravilo, t.pochemu, t.kratko, ...t.urovni]) {
        const r = tekstOk(s);
        check(r === true, `теория ${id}: формула в «${s}»: ${r}`);
      }
    }
    check(
      PRIYOMY.every((p) => USTNYY.priyomy[p.id] !== undefined),
      'теория есть у каждого приёма',
    );
  } else {
    check(false, 'нет content/ustnyySchet.ts');
  }
}

if (failures.length > 0) {
  console.error(`Устный счёт: ${failures.length} расхождений из ${checks} проверок:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Устный счёт: ${checks} проверок, расхождений нет.`);
