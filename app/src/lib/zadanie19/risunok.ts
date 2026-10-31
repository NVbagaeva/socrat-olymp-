/**
 * Рисунки задания №19 — сцены движка графиков №12 (lib/graph/renderer.js).
 *
 * Своего SVG нет: здесь только сборка сцены. Графики, которых нет среди
 * семейств №12 («W» из модулей, полуокружность, кусок параболы), идут
 * штатным registerCurve: кривая 'f19' берёт функцию f и рисует её на
 * [ot; do], разрывы (f = null) режут линию на куски. Тело рендерера не
 * меняется — так же модуль-кривая заведена в graph/ezhemesyachnye.ts.
 *
 * Обозначения на рисунке — как требует оформление решения: особые точки
 * большими латинскими буквами, выколотые точки пустыми кружками,
 * крайние положения подвижной прямой — вторым и третьим цветом.
 */

import { registerCurve, renderGraph } from '@/lib/graph/renderer.js';
import { sample } from '@/lib/graph/families/shared.js';

/** Функция графика: null там, где она не определена. */
export type F19 = (x: number) => number | null;

export type Cvet19 = 'lineA' | 'lineB' | 'lineC' | 'accent' | 'aux' | 'cross';

export interface Krivaya19 {
  type: 'f19' | 'line';
  f?: F19;
  ot?: number;
  do?: number;
  k?: number;
  b?: number;
  color: Cvet19;
  style?: 'solid' | 'dashed';
  label: null;
}

export interface Tochka19 {
  x: number;
  y: number;
  style: 'solid' | 'open';
  color: Cvet19;
  label: string | null;
}

export interface Figura19 {
  type: 'segment' | 'polygon' | 'circle' | 'label' | 'dot';
  [k: string]: unknown;
}

/** Сцена движка №12: окно, сетка, оси, кривые, точки, фигуры. */
export interface Scena19 {
  window: { xmin: number; xmax: number; ymin: number; ymax: number };
  grid: { step: number; show: boolean };
  axes: {
    labelX: string;
    labelY: string;
    origin: string;
    ticks?: { x?: { at: number; label: string }[]; y?: { at: number; label: string }[] };
  };
  axisLabels: 'minimal' | 'full' | 'none';
  curves: Krivaya19[];
  points: Tochka19[];
  shapes: Figura19[];
  alt: string;
}

/* Плотность выборки: на клетку окна — 60 точек, изломы модулей
   попадают в узлы при целых концах и не скругляются. */
const NA_KLETKU = 60;

registerCurve('f19', (curve: Krivaya19, win: { xmin: number; xmax: number }) => {
  const ot = Math.max(curve.ot ?? win.xmin - 1, win.xmin - 1);
  const dO = Math.min(curve.do ?? win.xmax + 1, win.xmax + 1);
  if (dO <= ot || curve.f === undefined) {
    return [];
  }
  const f = curve.f;
  const shagov = Math.max(60, Math.ceil((dO - ot) * NA_KLETKU));
  return sample((x: number) => f(x), ot, dO, shagov) as { x: number; y: number }[][];
});

/* ── Сборка сцены ────────────────────────────────────────────────── */

export interface Okno19 {
  x: [number, number];
  y: [number, number];
  /** Подписи осей: (x; y) по умолчанию, (x; a) — для метода областей. */
  osi?: [string, string];
  /** Свои подписи делений: числа, которые важны для решения. */
  deleniya?: { x?: number[]; y?: number[] };
  shag?: number;
}

/** Число на делении: десятичная запятая и минус, как в бланке. */
function chisloPodpis(v: number): string {
  const s = String(Math.round(v * 100) / 100).replace('.', ',');
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

export function scena(
  okno: Okno19,
  sostav: { curves?: Krivaya19[]; points?: Tochka19[]; shapes?: Figura19[] },
  alt: string,
): Scena19 {
  const [labelX, labelY] = okno.osi ?? ['x', 'y'];
  const ticks =
    okno.deleniya === undefined
      ? undefined
      : {
          ...(okno.deleniya.x === undefined
            ? {}
            : { x: okno.deleniya.x.map((at) => ({ at, label: chisloPodpis(at) })) }),
          ...(okno.deleniya.y === undefined
            ? {}
            : { y: okno.deleniya.y.map((at) => ({ at, label: chisloPodpis(at) })) }),
        };
  return {
    window: { xmin: okno.x[0], xmax: okno.x[1], ymin: okno.y[0], ymax: okno.y[1] },
    grid: { step: okno.shag ?? 1, show: true },
    axes: { labelX, labelY, origin: '0', ...(ticks === undefined ? {} : { ticks }) },
    axisLabels: ticks === undefined ? 'minimal' : 'full',
    curves: sostav.curves ?? [],
    points: sostav.points ?? [],
    shapes: sostav.shapes ?? [],
    alt,
  };
}

/** График функции f на [ot; do] (без концов — на всё окно). */
export function grafik(
  f: F19,
  cvet: Cvet19 = 'lineA',
  oblast: { ot?: number; do?: number } = {},
  style: 'solid' | 'dashed' = 'solid',
): Krivaya19 {
  return { type: 'f19', f, ...oblast, color: cvet, style, label: null };
}

/** Прямая y = kx + b. */
export function pryamaya(
  k: number,
  b: number,
  cvet: Cvet19 = 'lineB',
  style: 'solid' | 'dashed' = 'solid',
): Krivaya19 {
  return { type: 'line', k, b, color: cvet, style, label: null };
}

/** Вертикальная прямая x = c — отрезком на всю высоту окна. */
export function vertikal(
  c: number,
  y: [number, number],
  cvet: Cvet19 = 'lineA',
  style: 'solid' | 'dashed' = 'solid',
): Figura19 {
  return { type: 'segment', from: [c, y[0]], to: [c, y[1]], color: cvet, style, width: 3.2 };
}

/** Точка с буквой; выколотая — пустым кружком. */
export function tochka(
  x: number,
  y: number,
  bukva: string | null,
  vykolota = false,
  cvet: Cvet19 = 'cross',
): Tochka19 {
  return { x, y, style: vykolota ? 'open' : 'solid', color: cvet, label: bukva };
}

/** Подпись линии на рисунке (формула короткой строкой). */
export function podpis(x: number, y: number, tekst: string, cvet: Cvet19 = 'lineA'): Figura19 {
  return { type: 'label', at: [x, y], text: tekst, color: cvet, anchor: 'start' };
}

/** Закрашенная область — многоугольник с полупрозрачной заливкой. */
export function oblast(
  tochki: [number, number][],
  cvet: Cvet19 = 'lineA',
  prozrachnost = 0.14,
): Figura19 {
  return { type: 'polygon', points: tochki, color: cvet, fillOpacity: prozrachnost };
}

/** SVG рисунка строкой: страница вставляет её как есть. */
export function svg19(s: Scena19): string {
  return renderGraph(s) as string;
}
