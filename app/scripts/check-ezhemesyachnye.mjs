#!/usr/bin/env node
/* scripts/check-ezhemesyachnye.mjs — раздел «Ежемесячные варианты».

   Запуск: pnpm test:ezhemesyachnye

   Для каждого из четырёх вариантов (lib/ezhemesyachnye/dannye):

     1. Сборка части 1 и части 2, детерминизм (второй раз — тот же набор).
     2. Ответ части 1 — целое число или конечная десятичная дробь, есть
        условие, решение учителя и разбор ученика; сырого TeX нет.
     3. Ответ шаблона сходится со вторым, независимым счётом прямо по
        числам записи (формула, перебор, бисекция, координаты) — без
        решателей разделов — и с ответом, утверждённым в плане.
     4. Часть 2: ответы проверяются численно и перебором: корни 14 —
        подстановкой и сканированием отрезка, 16 и 19 — проходом по
        сетке значений, 20 — полным перебором, 15/17/18 — координатами.
     5. №6 — экземпляры генератора, у вариантов разные и не совпадают
        с задачами вариантов повышенной сложности.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc } from './lib/load-ts.mjs';
import { findRawTex, visibleTexts } from './lib/math-markup.mjs';

const { ezhSetIz } = requireSrc('lib/ezhemesyachnye/set');
const { zagruzitVariant } = requireSrc('lib/ezhemesyachnye/dannye');
const { zadacha2EV } = requireSrc('lib/ezhemesyachnye/chast2');

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 80) console.error(`  ✗ ${where}: ${message}`);
}
const num = (s) => Number(String(s).replace(',', '.').replace('−', '-'));
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
const S = (n) =>
  String(n)
    .split('')
    .reduce((s, c) => s + Number(c), 0);
const C = (n, k) => {
  let c = 1;
  for (let i = 1; i <= k; i += 1) c = (c * (n - k + i)) / i;
  return Math.round(c);
};

/* ── Ответы, утверждённые в плане (с оговорёнными правками) ─────── */

const PLAN = {
  1: [0.75, 2, 0.8, 0.4225, 64, -0.8, -38, 1109, 5, 60, 44, 2.5, 16],
  2: [7, 25000, 11, 0.4, 2.7, 6.35, -2, -3, 4, 60, 2928, 6, 10.9],
  3: [19, -225, 65.7, 0.67, 1.35, 11.16, -2026, 2, 3, 13, 40, 3.5, 316800],
  4: [9, 9, 1.5, 0.22, 0.3, 8.64, -0.25, -2.2, 3, 30, 20, 3, 188840],
};

/* ── Второй счёт части 1: прямо по числам записи ─────────────────── */

/** Нули сплайна не нужны: по узлам — смены знака и вершины ломаной. */
const smenZnaka = (uzly) => uzly.slice(1).filter(([, y], i) => y * uzly[i][1] < 0).length;
const vershiny = (uzly, tip) =>
  uzly.slice(1, -1).filter(([, y], i) => {
    const a = uzly[i][1];
    const b = uzly[i + 2][1];
    return tip === 'min' ? y < a && y < b : y > a && y > b;
  }).length;

const VTOROY = {
  'e01.sin-po-katetam': (p) => p.b / Math.hypot(p.k * Math.sqrt(p.m), p.b),
  'e01.tablica-sinusov': (p) => Math.round((Math.asin(p.h / p.l) * 180) / Math.PI),
  'e01.kasatelnaya-perimetr': (p) => {
    /* Координаты: треугольник 62°, 70°, касательная в точке на OB. */
    const B = [10, 0];
    const tA = Math.tan((62 * Math.PI) / 180);
    const tB = Math.tan((70 * Math.PI) / 180);
    const Cx = (10 * tB) / (tA + tB);
    const Cv = [Cx, Cx * tA];
    const a = Math.hypot(Cv[0] - B[0], Cv[1] - B[1]);
    const b = Math.hypot(Cv[0], Cv[1]);
    const c = 10;
    const s = (a + b + c) / 2;
    const BL = s - b; // касательная из B
    /* Периметр BEH = 2·BL при любой касательной; масштаб — по BP = a. */
    return ((2 * BL) / BL) * p.a;
  },
  'e01.vpisannaya-ravnobedr': (p) => {
    const k = p.a + p.b * Math.SQRT2;
    return (2 * k - k * Math.SQRT2) / 2;
  },
  'e02.konec-vektora': (p) => p.ax + p.vx,
  'z02.dlina-km': (p) => Math.hypot(p.k * p.ax + p.m * p.bx, p.k * p.ay + p.m * p.by),
  'e02.skalyar-treugolnik': (p) => {
    /* C(0; 0), B(BC; 0), A(0; AC); A = 60°, B = 30°, AB = k√3. */
    const AB = p.k * Math.sqrt(3);
    const BC = AB * Math.cos(Math.PI / 6);
    const AC = AB * Math.sin(Math.PI / 6);
    const t = (AC * AC) / (AB * AB);
    const H = [BC * t, AC * (1 - t)];
    return (0 - BC) * H[0] + 0 * H[1];
  },
  'e02.dlina-po-skalyarnomu': (p) =>
    p.s / (p.k * Math.sqrt(p.ugol === 30 ? 3 : 2) * Math.cos((p.ugol * Math.PI) / 180)),
  'e03.stupen-ugol': (p) => p.d / p.t,
  'e03.stvol': (p) => Math.hypot(p.a, p.b, p.c),
  'e03.kozhura': (p) => Math.round((1 - (p.d / p.D) ** 3) * 1e6) / 1e4,
  'e03.shest-tangens': (p) => {
    /* Координаты: C и F — противоположные вершины, |CF| = 2a. */
    const C = [p.a * Math.cos(0), p.a * Math.sin(0), 0];
    const F = [p.a * Math.cos(Math.PI), p.a * Math.sin(Math.PI), 0];
    return Math.hypot(C[0] - F[0], C[1] - F[1]) / p.h;
  },
  'e04.dva-v-norme': (p) => (p.p1 + p.p2 - 1) ** 2,
  'e04.eiler-uslovnaya': (p) => p.nAB / (p.nA + p.nAB),
  'e04.hotya-by-odno': (p) => p.pA + p.pB - p.pAB,
  'e04.dva-etapa': (p) => p.p1 - p.p12,
  'e05.hotya-by-tri': (p) => {
    let P = 0;
    const q = [p.q1, p.q2, p.q3].map((x) => x / 100);
    for (let m = 1; m < 8; m += 1) P += q.reduce((w, x, i) => w * ((m >> i) & 1 ? x : 1 - x), 1);
    return 100 * P;
  },
  'e05.bernulli-otnoshenie': (p) =>
    (C(p.n, p.k1) * p.q1 ** p.k1 * (1 - p.q1) ** (p.n - p.k1)) /
    (C(p.n, p.k2) * p.q2 ** p.k2 * (1 - p.q2) ** (p.n - p.k2)),
  'e05.uslovnaya': (p) => p.ab / p.a,
  'e06.ozhidanie-tablica': (p) => p.xs.reduce((s, x, i) => s + (x * p.ps[i]) / p.den, 0),
  'z06.ozhidanie': (p) => p.xs.reduce((s, x, i) => s + (x * p.ps[i]) / p.den, 0),
  'z06.dispersiya': (p) => {
    const E = p.xs.reduce((s, x, i) => s + (x * p.ps[i]) / p.den, 0);
    return p.xs.reduce((s, x, i) => s + ((x - E) ** 2 * p.ps[i]) / p.den, 0);
  },
  'e06.dispersiya-drobi': (p) => {
    const E = p.xs.reduce((s, x, i) => s + (x * p.ps[i]) / p.den, 0);
    return p.xs.reduce((s, x, i) => s + ((x - E) ** 2 * p.ps[i]) / p.den, 0);
  },
  'e07.kub-koren': (p) => p.c ** 3 - p.a,
  'e07.log-kvadratnyy': (p) => {
    /* Перебор целых x: подстановка в исходное уравнение. */
    const xs = [];
    for (let x = -100; x <= 100; x += 1) {
      const t = x * x + p.p * x + p.q;
      if (t > 0 && close(Math.log(t) / Math.log(p.a), p.c)) xs.push(x);
    }
    return Math.min(...xs);
  },
  'e07.kvadratnoe': (p) => {
    const D = p.p * p.p - 4 * p.qq;
    return (-p.p - Math.sqrt(D)) / 2;
  },
  'e07.cos': (p) => {
    /* Наибольший отрицательный корень: перебор с шагом 1/1000. */
    for (let i = -1; i > -20000; i -= 1) {
      const x = i / 1000;
      if (Math.abs(Math.cos((Math.PI * (p.k * x + p.b)) / p.a) - 1) < 1e-12) return x;
    }
    return NaN;
  },
  'e08.raznost-kvadratov': (p) => ((p.a / p.z) ** 2 - (p.b / p.z) ** 2) / p.k,
  'e08.trig-sokrashchenie': (p) => {
    const x = 0.77;
    return (
      (p.k *
        Math.sin((19 * Math.PI) / 6) *
        Math.sin(x + Math.PI / 3) *
        Math.sin(x - (3 * Math.PI) / 2)) /
      (Math.cos(x - Math.PI / 6) * Math.cos(x + 2 * Math.PI))
    );
  },
  'e08.log-chastnye': (p) => {
    const L = (b, x) => Math.log(x) / Math.log(b);
    const c = p.c;
    return L(c, 2 * c * c) / L(2 * c ** 3, c) - L(c, 2 * c ** 4) / L(2 * c, c);
  },
  'e08.otnoshenie': (p) => {
    /* (p·t + q)/(r·t + s) = v ⇔ (p − v·r)·t = v·s − q, знаменатель не нуль. */
    const t = (p.v * p.s - p.q) / (p.p - p.v * p.r);
    return Math.abs(p.r * t + p.s) > 1e-9 ? t : NaN;
  },
  'e09.nuli-f': (p) => smenZnaka(p.uzly),
  'e09.min-f': (p) => vershiny(p.uzly, 'min'),
  'e09.chislo-min': (p) =>
    p.uzly.filter(
      ([x, y], i) =>
        y === 0 && i > 0 && i < p.uzly.length - 1 && x >= p.p && x <= p.q && p.uzly[i - 1][1] < 0,
    ).length,
  'e09.parallel-chislo': (p) => {
    let n = 0;
    for (let i = 0; i < p.uzly.length - 1; i += 1) {
      const a = p.uzly[i][1] - p.k;
      const b = p.uzly[i + 1][1] - p.k;
      if (a * b < 0 || (i > 0 && a === 0)) n += 1;
    }
    return n;
  },
  'e10.vysota-ugol': (p) => {
    /* Бисекция по углу: H(α) возрастает на (0°; 90°). */
    const H = (a) => ((p.v0 * p.v0) / (4 * p.g)) * (1 - Math.cos((2 * a * Math.PI) / 180));
    let lo = 0;
    let hi = 90;
    for (let i = 0; i < 100; i += 1) {
      const m = (lo + hi) / 2;
      if (H(m) < p.H) lo = m;
      else hi = m;
    }
    return Math.round(lo * 1e6) / 1e6;
  },
  'e10.signal': (p) => {
    let n = 0;
    const N = 1e6;
    const c = p.ck * Math.sqrt(p.cm);
    for (let i = 0; i < N; i += 1) {
      const t = ((i + 0.5) / N) * p.tau;
      if (p.U0 * Math.sin(((p.w * t + p.phi) * Math.PI) / 180) >= c) n += 1;
    }
    return Math.round((n / N) * 100 * 1000) / 1000;
  },
  'e10.nagrevateli': (p) => {
    for (let n = 1; n < 1000; n += 1) if (p.eps / (n * p.R1 + p.r) <= p.I + 1e-12) return n;
    return NaN;
  },
  'e10.amper': (p) => {
    for (let a = 0; a <= 180; a += 1)
      if (p.B * p.I * p.l * Math.sin((a * Math.PI) / 180) >= p.F - 1e-12) return a;
    return NaN;
  },
  'e11.plot-kater': (p) => {
    /* Перебор скорости течения с шагом 0,001. */
    for (let u = 0.001; u < p.v; u += 0.001) {
      if (close(p.S / (p.v - u) + p.S / (p.v + u), p.T0 - p.st, 1e-4)) return Math.round(u) * p.T0;
    }
    return NaN;
  },
  'e11.progressiya': (p) => {
    let s = 0;
    for (let i = 0; i < p.n; i += 1) s += p.a + i * p.r;
    return s;
  },
  'e11.medlennyy': (p) => {
    for (let v = 1; v <= 300; v += 1) if (close(p.S / v - p.S / (v + p.dv), p.dt / 60)) return v;
    return NaN;
  },
  'e11.procent-cena': (p) => (p.sum / p.b / (p.sum / p.a) - 1) * 100,
  'e12.parabola-kx': (p) => {
    /* Решаем систему на a, b, c и уравнение ax² + (b − k)x + c = 0. */
    const [[x1, y1], [x2, y2], [x3, y3]] = p.uzly;
    const a = ((y3 - y1) / (x3 - x1) - (y2 - y1) / (x2 - x1)) / (x3 - x2);
    const b = (y2 - y1) / (x2 - x1) - a * (x1 + x2);
    const c = y1 - a * x1 * x1 - b * x1;
    const k = p.A[1] / p.A[0];
    const D = (b - k) ** 2 - 4 * a * c;
    const r = [(-(b - k) - Math.sqrt(D)) / (2 * a), (-(b - k) + Math.sqrt(D)) / (2 * a)];
    return r.find((x) => !close(x, p.A[0]));
  },
  'e12.modul-paraboly': (p) => {
    const m = (p.x1 + p.x2) / 2;
    for (const a of [-1, 1].map((z) => (z * p.h) / Math.abs((m - p.x1) * (m - p.x2)))) {
      const c = a * p.x1 * p.x2;
      if (c > 0) return c;
    }
    return NaN;
  },
  'e12.koren-pryamaya': (p) => {
    const a = p.G[1] / Math.sqrt(p.G[0]);
    const k = (p.L2[1] - p.L1[1]) / (p.L2[0] - p.L1[0]);
    const b = p.L1[1] - k * p.L1[0];
    let lo = 1;
    let hi = 1e4;
    const f = (x) => a * Math.sqrt(x) - k * x - b;
    for (let i = 0; i < 300; i += 1) {
      const mm = (lo + hi) / 2;
      if (f(mm) > 0) lo = mm;
      else hi = mm;
    }
    return a * Math.sqrt(lo);
  },
  'e12.b-log': (p) => p.b + Math.log(p.x0) / Math.log(p.a),
  'e13.dva-vklada': (p) => {
    for (let n = 1; n < 100; n += 1)
      if ((1 + p.r1 / 100) * (1 + n / 100) ** 2 > (1 + p.rA / 100) ** 3) return n;
    return NaN;
  },
  'e13.ravnye-platezhi-raznost': (p) => {
    /* Прямой пересчёт долга: платёж ищем бисекцией. */
    const k = 1 + Number(p.r) / 100;
    const Sum = [4, 2].map((n) => {
      const S0 = 3355 * p.c * 100;
      let lo = 0;
      let hi = S0 * 2;
      for (let i = 0; i < 200; i += 1) {
        const x = (lo + hi) / 2;
        let d = S0;
        for (let j = 0; j < n; j += 1) d = d * k - x;
        if (d > 0) lo = x;
        else hi = x;
      }
      return Math.round(lo) * n;
    });
    return p.n === 4 ? Sum[0] - Sum[1] : NaN;
  },
  'e13.teplicy': (p) =>
    (p.s1 * Math.max(p.o1 * p.co, p.t1 * p.ct) + p.s2 * Math.max(p.o2 * p.co, p.t2 * p.ct)) / 1e6,
  'e13.suhoy-led': (p) => {
    let m = p.M;
    let prodano = 0;
    for (let d = 0; d < p.n; d += 1) {
      m = m * (1 - p.p / 100) - p.k;
      prodano += p.k;
    }
    return Math.round((prodano + m * (1 - p.p / 100)) * p.c * 1e6) / 1e6;
  },
};

/* ── Часть 2: проверки численно и перебором ─────────────────────── */

/** Корни на отрезке сканированием: смена знака f или касание нуля. */
function korniNaOtrezke(f, lo, hi, n = 200000) {
  const out = [];
  const dobavit = (r) => {
    if (!out.some((y) => Math.abs(y - r) < 1e-3)) out.push(r);
  };
  const xs = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const vs = xs.map(f);
  for (let i = 1; i <= n; i += 1) {
    const [prev, v] = [vs[i - 1], vs[i]];
    if (Number.isFinite(prev) && Number.isFinite(v) && (prev === 0 || prev * v < 0))
      dobavit(prev === 0 ? xs[i - 1] : xs[i]);
  }
  /* Корни касания (чётной кратности): локальный минимум |f|, уточнённый троичным поиском. */
  const a = (x) => Math.abs(f(x));
  for (let i = 0; i <= n; i += 1) {
    const v = Math.abs(vs[i]);
    if (!Number.isFinite(v) || v > 1e-4) continue;
    const l = i > 0 ? Math.abs(vs[i - 1]) : Infinity;
    const r = i < n ? Math.abs(vs[i + 1]) : Infinity;
    if (!(v <= (Number.isFinite(l) ? l : Infinity) && v <= (Number.isFinite(r) ? r : Infinity)))
      continue;
    let x0 = xs[Math.max(i - 1, 0)];
    let x1 = xs[Math.min(i + 1, n)];
    for (let k = 0; k < 100; k += 1) {
      const m1 = x0 + (x1 - x0) / 3;
      const m2 = x1 - (x1 - x0) / 3;
      const [f1, f2] = [a(m1), a(m2)];
      if (!(f1 <= f2) && Number.isFinite(f2)) x0 = m1;
      else x1 = m2;
    }
    const x = (x0 + x1) / 2;
    if (a(x) < 1e-10) dobavit(x);
  }
  return out.sort((p, q) => p - q);
}

const URAVNENIYA_14 = {
  'ev1.14': (x) => Math.cos(2 * x) + 3 * Math.sin(x) ** 2 - 1.25,
  'ev2.14': (x) =>
    (1 - 4 * Math.sin(x) ** 2) * Math.sin(2 * x) ** 2 /* та же функция, что разность частей */,
  'ev3.14': (x) => {
    const c = Math.cos(x);
    if (c <= 0) return NaN;
    const den = 2 * Math.sin(x) - Math.sqrt(3);
    if (Math.abs(den) < 1e-9) return NaN;
    return (Math.log2(c) ** 2 + Math.log2(c)) / den;
  },
  'ev4.14': (x) =>
    -Math.SQRT2 * Math.sin(3 * Math.PI + 2 * x) +
    2 * Math.sin(x - (5 * Math.PI) / 2) +
    Math.sqrt(6) * Math.cos(x - (21 * Math.PI) / 2) -
    Math.sqrt(3),
};

/** Сравнение разности частей №14 из условия (ноябрь) с формой в разложении. */
function proverkaRazlozheniya14() {
  for (let i = 0; i < 100; i += 1) {
    const x = -5 + i * 0.137;
    const lev = 1 + 4 * Math.sin(x) ** 2 * Math.cos(2 * x) ** 2;
    const prav = 4 * Math.sin(x) ** 2 + Math.cos(2 * x) ** 2;
    if (!close(lev - prav, URAVNENIYA_14['ev2.14'](x), 1e-9)) return false;
  }
  return true;
}

/** Решение неравенства №16 по сетке: куски [lo, hi, loZ, hiZ]. */
const NERAVENSTVA_16 = {
  'ev1.16': (x) =>
    1 + (2 * (7 - 3 * x)) / (x * x - 8 * x + 15) - ((2 - 2 * x) / (x - 5) - 13 / (x - 3)) <= 1e-12,
  'ev2.16': (x) => {
    const r = -6 * x - x * x;
    if (r < 0 || x === -2 || x === -3) return false;
    return ((x + 3) / (x + 2) - 1 / (x * x + 5 * x + 6)) * Math.sqrt(r) >= -1e-12;
  },
  'ev3.16': (x) =>
    ((4 ** x + 2 ** x) ** 2 - 19 * 2 ** x - 19 * 4 ** x - 20) / Math.sqrt(3 * x * x - 2 * x + 1) <=
    1e-9,
  'ev4.16': (x) => {
    if (x === 0 || x === 1.5) return false;
    return (
      (Math.log(x * x) / Math.log(3) - Math.log(x * x) / Math.log(7)) /
        (Math.log(4 * x * x - 12 * x + 9) ** 2 / Math.log(5) ** 2 + 2) >=
      -1e-12
    );
  },
};

/** Принадлежит ли x ответу — множеству из полей поля промежутков. */
function vOtvete(pole, x) {
  const val = (s) => (s === 'inf' ? Infinity : s === '-inf' ? -Infinity : num(s));
  return pole.verno.kuski.some((k) =>
    k.t === 'tochka'
      ? close(x, val(k.x), 1e-9)
      : (x > val(k.lo) || (k.loZakr && close(x, val(k.lo), 1e-9))) &&
        (x < val(k.hi) || (k.hiZakr && close(x, val(k.hi), 1e-9))),
  );
}

/** Число решений уравнений №19 при параметре — независимо, перебором. */
const PARAMETR_19 = {
  /* |x−3| + |x+2| = kx + 2: корни на каждом куске. */
  'ev1.19': (k) => {
    const xs = new Set();
    for (const [a, b, lo, hi] of [
      [-2, 1, -Infinity, -2],
      [0, 5, -2, 3],
      [2, -1, 3, Infinity],
    ]) {
      if (Math.abs(a - k) < 1e-12) {
        if (Math.abs(b - 2) < 1e-12) return Infinity;
        continue;
      }
      const x = (2 - b) / (a - k);
      if (x >= lo - 1e-12 && x <= hi + 1e-12) xs.add(Math.round(x * 1e9) / 1e9);
    }
    return xs.size;
  },
  /* (a − x)(a + 2 − (x − 4)²)/√(x − 3) = 0. */
  'ev2.19': (a) => {
    const xs = new Set();
    if (a > 3) xs.add(a);
    if (a + 2 >= 0)
      for (const z of [-1, 1]) {
        const x = 4 + z * Math.sqrt(a + 2);
        if (x > 3) xs.add(Math.round(x * 1e9) / 1e9);
      }
    return xs.size;
  },
  /* |t − 3| + |t + 1| = 4, t = x + 4a²/x: есть ли решение — сканирование x. */
  'ev3.19': (a) => {
    for (let i = -40000; i <= 40000; i += 1) {
      const x = i / 2000;
      if (x === 0) continue;
      const t = x + (4 * a * a) / x;
      if (Math.abs(Math.abs(t - 3) + Math.abs(t + 1) - 4) < 1e-9) return 1;
    }
    /* Точки, где t = 3 или t = −1 ровно (концы отрезка): решаем квадратное. */
    for (const T of [3, -1]) if (T * T - 16 * a * a >= -1e-12) return 1;
    return 0;
  },
  /* Система: число решений на [−1; 5] — по сетке (бесконечно много ≈ много точек). */
  'ev4.19': (a) => {
    let n = 0;
    for (let i = 0; i <= 60000; i += 1) {
      const x = -1 + i / 10000;
      if ((a + 7 - (x * x - 4 * x)) * (a - Math.cos(x)) <= 1e-12) n += 1;
    }
    return n;
  },
};

const VTOROY_2 = {
  'ev1.15': () => {
    /* Координаты призмы: B(12;0;0), D(0;12;0), K(12;8;7), L(8;12;7). */
    const P = [
      [12, 0, 0],
      [12, 8, 7],
      [8, 12, 7],
      [0, 12, 0],
    ];
    const s = [0, 0, 0];
    for (let i = 0; i < 4; i += 1) {
      const [a, b] = [P[i], P[(i + 1) % 4]];
      s[0] += a[1] * b[2] - a[2] * b[1];
      s[1] += a[2] * b[0] - a[0] * b[2];
      s[2] += a[0] * b[1] - a[1] * b[0];
    }
    return Math.hypot(...s) / 2;
  },
  'ev1.17': () => {
    let best = 0;
    let arg = 0;
    for (let i = 1; i < 16000; i += 1) {
      const h = i / 10000;
      const L = Math.sqrt(2 * 10 * (1.6 - h)) * Math.sqrt((2 * h) / 10);
      if (L > best) [best, arg] = [L, h];
    }
    return Math.round(arg * 1000) / 1000;
  },
  'ev1.18': () => {
    /* Окружность R = 9, A = 35°, C = 80°: точки и вторая точка высоты. */
    const R = 9;
    const t = (g) => [R * Math.cos((g * Math.PI) / 180), R * Math.sin((g * Math.PI) / 180)];
    const B = t(90);
    const A = t(250);
    const Cc = t(20);
    const N = t(270);
    const d = [Cc[0] - A[0], Cc[1] - A[1]];
    const n = [-d[1], d[0]];
    const nl = Math.hypot(...n);
    const u = [n[0] / nl, n[1] / nl];
    const s = -2 * (B[0] * u[0] + B[1] * u[1]);
    const K = [B[0] + s * u[0], B[1] + s * u[1]];
    return Math.hypot(K[0] - N[0], K[1] - N[1]);
  },
  'ev2.15': () => {
    const a = 14;
    const h = Math.sqrt(625 - 196);
    const v = (k) => [a * Math.cos((k * Math.PI) / 3), a * Math.sin((k * Math.PI) / 3), 0];
    const [A, B, Cc, D, E] = [0, 1, 2, 3, 4].map(v);
    const Sv = [0, 0, h];
    const H = [(B[0] + Cc[0]) / 2, (B[1] + Cc[1]) / 2, 0];
    const be = [E[0] - B[0], E[1] - B[1], 0];
    const sh = [H[0] - Sv[0], H[1] - Sv[1], -h];
    void A;
    void D;
    return (
      Math.abs(be[0] * sh[0] + be[1] * sh[1] + be[2] * sh[2]) /
      (Math.hypot(...be) * Math.hypot(...sh))
    );
  },
  'ev2.17': () => {
    let best = 0;
    let arg = 0;
    for (let i = 1; i < 50000; i += 1) {
      const h = i / 10000;
      const E = h / (h * h + 1.44) ** 1.5;
      if (E > best) [best, arg] = [E, h];
    }
    return arg;
  },
  'ev2.18': () => {
    /* Бисекция по радиусу x: касание малой окружности при центре на расстоянии 7 − x от O₁. */
    const f = (x) => {
      const p = Math.sqrt(49 - 14 * x);
      return Math.hypot(p - 6, x) - (1 + x);
    };
    let lo = 0.01;
    let hi = 3.4;
    for (let i = 0; i < 200; i += 1) {
      const m = (lo + hi) / 2;
      if (Math.sign(f(m)) === Math.sign(f(lo))) lo = m;
      else hi = m;
    }
    return lo;
  },
  'ev3.15': () => {
    /* Расстояние от A до плоскости SBC по координатам. */
    const a = 12;
    const R = a / Math.sqrt(3);
    const Pt = (g) => [R * Math.cos(g), R * Math.sin(g), 0];
    const A = Pt(0);
    const B = Pt((2 * Math.PI) / 3);
    const Cc = Pt((4 * Math.PI) / 3);
    const Sv = [0, 0, Math.sqrt(64 - R * R)];
    const u = [B[0] - Sv[0], B[1] - Sv[1], B[2] - Sv[2]];
    const w = [Cc[0] - Sv[0], Cc[1] - Sv[1], Cc[2] - Sv[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const d = [A[0] - Sv[0], A[1] - Sv[1], A[2] - Sv[2]];
    return Math.abs(n[0] * d[0] + n[1] * d[1] + n[2] * d[2]) / Math.hypot(...n);
  },
  'ev3.17': () => {
    let best = Infinity;
    let arg = 0;
    for (let i = 0; i <= 60000; i += 1) {
      const x = i / 1000;
      const T = x / 5 + Math.hypot(60 - x, 30) / 3;
      if (T < best) [best, arg] = [T, x];
    }
    return arg;
  },
  'ev3.18': () => {
    /* Случайный прямоугольный треугольник, LC = 14: площадь KLM. */
    const b = 5.3;
    const a = 14 * Math.SQRT2 - b;
    const K = [b / 2, -b / 2];
    const M = [-a / 2, a / 2];
    const L = [(a + b) / 2, (a + b) / 2];
    return Math.abs((M[0] - K[0]) * (L[1] - K[1]) - (L[0] - K[0]) * (M[1] - K[1])) / 2;
  },
  'ev4.15': () => {
    const h = Math.sqrt(144 - 8);
    const A = [-2, -2, 0];
    const Sv = [0, 0, h];
    const at = (P, Q, t) => P.map((v, i) => v + (Q[i] - v) * t);
    const L = at(Sv, [2, -2, 0], 0.75);
    const M = at(Sv, [-2, 2, 0], 0.75);
    /* Точку P ищем как пересечение плоскости ALM с ребром SC. */
    const u = L.map((v, i) => v - A[i]);
    const w = M.map((v, i) => v - A[i]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const Cc = [2, 2, 0];
    const f = (t) => at(Sv, Cc, t).reduce((s, v, i) => s + (v - A[i]) * n[i], 0);
    const t = f(0) / (f(0) - f(1));
    const P = at(Sv, Cc, t);
    const pl = [A, L, P, M];
    const s = [0, 0, 0];
    for (let i = 0; i < 4; i += 1) {
      const [a, b] = [pl[i], pl[(i + 1) % 4]];
      s[0] += a[1] * b[2] - a[2] * b[1];
      s[1] += a[2] * b[0] - a[0] * b[2];
      s[2] += a[0] * b[1] - a[1] * b[0];
    }
    return [Math.hypot(...s) / 2, t];
  },
  'ev4.17': () => {
    let best = Infinity;
    let arg = 0;
    for (let i = 0; i < 90000; i += 1) {
      const a = (i / 1000) * (Math.PI / 180);
      const F = (0.75 * 20 * 10) / (Math.cos(a) + 0.75 * Math.sin(a));
      if (F < best) [best, arg] = [F, a];
    }
    return [Math.round(Math.tan(arg) * 1000) / 1000, Math.round(best * 1000) / 1000];
  },
  'ev4.18': () => {
    /* Перебор формы четырёхугольника с AC ⊥ BD и данными PQ, QW, R. */
    const A = [-2, 0];
    const Cc = [4, 0];
    const B = [0, -3];
    const D = [0, 6];
    const tr = (u, v) => [u[0] + (v[0] - u[0]) / 3, u[1] + (v[1] - u[1]) / 3];
    const P = tr(A, B);
    const Q = tr(Cc, B);
    const W = tr(Cc, D);
    const d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]);
    const [pq, qw, pw] = [d(P, Q), d(Q, W), d(P, W)];
    const S4 = Math.abs((Cc[0] - A[0]) * (D[1] - B[1]) - (Cc[1] - A[1]) * (D[0] - B[0])) / 2;
    const R =
      (pq * qw * pw) /
      (4 * (Math.abs((Q[0] - P[0]) * (W[1] - P[1]) - (W[0] - P[0]) * (Q[1] - P[1])) / 2));
    return close(pq, 4) && close(qw, 3) && close(R, 2.5) ? S4 : NaN;
  },
  'ev1.20': () => {
    const sums = new Set();
    for (let n = 1; n < 2000; n += 1) {
      const a = S(n);
      const b = S(a);
      if (new Set([n, a, b]).size === 3) sums.add(n + a + b);
    }
    let v = 0;
    for (let n = 100; n < 1000; n += 1)
      if (S(S(n)) === 7 && new Set([n, S(n), 7]).size === 3) v += 1;
    return [sums.has(555), sums.has(556), v];
  },
  'ev2.20': () => {
    const good = (s) => {
      const t = s.reduce((x, y) => x + y, 0);
      if (t % 2) return false;
      for (let m = 1; m < 1 << s.length; m += 1) {
        let sum = 0;
        s.forEach((x, i) => {
          if ((m >> i) & 1) sum += x;
        });
        if (sum === t / 2) return true;
      }
      return false;
    };
    const baza = [1, 3, 4, 6, 7, 8, 10];
    let v = 0;
    for (let m = 0; m < 1 << 7; m += 1) {
      const s = baza.filter((_, i) => (m >> i) & 1);
      if (s.length === 4 && good(s)) v += 1;
    }
    /* а) разбиение на пары четвёрок; б) наибольшее больше суммы остальных. */
    const a = [];
    for (let n = 150; n < 250; n += 1) a.push(n);
    const pervoe = a
      .filter((n) => (n - 150) % 4 === 0 || (n - 150) % 4 === 3)
      .reduce((x, y) => x + y, 0);
    const vtoroe = a
      .filter((n) => (n - 150) % 4 === 1 || (n - 150) % 4 === 2)
      .reduce((x, y) => x + y, 0);
    const b = 3n ** 50n > (3n ** 50n - 3n) / 2n;
    return [pervoe === vtoroe, !b, v];
  },
  'ev3.20': () => {
    const pr = new Set();
    for (let A = 100; A < 1000; A += 1) pr.add(A * S(A));
    let v = 2027;
    while (!pr.has(v)) v += 1;
    return [pr.has(1450), pr.has(1451), v];
  },
  'ev4.20': () => {
    /* Все наборы a ≤ b ≤ c ≤ d с суммой обратных 1/2 — перебор. */
    const nabory = [];
    for (let a = 3; a <= 8; a += 1)
      for (let b = a; b <= 200; b += 1)
        for (let c = b; c <= 2000; c += 1) {
          const r = 1 / 2 - 1 / a - 1 / b - 1 / c;
          if (r <= 1e-12) continue;
          const d = Math.round(1 / r);
          if (d >= c && Math.abs(1 / a + 1 / b + 1 / c + 1 / d - 0.5) < 1e-12)
            nabory.push([a, b, c, d]);
        }
    const razlichny = nabory.some((s) => new Set(s).size === 4);
    const est17 = nabory.some((s) => s.includes(17));
    const tri = nabory.filter((s) => {
      const k = {};
      s.forEach((x) => (k[x] = (k[x] ?? 0) + 1));
      return Object.values(k).includes(3);
    }).length;
    return [razlichny, est17, tri];
  },
};

/* ── Прогон ─────────────────────────────────────────────────────── */

const ROOT = path.resolve(process.cwd(), '..');
const vse6 = [];

for (const k of [1, 2, 3, 4]) {
  const d = await zagruzitVariant(k);
  const set = ezhSetIz(k, d.versii);
  const again = ezhSetIz(k, d.versii);
  if (JSON.stringify(set) !== JSON.stringify(again))
    fail(`вариант ${k}`, 'сборка не детерминирована');
  const tasks = set.variants[0].tasks;
  if (tasks.length !== 13) fail(`вариант ${k}`, `заданий части 1: ${tasks.length}`);
  tasks.forEach((t, i) => {
    const where = `вариант ${k}, №${t.egeNumber}`;
    const z = d.versii[0][i];
    if (t.egeNumber !== i + 1) fail(where, 'номер не по порядку');
    if (!/^−?\d+(,\d+)?$/.test(t.answer))
      fail(where, `ответ «${t.answer}» не целое и не конечная дробь`);
    for (const pole of ['statement', 'solutionTeacher', 'solutionStudent']) {
      if (!t[pole]) fail(where, `пусто: ${pole}`);
      else {
        for (const txt of visibleTexts(t[pole])) {
          const raw = findRawTex(txt);
          if (raw.length > 0) fail(where, `сырой TeX в ${pole}: ${raw[0]}`);
        }
      }
    }
    const otvet = num(t.answer);
    const plan = PLAN[k][i];
    if (!close(otvet, plan)) fail(where, `ответ ${otvet}, в плане ${plan}`);
    const f = VTOROY[z.s];
    if (f === undefined) fail(where, `нет второго счёта для ${z.s}`);
    else {
      const v = f(z.p);
      if (!close(v, otvet, 1e-5)) fail(where, `второй счёт ${v} ≠ ${otvet}`);
    }
    if (t.egeNumber === 6) vse6.push(JSON.stringify([z.p.xs, z.p.ps]));
  });

  /* Часть 2. */
  const ch2 = d.chast2[0].map((z) => zadacha2EV(z));
  if (ch2.length !== 7) fail(`вариант ${k}`, `заданий части 2: ${ch2.length}`);
  for (const z of ch2) {
    const where = `вариант ${k}, №${z.no}`;
    const id = z.shablon;
    if (!z.uslovie || z.reshenie.length === 0 || z.razbor.length === 0)
      fail(where, 'нет условия или решения');
    if (z.no === 14) {
      const f = URAVNENIYA_14[id];
      const { lo, hi, korni } = z.kontrol;
      const najdeno = korniNaOtrezke(f, lo - 1e-9, hi + 1e-9);
      const ok =
        najdeno.length === korni.length &&
        korni.every((r) => najdeno.some((y) => Math.abs(y - r) < 1e-3));
      if (!ok)
        fail(
          where,
          `корни на отрезке: найдено ${najdeno.map((x) => x.toFixed(4))}, в ответе ${korni.map((x) => x.toFixed(4))}`,
        );
      for (const r of korni) if (!(Math.abs(f(r)) < 1e-9)) fail(where, `x=${r} не корень`);
      const verno = z.punkty[1].pole.verno.length;
      if (verno !== korni.length) fail(where, 'число корней в поле и в kontrol разное');
      if (id === 'ev2.14' && !proverkaRazlozheniya14())
        fail(where, 'разложение не равно разности частей');
    } else if (z.no === 16) {
      const f = NERAVENSTVA_16[id];
      const pole = z.punkty[0].pole;
      for (let i = -20000; i <= 20000; i += 1) {
        const x = i / 1000;
        let v;
        try {
          v = f(x);
        } catch {
          v = false;
        }
        if (Boolean(v) !== vOtvete(pole, x)) {
          fail(
            where,
            `x=${x}: неравенство ${v ? 'выполнено' : 'не выполнено'}, а ответ говорит обратное`,
          );
          break;
        }
      }
    } else if (z.no === 19) {
      const f = PARAMETR_19[id];
      const pole = z.punkty[0].pole;
      const nado = (n) =>
        id === 'ev1.19' ? n > 1 : id === 'ev2.19' ? n === 1 : id === 'ev3.19' ? n >= 1 : n > 1;
      const tochki = [];
      for (let i = -1500; i <= 1500; i += 1) tochki.push(i / 100);
      for (const c of [-2, -1.5, 1, 2, -1, 3, 7, 0.75, -0.75, -11]) tochki.push(c);
      for (const a of tochki) {
        if (Boolean(nado(f(a))) !== vOtvete(pole, a)) {
          fail(where, `параметр ${a}: решений ${f(a)}, ответ говорит обратное`);
          break;
        }
      }
    } else {
      const f = VTOROY_2[id];
      if (f === undefined) fail(where, `нет второго счёта для ${id}`);
      else {
        const v = f();
        const ozhid = {
          'ev1.15': z.kontrol.S,
          'ev1.17': z.kontrol.h,
          'ev1.18': z.kontrol.KN,
          'ev2.15': z.kontrol.cos,
          'ev2.17': z.kontrol.h,
          'ev2.18': z.kontrol.x,
          'ev3.15': z.kontrol.d,
          'ev3.17': z.kontrol.x,
          'ev3.18': z.kontrol.S,
          'ev4.15': [z.kontrol.S, z.kontrol.sp],
          'ev4.17': [z.kontrol.tg, z.kontrol.F],
          'ev4.18': z.kontrol.S,
          'ev1.20': [z.kontrol.A, z.kontrol.B, z.kontrol.V],
          'ev2.20': [z.kontrol.A, z.kontrol.B, z.kontrol.V],
          'ev3.20': [z.kontrol.A, z.kontrol.B, z.kontrol.V],
          'ev4.20': [z.kontrol.A, z.kontrol.B, z.kontrol.V],
        }[id];
        const sovp = Array.isArray(v)
          ? v.every((x, i) => (typeof x === 'boolean' ? x === ozhid[i] : close(x, ozhid[i], 1e-4)))
          : close(v, ozhid, 1e-4);
        if (!sovp) fail(where, `второй счёт ${JSON.stringify(v)} ≠ ${JSON.stringify(ozhid)}`);
        /* Ответы в полях — те же, что в kontrol. */
        if (z.no === 20) {
          const p = z.punkty;
          if (
            p[0].pole.verno !== z.kontrol.A ||
            p[1].pole.verno !== z.kontrol.B ||
            num(p[2].pole.verno) !== z.kontrol.V
          )
            fail(where, 'поля ответа и kontrol расходятся');
        }
      }
    }
  }
}

/* №6: разные экземпляры и не из вариантов повышенной сложности. */
if (new Set(vse6).size !== vse6.length) fail('№6', 'экземпляры повторяются между вариантами');
const pvDir = path.join(ROOT, 'app/src/lib/povyshennye/dannye');
const pvText = fs
  .readdirSync(pvDir)
  .filter((f) => /^v\d+\.ts$/.test(f))
  .map((f) => fs.readFileSync(path.join(pvDir, f), 'utf8').replace(/\s+/g, ''))
  .join('\n');
for (const s of vse6) {
  const [xs, ps] = JSON.parse(s);
  if (pvText.includes(`xs:[${xs.join(',')}],ps:[${ps.join(',')}]`))
    fail('№6', `экземпляр ${s} уже есть в вариантах повышенной сложности`);
}

if (failures > 0) {
  console.error(`\ntest:ezhemesyachnye — ошибок: ${failures}`);
  process.exit(1);
}
console.log(
  'test:ezhemesyachnye — 4 варианта: части 1 и 2 собраны, все ответы сошлись со вторым счётом',
);
