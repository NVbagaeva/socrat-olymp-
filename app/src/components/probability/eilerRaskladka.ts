/**
 * Раскладка диаграммы Эйлера с точками-исходами.
 *
 * Рисунок как в задачах ЕГЭ: прямоугольник — случайный опыт $S$ (буква
 * в левом верхнем углу), точки — элементарные события. Над точкой —
 * значение случайной величины, справа снизу мелко — вероятность
 * элементарного события (если она задана).
 *
 * Подписи стоят на своих местах относительно точки, поэтому двигаются
 * не подписи, а сами точки: место точки подбирается так, чтобы ни одна
 * рамка подписи не задела чужую подпись, чужую точку, букву $S$ и край
 * прямоугольника. Проверяет пересечения тот же модуль, что раскладывает
 * подписи на всех чертежах сайта (lib/graph/labels.js, `slack`), с теми
 * же запасами. Раскладка детерминирована зерном задачи: один и тот же
 * рисунок на сайте, на листе ученика и в автотесте.
 */

import labels from '@/lib/graph/labels.js';

export const EILER = {
  w: 280,
  h: 200,
  /** Отступ прямоугольника от края рисунка. */
  pole: 4,
  r: 3.6,
  /** Кегль значения и вероятности. */
  kegl: 16,
  keglP: 11.5,
};

export interface Ramka {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

export interface TochkaRaskladki {
  cx: number;
  cy: number;
  /** Рамка значения (над точкой). */
  znachenie: Ramka;
  /** Рамка вероятности (справа снизу); нет — вероятность не задана. */
  veroyatnost?: Ramka;
}

export interface RaskladkaEilera {
  w: number;
  h: number;
  /** Рамка буквы S. */
  s: Ramka;
  tochki: TochkaRaskladki[];
}

/** Ширина подписи по таблице долей кегля общего модуля. */
function shirina(tekst: string, kegl: number): number {
  return labels.pointTextWidth(tekst.replace(/\{,\}/g, ',').replace(/[{}\\]/g, ''), kegl);
}

/** Рамка значения: по центру над точкой. */
export function ramkaZnacheniya(cx: number, cy: number, x: string): Ramka {
  const halfW = shirina(x, EILER.kegl) / 2 + 1.5;
  const halfH = EILER.kegl * 0.38;
  return { x: cx, y: cy - EILER.r - 3 - halfH, halfW, halfH };
}

/** Рамка вероятности: справа снизу, левый край чуть правее точки. */
export function ramkaVeroyatnosti(cx: number, cy: number, p: string): Ramka {
  const halfW = shirina(p, EILER.keglP) / 2 + 1;
  const halfH = EILER.keglP * 0.38;
  return { x: cx + EILER.r + 1.5 + halfW, y: cy + EILER.r + 1 + halfH, halfW, halfH };
}

/** Поле, в котором должны лежать подписи: внутренность прямоугольника. */
export function poleEilera(): { left: number; right: number; top: number; bottom: number } {
  return {
    left: EILER.pole,
    right: EILER.w - EILER.pole,
    top: EILER.pole,
    bottom: EILER.h - EILER.pole,
  };
}

/** Детерминированный ГПСЧ по строке (mulberry32 от FNV-1a). */
function generator(zerno: string): () => number {
  let h = 0x811c9dc5;
  for (const ch of zerno) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let a = h;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Зазор рамки среди препятствий: ≥ 0 — свободно (lib/graph/labels.js). */
function zazor(
  box: Ramka,
  prepyatstviya: { boxes: Ramka[]; points: { x: number; y: number; r: number }[] },
  svoya?: { x: number; y: number },
): number {
  const ob = labels.obstaclesOf({
    field: poleEilera(),
    boxes: prepyatstviya.boxes,
    points: prepyatstviya.points,
  });
  return labels.slack(box, ob, svoya);
}

/**
 * Разложить точки. `tochki` — подписи: значение и (если есть)
 * вероятность. Точки занимают верхние две трети прямоугольника, как на
 * рисунках ЕГЭ, а при тесноте — весь прямоугольник.
 */
export function raskladkaEilera(
  tochki: readonly { x: string; p?: string }[],
  zerno: string,
): RaskladkaEilera {
  const s: Ramka = { x: EILER.pole + 12, y: EILER.pole + 13, halfW: 6, halfH: 8 };
  for (let popytka = 0; popytka < 60; popytka += 1) {
    const rnd = generator(`${zerno}#${popytka}`);
    const gotovo: TochkaRaskladki[] = [];
    const boxes: Ramka[] = [s];
    const points: { x: number; y: number; r: number }[] = [];
    const niz = popytka < 20 ? EILER.h * 0.72 : EILER.h - 22;
    let ok = true;
    for (const t of tochki) {
      let mesto: TochkaRaskladki | null = null;
      for (let i = 0; i < 400 && mesto === null; i += 1) {
        const cx = 22 + rnd() * (EILER.w - 22 - 46);
        const cy = 36 + rnd() * (niz - 36);
        const zn = ramkaZnacheniya(cx, cy, t.x);
        const ver = t.p === undefined ? undefined : ramkaVeroyatnosti(cx, cy, t.p);
        const svoi = ver ? [zn, ver] : [zn];
        /* Своя точка — препятствие для чужих подписей, но не для своих. */
        const chuzhie = { boxes, points };
        if (svoi.some((b) => zazor(b, chuzhie) < 2)) {
          continue;
        }
        /* Точка не ложится на уже стоящие подписи и держится в стороне от других точек. */
        const tochka = { x: cx, y: cy, halfW: EILER.r + 2, halfH: EILER.r + 2 };
        if (zazor(tochka, { boxes, points: [] }) < 2) {
          continue;
        }
        if (points.some((p) => Math.hypot(p.x - cx, p.y - cy) < 34)) {
          continue;
        }
        mesto = { cx, cy, znachenie: zn, ...(ver ? { veroyatnost: ver } : {}) };
      }
      if (mesto === null) {
        ok = false;
        break;
      }
      gotovo.push(mesto);
      boxes.push(mesto.znachenie, ...(mesto.veroyatnost ? [mesto.veroyatnost] : []));
      points.push({ x: mesto.cx, y: mesto.cy, r: EILER.r });
    }
    if (ok) {
      return { w: EILER.w, h: EILER.h, s, tochki: gotovo };
    }
  }
  throw new Error(`диаграмма Эйлера: не удалось разложить ${tochki.length} точек (${zerno})`);
}

/**
 * Проверка готовой раскладки — для автотеста: каждая рамка подписи
 * свободна от чужих подписей, чужих точек, буквы S и края.
 */
export function problemyEilera(r: RaskladkaEilera): string[] {
  const out: string[] = [];
  const vse = r.tochki.flatMap((t, i) => [
    { i, b: t.znachenie, chto: 'значение' },
    ...(t.veroyatnost ? [{ i, b: t.veroyatnost, chto: 'вероятность' }] : []),
  ]);
  for (const a of vse) {
    const boxes = [r.s, ...vse.filter((x) => x !== a).map((x) => x.b)];
    const points = r.tochki
      .filter((_, j) => j !== a.i)
      .map((t) => ({ x: t.cx, y: t.cy, r: EILER.r }));
    const zz = zazor(a.b, { boxes, points });
    if (zz < 0) {
      out.push(`подпись «${a.chto}» точки ${a.i + 1} задевает соседей (зазор ${zz.toFixed(1)})`);
    }
  }
  return out;
}
