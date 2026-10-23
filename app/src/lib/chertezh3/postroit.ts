/**
 * Сценарий → сцена: точки в пространстве, тело ядра, элементы.
 *
 * Ничего не бросает: точка, которую не удалось найти, просто не
 * попадает в сцену, а причина ложится в `oshibki` — их печатает
 * валидатор. Рисовать сцену с ошибками можно (предпросмотр покажет
 * кривой чертёж), выпускать — нет: это ловит автотест.
 */

import { type V, add, centroid, cross, dot, len, lerp, norm, scale, sub } from '@/lib/stereo/vec';
import type { RisuemoeTelo } from '@/lib/stereo/tela';
import { type Geometriya, geometriya, risuemoe } from './geometriya';
import type { Element, Gde, Rol, Scenariy } from './scenariy';

export interface ElementSceny {
  el: Element;
  pts: V[];
  rol: Rol;
}

export interface TochkaSceny {
  imya: string;
  p: V;
  /** vershina — вершина тела; иначе роль дополнительной точки. */
  rol: Rol | 'vershina';
  /** Рисовать ли точку и её имя. */
  pokazat: boolean;
}

export interface Scena3 {
  sc: Scenariy;
  geom: Geometriya;
  telo: RisuemoeTelo;
  tochki: Map<string, TochkaSceny>;
  elementy: ElementSceny[];
  oshibki: string[];
}

export function postroit(sc: Scenariy): Scena3 {
  const oshibki: string[] = [];
  const geom = geometriya(sc.telo);
  const imena = sc.imena ?? [];
  const tochki = new Map<string, TochkaSceny>();
  if (sc.imena !== undefined && geom.vypukloe && sc.imena.length !== geom.vershiny.length) {
    oshibki.push(`имён вершин ${sc.imena.length}, а у тела ${geom.vershiny.length} вершин`);
  }
  geom.vershiny.forEach((p, i) => {
    const imya = imena[i];
    if (imya) {
      tochki.set(imya, { imya, p, rol: 'vershina', pokazat: sc.podpisatVershiny !== false });
    }
  });
  const telo = risuemoe(geom, imena);

  for (const t of sc.tochki ?? []) {
    const p = najti(t.gde, tochki, oshibki, t.imya);
    if (p === null) continue;
    if (tochki.has(t.imya)) {
      oshibki.push(`точка ${t.imya} названа дважды`);
      continue;
    }
    tochki.set(t.imya, { imya: t.imya, p, rol: t.rol ?? 'vspom', pokazat: t.pokazat !== false });
  }

  const elementy: ElementSceny[] = [];
  for (const el of sc.elementy ?? []) {
    const pts: V[] = [];
    for (const n of el.tochki) {
      const t = tochki.get(n);
      if (t === undefined) {
        oshibki.push(`элемент ${el.id}: нет точки ${n}`);
      } else {
        pts.push(t.p);
      }
    }
    if (pts.length === el.tochki.length) {
      elementy.push({ el, pts, rol: el.rol ?? 'vspom' });
    }
  }
  return { sc, geom, telo, tochki, elementy, oshibki };
}

function najti(
  g: Gde,
  tochki: ReadonlyMap<string, TochkaSceny>,
  oshibki: string[],
  imya: string,
): V | null {
  const p = (n: string): V | null => {
    const t = tochki.get(n);
    if (t === undefined) {
      oshibki.push(`точка ${imya}: нет точки ${n}`);
      return null;
    }
    return t.p;
  };
  if ('xyz' in g) return g.xyz;
  if ('seredina' in g) {
    const [a, b] = g.seredina.map(p);
    return a && b ? lerp(a, b, 0.5) : null;
  }
  if ('naOtrezke' in g) {
    const [a, b] = [p(g.naOtrezke[0]), p(g.naOtrezke[1])];
    return a && b ? lerp(a, b, g.naOtrezke[2]) : null;
  }
  if ('centr' in g) {
    const pts = g.centr.map(p);
    return pts.every((x) => x !== null) ? centroid(pts as V[]) : null;
  }
  const x = p(g.proekciya);
  const na = g.na.map(p);
  if (x === null || na.some((q) => q === null)) return null;
  const [a, b, c] = na as V[];
  if (na.length === 2 && a && b) {
    const d = sub(b, a);
    return add(a, scale(d, dot(sub(x, a), d) / dot(d, d)));
  }
  if (na.length === 3 && a && b && c) {
    const n = norm(cross(sub(b, a), sub(c, a)));
    if (len(n) < 1e-12) {
      oshibki.push(`точка ${imya}: плоскость задана точками на одной прямой`);
      return null;
    }
    return sub(x, scale(n, dot(sub(x, a), n)));
  }
  oshibki.push(
    `точка ${imya}: проекция на ${na.length} точек — нужна прямая (2) или плоскость (3)`,
  );
  return null;
}
