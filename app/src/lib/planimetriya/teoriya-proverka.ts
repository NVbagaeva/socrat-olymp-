/**
 * Численная проверка формул справочника задания №1.
 *
 * Каждой карточке с формулой (content/teoriya1.ts) — функция, которая
 * строит случайную фигуру в координатах и возвращает пары «величина
 * на фигуре — величина по формуле». Фигура строится независимо от
 * формулы: углы — через скалярное произведение, площади — по формуле
 * шнурования, центры окружностей — пересечением прямых. Автотест
 * (scripts/check-planimetria.mjs) гоняет каждую проверку на 200
 * случайных фигурах с точностью 1e-9.
 *
 * Без численной проверки — только определения (OPREDELENIYA).
 */

import { rngOf } from '../vychisleniya/rng';
import { RAZDELY_TEORII_1 } from '../../content/teoriya1';

type P = readonly [number, number];
type Para = readonly [number, number];
interface Rnd {
  next(): number;
}

/* ── Геометрия в координатах ─────────────────────────────────────── */

const RAD = Math.PI / 180;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1];
const cross = (a: P, b: P) => a[0] * b[1] - a[1] * b[0];
const len = (a: P) => Math.hypot(a[0], a[1]);
const dist = (a: P, b: P) => len(sub(a, b));
const unit = (a: P): P => mul(a, 1 / len(a));
const mid = (a: P, b: P): P => mul(add(a, b), 0.5);
const perp = (a: P): P => [-a[1], a[0]];
const dir = (deg: number): P => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
const naOkr = (o: P, r: number, deg: number): P => add(o, mul(dir(deg), r));

/** Угол AVB в градусах — через скалярное произведение. */
function ug(a: P, v: P, b: P): number {
  const x = sub(a, v);
  const y = sub(b, v);
  return Math.acos(Math.max(-1, Math.min(1, dot(x, y) / (len(x) * len(y))))) / RAD;
}

/** Площадь многоугольника по формуле шнурования. */
function pl(...t: P[]): number {
  let s = 0;
  for (let i = 0; i < t.length; i += 1) s += cross(t[i]!, t[(i + 1) % t.length]!);
  return Math.abs(s) / 2;
}

/** Пересечение прямых AB и CD. */
function per(a: P, b: P, c: P, d: P): P {
  const r = sub(b, a);
  const s = sub(d, c);
  const t = cross(sub(c, a), s) / cross(r, s);
  return add(a, mul(r, t));
}

/** Основание перпендикуляра из P на прямую AB. */
function osn(p: P, a: P, b: P): P {
  const r = sub(b, a);
  return add(a, mul(r, dot(sub(p, a), r) / dot(r, r)));
}

const doPryamoy = (p: P, a: P, b: P) => dist(p, osn(p, a, b));

/** Точка на биссектрисе угла AVB. */
const biss = (a: P, v: P, b: P): P => add(v, add(unit(sub(a, v)), unit(sub(b, v))));

/** Центр описанной окружности — пересечение серединных перпендикуляров. */
function centrOpis(a: P, b: P, c: P): P {
  const m1 = mid(a, b);
  const m2 = mid(b, c);
  return per(m1, add(m1, perp(sub(b, a))), m2, add(m2, perp(sub(c, b))));
}

/** Центр вписанной окружности — пересечение биссектрис. */
const centrVpis = (a: P, b: P, c: P): P => per(a, biss(b, a, c), b, biss(a, b, c));

/** Дуга от точки P до Q против часовой стрелки (градусы), центр O. */
function dugaCcw(o: P, p: P, q: P): number {
  const a = Math.atan2(p[1] - o[1], p[0] - o[0]);
  const b = Math.atan2(q[1] - o[1], q[0] - o[0]);
  return ((((b - a) / RAD) % 360) + 360) % 360;
}

/* ── Случайные фигуры ────────────────────────────────────────────── */

const ot = (r: Rnd, lo: number, hi: number) => lo + r.next() * (hi - lo);

/** Случайный невырожденный треугольник: углы не меньше 12°. */
function treug(r: Rnd, ostryy = false): [P, P, P] {
  for (;;) {
    const a: P = [ot(r, -10, 10), ot(r, -10, 10)];
    const b: P = [ot(r, -10, 10), ot(r, -10, 10)];
    const c: P = [ot(r, -10, 10), ot(r, -10, 10)];
    const u = [ug(b, a, c), ug(a, b, c), ug(a, c, b)];
    if (Math.min(...u) < 12) continue;
    if (ostryy && Math.max(...u) >= 85) continue;
    return [a, b, c];
  }
}

/** Прямоугольный треугольник ABC с прямым углом C, повёрнутый случайно. */
function pryamoy(r: Rnd): [P, P, P] {
  const c: P = [ot(r, -5, 5), ot(r, -5, 5)];
  const t = ot(r, 0, 360);
  const ka = ot(r, 2, 10);
  const kb = ot(r, 2, 10);
  return [add(c, mul(dir(t + 90), ka)), add(c, mul(dir(t), kb)), c];
}

/** Равнобедренный треугольник ABC с вершиной C. */
function ravnobedr(r: Rnd): [P, P, P] {
  const a: P = [ot(r, -5, 5), ot(r, -5, 5)];
  const t = ot(r, 0, 360);
  const osnov = ot(r, 3, 12);
  const h = ot(r, 1, 12);
  const b = add(a, mul(dir(t), osnov));
  return [a, b, add(mid(a, b), mul(dir(t + 90), h))];
}

/** Равносторонний треугольник. */
function pravilnyy(r: Rnd): [P, P, P] {
  const a: P = [ot(r, -5, 5), ot(r, -5, 5)];
  const t = ot(r, 0, 360);
  const s = ot(r, 2, 12);
  return [a, add(a, mul(dir(t), s)), add(a, mul(dir(t + 60), s))];
}

/** Точки на окружности по возрастанию угла (промежутки не меньше min°). */
function naKruge(r: Rnd, n: number, min = 15): { o: P; R: number; t: number[] } {
  for (;;) {
    const t = Array.from({ length: n }, () => ot(r, 0, 360)).sort((x, y) => x - y);
    const ok = t.every((x, i) => (i === 0 ? t[n - 1]! - 360 : t[i - 1]!) <= x - min);
    if (ok) return { o: [ot(r, -3, 3), ot(r, -3, 3)], R: ot(r, 2, 9), t };
  }
}

/** Выпуклый четырёхугольник ABCD (против часовой). */
function chetyreh(r: Rnd): [P, P, P, P] {
  for (;;) {
    const { t } = naKruge(r, 4, 30);
    const q = t.map((x) => mul(dir(x), ot(r, 4, 9))) as [P, P, P, P];
    const vyp = q.every(
      (p, i) => cross(sub(q[(i + 1) % 4]!, p), sub(q[(i + 2) % 4]!, q[(i + 1) % 4]!)) > 1,
    );
    if (vyp) return q;
  }
}

/** Трапеция ABCD: AD ∥ BC, AD — большее основание. */
function trapeciya(r: Rnd, ravnobedrennaya = false): [P, P, P, P] {
  const a = ot(r, 8, 14);
  const b = ot(r, 2, a - 2);
  const h = ot(r, 2, 8);
  const x = ravnobedrennaya ? (a - b) / 2 : ot(r, -2, a - b + 2);
  const t = ot(r, 0, 360);
  const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
  const v = (p: P): P => add(o, [p[0] * Math.cos(t * RAD) - p[1] * Math.sin(t * RAD), p[0] * Math.sin(t * RAD) + p[1] * Math.cos(t * RAD)]);
  return [v([0, 0]), v([x, h]), v([x + b, h]), v([a, 0])];
}

/** Касательные к окружности (центр o, радиус R) в точках под углами t → вершины многоугольника. */
function opisannyy(o: P, R: number, t: number[]): P[] {
  const kas = (x: number): [P, P] => {
    const p = naOkr(o, R, x);
    return [p, add(p, perp(dir(x)))];
  };
  return t.map((x, i) => {
    const [p1, p2] = kas(t[(i + t.length - 1) % t.length]!);
    const [q1, q2] = kas(x);
    return per(p1, p2, q1, q2);
  });
}

const sinG = (x: number) => Math.sin(x * RAD);
const cosG = (x: number) => Math.cos(x * RAD);

/* ── Проверки по карточкам ───────────────────────────────────────── */

type Proverka = (r: Rnd) => Para[];

export const PROVERKI: Record<string, Proverka> = {
  smezhnye: (r) => {
    const o: P = [0, 0];
    const t = ot(r, 0, 360);
    const a = dir(t);
    const b = dir(t + ot(r, 10, 170));
    return [[ug(a, o, b) + ug(b, o, mul(a, -1)), 180]];
  },
  vertikalnye: (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const a = add(o, dir(ot(r, 0, 360)));
    const b = add(o, dir(ot(r, 0, 360)));
    return [[ug(a, o, b), ug(add(o, sub(o, a)), o, add(o, sub(o, b)))]];
  },
  parallelnye: (r) => {
    const h = ot(r, 1, 8);
    const p: P = [ot(r, -5, 5), 0];
    const q: P = [ot(r, -5, 5), h];
    const a1 = ug(add(p, [1, 0]), p, q);
    const a2 = ug(add(q, [-1, 0]), q, p);
    const a3 = ug(add(q, [1, 0]), q, p);
    return [
      [a1, a2],
      [a1 + a3, 180],
    ];
  },
  'bissektrisa-ugla': (r) => {
    const a: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const t = ot(r, 0, 360);
    const b = add(a, dir(t));
    const c = add(a, dir(t + ot(r, 20, 170)));
    const l = biss(b, a, c);
    return [
      [ug(b, a, l), ug(l, a, c)],
      [ug(b, a, l), ug(b, a, c) / 2],
    ];
  },
  'summa-uglov': (r) => {
    const [a, b, c] = treug(r);
    return [[ug(b, a, c) + ug(a, b, c) + ug(a, c, b), 180]];
  },
  vneshniy: (r) => {
    const [a, b, c] = treug(r);
    const d = add(c, sub(c, a));
    return [[ug(b, c, d), ug(b, a, c) + ug(a, b, c)]];
  },
  neravenstvo: (r) => {
    const [a, b, c] = treug(r);
    const [x, y, z] = [dist(b, c), dist(a, c), dist(a, b)];
    return [
      [Number(x < y + z), 1],
      [Number(y < x + z), 1],
      [Number(z < x + y), 1],
    ];
  },
  'bolshaya-storona': (r) => {
    const [a, b, c] = treug(r);
    return [[Math.sign(dist(b, c) - dist(a, c)), Math.sign(ug(b, a, c) - ug(a, b, c))]];
  },
  'ploshchad-treugolnika': (r) => {
    const [a, b, c] = treug(r);
    return [[pl(a, b, c), 0.5 * dist(b, c) * doPryamoy(a, b, c)]];
  },
  'ploshchad-sinus': (r) => {
    const [a, b, c] = treug(r);
    return [[pl(a, b, c), 0.5 * dist(c, a) * dist(c, b) * sinG(ug(a, c, b))]];
  },
  geron: (r) => {
    const [a, b, c] = treug(r);
    const [x, y, z] = [dist(b, c), dist(a, c), dist(a, b)];
    const p = (x + y + z) / 2;
    return [[pl(a, b, c), Math.sqrt(p * (p - x) * (p - y) * (p - z))]];
  },
  'ploshchad-pr': (r) => {
    const [a, b, c] = treug(r);
    const i = centrVpis(a, b, c);
    const p = (dist(a, b) + dist(b, c) + dist(c, a)) / 2;
    return [[pl(a, b, c), p * doPryamoy(i, a, b)]];
  },
  'ploshchad-R': (r) => {
    const [a, b, c] = treug(r);
    const R = dist(centrOpis(a, b, c), a);
    return [[pl(a, b, c), (dist(a, b) * dist(b, c) * dist(c, a)) / (4 * R)]];
  },
  'teorema-sinusov': (r) => {
    const [a, b, c] = treug(r);
    const R = dist(centrOpis(a, b, c), a);
    return [
      [dist(b, c) / sinG(ug(b, a, c)), 2 * R],
      [dist(a, c) / sinG(ug(a, b, c)), 2 * R],
      [dist(a, b) / sinG(ug(a, c, b)), 2 * R],
    ];
  },
  kosinusov: (r) => {
    const [a, b, c] = treug(r);
    const [x, y] = [dist(c, b), dist(c, a)];
    return [[dist(a, b) ** 2, x * x + y * y - 2 * x * y * cosG(ug(a, c, b))]];
  },
  pifagor: (r) => {
    const [a, b, c] = pryamoy(r);
    return [[dist(a, b) ** 2, dist(a, c) ** 2 + dist(b, c) ** 2]];
  },
  trig: (r) => {
    const [a, b, c] = pryamoy(r);
    const B = ug(a, b, c);
    return [
      [sinG(B), dist(a, c) / dist(a, b)],
      [cosG(B), dist(b, c) / dist(a, b)],
      [Math.tan(B * RAD), dist(a, c) / dist(b, c)],
    ];
  },
  tablica: (r) => {
    /* Половина правильного треугольника и половина квадрата. */
    const [a, b, d] = pravilnyy(r);
    const c = mid(b, d);
    const s = dist(a, b);
    const k = mid(a, d);
    return [
      [ug(c, a, b), 30],
      [dist(b, c) / s, 0.5],
      [sinG(30), 0.5],
      [cosG(60), 0.5],
      [dist(a, c) / s, Math.sqrt(3) / 2],
      [dist(b, c) / dist(a, c), Math.sqrt(3) / 3],
      [dist(a, c) / dist(b, c), Math.sqrt(3)],
      [sinG(45), Math.SQRT2 / 2],
      [Math.tan(45 * RAD), 1],
      [dist(a, k) / dist(a, b), 0.5],
    ];
  },
  'osnovnoe-tozhdestvo': (r) => {
    const [a, b, c] = pryamoy(r);
    const A = ug(b, a, c);
    return [
      [sinG(A) ** 2 + cosG(A) ** 2, 1],
      [(dist(b, c) / dist(a, b)) ** 2 + (dist(a, c) / dist(a, b)) ** 2, 1],
      [sinG(ug(a, b, c)), cosG(A)],
    ];
  },
  'cos-ravnobedrennyy': (r) => {
    const [a, b, c] = ravnobedr(r);
    return [[cosG(ug(b, a, c)), dist(a, b) / 2 / dist(a, c)]];
  },
  'vysota-gipotenuza': (r) => {
    const [a, b, c] = pryamoy(r);
    const h = osn(c, a, b);
    return [
      [dist(c, h) ** 2, dist(a, h) * dist(h, b)],
      [dist(c, h), (dist(a, c) * dist(b, c)) / dist(a, b)],
    ];
  },
  'mediana-gipotenuza': (r) => {
    const [a, b, c] = pryamoy(r);
    const m = mid(a, b);
    return [
      [dist(c, m), dist(a, b) / 2],
      [dist(c, m), dist(a, m)],
    ];
  },
  'tupoy-ugol': (r) => {
    for (;;) {
      const [a, b, c] = treug(r);
      const C = ug(a, c, b);
      if (C <= 95) continue;
      const d = add(c, sub(c, a));
      const s = ug(b, c, d);
      /* Косинус тупого угла — из теоремы косинусов, независимо от угла. */
      const [x, y, z] = [dist(c, b), dist(c, a), dist(a, b)];
      return [
        [sinG(C), sinG(s)],
        [(x * x + y * y - z * z) / (2 * x * y), -cosG(s)],
      ];
    }
  },
  ravnobedrennyy: (r) => {
    const [a, b, c] = ravnobedr(r);
    return [
      [ug(b, a, c), ug(a, b, c)],
      [ug(a, c, b), 180 - 2 * ug(b, a, c)],
    ];
  },
  'pravilnyy-treugolnik': (r) => {
    const [a, b, c] = pravilnyy(r);
    const s = dist(a, b);
    return [
      [doPryamoy(c, a, b), (s * Math.sqrt(3)) / 2],
      [pl(a, b, c), (s * s * Math.sqrt(3)) / 4],
    ];
  },
  '30-60-90': (r) => {
    const [a, b, d] = pravilnyy(r);
    const c = mid(b, d);
    return [
      [ug(c, a, b), 30],
      [dist(b, c), dist(a, b) / 2],
      [dist(a, c), (dist(a, b) * Math.sqrt(3)) / 2],
    ];
  },
  '45-45-90': (r) => {
    const a: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const t = ot(r, 0, 360);
    const s = ot(r, 1, 9);
    const c = add(a, mul(dir(t), s));
    const b = add(c, mul(dir(t + 90), s));
    return [
      [ug(c, a, b), 45],
      [dist(a, b), s * Math.SQRT2],
    ];
  },
  podobnye: (r) => {
    const [a, b, c] = treug(r);
    const k = ot(r, 0.3, 3);
    const t = ot(r, 0, 360);
    const f = (p: P): P => {
      const q = mul(p, k);
      return add([q[0] * cosG(t) - q[1] * sinG(t), q[0] * sinG(t) + q[1] * cosG(t)], [3, -2]);
    };
    return [[pl(f(a), f(b), f(c)) / pl(a, b, c), k * k]];
  },
  'srednyaya-liniya': (r) => {
    const [a, b, c] = treug(r);
    const m = mid(a, c);
    const n = mid(b, c);
    return [
      [dist(m, n), dist(a, b) / 2],
      [pl(m, c, n), pl(a, b, c) / 4],
      [cross(sub(n, m), sub(b, a)), 0],
    ];
  },
  otsechennyy: (r) => {
    const [a, b, c] = treug(r);
    const f = add(b, mul(sub(a, b), ot(r, 0.15, 0.85)));
    const e = per(f, add(f, sub(c, a)), b, c);
    return [[pl(f, b, e) / pl(a, b, c), (dist(b, f) / dist(b, a)) ** 2]];
  },
  mediany: (r) => {
    const [a, b, c] = treug(r);
    const k = mid(b, c);
    const m = per(a, k, b, mid(a, c));
    return [[dist(a, m) / dist(m, k), 2]];
  },
  'mediana-ploshchad': (r) => {
    const [a, b, c] = treug(r);
    const m = mid(a, b);
    return [
      [pl(a, c, m), pl(b, c, m)],
      [pl(a, c, m), pl(a, b, c) / 2],
    ];
  },
  'bissektrisa-delit': (r) => {
    const [a, b, c] = treug(r);
    const l = per(c, biss(a, c, b), a, b);
    return [[dist(a, l) / dist(l, b), dist(a, c) / dist(b, c)]];
  },
  'bissektrisa-mediana': (r) => {
    const [a, b, c] = pryamoy(r);
    const d = per(c, biss(a, c, b), a, b);
    const m = mid(a, b);
    return [[ug(d, c, m), Math.abs(ug(b, a, c) - ug(a, b, c)) / 2]];
  },
  'vysota-bissektrisa': (r) => {
    const [a, b, c] = pryamoy(r);
    const d = per(c, biss(a, c, b), a, b);
    const h = osn(c, a, b);
    return [[ug(h, c, d), Math.abs(ug(b, a, c) - ug(a, b, c)) / 2]];
  },
  'vysota-mediana': (r) => {
    const [a, b, c] = pryamoy(r);
    const h = osn(c, a, b);
    return [[ug(h, c, mid(a, b)), Math.abs(ug(b, a, c) - ug(a, b, c))]];
  },
  'vysoty-peresechenie': (r) => {
    const [a, b, c] = treug(r, true);
    const d = osn(b, a, c);
    const e = osn(c, a, b);
    const o = per(b, d, c, e);
    return [[ug(d, o, e), 180 - ug(b, a, c)]];
  },
  'bissektrisy-peresechenie': (r) => {
    const [a, b, c] = treug(r);
    const o = centrVpis(a, b, c);
    return [[ug(a, o, b), 90 + ug(a, c, b) / 2]];
  },
  'bissektrisy-45': (r) => {
    const [a, b, c] = pryamoy(r);
    return [[ug(a, centrVpis(a, b, c), b), 135]];
  },
  seredinnyy: (r) => {
    const [a, b, c] = treug(r);
    const o = centrOpis(a, b, c);
    return [
      [dist(o, a), dist(o, b)],
      [dist(o, b), dist(o, c)],
    ];
  },
  'vpisannaya-treugolnik': (r) => {
    const [a, b, c] = treug(r);
    const i = centrVpis(a, b, c);
    const p = (dist(a, b) + dist(b, c) + dist(c, a)) / 2;
    return [
      [doPryamoy(i, a, b), pl(a, b, c) / p],
      [doPryamoy(i, b, c), doPryamoy(i, a, c)],
    ];
  },
  'summa-360': (r) => {
    const [a, b, c, d] = chetyreh(r);
    return [[ug(d, a, b) + ug(a, b, c) + ug(b, c, d) + ug(c, d, a), 360]];
  },
  'ploshchad-diagonali': (r) => {
    const [a, b, c, d] = chetyreh(r);
    const o = per(a, c, b, d);
    return [[pl(a, b, c, d), 0.5 * dist(a, c) * dist(b, d) * sinG(ug(a, o, b))]];
  },
  varinon: (r) => {
    const [a, b, c, d] = chetyreh(r);
    const [k, l, m, n] = [mid(a, b), mid(b, c), mid(c, d), mid(d, a)];
    return [
      [pl(k, l, m, n), pl(a, b, c, d) / 2],
      [dist(sub(l, k), sub(m, n)), 0],
    ];
  },
  'ugly-trapecii': (r) => {
    const [a, b, c, d] = trapeciya(r);
    return [[ug(d, a, b) + ug(a, b, c), 180]];
  },
  'ploshchad-trapecii': (r) => {
    const [a, b, c, d] = trapeciya(r);
    return [[pl(a, b, c, d), ((dist(a, d) + dist(b, c)) / 2) * doPryamoy(b, a, d)]];
  },
  'srednyaya-liniya-trapecii': (r) => {
    const [a, b, c, d] = trapeciya(r);
    return [[dist(mid(a, b), mid(c, d)), (dist(a, d) + dist(b, c)) / 2]];
  },
  'serediny-diagonaley': (r) => {
    const [a, b, c, d] = trapeciya(r);
    return [[dist(mid(a, c), mid(b, d)), (dist(a, d) - dist(b, c)) / 2]];
  },
  'proekciya-trapecii': (r) => {
    const [a, b, c, d] = trapeciya(r, true);
    const h = osn(b, a, d);
    const [x, y] = [dist(a, d), dist(b, c)];
    return [
      [dist(a, h), (x - y) / 2],
      [dist(h, d), (x + y) / 2],
    ];
  },
  parallelogramm: (r) => {
    const [a, b, d] = treug(r);
    const c = add(b, sub(d, a));
    const o = per(a, c, b, d);
    return [
      [ug(d, a, b) + ug(a, b, c), 180],
      [dist(a, o), dist(o, c)],
      [dist(b, o), dist(o, d)],
    ];
  },
  'ploshchad-parallelogramma': (r) => {
    const [a, b, d] = treug(r);
    const c = add(b, sub(d, a));
    const s = pl(a, b, c, d);
    return [
      [s, dist(a, d) * doPryamoy(b, a, d)],
      [s, dist(a, b) * doPryamoy(d, a, b)],
      [s, dist(a, b) * dist(a, d) * sinG(ug(b, a, d))],
    ];
  },
  'bissektrisa-parallelogramma': (r) => {
    const [a, b, d] = treug(r);
    const c = add(b, sub(d, a));
    const k = per(a, biss(b, a, d), b, c);
    return [[dist(a, b), dist(b, k)]];
  },
  pryamougolnik: (r) => {
    /* Прямой угол — при A (третья вершина pryamoy). */
    const [b, d, a] = pryamoy(r);
    const c = add(b, sub(d, a));
    return [
      [dist(a, c), Math.hypot(dist(a, b), dist(a, d))],
      [dist(a, c), dist(b, d)],
    ];
  },
  romb: (r) => {
    const a: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const s = ot(r, 2, 9);
    const t = ot(r, 0, 360);
    const b = add(a, mul(dir(t), s));
    const d = add(a, mul(dir(t + ot(r, 20, 160)), s));
    const c = add(b, sub(d, a));
    const ac = sub(c, a);
    const bd = sub(d, b);
    return [
      [dot(ac, bd) / (len(ac) * len(bd)), 0],
      [pl(a, b, c, d), 0.5 * len(ac) * len(bd)],
    ];
  },
  'diametr-khorda': (r) => {
    const { o, R, t } = naKruge(r, 2);
    const a = naOkr(o, R, t[0]!);
    const b = naOkr(o, R, t[1]!);
    const m = osn(o, a, b);
    return [[dist(a, m), dist(m, b)]];
  },
  'kasatelnaya-radius': (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 1, 6);
    const d = R * ot(r, 1.2, 4);
    const t = ot(r, 0, 360);
    const c = naOkr(o, R === 0 ? 1 : d, t);
    const a = naOkr(o, R, t + Math.acos(R / d) / RAD);
    const oa = sub(a, o);
    const ca = sub(a, c);
    return [
      [dot(oa, ca) / (len(oa) * len(ca)), 0],
      [dist(c, a) ** 2, dist(c, o) ** 2 - R * R],
    ];
  },
  'dve-kasatelnye': (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 1, 6);
    const d = R * ot(r, 1.2, 4);
    const t = ot(r, 0, 360);
    const c = naOkr(o, d, t);
    const u = Math.acos(R / d) / RAD;
    const a = naOkr(o, R, t + u);
    const b = naOkr(o, R, t - u);
    return [
      [dist(c, a), dist(c, b)],
      [ug(a, c, b) + ug(a, o, b), 180],
    ];
  },
  'kasanie-okruzhnostey': (r) => {
    const o1: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 1, 6);
    const rr = ot(r, 1, 6);
    const t = ot(r, 0, 360);
    const o2 = naOkr(o1, R + rr, t);
    const c = naOkr(o1, R, t);
    return [
      [dist(o1, o2), R + rr],
      [dist(c, o2), rr],
      [cross(sub(c, o1), sub(o2, o1)), 0],
    ];
  },
  'centralnyy-vpisannyy': (r) => {
    const { o, R, t } = naKruge(r, 3);
    const [a, b, c] = t.map((x) => naOkr(o, R, x)) as [P, P, P];
    /* Вписанный угол ACB опирается на дугу AB, где нет C — от A до B против часовой. */
    const duga = dugaCcw(o, a, b);
    const centr = duga <= 180 ? ug(a, o, b) : 360 - ug(a, o, b);
    return [
      [ug(a, c, b), duga / 2],
      [ug(a, c, b), centr / 2],
    ];
  },
  'odna-duga': (r) => {
    const { o, R, t } = naKruge(r, 4);
    const [a, b, c, d] = t.map((x) => naOkr(o, R, x)) as [P, P, P, P];
    return [[ug(a, c, b), ug(a, d, b)]];
  },
  'na-diametr': (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 1, 8);
    const t = ot(r, 0, 360);
    const c = naOkr(o, R, t + ot(r, 10, 170));
    return [[ug(naOkr(o, R, t), c, naOkr(o, R, t + 180)), 90]];
  },
  'duga-dolya': (r) => {
    const n = 3 + Math.floor(r.next() * 18);
    const k = 1 + Math.floor(r.next() * (n - 1));
    const o: P = [0, 0];
    const t = ot(r, 0, 360);
    const a = naOkr(o, 5, t);
    const b = naOkr(o, 5, t + (360 * k) / n);
    const c = naOkr(o, 5, t + (360 * k) / n + ot(r, 0.05, 0.95) * (360 - (360 * k) / n));
    return [[ug(a, c, b), 0.5 * (k / n) * 360]];
  },
  'khorda-kasatelnaya': (r) => {
    const { o, R, t } = naKruge(r, 2);
    const b = naOkr(o, R, t[0]!);
    const a = naOkr(o, R, t[1]!);
    const c = add(b, perp(sub(b, o)));
    return [[ug(a, b, c), dugaCcw(o, b, a) / 2]];
  },
  'mezhdu-khordami': (r) => {
    const { o, R, t } = naKruge(r, 4);
    const [a, c, b, d] = t.map((x) => naOkr(o, R, x)) as [P, P, P, P];
    const e = per(a, b, c, d);
    return [[ug(a, e, c), (dugaCcw(o, a, c) + dugaCcw(o, b, d)) / 2]];
  },
  sekushchie: (r) => {
    const o: P = [0, 0];
    const R = ot(r, 2, 6);
    const c: P = [R * ot(r, 1.3, 3), 0];
    const u = Math.asin(R / c[0]) / RAD;
    /* Две секущие из C: ближние точки D, E, дальние B, A. */
    const sek = (phi: number): [P, P] => {
      const v = dir(180 + phi);
      const bq = dot(sub(c, o), v);
      const cq = dot(sub(c, o), sub(c, o)) - R * R;
      const s = Math.sqrt(bq * bq - cq);
      return [add(c, mul(v, -bq - s)), add(c, mul(v, -bq + s))];
    };
    const [d, b] = sek(ot(r, 2, u - 2));
    const [e, a] = sek(-ot(r, 2, u - 2));
    return [[ug(a, c, b), (dugaCcw(o, a, b) - dugaCcw(o, d, e)) / 2]];
  },
  'kasatelnaya-sekushchaya': (r) => {
    const o: P = [0, 0];
    const R = ot(r, 2, 6);
    const a: P = [R * ot(r, 1.3, 3), 0];
    const k = naOkr(o, R, Math.acos(R / a[0]) / RAD);
    const v = dir(180 + ot(r, -0.9, 0.9) * (Math.asin(R / a[0]) / RAD));
    const bq = dot(a, v);
    const cq = dot(a, a) - R * R;
    const s = Math.sqrt(bq * bq - cq);
    const b = add(a, mul(v, -bq - s));
    const c = add(a, mul(v, -bq + s));
    return [[dist(a, k) ** 2, dist(a, b) * dist(a, c)]];
  },
  'khordy-peresechenie': (r) => {
    const { o, R, t } = naKruge(r, 4);
    const [a, c, b, d] = t.map((x) => naOkr(o, R, x)) as [P, P, P, P];
    const e = per(a, b, c, d);
    return [[dist(a, e) * dist(e, b), dist(c, e) * dist(e, d)]];
  },
  'r-pryamougolnogo': (r) => {
    const [a, b, c] = pryamoy(r);
    const [x, y, z] = [dist(b, c), dist(a, c), dist(a, b)];
    return [
      [dist(centrOpis(a, b, c), a), z / 2],
      [doPryamoy(centrVpis(a, b, c), a, b), (x + y - z) / 2],
    ];
  },
  'r-pravilnogo': (r) => {
    const [a, b, c] = pravilnyy(r);
    const h = doPryamoy(c, a, b);
    return [
      [doPryamoy(centrVpis(a, b, c), a, b), h / 3],
      [dist(centrOpis(a, b, c), c), (2 * h) / 3],
    ];
  },
  'vpisannyy-chetyrehugolnik': (r) => {
    const { o, R, t } = naKruge(r, 4);
    const [a, b, c, d] = t.map((x) => naOkr(o, R, x)) as [P, P, P, P];
    return [
      [ug(d, a, b) + ug(b, c, d), 180],
      [ug(a, b, c) + ug(c, d, a), 180],
    ];
  },
  'odna-duga-chetyrehugolnik': (r) => {
    const { o, R, t } = naKruge(r, 4);
    const [a, b, c, d] = t.map((x) => naOkr(o, R, x)) as [P, P, P, P];
    return [[ug(a, b, d), ug(a, c, d)]];
  },
  'opisannyy-chetyrehugolnik': (r) => {
    for (;;) {
      const { o, R, t } = naKruge(r, 4, 40);
      if (t.some((x, i) => (i === 0 ? x + 360 - t[3]! : x - t[i - 1]!) > 150)) continue;
      const [a, b, c, d] = opisannyy(o, R, t) as [P, P, P, P];
      return [[dist(a, b) + dist(c, d), dist(b, c) + dist(a, d)]];
    }
  },
  'opisannaya-trapeciya': (r) => {
    /* Касательные: нижнее основание (270°), верхнее (90°) и две боковые. */
    const R = ot(r, 1, 6);
    const t = [270, ot(r, 300, 350), 90, ot(r, 190, 240)];
    const [a, b, c, d] = opisannyy([0, 0], R, t) as [P, P, P, P];
    /* a — на боковой слева внизу… порядок: A (270/лев), B (прав/270), C (прав/90), D (90/лев). */
    const m = dist(mid(a, d), mid(b, c));
    return [
      [dist(a, b) + dist(c, d), dist(b, c) + dist(a, d)],
      [m, (dist(b, c) + dist(a, d)) / 2],
    ];
  },
  'pryamougolnaya-trapeciya': (r) => {
    const R = ot(r, 1, 6);
    const t = [270, ot(r, 300, 350), 90, 180];
    const [a, b, c, d] = opisannyy([0, 0], R, t) as [P, P, P, P];
    return [
      [doPryamoy(c, a, b), 2 * R],
      [dist(d, a), 2 * R],
    ];
  },
  'pravilnyy-shestiugolnik': (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 1, 8);
    const t = ot(r, 0, 360);
    const n = 3 + Math.floor(r.next() * 20);
    const v = (i: number, k: number) => naOkr(o, R, t + (360 * i) / k);
    return [
      [dist(v(0, 6), v(1, 6)), R],
      [ug(v(n - 1, n), v(0, n), v(1, n)), (180 * (n - 2)) / n],
    ];
  },

  /* ── Лайфхаки: свои проверки там, где формула не повторяет карточку ── */

  'fakt-1': (r) => {
    const o: P = [0, 0];
    const t = ot(r, 0, 360);
    const a = dir(t);
    const b = dir(t + ot(r, 10, 170));
    const c = mul(a, -1);
    return [[ug(biss(a, o, b), o, biss(b, o, c)), 90]];
  },
  'fakt-3': (r) => {
    const [a, b, c] = treug(r);
    const k = mid(b, c);
    const m = per(a, k, b, mid(a, c));
    return [[dist(a, m), (2 / 3) * dist(a, k)]];
  },
  'fakt-4': (r) => {
    const [a, b, d] = treug(r);
    const c = add(b, sub(d, a));
    return [[dist(a, c) ** 2 + dist(b, d) ** 2, 2 * (dist(a, b) ** 2 + dist(a, d) ** 2)]];
  },
  'fakt-8': (r) => {
    const [a, b, c, d] = trapeciya(r);
    const e = per(a, c, b, d);
    const f = per(a, b, d, c);
    const m = mid(a, d);
    const n = mid(b, c);
    const s = dist(m, f);
    return [
      [cross(sub(e, f), sub(m, f)) / (s * s), 0],
      [cross(sub(n, f), sub(m, f)) / (s * s), 0],
    ];
  },
  'fakt-12': (r) => {
    const o: P = [ot(r, -3, 3), ot(r, -3, 3)];
    const R = ot(r, 2, 8);
    const u = ot(r, 20, 160);
    const t1 = ot(r, 0, 360);
    const t2 = ot(r, 0, 360);
    const [a, b] = [naOkr(o, R, t1), naOkr(o, R, t1 + u)];
    const [c, d] = [naOkr(o, R, t2), naOkr(o, R, t2 + u)];
    return [
      [dist(a, b), dist(c, d)],
      [doPryamoy(o, a, b), doPryamoy(o, c, d)],
    ];
  },
  'fakt-13': (r) => {
    const o: P = [0, 0];
    const R = ot(r, 2, 8);
    const y1 = ot(r, -0.9, 0.9) * R;
    const y2 = ot(r, -0.9, 0.9) * R;
    const x = (y: number) => Math.sqrt(R * R - y * y);
    const a: P = [-x(y1), y1];
    const b: P = [x(y1), y1];
    const c: P = [-x(y2), y2];
    const d: P = [x(y2), y2];
    return [[ug(a, o, c), ug(b, o, d)]];
  },
  'fakt-24': (r) => {
    const R = ot(r, 1, 6);
    const u = ot(r, 300, 350);
    const [a, b, c, d] = opisannyy([0, 0], R, [270, u, 90, 540 - u]) as [P, P, P, P];
    return [
      [dist(b, c), dist(mid(a, d), mid(b, c))],
      [dist(a, d), dist(b, c)],
    ];
  },

  /* ── Для №17 ── */

  'd17-21': (r) => {
    const o1: P = [0, 0];
    const R = ot(r, 1, 5);
    const rr = ot(r, 0.5, R);
    const a = (R + rr) * ot(r, 1.1, 3);
    const o2: P = [a, 0];
    const vnesh = (s: number): number => {
      /* Нормаль касательной n: n·(O₂ − O₁) = R − s·r. */
      const k = (R - s * rr) / a;
      const n: P = [k, Math.sqrt(1 - k * k)];
      const t1 = add(o1, mul(n, R));
      const t2 = add(o2, mul(n, s * rr));
      return dist(t1, t2);
    };
    return [
      [vnesh(1) ** 2, a * a - (R - rr) ** 2],
      [vnesh(-1) ** 2, a * a - (R + rr) ** 2],
    ];
  },
  'd17-27': (r) => {
    const [a, b, c] = treug(r);
    const m = osn(centrVpis(a, b, c), a, c);
    const p = (dist(a, b) + dist(b, c) + dist(c, a)) / 2;
    return [[dist(a, m), p - dist(b, c)]];
  },
  'd17-28': (r) => {
    const [a, b, c] = treug(r);
    /* Центр вневписанной: внешние биссектрисы при B и C. */
    const vneB = add(b, perp(sub(biss(a, b, c), b)));
    const vneC = add(c, perp(sub(biss(a, c, b), c)));
    const j = per(b, vneB, c, vneC);
    const k = osn(j, a, b);
    const p = (dist(a, b) + dist(b, c) + dist(c, a)) / 2;
    return [[dist(a, k), p]];
  },
  'd17-29': (r) => {
    const [a, b, c] = treug(r);
    const i = centrVpis(a, b, c);
    const k = osn(i, a, b);
    const l = osn(i, b, c);
    const m = osn(i, a, c);
    return [[ug(k, l, m), 90 - ug(b, a, c) / 2]];
  },
  'd17-31': (r) => {
    const [a, b, c] = treug(r);
    const m = osn(a, b, c);
    const k = osn(c, a, b);
    return [[dist(m, k), dist(a, c) * Math.abs(cosG(ug(a, b, c)))]];
  },
  'd17-32': (r) => {
    const [a, b, c] = treug(r);
    const ma = dist(a, mid(b, c));
    const mb = dist(b, mid(a, c));
    const mc = dist(c, mid(a, b));
    /* Треугольник из медиан: строим по трём длинам в координатах. */
    const x = (ma * ma + mb * mb - mc * mc) / (2 * ma);
    const y = Math.sqrt(mb * mb - x * x);
    return [[pl([0, 0], [ma, 0], [x, y]), 0.75 * pl(a, b, c)]];
  },
};

/** Формулы-определения: численно проверять нечего. */
export const OPREDELENIYA: Record<string, string> = {
  'vidy-uglov': 'определение развёрнутого угла',
  'dlina-okruzhnosti': 'длина окружности и площадь круга через радиус — определение числа пи',
  sektor: 'дуга и сектор — доля окружности и круга по определению градусной меры',
};

/** Ключ проверки факта: свой или общий с карточкой. */
const FAKTY_KARTOCHKI: Record<number, string> = {
  2: 'mediana-gipotenuza',
  5: 'ploshchad-diagonali',
  6: 'serediny-diagonaley',
  7: 'proekciya-trapecii',
  9: 'diametr-khorda',
  10: 'khordy-peresechenie',
  11: 'diametr-khorda',
  14: 'kasatelnaya-sekushchaya',
  15: 'khorda-kasatelnaya',
  16: 'mezhdu-khordami',
  17: 'sekushchie',
  18: 'r-pryamougolnogo',
  22: 'vpisannyy-chetyrehugolnik',
  23: 'opisannyy-chetyrehugolnik',
};

export function klyuchFakta(no: number): string {
  return FAKTY_KARTOCHKI[no] ?? `fakt-${no}`;
}

export interface ItogFormul {
  formul: number;
  figur: number;
  problems: string[];
  bezProverki: string[];
}

/** Каждая формула справочника — на n случайных фигурах с точностью eps. */
export function proveritFormuly(n = 200, eps = 1e-9): ItogFormul {
  const itog: ItogFormul = { formul: 0, figur: 0, problems: [], bezProverki: [] };
  const zadachi: { metka: string; klyuch: string }[] = [];
  for (const razdel of RAZDELY_TEORII_1) {
    for (const k of razdel.kartochki) {
      if (k.formula === undefined) continue;
      if (OPREDELENIYA[k.id] !== undefined) {
        itog.bezProverki.push(`${k.id}: ${OPREDELENIYA[k.id]}`);
        continue;
      }
      zadachi.push({ metka: `карточка «${k.id}»`, klyuch: k.id });
    }
    for (const f of razdel.fakty ?? []) {
      /* Факт без формулы (8, 11) тоже проверяется, если у него есть проверка. */
      const klyuch = klyuchFakta(f.no);
      if (f.formula === undefined && PROVERKI[klyuch] === undefined) continue;
      zadachi.push({ metka: `факт ${f.no}`, klyuch });
    }
    for (const f of razdel.dlya17 ?? []) {
      if (f.formula === undefined) continue;
      zadachi.push({ metka: `факт ${f.no} (для №17)`, klyuch: `d17-${f.no}` });
    }
  }
  for (const z of zadachi) {
    const f = PROVERKI[z.klyuch];
    if (f === undefined) {
      itog.problems.push(`${z.metka}: нет численной проверки формулы`);
      continue;
    }
    itog.formul += 1;
    const rng = rngOf(`formula:${z.klyuch}`);
    for (let i = 0; i < n; i += 1) {
      itog.figur += 1;
      for (const [x, y] of f(rng)) {
        const d = Math.abs(x - y);
        if (!Number.isFinite(x) || !Number.isFinite(y) || d > eps * Math.max(1, Math.abs(x), Math.abs(y))) {
          itog.problems.push(`${z.metka}: на фигуре ${i} ${x} ≠ ${y}`);
          break;
        }
      }
    }
  }
  return itog;
}
