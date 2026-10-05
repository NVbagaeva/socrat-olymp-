/**
 * Расположение векторов на поле рисунка.
 *
 * Генератор прототипа решает, какие у векторов координаты (конец
 * минус начало); здесь им подбираются начала так, чтобы рисунок
 * читался: концы внутри окна не ближе клетки к краю, вектор не лежит
 * на оси, векторы не пересекаются, не касаются и держат дистанцию в
 * клетку. Подписи осей, чисел и векторов проверяет уже движок по
 * отчёту — generate.ts отбраковывает рисунок с нарушениями.
 */

import type { Rng } from '../veroyatnost/generator';
import { type Seg, pointSegDist, segSegDist } from './geometry';
import type { Okno, Tochka, Vektor } from './types';

export const NAMES = ['a', 'b', 'c'] as const;

/** Окна рисунков: два вектора — поле поменьше, три — поле ФИПИ. */
export const OKNO_DVA: Okno = { xmin: -1, xmax: 9, ymin: -2, ymax: 7 };
export const OKNO_TRI: Okno = { xmin: -1, xmax: 13, ymin: -2, ymax: 11 };

function seg(v: Vektor): Seg {
  return { x1: v.from[0], y1: v.from[1], x2: v.to[0], y2: v.to[1] };
}

/** Проверка пары: не пересекаются, не касаются, дистанция ≥ 1 клетки. */
function daleko(a: Vektor, b: Vektor): boolean {
  const sa = seg(a);
  const sb = seg(b);
  const sharedStart = a.from[0] === b.from[0] && a.from[1] === b.from[1];
  const d = sharedStart
    ? Math.min(pointSegDist(a.to[0], a.to[1], sb), pointSegDist(b.to[0], b.to[1], sa))
    : segSegDist(sa, sb);
  return d >= 1;
}

export interface RazmeshchenieOpts {
  /** Все векторы выходят из начала координат (B6). */
  izNachala?: boolean;
  /** Только первая четверть: начала и концы с положительными координатами (B6, B7). */
  pervayaChetvert?: boolean;
}

/**
 * Начала для векторов с заданными координатами. null — за 80 попыток
 * расположение не нашлось: генератор берёт другие числа.
 */
export function razmestit(
  r: Rng,
  koordy: readonly Tochka[],
  okno: Okno,
  opts: RazmeshchenieOpts = {},
): Vektor[] | null {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const placed: Vektor[] = [];
    let ok = true;
    for (let i = 0; i < koordy.length && ok; i += 1) {
      const [dx, dy] = koordy[i] as Tochka;
      const name = NAMES[i] as string;
      let found: Vektor | null = null;
      for (let t = 0; t < 40 && found === null; t += 1) {
        const x1 = opts.izNachala ? 0 : r.int(okno.xmin + 1, okno.xmax - 1);
        const y1 = opts.izNachala ? 0 : r.int(okno.ymin + 1, okno.ymax - 1);
        const x2 = x1 + dx;
        const y2 = y1 + dy;
        if (x2 < okno.xmin + 1 || x2 > okno.xmax - 1 || y2 < okno.ymin + 1 || y2 > okno.ymax - 1)
          continue;
        if (opts.pervayaChetvert && !opts.izNachala && (x1 < 1 || y1 < 1 || x2 < 1 || y2 < 1))
          continue;
        if ((y1 === 0 && dy === 0) || (x1 === 0 && dx === 0)) continue;
        /* Концы на осях — только у B6 (из начала координат): иначе
           катет подсказки ложится на ось, а конец — на подпись «0».
           Пересекать оси вектор может. */
        if (!opts.izNachala && (x1 === 0 || y1 === 0 || x2 === 0 || y2 === 0)) continue;
        const v: Vektor = { name, from: [x1, y1], to: [x2, y2] };
        if (placed.every((p) => daleko(p, v))) {
          found = v;
        }
      }
      if (found === null) {
        ok = false;
      } else {
        placed.push(found);
      }
    }
    if (ok) {
      return placed;
    }
  }
  return null;
}
