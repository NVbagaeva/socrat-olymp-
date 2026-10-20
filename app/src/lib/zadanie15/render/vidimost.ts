/**
 * Видимость линий сцены №15: какие куски сплошные, какие — штрихом.
 * Правила видимости (грани, луч к зрителю, аналитическое разбиение
 * отрезка) — общее ядро чертежей lib/stereo/vidimost; здесь — сборка
 * линий сцены.
 *
 * Камера — параллельная проекция (направление взгляда) или
 * центральная (точка глаза). Пересчитывается на каждом повороте.
 * Всё считается аналитически (удаление невидимых линий), а не
 * буфером глубины WebGL.
 *
 * Рёбра тела: ребро невидимо, если обе его грани повёрнуты от
 * зрителя, — точное правило для выпуклого тела. Так же — отрезки,
 * лежащие на поверхности (стороны сечения): на лицевой грани —
 * сплошные, на невидимой — штрихом. Ребро «ровно по краю» (одна
 * грань лицевая, другая смотрит ребром) — видно.
 *
 * Любой другой отрезок (след, продолжение ребра, прямая построения,
 * контур секущей плоскости) разбивается на куски точками, где в
 * проекции он пересекает контуры лицевых граней (рёбра, у которых
 * хотя бы одна грань лицевая) и дополнительные контуры (контур
 * плоскости), а также точками, где он протыкает грань. Между такими
 * точками видимость не меняется, поэтому каждый кусок проверяется
 * по одной точке — середине: закрыта ли она лицевой гранью (луч от
 * неё к зрителю входит внутрь тела).
 */

import { type V, dot, lerp } from './geom';
import type { Gran, Otrezok, Scena } from './scena';
import { type Kamera, kuskiOtrezka, rebroVidno } from '@/lib/stereo/vidimost';
import { sdvinut } from '@/lib/stereo/telo';

export * from '@/lib/stereo/vidimost';
export { sdvinut };

/** Готовая к рисованию линия: концы и видимость. */
export interface Liniya {
  a: V;
  b: V;
  vidno: boolean;
  /** rebro — ребро тела; иначе вид отрезка сцены. */
  vid: 'rebro' | Otrezok['vid'];
}

/** Грань к зрителю или смотрит ребром (для отрезков на поверхности). */
function neOtvernuta(g: Gran, kam: Kamera): boolean {
  const l = kam.vid === 'orto' ? dot(g.n, kam.k) : dot(g.n, kam.glaz) - g.c;
  return l > -1e-9;
}

/** Контур секущей плоскости отрезками. */
export function konturPloskosti(pts: readonly V[]): [V, V][] {
  return pts.map((p, i) => [p, pts[(i + 1) % pts.length] as V]);
}

/** Все линии сцены с видимостью для данной камеры. */
export function linii(sc: Scena, kam: Kamera, sdvigi?: readonly V[]): Liniya[] {
  const eps = sc.razmer * 1e-7;
  const tela = sdvigi ? sc.tela.map((t, i) => sdvinut(t, sdvigi[i] ?? [0, 0, 0])) : sc.tela;
  const out: Liniya[] = [];
  tela.forEach((t) => {
    for (const r of t.rebra) {
      out.push({ a: r.a, b: r.b, vidno: rebroVidno(t, r, kam), vid: 'rebro' });
    }
  });
  const kontur = sc.ploskost ? konturPloskosti(sc.ploskost) : [];
  const otrezki: Otrezok[] = [
    ...sc.otrezki,
    ...kontur.map(([a, b]): Otrezok => ({ a, b, vid: 'ploskost' })),
  ];
  const telo = tela[0];
  for (const o of otrezki) {
    if (o.grani && telo && !sdvigi) {
      const vidno = o.grani.some((f) => {
        const g = telo.grani[f];
        return g !== undefined && neOtvernuta(g, kam);
      });
      out.push({ a: o.a, b: o.b, vidno, vid: o.vid });
      continue;
    }
    for (const k of kuskiOtrezka(o.a, o.b, tela, kam, eps, kontur)) {
      out.push({ a: lerp(o.a, o.b, k.t0), b: lerp(o.a, o.b, k.t1), vidno: k.vidno, vid: o.vid });
    }
  }
  return out;
}
