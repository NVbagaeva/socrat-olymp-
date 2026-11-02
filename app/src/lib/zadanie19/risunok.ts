/**
 * Рисунки задания №19 — сцены движка графиков №12 (lib/graph/renderer.js).
 *
 * Своего SVG нет: здесь только сборка сцены. Графики, которых нет среди
 * семейств №12 («W» из модулей, полуокружность, кусок параболы), идут
 * штатным registerCurve: кривая 'f19' берёт функцию f и рисует её на
 * [ot; do], разрывы (f = null) режут линию на куски. Окружность
 * ('krug19') и ломаная по вершинам ('loman19') — тоже кривые: так их
 * обходят подписи точек. Тело рендерера не меняется — так же
 * модуль-кривая заведена в graph/ezhemesyachnye.ts.
 *
 * Метод областей рисует на плоскости (x; a): закрашенная область —
 * штатная фигура 'polygon' (oblast, oblastMezhdu — между двумя
 * графиками), горизонталь a = c и куски решения на ней — фигуры
 * 'segment' (gorizontal, otrezokNa), чтобы толстый кусок лёг поверх.
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
  type: 'f19' | 'line' | 'krug19' | 'loman19';
  f?: F19;
  ot?: number;
  do?: number;
  k?: number;
  b?: number;
  /** Окружность 'krug19': центр и радиус. */
  centr?: [number, number];
  r?: number;
  /** Ломаная 'loman19': вершины по порядку; замкнутая — последняя соединена с первой. */
  vershiny?: [number, number][];
  zamknuta?: boolean;
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
  /** Пикселей на клетку; по умолчанию — как у движка (34). */
  cell?: number;
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

/* Окружность — замкнутая ломаная по углу: шаг такой, чтобы хорда
   отходила от дуги меньше чем на сотую клетки. Окно у движка одного
   масштаба по осям, поэтому окружность выходит окружностью, а куски
   за рамкой отрезает общая обрезка кривых. Как кривая, а не фигура
   (shape 'circle'), окружность — препятствие для подписей точек. */
registerCurve('krug19', (curve: Krivaya19) => {
  const [cx, cy] = curve.centr ?? [0, 0];
  const r = curve.r ?? 0;
  if (!(r > 0)) {
    return [];
  }
  const n = Math.min(2000, Math.max(120, Math.ceil(2 * Math.PI * Math.sqrt(r / 0.02))));
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n;
    out.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return [out];
});

/* Ломаная по вершинам: ромб |x| + |y| = c, отрезок, многоугольник. */
registerCurve('loman19', (curve: Krivaya19) => {
  const v = curve.vershiny ?? [];
  const tochki = (curve.zamknuta === true && v.length > 2 ? [...v, v[0]!] : v).map(([x, y]) => ({
    x,
    y,
  }));
  return tochki.length < 2 ? [] : [tochki];
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
  /**
   * Крупнее клетка (пикселей на единицу): у маленького окна, где кривые
   * касаются в одной точке и почти сливаются, подписи точки иначе негде встать.
   */
  kletka?: number;
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
    ...(okno.kletka === undefined ? {} : { cell: okno.kletka }),
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

/** Окружность с центром (cx; cy) радиуса r. */
export function okruzhnost(
  cx: number,
  cy: number,
  r: number,
  cvet: Cvet19 = 'lineA',
  style: 'solid' | 'dashed' = 'solid',
): Krivaya19 {
  return { type: 'krug19', centr: [cx, cy], r, color: cvet, style, label: null };
}

/** Ломаная по вершинам; zamknuta — многоугольник (ромб |x| + |y| = c). */
export function lomanaya(
  vershiny: [number, number][],
  cvet: Cvet19 = 'lineA',
  zamknuta = false,
  style: 'solid' | 'dashed' = 'solid',
): Krivaya19 {
  return { type: 'loman19', vershiny, zamknuta, color: cvet, style, label: null };
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

/**
 * Закрашенная область между графиками: niz(x) ≤ y ≤ verh(x) на [ot; do].
 * Метод областей (№19, глава 3): множество точек (x; a), где выполнено
 * условие. Края — выборка по x, высота обрезана окном y: пересечение
 * области с полосой окна — та же область между обрезанными графиками,
 * поэтому за рамку заливка не выходит. Концы [ot; do] — внутри окна.
 */
export function oblastMezhdu(
  niz: (x: number) => number,
  verh: (x: number) => number,
  ot: number,
  dO: number,
  y: [number, number],
  cvet: Cvet19 = 'lineA',
  prozrachnost = 0.14,
): Figura19 {
  const kray = (v: number) => Math.min(y[1], Math.max(y[0], v));
  const n = Math.max(8, Math.ceil((dO - ot) * 24));
  const xs = Array.from({ length: n + 1 }, (_, i) => ot + ((dO - ot) * i) / n);
  const verhT = xs.map((x): [number, number] => [x, kray(verh(x))]);
  const nizT = [...xs].reverse().map((x): [number, number] => [x, kray(niz(x))]);
  return oblast([...verhT, ...nizT], cvet, prozrachnost);
}

/** Отрезок от (x1; y1) до (x2; y2): кусок решения на прямой a = const, граница области. */
export function otrezokNa(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cvet: Cvet19 = 'accent',
  style: 'solid' | 'dashed' = 'solid',
  width = 3.2,
): Figura19 {
  return { type: 'segment', from: [x1, y1], to: [x2, y2], color: cvet, style, width };
}

/**
 * Горизонталь a = c на всю ширину окна — фигурой, а не кривой: фигуры
 * рисуются под кривыми и в порядке списка, поэтому толстые куски
 * решения (otrezokNa после неё) ложатся поверх прямой, а не под неё.
 */
export function gorizontal(
  c: number,
  x: [number, number],
  cvet: Cvet19 = 'lineB',
  style: 'solid' | 'dashed' = 'solid',
): Figura19 {
  return otrezokNa(x[0], c, x[1], c, cvet, style, 2.4);
}

/* ── Прямая параметра (метод 10) ─────────────────────────────────── */

/** Кусок прямой параметра: от ot до do (±Infinity — луч), включены ли концы; точка — ot = do. */
export interface KusokA19 {
  ot: number;
  do: number;
  otVkl: boolean;
  doVkl: boolean;
}

/** Полоса одного корня: где на прямой параметра он — решение. */
export interface Polosa19 {
  /** Имя корня над полосой: «x = 2a + 1» (короткая строка, как подпись линии). */
  imya: string;
  kuski: KusokA19[];
  cvet: Cvet19;
}

export interface PryamayaParametra19 {
  /** Видимый кусок прямой параметра. */
  a: [number, number];
  /** Клеток на единицу параметра: близкие особые точки разводятся крупнее. */
  masshtab?: number;
  /** Особые точки по возрастанию: совпадения корней, границы ограничений. */
  osobye: number[];
  /** Подписи особых точек под осью; по умолчанию — число с запятой. */
  podpisi?: string[];
  polosy: Polosa19[];
  /**
   * Число корней над прямой: на промежутках между особыми точками
   * (на один больше, чем точек) и в самих точках — посчитанное, а не
   * прочитанное по закрашенным концам полос.
   */
  schet?: { promezhutki: number[]; tochki: number[] };
  /** Подпись для экранного диктора — обычный текст. */
  alt: string;
  /** Ползунок: текущее a — вертикальная метка и точки корней на полосах. */
  metka?: { a: number; verny: boolean[] };
}

/**
 * Прямая параметра: ось a снизу, над ней по полосе на каждый корень
 * (куски, где корень — решение; концы закрашенные или пустые), сверху —
 * число корней на каждом промежутке и в каждой особой точке. Окно сдвинуто
 * так, что x = 0 движка левее рамки: вертикальной оси на рисунке нет, а
 * деления оси — свои подписи значений a.
 */
export function pryamayaParametra(p: PryamayaParametra19): Scena19 {
  const m = p.masshtab ?? 1;
  const [aLo, aHi] = p.a;
  /* Окно начинается с x = 3 движка: ось y (x = 0) уходит за край рисунка. */
  const X0 = 3;
  const u = (a: number) => X0 + (Math.min(aHi, Math.max(aLo, a)) - aLo) * m;
  const uMax = u(aHi);
  const n = p.polosy.length;
  const verh = n + (p.schet === undefined ? 0.6 : 1.85);
  const shapes: Figura19[] = [];
  const points: Tochka19[] = [];
  for (const a of p.osobye) {
    shapes.push(
      otrezokNa(u(a), 0, u(a), p.schet === undefined ? n + 0.35 : n + 1.1, 'aux', 'dashed', 1.2),
    );
  }
  p.polosy.forEach((pol, i) => {
    const y = i + 1;
    for (const k of pol.kuski) {
      if (k.do < aLo || k.ot > aHi) continue;
      if (k.ot === k.do) {
        points.push(tochka(u(k.ot), y, null, !k.otVkl, pol.cvet));
        continue;
      }
      shapes.push(otrezokNa(u(k.ot), y, u(k.do), y, pol.cvet, 'solid', 4.5));
      if (Number.isFinite(k.ot) && k.ot >= aLo)
        points.push(tochka(u(k.ot), y, null, !k.otVkl, pol.cvet));
      if (Number.isFinite(k.do) && k.do <= aHi)
        points.push(tochka(u(k.do), y, null, !k.doVkl, pol.cvet));
    }
    shapes.push({ ...podpis(X0 + 0.1, y - 0.4, pol.imya, pol.cvet), size: 13, fixed: true });
  });
  if (p.schet !== undefined) {
    const granicy = [aLo, ...p.osobye, aHi];
    p.schet.promezhutki.forEach((c, i) => {
      const x = (u(granicy[i]!) + u(granicy[i + 1]!)) / 2;
      shapes.push({
        type: 'label',
        at: [x, n + 0.72],
        text: String(c),
        color: 'cross',
        anchor: 'middle',
        fixed: true,
      });
    });
    p.schet.tochki.forEach((c, i) => {
      shapes.push({
        type: 'label',
        at: [u(p.osobye[i]!), n + 1.45],
        text: String(c),
        color: 'accent',
        anchor: 'middle',
        fixed: true,
      });
    });
  }
  if (p.metka !== undefined) {
    const x = u(p.metka.a);
    shapes.push(otrezokNa(x, -0.3, x, n + 0.45, 'cross', 'solid', 1.6));
    p.metka.verny.forEach((v, i) =>
      points.push(tochka(x, i + 1, null, !v, v ? 'accent' : 'cross')),
    );
  }
  const s = scena({ x: [X0, uMax], y: [-0.6, verh], osi: ['a', ''] }, { shapes, points }, p.alt);
  return {
    ...s,
    grid: { step: 1, show: false },
    axes: {
      ...s.axes,
      origin: '',
      ticks: {
        x: p.osobye.map((a, i) => ({ at: u(a), label: p.podpisi?.[i] ?? chisloPodpis(a) })),
        y: [],
      },
    },
    axisLabels: 'full',
  };
}

/** SVG рисунка строкой: страница вставляет её как есть. */
export function svg19(s: Scena19): string {
  return renderGraph(s) as string;
}
