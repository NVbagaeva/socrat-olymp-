/**
 * Независимый пересчёт ответов: каждый ответ измеряется на фигуре,
 * построенной по условию в координатах, — без формулы прототипа.
 *
 * Прямая задача (даны углы — найти угол) — строим фигуру и меряем.
 * Обратная (дан угол между высотой и биссектрисой — найти угол
 * треугольника) — подбираем неизвестное бисекцией так, чтобы
 * измеренная величина совпала с данной, и меряем искомое. Так
 * ошибка в формуле прототипа (otvet) не может совпасть с ошибкой
 * проверки: у них нет общего кода, кроме построения точек.
 *
 * В задачнике ответов нет — сверка банка идёт этими двумя расчётами.
 */

import {
  RAD,
  add,
  angleAt,
  dist,
  foot,
  intersect,
  mid,
  polar,
  signedArea,
  tangentPoints,
} from '../geom';
import { opisannayaTrapeciya, opisannyy, opisannyyPoStoronam } from '../figury';
import type { Params } from '../stseny/dsl';
import type { T2 } from '../types';

/** Бисекция: x из [lo; hi], при котором f(x) = cel (f монотонна). */
export function reshit(f: (x: number) => number, lo: number, hi: number, cel: number): number {
  let a = lo;
  let b = hi;
  const rastet = f(b) > f(a);
  for (let i = 0; i < 200; i += 1) {
    const m = (a + b) / 2;
    if (f(m) < cel === rastet) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Треугольник ABC по углам при A и B: AB на оси x. */
function tre(ugolA: number, ugolB: number): { A: T2; B: T2; C: T2 } {
  const A: T2 = [0, 0];
  const B: T2 = [1, 0];
  const C = intersect(A, polar(ugolA), B, add(B, polar(180 - ugolB)));
  if (C === null) throw new Error('треугольник не строится');
  return { A, B, C };
}

const area = (...p: T2[]) => Math.abs(signedArea(p));
const sinU = (u: number) => Math.sin(u * RAD);
const naOkr = (u: number, r = 1): T2 => polar(u, r);
const bis = (v: T2, p: T2, q: T2): T2 => {
  const a = dist(v, p);
  const b = dist(v, q);
  return [p[0] + ((q[0] - p[0]) * a) / (a + b), p[1] + ((q[1] - p[1]) * a) / (a + b)];
};
const rasst = (p: T2, a: T2, b: T2) => dist(p, foot(p, a, b));
/** Масштаб фигуры: умножить все точки. */
const k = (p: T2, s: number): T2 => [p[0] * s, p[1] * s];

/** Параллелограмм ABCD: A в начале, AD по оси x. */
function para(ugolA: number, ad: number, ab: number) {
  const A: T2 = [0, 0];
  const D: T2 = [ad, 0];
  const B = polar(ugolA, ab);
  return { A, B, C: add(B, D), D };
}

/** Вписанный четырёхугольник по дугам AB, BC, CD (по часовой стрелке от A). */
function vpis(ab: number, bc: number, cd: number) {
  const a = 150;
  return { A: naOkr(a), B: naOkr(a - ab), C: naOkr(a - ab - bc), D: naOkr(a - ab - bc - cd) };
}

/** Четырёхугольник вокруг единичной окружности по касательным из вершин A, B, C, D. */
function poKasatelnym(t: readonly number[]) {
  /* Радиус подбирается так, чтобы углы при вершинах дали 360°. */
  const r = reshit(
    (x) => t.reduce((s, ti) => s + 2 * Math.atan(x / ti), 0),
    1e-9,
    100 * Math.max(...t),
    2 * Math.PI,
  );
  const ugol = t.map((ti) => (2 * Math.atan(r / ti)) / RAD);
  const tAB = -90;
  const tBC = tAB + 180 - ugol[1]!;
  const tCD = tBC + 180 - ugol[2]!;
  const tDA = tCD + 180 - ugol[3]!;
  const [B, C, D, A] = opisannyy([tAB, tBC, tCD, tDA], r) as [T2, T2, T2, T2];
  return { A, B, C, D };
}

type Izmerenie = (p: Params) => number;

export const IZMERENIYA: Record<number, Izmerenie> = {
  1: (p) => {
    const t = tre(p.a, p.a);
    return angleAt(t.A, t.C, t.B);
  },
  2: (p) => {
    const x = reshit((u) => 180 - 2 * u, 0.01, 89.99, p.c);
    const t = tre(x, x);
    return p.v ? angleAt(t.A, t.B, t.C) : angleAt(t.C, t.A, t.B);
  },
  3: (p) => {
    const t = tre(180 - p.b, 180 - p.b);
    return angleAt(t.A, t.C, t.B);
  },
  4: (p) => {
    const t = tre(90 - p.b, p.b);
    return angleAt(t.A, t.C, mid(t.A, t.B));
  },
  5: (p) => {
    const t = tre(90 - p.b, p.b);
    return angleAt(bis(t.C, t.A, t.B), t.C, mid(t.A, t.B));
  },
  6: (p) => {
    const ugol = (x: number) => {
      const t = tre(x, 90 - x);
      return angleAt(foot(t.C, t.A, t.B), t.C, bis(t.C, t.A, t.B));
    };
    return reshit(ugol, 0.01, 44.99, p.f);
  },
  7: (p) => {
    const ugol = (x: number) => {
      const t = tre(x, 90 - x);
      return angleAt(mid(t.A, t.B), t.C, bis(t.C, t.A, t.B));
    };
    return reshit(ugol, 0.01, 44.99, p.f);
  },
  8: (p) => {
    const t = tre(p.a, 90 - p.a);
    return angleAt(foot(t.C, t.A, t.B), t.C, mid(t.A, t.B));
  },
  9: (p) => {
    /* Основание AC, вершина B: угол A = 2·CAD. */
    const t = tre(2 * p.d, p.c);
    return angleAt(t.A, t.C, t.B);
  },
  10: (p) => {
    const b = (180 - p.a) / 2;
    const t = tre(b, b);
    const [B, C, A] = [t.A, t.B, t.C];
    const D = foot(B, A, C);
    const E = foot(C, A, B);
    const O = intersect(B, D, C, E) as T2;
    return angleAt(D, O, E);
  },
  11: (p) => {
    const a = (180 - p.c) / 2;
    const t = tre(a, a);
    const O = intersect(t.A, bis(t.A, t.B, t.C), t.B, bis(t.B, t.A, t.C)) as T2;
    return angleAt(t.A, O, t.B);
  },
  12: (p) => {
    const raznost = (x: number) => {
      const f = para(x, 1, 1);
      return angleAt(f.A, f.B, f.C) - angleAt(f.D, f.A, f.B);
    };
    const x = reshit(raznost, 0.01, 89.99, p.d);
    const f = para(x, 1, 1);
    return p.k ? angleAt(f.A, f.B, f.C) : angleAt(f.D, f.A, f.B);
  },
  13: (p) => {
    /* Угол ромба при данной вершине = g; меряем искомый угол. */
    const pri = ['A', 'C', 'B', 'D'][p.k]!;
    const ugolA = pri === 'A' || pri === 'C' ? p.g : 180 - p.g;
    const f = para(ugolA, 1, 1);
    const isk = [
      [f.B, f.D, f.C],
      [f.D, f.B, f.A],
      [f.A, f.C, f.D],
      [f.A, f.C, f.B],
    ][p.k]!;
    return angleAt(isk[0]!, isk[1]!, isk[2]!);
  },
  14: (p) => {
    /* AD = b, AB = a; угол A подбирается так, чтобы высота на CD была h. */
    const vys = (u: number) => {
      const f = para(u, p.b, p.a);
      return rasst(f.B, f.C, f.D);
    };
    const u = reshit(vys, 0.01, 90, p.h);
    const f = para(u, p.b, p.a);
    return rasst(f.C, f.A, f.D);
  },
  15: (p) => {
    const f0 = para(63, 7, 4);
    const s = Math.sqrt(p.s / area(f0.A, f0.B, f0.C, f0.D));
    const { A, B, C, D } = { A: k(f0.A, s), B: k(f0.B, s), C: k(f0.C, s), D: k(f0.D, s) };
    const trap = [
      () => area(A, B, C, mid(C, D)),
      () => area(A, B, mid(B, C), D),
      () => area(A, mid(A, B), C, D),
      () => area(B, C, D, mid(A, D)),
    ][p.k]!;
    return trap();
  },
  16: (p) => {
    /* CA = b, CB = a, угол C подбирается: высота из B на CA равна h. */
    const tri = (u: number) => ({ C: [0, 0] as T2, A: polar(0, p.b), B: polar(u, p.a) });
    const u = reshit((x) => rasst(tri(x).B, tri(x).C, tri(x).A), 0.01, 90, p.h);
    const t = tri(u);
    return rasst(t.A, t.C, t.B);
  },
  17: (p) => area([0, 0], polar(0, p.a), polar(30, p.a)),
  18: (p) => {
    const t = tre(60, 60);
    const s = (p.k * Math.sqrt(3)) / rasst(t.C, t.A, t.B);
    return dist(t.A, t.B) * s;
  },
  19: (p) => {
    const t = tre(40, 65);
    const s = p.s / area(t.A, t.B, t.C);
    return area(t.C, mid(t.A, t.C), mid(t.B, t.C)) * s;
  },
  20: (p) => {
    const t = tre(40, 65);
    const s = p.s / area(t.A, t.B, t.C);
    return area(t.A, t.B, mid(t.B, t.C), mid(t.A, t.C)) * s;
  },
  21: (p) => {
    const t = tre(70, 55);
    const malyy = [
      area(t.B, mid(t.B, t.C), mid(t.A, t.B)),
      area(t.C, mid(t.A, t.C), mid(t.B, t.C)),
      area(t.A, mid(t.A, t.C), mid(t.A, t.B)),
    ][p.k]!;
    return (p.s / malyy) * area(t.A, t.B, t.C);
  },
  22: (p) => {
    const nizh = Math.max(p.a, p.b);
    const verh = Math.min(p.a, p.b);
    const A: T2 = [0, 0];
    const D: T2 = [nizh, 0];
    const B: T2 = [1.3, 3];
    const C: T2 = [1.3 + verh, 3];
    const M = mid(A, B);
    const N = mid(D, C);
    const K = intersect(M, N, A, C) as T2;
    return Math.max(dist(M, K), dist(K, N));
  },
  23: (p) => {
    const C: T2 = [0, Math.sqrt(p.l * p.l - (p.c / 2) ** 2)];
    const A: T2 = [-p.c / 2, 0];
    const B: T2 = [p.c / 2, 0];
    return Math.cos(angleAt(C, A, B) * RAD);
  },
  24: (p) => {
    const u = Math.acos(p.n / p.d) / RAD;
    const C: T2 = [0, 0];
    const B: T2 = [p.bc, 0];
    const A = intersect(C, [0, 1], B, add(B, polar(180 - u))) as T2;
    return dist(A, B);
  },
  25: (p) => {
    /* Катет AC и гипотенуза AB: B на перпендикуляре в C на расстоянии AB от A. */
    const ac = p.k * Math.sqrt(p.m);
    const A: T2 = [0, 0];
    const C: T2 = [ac, 0];
    const y = reshit((h) => dist(A, [ac, h]), 0, p.ab, p.ab);
    return Math.sin(angleAt(C, A, [ac, y]) * RAD);
  },
  26: (p) => {
    const bc = p.k * Math.sqrt(p.m);
    const C: T2 = [0, 0];
    const B: T2 = [bc, 0];
    const y = reshit((h) => dist(B, [0, h]), 0, p.ab, p.ab);
    return Math.cos(angleAt(C, [0, y], B) * RAD);
  },
  27: (p) => {
    const bc = p.k * Math.sqrt(p.m);
    const C: T2 = [0, 0];
    const B: T2 = [bc, 0];
    const y = reshit((h) => dist(B, [0, h]), 0, p.ab, p.ab);
    return Math.sin(angleAt([0, y], B, C) * RAD);
  },
  28: (p) => {
    const a = Math.asin((p.n * Math.sqrt(p.m)) / p.d) / RAD;
    const t = tre(a, 90 - a);
    return Math.sin(angleAt(t.A, t.B, t.C) * RAD);
  },
  29: (p) => {
    const tg = (p.n * Math.sqrt(p.m)) / p.d;
    const C: T2 = [0, 0];
    const A: T2 = [p.ac, 0];
    const B = intersect(C, [0, 1], A, add(A, polar(180 - Math.atan(tg) / RAD))) as T2;
    return dist(A, B);
  },
  30: (p) => {
    const cos = (p.n * Math.sqrt(p.m)) / p.d;
    const u = Math.acos(cos) / RAD;
    const t = tre(u, u);
    const s = (p.hk * Math.sqrt(p.hm)) / rasst(t.C, t.A, t.B);
    return dist(t.A, t.C) * s;
  },
  31: (p) => {
    /* Основание a; угол при основании подбирается: высота к боковой равна h. */
    const vys = (u: number) => {
      const t = tre(u, u);
      return (rasst(t.A, t.B, t.C) / dist(t.A, t.B)) * p.a;
    };
    const u = reshit(vys, 0.01, 89.99, p.h);
    return Math.sin(u * RAD);
  },
  32: (p) => {
    const bh = (u: number) => {
      const t = tre(u, u);
      return (dist(t.B, foot(t.A, t.B, t.C)) / dist(t.A, t.B)) * p.c;
    };
    const u = reshit(bh, 0.01, 89.99, p.m);
    return Math.cos(u * RAD);
  },
  33: (p) => {
    const raznost = (x: number) => {
      const A = naOkr(270 - x);
      const B = naOkr(270 + x);
      const C = naOkr(90);
      return angleAt(A, [0, 0], B) - angleAt(A, C, B);
    };
    const x = reshit(raznost, 0.01, 89.99, p.d);
    return p.k
      ? angleAt(naOkr(270 - x), naOkr(90), naOkr(270 + x))
      : angleAt(naOkr(270 - x), [0, 0], naOkr(270 + x));
  },
  34: (p) => {
    const vpisannyy = (aod: number) => angleAt(naOkr(180 + aod), naOkr(aod), naOkr(0));
    if (p.k === 0) return vpisannyy(p.u);
    const aod = reshit(vpisannyy, 0.01, 179.99, p.u);
    return angleAt(naOkr(180 + aod), [0, 0], naOkr(180));
  },
  35: (p) => {
    const duga = (360 * p.n) / p.d;
    return angleAt(naOkr(270 - duga / 2), naOkr(90 + (duga > 180 ? 0 : 1)), naOkr(270 + duga / 2));
  },
  36: (p) => angleAt(naOkr(70 + p.ac), naOkr(70), naOkr(70 - p.bc)),
  37: (p) => {
    const duga = (u: number) => {
      const C: T2 = [1 / sinU(u), 0];
      const A = (tangentPoints(C, { c: [0, 0], r: 1 }) as [T2, T2])[0];
      return angleAt(A, [0, 0], [1, 0]);
    };
    return p.k ? reshit(duga, 0.01, 89.99, p.u) : duga(p.u);
  },
  38: (p) => {
    const C: T2 = [1 / sinU(p.u), 0];
    const A = (tangentPoints(C, { c: [0, 0], r: 1 }) as [T2, T2])[0];
    return angleAt(A, [0, 0], [-1, 0]);
  },
  39: (p) => {
    const A = naOkr(p.g / 2);
    const B = naOkr(-p.g / 2);
    const C = intersect(A, add(A, polar(p.g / 2 + 90)), B, add(B, polar(-p.g / 2 + 90))) as T2;
    return angleAt(A, C, B);
  },
  40: (p) => {
    /* A и B — дуга t; D и E симметричны, дуга DE подбирается под угол ACB. */
    const tochki = (de: number) => {
      const ost = (360 - p.t - de) / 2;
      const D = naOkr(de / 2);
      const E = naOkr(-de / 2);
      const B = naOkr(de / 2 + ost);
      const A = naOkr(-de / 2 - ost);
      return { A, B, D, E, C: intersect(B, D, A, E) as T2 };
    };
    const de = reshit(
      (x) => {
        const q = tochki(x);
        return angleAt(q.A, q.C, q.B);
      },
      0.01,
      p.t - 0.01,
      p.f,
    );
    const q = tochki(de);
    return angleAt(q.D, q.A, q.E);
  },
  41: (p) => {
    /* Равные касательные из вершины: по трём известным сторонам и
       касательной из A находим остальные касательные, строим
       четырёхугольник вокруг окружности и меряем четвёртую сторону. */
    /* Касательная из A: все четыре касательные положительны. */
    const lo = Math.max(0, p.ab - p.bc);
    const hi = p.k ? Math.min(p.ab, p.ab - p.bc + p.cd) : Math.min(p.ab, p.da);
    const tA = (lo + hi) / 2;
    const tB = p.ab - tA;
    const tC = p.bc - tB;
    const tD = p.k ? p.cd - tC : p.da - tA;
    const f = poKasatelnym([tA, tB, tC, tD]);
    return p.k ? dist(f.D, f.A) : dist(f.C, f.D);
  },
  42: (p) => {
    const f = opisannyyPoStoronam(p.ab, p.bc, p.cd, p.da);
    return dist(f.A, f.B) + dist(f.B, f.C) + dist(f.C, f.D) + dist(f.D, f.A);
  },
  43: (p) => {
    const per = (r: number) => {
      const t = opisannayaTrapeciya(90, Math.asin(Math.min(1, (2 * r) / p.c)) / RAD, r);
      return dist(t.A, t.B) + dist(t.B, t.C) + dist(t.C, t.D) + dist(t.D, t.A);
    };
    return reshit(per, 0.001, p.c / 2 - 1e-9, p.per);
  },
  44: (p) => {
    const r = Math.min(p.c, p.d) * 0.4;
    const t = opisannayaTrapeciya(
      Math.asin((2 * r) / p.c) / RAD,
      Math.asin((2 * r) / p.d) / RAD,
      r,
    );
    return dist(mid(t.A, t.B), mid(t.D, t.C));
  },
  45: (p) => {
    /* Дуга DA подбирается под ∠ABD, дуга CD — под ∠CAD, дуга AB любая. */
    const ab = 100;
    const da = reshit(
      (x) => {
        const q = vpis(ab, 360 - ab - x - 30, 30);
        return angleAt(q.A, q.B, q.D);
      },
      1,
      359 - ab - 31,
      p.abd,
    );
    const cd = reshit(
      (x) => {
        const q = vpis(ab, 360 - ab - da - x, x);
        return angleAt(q.C, q.A, q.D);
      },
      0.1,
      359 - ab - da,
      p.cad,
    );
    const q = vpis(ab, 360 - ab - da - cd, cd);
    return p.k ? angleAt(q.A, q.B, q.D) : angleAt(q.A, q.B, q.C);
  },
  46: (p) => {
    const ab = 80;
    const da = reshit(
      (x) => {
        const q = vpis(ab, 360 - ab - x - 30, 30);
        return angleAt(q.A, q.B, q.D);
      },
      1,
      359 - ab - 31,
      p.abd,
    );
    const cd = reshit(
      (x) => {
        const q = vpis(ab, 360 - ab - da - x, x);
        return angleAt(q.A, q.B, q.C);
      },
      0.1,
      359 - ab - da,
      p.abc,
    );
    const q = vpis(ab, 360 - ab - da - cd, cd);
    return angleAt(q.C, q.A, q.D);
  },
  47: (p) => {
    const ab = 50;
    const bad = (x: number) => {
      const q = vpis(ab, x / 2, x / 2);
      return angleAt(q.D, q.A, q.B);
    };
    const daniy = (x: number) => {
      const q = vpis(ab, x / 2, x / 2);
      return p.k ? angleAt(q.B, q.C, q.D) : bad(x);
    };
    const x = reshit(daniy, 1, 359 - ab - 1, p.u);
    const q = vpis(ab, x / 2, x / 2);
    return p.k ? angleAt(q.D, q.A, q.B) : angleAt(q.B, q.C, q.D);
  },
  48: (p) => {
    /* Дуга CD выбрана, BC подбирается под угол A, DA — под угол B. */
    const cd = (Math.max(0, 2 * p.a + 2 * p.b - 360) + Math.min(2 * p.a, 2 * p.b)) / 2;
    const bc = reshit(
      (x) => {
        const q = vpis(360 - x - cd - 40, x, cd);
        return angleAt(q.D, q.A, q.B);
      },
      0.1,
      359 - cd - 41,
      p.a,
    );
    const ab = reshit(
      (x) => {
        const q = vpis(x, bc, cd);
        return angleAt(q.A, q.B, q.C);
      },
      0.1,
      359.9 - bc - cd,
      p.b,
    );
    const q = vpis(ab, bc, cd);
    const c = angleAt(q.B, q.C, q.D);
    const d = angleAt(q.C, q.D, q.A);
    return p.k ? Math.max(c, d) : Math.min(c, d);
  },
  49: (p) => {
    /* Единичная окружность: дуга AB (с C) подбирается под угол C. */
    const tochki = (s: number) => ({
      A: naOkr(90 + s / 2),
      B: naOkr(90 - s / 2),
      C: naOkr(90 + s * 0.1),
    });
    const s = reshit(
      (x) => {
        const q = tochki(x);
        return angleAt(q.A, q.C, q.B);
      },
      0.01,
      179.99,
      p.g,
    );
    const q = tochki(s);
    return (p.k * Math.sqrt(p.m)) / dist(q.A, q.B);
  },

  /* ── X ──────────────────────────────────────────────────────── */
  50: (p) => {
    const s = p.a + p.b + p.c;
    const t = tre((180 * p.a) / s, (180 * p.b) / s);
    const u = [angleAt(t.C, t.A, t.B), angleAt(t.A, t.B, t.C), angleAt(t.A, t.C, t.B)];
    return p.k ? Math.max(...u) : Math.min(...u);
  },
  51: (p) => {
    const vneshniy = (a: number) => {
      const t = tre(a, 180 - a - p.b);
      return 180 - angleAt(t.A, t.B, t.C);
    };
    return reshit(vneshniy, 0.01, 179.98 - p.b, p.e);
  },
  52: (p) => {
    const t = tre(p.a, p.b);
    const H = intersect(t.A, foot(t.A, t.B, t.C), t.B, foot(t.B, t.A, t.C)) as T2;
    return angleAt(t.A, H, t.B);
  },
  53: (p) => {
    /* AB подбирается так, чтобы биссектриса угла A отсекала BK = m. */
    const bk = (ab: number) => {
      const f = para(60, p.m + p.n, ab);
      const K = intersect(f.A, add(f.A, polar(30)), f.B, f.C) as T2;
      return dist(f.B, K);
    };
    const ab = reshit(bk, 0.01, (p.m + p.n) * 0.999, p.m);
    return 2 * (ab + p.m + p.n);
  },
  54: (p) => {
    const ugol = (w: number) => angleAt([0, 0], mid([0, 0], [w, p.a]), [0, p.a]);
    const w = reshit(ugol, p.a * 1.0001, p.a * 100, 60);
    return Math.hypot(w, p.a);
  },
  55: (p) => {
    const ugol = (h: number) => angleAt([0, 0], [p.p, h], [p.p + p.q, 0]);
    return reshit(ugol, 0.0001, 1000, 90);
  },
  56: (p) => rasst([0, 0], [p.a, 0], [0, p.b]),
  57: (p) => dist(polar(0, p.b), polar(p.g, p.a)),
  58: (p) => {
    const r = (p.n - p.m) / 1.6;
    const sekushchaya = (d: number) => {
      const A: T2 = [d, 0];
      /* Угол секущей подбирается так, чтобы ближняя точка была на расстоянии m. */
      const blizh = (phi: number) => {
        const dir = polar(180 - phi);
        const xs = [] as number[];
        for (const t of [0, 1]) {
          const tt = reshit(
            (s) => dist(add(A, [dir[0] * s, dir[1] * s]), [0, 0]),
            t ? d : 0,
            t ? 2 * d + 2 * r : d,
            r,
          );
          xs.push(tt);
        }
        return xs;
      };
      const phiMax = Math.asin(Math.min(1, r / d)) / RAD - 1e-6;
      const phi = reshit((x) => blizh(x)[0]!, 0, phiMax, p.m);
      return blizh(phi)[1]!;
    };
    const d = reshit(sekushchaya, r + 1e-6, 1000, p.n);
    return Math.sqrt(d * d - r * r);
  },
  59: (p) => {
    const kas = (r: number) => {
      const T = (tangentPoints([p.d, 0], { c: [0, 0], r }) as [T2, T2])[0];
      return dist(T, [p.d, 0]);
    };
    const r = reshit(kas, 1e-6, p.d - 1e-6, p.t);
    return r;
  },
  60: (p) => {
    const B = naOkr(270);
    const C: T2 = [5, -1];
    const ugol = (x: number) => angleAt(naOkr(270 + x), B, C);
    const x = reshit(ugol, 0.01, 179.99, p.f);
    return angleAt(naOkr(270 + x), [0, 0], B);
  },
  61: (p) => {
    const mal = (360 * Math.min(p.k, p.m)) / (p.k + p.m);
    return angleAt(naOkr(90 + mal / 2), naOkr(90), naOkr(90 - mal / 2));
  },
  62: (p) => {
    /* Число вершин: правильный n-угольник с измеренным углом, равным данному. */
    for (let n = 3; n <= 100; n += 1) {
      const u = angleAt(naOkr(360 / n), naOkr(0), naOkr(-360 / n));
      if (Math.abs(u - (180 - 360 / p.n)) < 1e-9) return n;
    }
    return NaN;
  },
  63: (p) => {
    const storona = dist(naOkr(0), naOkr(60));
    return (2 * p.per) / 6 / storona;
  },
  64: (p) => {
    /* Центр вписанной окружности — пересечение биссектрис; меряем радиус. */
    const t = tre(60, 60);
    const s = p.h / rasst(t.C, t.A, t.B);
    const I = intersect(t.A, bis(t.A, t.B, t.C), t.B, bis(t.B, t.A, t.C)) as T2;
    return rasst(I, t.A, t.B) * s;
  },
  65: (p) => area([0, 0], [p.a, 0], polar(Math.asin(p.s) / RAD, p.b)),
  66: (p) => {
    /* Треугольник с углами 50, 60 масштабируется под радиус r; его периметр
       не обязан совпасть с данным — меряем S/(P·r) и умножаем на данные. */
    const t = tre(50, 60);
    const s = area(t.A, t.B, t.C);
    const P = dist(t.A, t.B) + dist(t.B, t.C) + dist(t.C, t.A);
    const la = dist(t.B, t.C);
    const lb = dist(t.A, t.C);
    const lc = dist(t.A, t.B);
    const I: T2 = [
      (t.A[0] * la + t.B[0] * lb + t.C[0] * lc) / P,
      (t.A[1] * la + t.B[1] * lb + t.C[1] * lc) / P,
    ];
    const r = rasst(I, t.A, t.B);
    return (s / (P * r)) * p.per * p.r;
  },
  67: (p) => dist([0, 0], mid([0, 0], [p.a, p.b])),
  68: (p) => {
    const q = vpis(360 - p.b - p.c - 30, p.b, p.c);
    return angleAt(q.B, q.C, q.D);
  },
  69: (p) => dist([0, 0], mid([p.a, 0], [0, p.b])),
  70: (p) => {
    /* Основания 10 и 4; высота подбирается так, чтобы диагонали были перпендикулярны. */
    const ugol = (h: number) => {
      const A: T2 = [0, 0];
      const D: T2 = [10, 0];
      const B: T2 = [3, h];
      const C: T2 = [7, h];
      return angleAt(B, intersect(A, C, B, D) as T2, A);
    };
    const h0 = reshit(ugol, 0.001, 1000, 90);
    return 7 * (p.h / h0);
  },
  71: (p) => {
    const A: T2 = [0, 0];
    const D: T2 = [Math.max(p.a, p.b), 0];
    const B: T2 = [2, 3];
    const C: T2 = [2 + Math.min(p.a, p.b), 3];
    return dist(mid(A, C), mid(B, D));
  },
  72: (p) => {
    const f = para(30, 1, 1);
    const O = mid(f.A, f.C);
    return p.r / rasst(O, f.A, f.D);
  },
  73: (p) => {
    /* Угол OAB = 60°: точки A и B на окружности радиуса R; R подбирается под хорду. */
    const ugolAOB = 180 - 2 * 60;
    return reshit((r) => dist(polar(0, r), polar(ugolAOB, r)), 0.0001, 10000, p.c);
  },
  74: (p) => {
    const ugolA = (180 * p.k) / (p.k + p.n);
    const ugolB = (180 * p.m) / (p.k + p.n);
    const cd = (Math.max(0, 2 * ugolA + 2 * ugolB - 360) + Math.min(2 * ugolA, 2 * ugolB)) / 2;
    const bc = reshit(
      (x) => {
        const q = vpis(360 - x - cd - 1, x, cd);
        return angleAt(q.D, q.A, q.B);
      },
      0.01,
      359 - cd - 1.01,
      ugolA,
    );
    const ab = reshit(
      (x) => angleAt(vpis(x, bc, cd).A, vpis(x, bc, cd).B, vpis(x, bc, cd).C),
      0.01,
      359.99 - bc - cd,
      ugolB,
    );
    const q = vpis(ab, bc, cd);
    return angleAt(q.C, q.D, q.A);
  },
  75: (p) => {
    const a = (p.e * p.k) / (p.k + p.m);
    const t = tre(a, p.e - a);
    const vneshniy = 180 - angleAt(t.A, t.C, t.B);
    if (Math.abs(vneshniy - p.e) > 1e-6) return NaN;
    return Math.max(angleAt(t.C, t.A, t.B), angleAt(t.A, t.B, t.C));
  },
};

/** Ответ, измеренный на фигуре; null — для прототипа нет измерения. */
export function izmerit(proto: number, p: Params): number | null {
  const f = IZMERENIYA[proto];
  return f === undefined ? null : f(p);
}
