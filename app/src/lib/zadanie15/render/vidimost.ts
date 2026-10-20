/**
 * Видимость линий сцены №15. Сами правила видимости — в общем ядре
 * (lib/stereo/vidimost): здесь только сборка линий сцены.
 */

import { type V, lerp } from './geom';
import type { Otrezok, Scena } from './scena';
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
  for (const o of sc.otrezki) {
    for (const k of kuskiOtrezka(o.a, o.b, tela, kam, eps)) {
      out.push({ a: lerp(o.a, o.b, k.t0), b: lerp(o.a, o.b, k.t1), vidno: k.vidno, vid: o.vid });
    }
  }
  return out;
}
