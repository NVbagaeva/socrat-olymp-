/**
 * Живые сцены тригонометрической окружности (теория №13): «Угол и
 * координаты точки» и «Деление окружности». Чистая модель без React,
 * проверка — scripts/check-zhivye.mjs. Тексты шагов — content/zhivye13.ts.
 *
 * Углы — в долях π.
 */

import type { HodOpcii } from './hod';

/* ── Угол и координаты ── */

/** Путь точки: от 0 до 13π/3 = 4π + π/3 — два полных оборота и ещё π/3. */
export const UGOL_MAX = 13 / 3;

export const HOD_UGLA: HodOpcii = {
  tMax: UGOL_MAX,
  /* Снимки: четверти первого оборота, затем конец второго оборота. */
  ostanovki: [0.5, 1, 1.5, 2, 4],
  sekNaEd: 1.5,
  sekSnimok: 1.1,
  razgon: 0.1,
};

/** Точные cos и sin на углах, кратных 30° и 45° (TeX), иначе null. */
export function tochno(xPi: number): { cos: string; sin: string } | null {
  const g0 = xPi * 180;
  const g = Math.round(g0);
  if (Math.abs(g0 - g) > 1e-6) return null;
  const v: Record<number, string> = {
    0: '0',
    30: '\\dfrac{1}{2}',
    45: '\\dfrac{\\sqrt{2}}{2}',
    60: '\\dfrac{\\sqrt{3}}{2}',
    90: '1',
  };
  const gg = ((g % 360) + 360) % 360;
  const r = gg <= 90 ? gg : gg <= 180 ? 180 - gg : gg <= 270 ? gg - 180 : 360 - gg;
  const s = v[r];
  const c = v[90 - r];
  if (s === undefined || c === undefined) return null;
  const zn = (x: number, t: string) => (t === '0' ? '0' : x < -1e-12 ? `-${t}` : t);
  const rad = (gg * Math.PI) / 180;
  return { cos: zn(Math.cos(rad), c), sin: zn(Math.sin(rad), s) };
}

/** Сколько полных оборотов в угле и остаток в [0; 2). */
export function oboroty(xPi: number): { n: number; ostatok: number } {
  const n = Math.floor((xPi + 1e-9) / 2);
  return { n, ostatok: xPi - 2 * n };
}

/* ── Деление окружности ── */

export interface ShagDeleniya {
  /** Новые точки шага: [числитель, знаменатель] — угол n/d·π. */
  tochki: readonly (readonly [number, number])[];
}

export interface Maket {
  id: 'chetverti' | 'popolam' | 'na-tri';
  /** На сколько равных дуг делится окружность. */
  delenie: number;
  /** Точки, которые стоят с самого начала. */
  fon: readonly (readonly [number, number])[];
  shagi: readonly ShagDeleniya[];
}

const CHETVERTI = [
  [1, 2],
  [1, 1],
  [3, 2],
  [2, 1],
] as const;

export const MAKETY: readonly Maket[] = [
  {
    id: 'chetverti',
    delenie: 4,
    fon: [],
    shagi: [
      { tochki: [] },
      { tochki: [[1, 2]] },
      { tochki: [[1, 1]] },
      { tochki: [[3, 2]] },
      { tochki: [[2, 1]] },
    ],
  },
  {
    id: 'popolam',
    delenie: 8,
    fon: CHETVERTI,
    shagi: [
      { tochki: [] },
      { tochki: [[1, 4]] },
      { tochki: [[3, 4]] },
      { tochki: [[5, 4]] },
      { tochki: [[7, 4]] },
    ],
  },
  {
    id: 'na-tri',
    delenie: 12,
    fon: CHETVERTI,
    shagi: [
      { tochki: [] },
      { tochki: [[1, 6]] },
      { tochki: [[1, 3]] },
      {
        tochki: [
          [2, 3],
          [5, 6],
        ],
      },
      {
        tochki: [
          [7, 6],
          [4, 3],
        ],
      },
      {
        tochki: [
          [5, 3],
          [11, 6],
        ],
      },
    ],
  },
];

export function hodMaketa(m: Maket): HodOpcii {
  const n = m.shagi.length;
  return {
    tMax: n - 1,
    ostanovki: Array.from({ length: n - 2 }, (_, i) => i + 1),
    sekNaEd: 1.5,
    sekSnimok: 1.6,
    razgon: 0.2,
  };
}

const ugol = ([n, d]: readonly [number, number]) => n / d;

/** Наибольший угол точек шага (куда тянется дуга). */
export function konecShaga(m: Maket, i: number): number {
  const s = m.shagi[i];
  if (s === undefined || s.tochki.length === 0) return 0;
  return Math.max(...s.tochki.map(ugol));
}

/**
 * Дуга, которую откладывают на шаге: в момент t между шагами i и i + 1 —
 * от 0 до угла, интерполированного между концом шага i и концом шага i + 1.
 * Дуга идёт от точки (1; 0) против часовой стрелки.
 */
export function duga(m: Maket, t: number): number {
  const n = m.shagi.length;
  const tt = Math.min(Math.max(t, 0), n - 1);
  const i = Math.min(Math.floor(tt), n - 2);
  const u = tt - i;
  const a = konecShaga(m, i);
  const b = konecShaga(m, i + 1);
  return a + (b - a) * u;
}

/** Точки, которые видны к моменту t: фон и точки пройденных шагов. */
export function vidnyeTochki(
  m: Maket,
  t: number,
): { tochka: readonly [number, number]; novaya: boolean }[] {
  const k = Math.floor(t + 1e-9);
  const out = m.fon.map((tochka) => ({ tochka, novaya: false }));
  m.shagi.forEach((s, i) => {
    if (i <= k) for (const tochka of s.tochki) out.push({ tochka, novaya: i === k });
  });
  return out;
}

/** Подпись угла для SVG: «π/4», «3π/2», «2π», «0». */
export function ugolText(n: number, d: number): string {
  const g = gcd(Math.abs(n), d) || 1;
  const nn = n / g;
  const dd = d / g;
  if (nn === 0) return '0';
  const s = nn < 0 ? '−' : '';
  const a = Math.abs(nn);
  const ch = a === 1 ? 'π' : `${a}π`;
  return dd === 1 ? `${s}${ch}` : `${s}${ch}/${dd}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
