/* scripts/verify_trenazher18/obshchee.mjs — общее для проверки задач
   тренажёра №18: та же независимая от lib/ геометрия, что у проверки
   опорных задач (verify_opornye18/obshchee.mjs), и несколько своих
   построений. */

export * from '../verify_opornye18/obshchee.mjs';
export { skal } from '../verify_schemes/obshchee.mjs';

import { add, dist, len, mul, sub } from '../verify_opornye18/obshchee.mjs';

/** Периметр многоугольника. */
export function perimetr(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) s += dist(pts[i], pts[(i + 1) % pts.length]);
  return s;
}

/** Поворот вектора на 90° против часовой. */
export const povorot90 = (v) => [-v[1], v[0]];

/** Скалярное произведение векторов. */
export const skalyar = (a, b) => a[0] * b[0] + a[1] * b[1];

/** Пересечение двух окружностей {c, r}: точки (может не быть). */
export function okrOkr(o1, o2) {
  const d = dist(o1.c, o2.c);
  if (d > o1.r + o2.r || d < Math.abs(o1.r - o2.r) || d === 0) return [];
  const a = (o1.r ** 2 - o2.r ** 2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, o1.r ** 2 - a * a));
  const e = mul(sub(o2.c, o1.c), 1 / d);
  const p = add(o1.c, mul(e, a));
  const n = [-e[1], e[0]];
  return [add(p, mul(n, h)), add(p, mul(n, -h))];
}

/** Точки касания касательных из P к окружности {c, r} (через окружность на диаметре PO). */
export function kasaniya(p, okr) {
  const m = mul(add(p, okr.c), 0.5);
  return okrOkr(okr, { c: m, r: dist(p, okr.c) / 2 });
}

/** Точка на окружности {c, r} под углом u (градусы). */
export const naOkr = (okr, u) =>
  add(okr.c, [okr.r * Math.cos((u * Math.PI) / 180), okr.r * Math.sin((u * Math.PI) / 180)]);

/** Корень f на [a, b]: перебор сетки до смены знака, затем деление пополам. */
export function korenNaSetke(f, a, b, n = 400) {
  let x0 = a;
  let f0 = f(a);
  for (let i = 1; i <= n; i += 1) {
    const x1 = a + ((b - a) * i) / n;
    const f1 = f(x1);
    if (Number.isFinite(f0) && Number.isFinite(f1) && Math.sign(f0) !== Math.sign(f1)) {
      let lo = x0;
      let hi = x1;
      let flo = f0;
      for (let k = 0; k < 200; k += 1) {
        const m = (lo + hi) / 2;
        const fm = f(m);
        if (Math.sign(fm) === Math.sign(flo)) {
          lo = m;
          flo = fm;
        } else hi = m;
      }
      return (lo + hi) / 2;
    }
    x0 = x1;
    f0 = f1;
  }
  return NaN;
}

/** Длина вектора — для краткости в проверках. */
export const dlina = len;
