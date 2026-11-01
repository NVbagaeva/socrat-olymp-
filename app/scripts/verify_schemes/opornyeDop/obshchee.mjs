/* scripts/verify_schemes/opornyeDop/obshchee.mjs — общее для проверки
   опорных задач 7–15 и перенесённых задач тренажёра №18: независимая от
   lib/ геометрия в координатах, значение ответа из TeX и подбор
   параметра делением пополам.

   Генератор с зерном, счётчик фактов и сравнение с допуском — те же,
   что у проверки ключевых схем (../obshchee.mjs). */

export {
  blizko,
  dist,
  mid,
  opisannaya,
  orient,
  proveritEkran,
  schetchik,
  ugol,
  zerno,
} from '../obshchee.mjs';

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const len = (a) => Math.hypot(a[0], a[1]);
export const ed = (a) => mul(a, 1 / len(a));
export const polar = (u, r = 1) => [
  r * Math.cos((u * Math.PI) / 180),
  r * Math.sin((u * Math.PI) / 180),
];
/** Точка, делящая PQ в отношении m : n от P. */
export const delit = (p, q, m, n) => add(p, mul(sub(q, p), m / (m + n)));

/** Синус угла между прямыми AB и CD: 0 — параллельны. */
export function sinUgla(a, b, c, d) {
  const r = sub(b, a);
  const s = sub(d, c);
  return Math.abs(r[0] * s[1] - r[1] * s[0]) / (len(r) * len(s));
}

/** Три точки на одной прямой (относительный допуск). */
export const naPryamoy = (a, b, c, eps = 1e-9) => sinUgla(a, b, a, c) < eps;

/** Пересечение прямых AB и CD. */
export function peresech(a, b, c, d) {
  const r = sub(b, a);
  const s = sub(d, c);
  const z = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(z) < 1e-14) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / z;
  return add(a, mul(r, t));
}

/** Основание перпендикуляра из P на прямую AB. */
export function osnovanie(p, a, b) {
  const d = sub(b, a);
  const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
  return add(a, mul(d, t));
}

/** Расстояние от точки P до прямой AB. */
export const doPryamoy = (p, a, b) => len(sub(p, osnovanie(p, a, b)));

/** Площадь многоугольника (без знака), формула шнурования. */
export function ploshchad(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - p[1] * q[0];
  }
  return Math.abs(s) / 2;
}

/** Центр вписанной окружности. */
export function incentr(a, b, c) {
  const la = len(sub(b, c));
  const lb = len(sub(a, c));
  const lc = len(sub(a, b));
  const p = la + lb + lc;
  return [(a[0] * la + b[0] * lb + c[0] * lc) / p, (a[1] * la + b[1] * lb + c[1] * lc) / p];
}

/** Точки пересечения прямой P + t·(Q − P) с окружностью {c, r}: параметры t. */
export function pryamayaOkr(p, q, okr) {
  const d = sub(q, p);
  const f = sub(p, okr.c);
  const A = d[0] ** 2 + d[1] ** 2;
  const B = 2 * (f[0] * d[0] + f[1] * d[1]);
  const C = f[0] ** 2 + f[1] ** 2 - okr.r ** 2;
  const D = B * B - 4 * A * C;
  if (D < 0) return [];
  return [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)].map((t) => ({
    t,
    p: add(p, mul(d, t)),
  }));
}

/** Корень непрерывной f на [a, b] делением пополам (знаки на концах разные). */
export function koren(f, a, b, n = 200) {
  let fa = f(a);
  for (let i = 0; i < n; i += 1) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (Math.sign(fm) === Math.sign(fa)) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return (a + b) / 2;
}

/** Треугольник по трём сторонам: B(0; 0), C(a; 0), A сверху. */
export function poStoronam(a, b, c) {
  const x = (c * c - b * b + a * a) / (2 * a);
  return { A: [x, Math.sqrt(c * c - x * x)], B: [0, 0], C: [a, 0] };
}

/** Случайный треугольник с углами не меньше minU градусов. */
export function sluchaynyyTreugolnik(rnd, minU = 12) {
  for (;;) {
    const A = [rnd() * 20 - 10, rnd() * 20 - 10];
    const B = [rnd() * 20 - 10, rnd() * 20 - 10];
    const C = [rnd() * 20 - 10, rnd() * 20 - 10];
    const u = [ugolV(B, A, C), ugolV(A, B, C), ugolV(A, C, B)];
    if (Math.min(...u) >= minU && Math.min(len(sub(A, B)), len(sub(B, C)), len(sub(A, C))) > 1)
      return { A, B, C };
  }
}

function ugolV(a, v, b) {
  const p = sub(a, v);
  const q = sub(b, v);
  const c = (p[0] * q[0] + p[1] * q[1]) / (len(p) * len(q));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

/**
 * Значение ответа, записанного в TeX: целые и десятичные с запятой,
 * \dfrac{…}{…}, \sqrt{…} и \sqrt3. Всё прочее — ошибка: ответ должен
 * быть числом, которое можно сверить.
 */
export function texChislo(tex) {
  let s = tex.trim();
  if (!/^\$[^$]+\$$/.test(s)) throw new Error(`ответ не в одной формуле: ${tex}`);
  s = s.slice(1, -1).replace(/\s+/g, '');
  s = s.replace(/\{,\}/g, '.');
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'R($1)').replace(/\\sqrt(\d)/g, 'R($1)');
  for (let i = 0; i < 10 && /\\d?frac/.test(s); i += 1)
    s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
  /* Умножение без знака: 2R(3), )(, )R(. */
  s = s.replace(/(\d|\))(?=R\(|\()/g, '$1*');
  if (!/^[\d.()+\-*/R]+$/.test(s)) throw new Error(`не разобрать ответ: ${tex} → ${s}`);
  return Function('R', `return ${s};`)(Math.sqrt);
}
