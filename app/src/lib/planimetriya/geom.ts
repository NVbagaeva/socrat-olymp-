/**
 * Плоская геометрия движка планиметрии: векторы, построения,
 * окружности. Функции чистые, координаты — математические (y вверх).
 *
 * resolve(scena) вычисляет все точки и окружности сцены в порядке
 * зависимостей: построенная точка может опираться на другие
 * построенные точки и на окружности, окружность — на точки.
 */

import type { OpredelenieOkruzhnosti, OpredelenieTochki, Postroenie, Scena, T2 } from './types';

export const EPS = 1e-9;
export const RAD = Math.PI / 180;

export const add = (a: T2, b: T2): T2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: T2, b: T2): T2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: T2, k: number): T2 => [a[0] * k, a[1] * k];
export const dot = (a: T2, b: T2): number => a[0] * b[0] + a[1] * b[1];
export const cross = (a: T2, b: T2): number => a[0] * b[1] - a[1] * b[0];
export const len = (a: T2): number => Math.hypot(a[0], a[1]);
export const dist = (a: T2, b: T2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp = (a: T2, b: T2, t: number): T2 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
export const mid = (a: T2, b: T2): T2 => lerp(a, b, 0.5);

export function unit(a: T2): T2 {
  const l = len(a);
  return l < EPS ? [0, 0] : [a[0] / l, a[1] / l];
}

/** Вектор по полярному углу в градусах. */
export const polar = (deg: number, r = 1): T2 => [Math.cos(deg * RAD) * r, Math.sin(deg * RAD) * r];

/** Полярный угол вектора, градусы в [0; 360). */
export function angleOf(v: T2): number {
  const a = Math.atan2(v[1], v[0]) / RAD;
  return a < 0 ? a + 360 : a;
}

/** Угол APB при вершине P, градусы в [0; 180]. */
export function angleAt(a: T2, p: T2, b: T2): number {
  const u = sub(a, p);
  const v = sub(b, p);
  const c = dot(u, v) / (len(u) * len(v) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
}

/** Поворот точки вокруг центра на deg градусов против часовой стрелки. */
export function rotate(p: T2, c: T2, deg: number): T2 {
  const s = Math.sin(deg * RAD);
  const k = Math.cos(deg * RAD);
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
}

/** Основание перпендикуляра из P на прямую AB. */
export function foot(p: T2, a: T2, b: T2): T2 {
  const d = sub(b, a);
  const t = dot(sub(p, a), d) / (dot(d, d) || 1);
  return add(a, mul(d, t));
}

/** Параметр t проекции P на прямую AB: P' = A + t(B − A). */
export function projT(p: T2, a: T2, b: T2): number {
  const d = sub(b, a);
  return dot(sub(p, a), d) / (dot(d, d) || 1);
}

/** Пересечение прямых AB и CD; null — параллельны. */
export function intersect(a: T2, b: T2, c: T2, d: T2): T2 | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = cross(r, s);
  if (Math.abs(den) < EPS * (len(r) * len(s) + 1)) {
    return null;
  }
  const t = cross(sub(c, a), s) / den;
  return add(a, mul(r, t));
}

/** Конец биссектрисы угла V треугольника VPQ на стороне PQ. */
export function bisectorFoot(v: T2, p: T2, q: T2): T2 {
  const vp = dist(v, p);
  const vq = dist(v, q);
  return lerp(p, q, vp / (vp + vq));
}

export interface Krug {
  c: T2;
  r: number;
}

export function circumcircle(a: T2, b: T2, c: T2): Krug {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const a2 = dot(a, a);
  const b2 = dot(b, b);
  const c2 = dot(c, c);
  const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  const centr: T2 = [ux, uy];
  return { c: centr, r: dist(centr, a) };
}

export function incircle(a: T2, b: T2, c: T2): Krug {
  const la = dist(b, c);
  const lb = dist(a, c);
  const lc = dist(a, b);
  const p = la + lb + lc;
  const centr: T2 = [
    (a[0] * la + b[0] * lb + c[0] * lc) / p,
    (a[1] * la + b[1] * lb + c[1] * lc) / p,
  ];
  const s = Math.abs(cross(sub(b, a), sub(c, a))) / 2;
  return { c: centr, r: (2 * s) / p };
}

export function orthocenter(a: T2, b: T2, c: T2): T2 {
  const h1 = foot(a, b, c);
  const h2 = foot(b, a, c);
  return intersect(a, h1, b, h2) ?? a;
}

/** Точки пересечения прямой AB с окружностью, по возрастанию параметра t вдоль AB. */
export function lineCircle(a: T2, b: T2, k: Krug): { p: T2; t: number }[] {
  const d = sub(b, a);
  const f = sub(a, k.c);
  const A = dot(d, d);
  const B = 2 * dot(f, d);
  const C = dot(f, f) - k.r * k.r;
  const disc = B * B - 4 * A * C;
  if (disc < -EPS || A < EPS) {
    return [];
  }
  const s = Math.sqrt(Math.max(0, disc));
  const t1 = (-B - s) / (2 * A);
  const t2 = (-B + s) / (2 * A);
  return [
    { p: add(a, mul(d, t1)), t: t1 },
    { p: add(a, mul(d, t2)), t: t2 },
  ];
}

/** Точки касания касательных из внешней точки P к окружности. */
export function tangentPoints(p: T2, k: Krug): [T2, T2] | null {
  const d = dist(p, k.c);
  if (d <= k.r + EPS) {
    return null;
  }
  const base = angleOf(sub(p, k.c));
  const phi = Math.acos(k.r / d) / RAD;
  return [add(k.c, polar(base + phi, k.r)), add(k.c, polar(base - phi, k.r))];
}

/** Расстояние от точки до отрезка AB. */
export function pointSegDist(p: T2, a: T2, b: T2): number {
  const t = Math.max(0, Math.min(1, projT(p, a, b)));
  return dist(p, lerp(a, b, t));
}

/** Площадь многоугольника со знаком (против часовой стрелки — положительная). */
export function signedArea(pts: readonly T2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    s += cross(pts[i]!, pts[(i + 1) % pts.length]!);
  }
  return s / 2;
}

/* ── Вычисление сцены ────────────────────────────────────────────── */

export interface Vychislennaya {
  tochki: Record<string, T2>;
  okruzhnosti: Record<string, Krug>;
}

function isT2(d: OpredelenieTochki): d is T2 {
  return Array.isArray(d);
}

/** Имена точек и окружностей, от которых зависит построение. */
function zavisimosti(d: Postroenie): { tochki: string[]; okr: string[] } {
  if ('seredina' in d) return { tochki: [...d.seredina], okr: [] };
  if ('osnovanie' in d) return { tochki: [...d.osnovanie], okr: [] };
  if ('bissektrisa' in d) return { tochki: [...d.bissektrisa], okr: [] };
  if ('peresechenie' in d) return { tochki: [...d.peresechenie[0], ...d.peresechenie[1]], okr: [] };
  if ('pryamayaOkruzhnost' in d) {
    const v = d.pryamayaOkruzhnost.vybor;
    return {
      tochki: [...d.pryamayaOkruzhnost.pryamaya, ...(typeof v === 'object' ? [v.ne] : [])],
      okr: [d.pryamayaOkruzhnost.okr],
    };
  }
  if ('kasanie' in d) return { tochki: [d.kasanie.iz], okr: [d.kasanie.okr] };
  if ('naDuge' in d) return { tochki: [], okr: [d.naDuge.okr] };
  if ('centrOpisannoy' in d) return { tochki: [...d.centrOpisannoy], okr: [] };
  if ('centrVpisannoy' in d) return { tochki: [...d.centrVpisannoy], okr: [] };
  if ('ortocentr' in d) return { tochki: [...d.ortocentr], okr: [] };
  if ('naPryamoy' in d) return { tochki: [d.naPryamoy[0], d.naPryamoy[1]], okr: [] };
  return { tochki: [...d.summa], okr: [] };
}

function zavisimostiOkr(d: OpredelenieOkruzhnosti): string[] {
  if ('opisannaya' in d) return [...d.opisannaya];
  if ('vpisannaya' in d) return [...d.vpisannaya];
  if ('cherez' in d) return [d.centr, d.cherez];
  if ('kasaetsya' in d) return [d.centr, ...d.kasaetsya];
  return [d.centr];
}

function postroit(d: Postroenie, P: (n: string) => T2, K: (n: string) => Krug): T2 {
  if ('seredina' in d) return mid(P(d.seredina[0]), P(d.seredina[1]));
  if ('osnovanie' in d) return foot(P(d.osnovanie[0]), P(d.osnovanie[1]), P(d.osnovanie[2]));
  if ('bissektrisa' in d) {
    return bisectorFoot(P(d.bissektrisa[0]), P(d.bissektrisa[1]), P(d.bissektrisa[2]));
  }
  if ('peresechenie' in d) {
    const [[a, b], [c, e]] = d.peresechenie;
    const x = intersect(P(a), P(b), P(c), P(e));
    if (x === null) throw new Error(`прямые ${a}${b} и ${c}${e} параллельны`);
    return x;
  }
  if ('pryamayaOkruzhnost' in d) {
    const { pryamaya, okr, vybor } = d.pryamayaOkruzhnost;
    const xs = lineCircle(P(pryamaya[0]), P(pryamaya[1]), K(okr));
    if (xs.length === 0)
      throw new Error(`прямая ${pryamaya.join('')} не пересекает окружность ${okr}`);
    if (vybor === 'dalnyaya') return xs[1]!.p;
    if (vybor === 'blizhnyaya') return xs[0]!.p;
    const ne = P(vybor.ne);
    return dist(xs[0]!.p, ne) > dist(xs[1]!.p, ne) ? xs[0]!.p : xs[1]!.p;
  }
  if ('kasanie' in d) {
    const t = tangentPoints(P(d.kasanie.iz), K(d.kasanie.okr));
    if (t === null) throw new Error(`точка ${d.kasanie.iz} не вне окружности`);
    return d.kasanie.storona === 1 ? t[0] : t[1];
  }
  if ('naDuge' in d) {
    const k = K(d.naDuge.okr);
    return add(k.c, polar(d.naDuge.gradus, k.r));
  }
  if ('centrOpisannoy' in d) {
    const [a, b, c] = d.centrOpisannoy;
    return circumcircle(P(a), P(b), P(c)).c;
  }
  if ('centrVpisannoy' in d) {
    const [a, b, c] = d.centrVpisannoy;
    return incircle(P(a), P(b), P(c)).c;
  }
  if ('ortocentr' in d) {
    const [a, b, c] = d.ortocentr;
    return orthocenter(P(a), P(b), P(c));
  }
  if ('naPryamoy' in d) return lerp(P(d.naPryamoy[0]), P(d.naPryamoy[1]), d.naPryamoy[2]);
  return add(P(d.summa[0]), sub(P(d.summa[1]), P(d.summa[2])));
}

function okruzhnost(d: OpredelenieOkruzhnosti, P: (n: string) => T2): Krug {
  if ('opisannaya' in d) {
    const [a, b, c] = d.opisannaya;
    return circumcircle(P(a), P(b), P(c));
  }
  if ('vpisannaya' in d) {
    const [a, b, c] = d.vpisannaya;
    return incircle(P(a), P(b), P(c));
  }
  if ('cherez' in d) return { c: P(d.centr), r: dist(P(d.centr), P(d.cherez)) };
  if ('kasaetsya' in d) {
    const c = P(d.centr);
    return { c, r: dist(c, foot(c, P(d.kasaetsya[0]), P(d.kasaetsya[1]))) };
  }
  return { c: P(d.centr), r: d.radius };
}

/** Все точки и окружности сцены. Ошибка — циклическая или неразрешимая зависимость. */
export function resolve(scena: Scena): Vychislennaya {
  const tochki: Record<string, T2> = {};
  const okruzhnosti: Record<string, Krug> = {};
  const opr = scena.okruzhnosti ?? {};
  const vTochkah = new Set<string>();
  const vOkr = new Set<string>();

  const P = (n: string): T2 => {
    const got = tochki[n];
    if (got !== undefined) return got;
    const d = scena.tochki[n];
    if (d === undefined) throw new Error(`точка ${n} не определена`);
    if (vTochkah.has(n)) throw new Error(`точка ${n}: циклическое построение`);
    vTochkah.add(n);
    const p = isT2(d) ? d : postroit(d, P, K);
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) throw new Error(`точка ${n}: не число`);
    tochki[n] = p;
    return p;
  };
  const K = (n: string): Krug => {
    const got = okruzhnosti[n];
    if (got !== undefined) return got;
    const d = opr[n];
    if (d === undefined) throw new Error(`окружность ${n} не определена`);
    if (vOkr.has(n)) throw new Error(`окружность ${n}: циклическое построение`);
    vOkr.add(n);
    for (const t of zavisimostiOkr(d)) P(t);
    const k = okruzhnost(d, P);
    okruzhnosti[n] = k;
    return k;
  };

  for (const n of Object.keys(scena.tochki)) {
    const d = scena.tochki[n]!;
    if (!isT2(d)) {
      const z = zavisimosti(d);
      z.okr.forEach(K);
    }
    P(n);
  }
  for (const n of Object.keys(opr)) K(n);
  return { tochki, okruzhnosti };
}
