/**
 * Разрезать выпуклое тело плоскостью сечения на две части.
 *
 * Каждая грань обрезается полупространствами (Сазерленд — Ходжмен),
 * срез закрывается многоугольником сечения. Обе части — снова
 * выпуклые тела, их рисуют и проверяют на видимость так же, как
 * целое тело. Для анимации «разрезать» части раздвигаются вдоль
 * нормали сечения.
 */

import { type V, dot, lerp, scale } from './geom';
import { type Gran, type Sechenie, type Telo, gran, teloIzGraney } from './scena';

/** Часть грани по одну сторону плоскости n·X = c (знак sgn). */
function obrezat(pts: readonly V[], n: V, c: number, sgn: 1 | -1, eps: number): V[] {
  const out: V[] = [];
  const side = (p: V) => sgn * (dot(n, p) - c);
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i] as V;
    const b = pts[(i + 1) % pts.length] as V;
    const sa = side(a);
    const sb = side(b);
    if (sa >= -eps) {
      out.push(a);
    }
    if ((sa > eps && sb < -eps) || (sa < -eps && sb > eps)) {
      out.push(lerp(a, b, sa / (sa - sb)));
    }
  }
  return out;
}

export interface Chasti {
  /** Часть по сторону нормали сечения и противоположная. */
  plyus: Telo;
  minus: Telo;
}

export function razrezat(t: Telo, s: Sechenie, unit: number): Chasti {
  const n = s.n;
  const c = dot(n, s.pts[0] as V);
  const eps = unit * 1e-9;
  const chast = (sgn: 1 | -1): Telo => {
    const grani: Gran[] = [];
    for (const g of t.grani) {
      const p = obrezat(g.pts, n, c, sgn, eps);
      if (p.length >= 3) {
        grani.push({ ...gran(p), n: g.n, c: g.c });
      }
    }
    // Крышка: многоугольник сечения с внешней нормалью −sgn·n.
    const cap = sgn === 1 ? [...s.pts].reverse() : [...s.pts];
    const g = gran(cap);
    const want = scale(n, -sgn);
    grani.push(dot(g.n, want) > 0 ? g : gran([...cap].reverse()));
    return teloIzGraney(grani, unit);
  };
  return { plyus: chast(1), minus: chast(-1) };
}
