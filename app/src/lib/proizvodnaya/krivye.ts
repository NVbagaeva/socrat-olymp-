/**
 * Заготовки рисунков: волна для графика f (или F) и волна для графика
 * производной f′, с отмеченными точками и касательной.
 *
 * Волна задаётся не формулой, а узлами на целой сетке: экстремумы —
 * узлы с целой абсциссой, между ними монотонная интерполяция (см.
 * spline.ts) не даёт ни лишних экстремумов, ни выбросов. Заготовка
 * ничего не знает о вопросе: вопрос и проверка читаемости на неё
 * накладывают прототипы (reshit.ts: problemy).
 */

import type { Rng } from '../veroyatnost/generator';
import { naklony, postroit } from './spline';
import type { Figura, Okno, Uzel } from './types';

export interface Ekstremum {
  x: number;
  tip: 'max' | 'min';
}

export interface Volna {
  uzly: Uzel[];
  /** Внутренние экстремумы в порядке возрастания x. */
  ekstremumy: Ekstremum[];
  a: number;
  b: number;
}

/** Целая абсцисса не ближе `gap` друг к другу: выбор n значений из отрезка. */
export function raznesennye(
  r: Rng,
  lo: number,
  hi: number,
  n: number,
  gap: number,
): number[] | null {
  if (n === 0) {
    return [];
  }
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const xs: number[] = [];
    for (let i = 0; i < n; i += 1) {
      xs.push(r.int(lo, hi));
    }
    xs.sort((p, q) => p - q);
    let good = true;
    for (let i = 1; i < xs.length; i += 1) {
      if ((xs[i] as number) - (xs[i - 1] as number) < gap) {
        good = false;
        break;
      }
    }
    if (good) {
      return xs;
    }
  }
  return null;
}

export interface OpcVolny {
  /** Число внутренних экстремумов: от и до. */
  n: [number, number];
  /** Границы интервала: a ∈ [aLo, aHi], b ∈ [bLo, bHi]. */
  a?: [number, number];
  b?: [number, number];
  /** Высоты экстремумов по модулю (максимум не ниже min, минимум не выше −min). */
  vysota?: [number, number];
  /** Наименьший шаг между экстремумами. */
  shag?: number;
  /** Первый экстремум: 'max', 'min' или случайно. */
  pervyy?: 'max' | 'min';
}

/** Волна для графика f: чередующиеся максимумы и минимумы. */
export function volna(r: Rng, o: OpcVolny): Volna | null {
  const [aLo, aHi] = o.a ?? [-9, -3];
  const [bLo, bHi] = o.b ?? [3, 9];
  const a = r.int(aLo, aHi);
  const b = r.int(bLo, bHi);
  if (b - a < 8 || b - a > 17) {
    return null;
  }
  const n = r.int(o.n[0], o.n[1]);
  const gap = o.shag ?? 2;
  const xs = raznesennye(r, a + 1, b - 1, n, gap);
  if (xs === null) {
    return null;
  }
  const [vLo, vHi] = o.vysota ?? [1, 4];
  const first: 'max' | 'min' = o.pervyy ?? (r.next() < 0.5 ? 'max' : 'min');
  const ext: Ekstremum[] = xs.map((x, i) => ({
    x,
    tip: (i % 2 === 0) === (first === 'max') ? 'max' : 'min',
  }));
  /* Значения: максимумы выше, минимумы ниже, соседние различаются хотя бы на 2. */
  const ys: number[] = [];
  for (const e of ext) {
    let y = 0;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const raw = r.int(vLo, vHi);
      y = e.tip === 'max' ? raw - r.int(0, 1) : -raw + r.int(0, 1);
      const prev = ys[ys.length - 1];
      if (prev === undefined || Math.abs(prev - y) >= 2) {
        break;
      }
    }
    ys.push(y);
  }
  for (let i = 1; i < ys.length; i += 1) {
    if (Math.abs((ys[i] as number) - (ys[i - 1] as number)) < 2) {
      return null;
    }
  }
  const uzly: Uzel[] = [];
  const firstExt = ext[0];
  const lastExt = ext[ext.length - 1];
  /* Левый конец: подход к первому экстремуму снизу (к максимуму) или сверху. */
  if (firstExt === undefined || lastExt === undefined) {
    /* Без экстремумов — монотонная кривая. */
    const ya = r.int(-3, 0);
    const yb = ya + r.int(2, 5) * (r.next() < 0.5 ? 1 : -1);
    return {
      uzly: [
        { x: a, y: ya },
        { x: b, y: yb },
      ],
      ekstremumy: [],
      a,
      b,
    };
  }
  const y0 = ys[0] as number;
  const yEnd = ys[ys.length - 1] as number;
  const ya = firstExt.tip === 'max' ? y0 - r.int(2, 3) : y0 + r.int(2, 3);
  const yb = lastExt.tip === 'max' ? yEnd - r.int(2, 3) : yEnd + r.int(2, 3);
  uzly.push({ x: a, y: ya });
  ext.forEach((e, i) => uzly.push({ x: e.x, y: ys[i] as number }));
  uzly.push({ x: b, y: yb });
  return { uzly, ekstremumy: ext, a, b };
}

export interface NulProizvodnoy {
  x: number;
  /** Знак слева от нуля: +1 — график идёт сверху вниз (максимум f). */
  sleva: 1 | -1;
}

export interface VolnaP {
  uzly: Uzel[];
  nuli: NulProizvodnoy[];
  a: number;
  b: number;
}

export interface OpcVolnyP {
  /** Число нулей f′. */
  n: [number, number];
  a?: [number, number];
  b?: [number, number];
  /** Расстояние между соседними нулями не меньше. */
  shag?: number;
  /** Знак первой доли (до первого нуля): +1, −1 или случайно. */
  pervyy?: 1 | -1;
}

/** Волна для графика f′: узлы-нули на оси, между ними горбы. */
export function volnaP(r: Rng, o: OpcVolnyP): VolnaP | null {
  const [aLo, aHi] = o.a ?? [-9, -3];
  const [bLo, bHi] = o.b ?? [3, 9];
  const a = r.int(aLo, aHi);
  const b = r.int(bLo, bHi);
  if (b - a < 8 || b - a > 17) {
    return null;
  }
  const n = r.int(o.n[0], o.n[1]);
  const gap = o.shag ?? 2;
  const zs = raznesennye(r, a + 1, b - 1, n, gap);
  if (zs === null || zs.length === 0) {
    return null;
  }
  const s0: 1 | -1 = o.pervyy ?? (r.next() < 0.5 ? 1 : -1);
  const uzly: Uzel[] = [];
  const nuli: NulProizvodnoy[] = [];
  /* Доля i лежит между нулями i−1 и i; знак чередуется. */
  const sign = (i: number): 1 | -1 => (i % 2 === 0 ? s0 : (-s0 as 1 | -1));
  const bounds = [a, ...zs, b];
  const lobes = bounds.length - 1;
  for (let i = 0; i < lobes; i += 1) {
    const from = bounds[i] as number;
    const to = bounds[i + 1] as number;
    const s = sign(i);
    const leftEdge = i === 0;
    const rightEdge = i === lobes - 1;
    const room = to - from;
    const interior = !leftEdge && !rightEdge;
    if (interior && room < 2) {
      return null;
    }
    const wantPeak = interior || (room >= 3 && r.next() < 0.6);
    const peakX = wantPeak ? r.int(from + 1, to - 1) : null;
    const peakMag = wantPeak ? (interior ? r.int(1, 4) : r.int(2, 4)) : 0;
    const endMag = wantPeak ? r.int(1, Math.max(1, peakMag - 1)) : r.int(1, 3);
    if (leftEdge) {
      uzly.push({ x: a, y: s * endMag });
    }
    if (peakX !== null) {
      uzly.push({ x: peakX, y: s * peakMag });
    }
    if (rightEdge) {
      uzly.push({ x: b, y: s * endMag });
    } else {
      uzly.push({ x: to, y: 0 });
      nuli.push({ x: to, sleva: s });
    }
  }
  return { uzly, nuli, a, b };
}

/** Окно по узлам: целые границы с запасом, начало координат внутри. */
export function okno(uzly: readonly Uzel[], zapas = 1): Okno {
  const spl = postroit(uzly);
  let ymin = Infinity;
  let ymax = -Infinity;
  const first = uzly[0] as Uzel;
  const last = uzly[uzly.length - 1] as Uzel;
  for (let x = first.x; x <= last.x + 1e-9; x += 0.02) {
    const v = spl.y(x);
    ymin = Math.min(ymin, v);
    ymax = Math.max(ymax, v);
  }
  return {
    xmin: Math.min(first.x - zapas, -1),
    xmax: Math.max(last.x + zapas, 1),
    ymin: Math.min(Math.floor(ymin) - zapas, -1),
    ymax: Math.max(Math.ceil(ymax) + zapas, 1),
  };
}

/** Размер клетки под ширину: широкие окна сжимаются, чтобы влезть. */
export function razmerKletki(o: Okno): number {
  const w = o.xmax - o.xmin;
  return Math.max(24, Math.min(34, Math.floor(560 / Math.max(w, 1))));
}

/** Рисунок «волна» без запроса: остальное достраивает прототип. */
export function figura(
  rezhim: Figura['rezhim'],
  podpis: string,
  uzly: Uzel[],
  extra: Partial<Figura> = {},
): Figura {
  const w = okno(uzly);
  return {
    rezhim,
    okno: w,
    podpis,
    uzly,
    levyy: 'open',
    pravyy: 'open',
    chisla: 'vse',
    chislaY: 'minimum',
    cell: razmerKletki(w),
    ...extra,
  };
}

/* ── Касательная ─────────────────────────────────────────────────── */

/** Допустимые угловые коэффициенты: целые и конечные десятичные дроби. */
export const NAKLONY: { p: number; q: number }[] = [
  { p: 1, q: 4 },
  { p: 1, q: 2 },
  { p: 3, q: 4 },
  { p: 1, q: 1 },
  { p: 3, q: 2 },
  { p: 2, q: 1 },
  { p: 5, q: 2 },
  { p: 3, q: 1 },
  { p: 4, q: 1 },
];

/** Ближайший допустимый наклон (со знаком) к желаемому; null — вне диапазона. */
export function blizhayshiyNaklon(want: number): { p: number; q: number } | null {
  const sign = want < 0 ? -1 : 1;
  const abs = Math.abs(want);
  let best: { p: number; q: number } | null = null;
  let bestD = Infinity;
  for (const c of NAKLONY) {
    const d = Math.abs(c.p / c.q - abs);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  if (best === null || bestD > 0.45 * Math.max(abs, 0.5)) {
    return null;
  }
  return { p: sign * best.p, q: best.q };
}

/** Наклон кривой в узле, если наклон не задан. */
export function naturalnyyNaklon(uzly: readonly Uzel[], i: number): number {
  return naklony(uzly)[i] ?? 0;
}
