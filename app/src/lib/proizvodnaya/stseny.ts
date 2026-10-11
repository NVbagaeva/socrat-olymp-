/**
 * Рисунки теории и разобранных примеров задания №9.
 *
 * Сцена — готовая Figura для движка render.ts и режим, в котором её
 * нужно рисовать. Теория показывает рисунки «учителя»: с треугольником
 * наклона, пунктирами, знаками на промежутках. Узлы кривых стоят на
 * целой сетке, значения читаются точно; подписи ставит движок и сам
 * следит, чтобы они не пересекались (Otchet.problems, см. проверку
 * `sceny9Chisty` ниже).
 */

import { figura } from './krivye';
import { pustoyOtchet, renderFigura, type RezhimRisunka } from './render';
import type { Figura, Uzel } from './types';

export type StsenaId =
  | 'naklon-vverh'
  | 'naklon-vniz'
  | 'f-grafik'
  | 'f-proizvodnaya'
  | 'smena-znaka'
  | 'kasanie-bez-smeny'
  | 'otrezok-i-interval'
  | 'parallel-pryamoy'
  | 'F-znak-f'
  | 'F-ekstremumy'
  | 'ploschad-lomanaya'
  | 'ploschad-parabola';

export interface Stsena {
  fig: Figura;
  rezhim: RezhimRisunka;
}

/* ── Наклон касательной ─────────────────────────────────────────── */

function naklonVverh(): Stsena {
  const uzly: Uzel[] = [
    { x: -5, y: -2 },
    { x: 0, y: 1, m: 0.75 },
    { x: 5, y: 6 },
  ];
  const fig = figura('f', 'f(x)', uzly, {
    kasatelnaya: { a: [-4, -2], b: [4, 4], x0: 0 },
    pomoshch: [{ t: 'vert', x: 0 }, { t: 'treugolnik' }],
    alt: 'График функции, касательная в точке касания и прямоугольный треугольник на двух узлах сетки; угол альфа острый',
  });
  return { fig, rezhim: 'teacher' };
}

function naklonVniz(): Stsena {
  const uzly: Uzel[] = [
    { x: -5, y: 3 },
    { x: 0, y: 3, m: -0.5 },
    { x: 5, y: -3 },
  ];
  const fig = figura('f', 'f(x)', uzly, {
    kasatelnaya: { a: [-4, 5], b: [4, 1], x0: 0 },
    pomoshch: [{ t: 'vert', x: 0 }, { t: 'treugolnik' }],
    alt: 'График функции, убывающая касательная и прямоугольный треугольник; угол альфа тупой, смежный с ним угол бета острый',
  });
  return { fig, rezhim: 'teacher' };
}

/* ── Один и тот же характер: график f и график f′ ──────────────── */

/** Горка в −2 и ямка в 2: f возрастает, убывает, снова возрастает. */
function fGrafik(): Stsena {
  const uzly: Uzel[] = [
    { x: -5, y: -2 },
    { x: -2, y: 3, m: 0 },
    { x: 2, y: -1, m: 0 },
    { x: 5, y: 3 },
  ];
  const fig = figura('f', 'f(x)', uzly, {
    metki: [-4, 1, 4],
    pomoshch: [
      { t: 'vert', x: -2 },
      { t: 'vert', x: 2 },
    ],
    alt: 'График функции с максимумом в точке минус два и минимумом в точке два',
  });
  return { fig, rezhim: 'teacher' };
}

function fProizvodnaya(): Stsena {
  const uzly: Uzel[] = [
    { x: -5, y: 3 },
    { x: -2, y: 0, m: -1.5 },
    { x: 0, y: -2, m: 0 },
    { x: 2, y: 0, m: 1.5 },
    { x: 5, y: 3 },
  ];
  const fig = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'znak', x0: -5, x1: -2, znak: 1 },
      { t: 'znak', x0: -2, x1: 2, znak: -1 },
      { t: 'znak', x0: 2, x1: 5, znak: 1 },
    ],
    alt: 'График производной: положительна левее минус двух, отрицательна между минус двумя и двумя, положительна правее двух',
  });
  return { fig, rezhim: 'teacher' };
}

/* ── Смена знака и касание ─────────────────────────────────────── */

function smenaZnaka(): Stsena {
  const uzly: Uzel[] = [
    { x: -6, y: -2 },
    { x: -3, y: 0, m: 1 },
    { x: -1, y: 2, m: 0 },
    { x: 1, y: 0, m: -1.5 },
    { x: 3, y: -2, m: 0 },
    { x: 5, y: 0, m: 1.5 },
    { x: 7, y: 2 },
  ];
  const fig = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'znak', x0: -6, x1: -3, znak: -1 },
      { t: 'znak', x0: -3, x1: 1, znak: 1 },
      { t: 'znak', x0: 1, x1: 5, znak: -1 },
      { t: 'znak', x0: 5, x1: 7, znak: 1 },
    ],
    alt: 'График производной: нули минус три, один и пять; в точке минус три знак меняется с минуса на плюс, в точке один с плюса на минус',
  });
  return { fig, rezhim: 'teacher' };
}

function kasanieBezSmeny(): Stsena {
  const uzly: Uzel[] = [
    { x: -5, y: 2 },
    { x: -2, y: 0, m: 0 },
    { x: 1, y: 3, m: 0 },
    { x: 3, y: 0, m: -1.5 },
    { x: 5, y: -2 },
  ];
  const fig = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'znak', x0: -5, x1: -2, znak: 1 },
      { t: 'znak', x0: -2, x1: 3, znak: 1 },
      { t: 'znak', x0: 3, x1: 5, znak: -1 },
    ],
    alt: 'График производной касается оси абсцисс в точке минус два и не меняет знак; экстремум только в точке три',
  });
  return { fig, rezhim: 'teacher' };
}

/* ── Отрезок против интервала ───────────────────────────────────── */

function otrezokIInterval(): Stsena {
  const uzly: Uzel[] = [
    { x: -7, y: 2 },
    { x: -4, y: 0, m: -1 },
    { x: -2, y: -2, m: 0 },
    { x: 0, y: 0, m: 1.5 },
    { x: 2, y: 2, m: 0 },
    { x: 4, y: 0, m: -1.5 },
    { x: 7, y: -3 },
  ];
  const fig = figura('fprime', "f'(x)", uzly, {
    pomoshch: [{ t: 'otrezok', p: -3, q: 5 }],
    alt: 'График производной на интервале от минус семи до семи; на оси выделен отрезок от минус трёх до пяти',
  });
  return { fig, rezhim: 'teacher' };
}

/* ── Параллельность: горизонталь y = k ─────────────────────────── */

function parallelPryamoy(): Stsena {
  const uzly: Uzel[] = [
    { x: -6, y: -3 },
    { x: -3, y: 1, m: 1.5 },
    { x: 0, y: 4, m: 0 },
    { x: 3, y: 1, m: -1.5 },
    { x: 6, y: -2 },
  ];
  const fig = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'goriz', y: 1, podpis: 'y = 1' },
      { t: 'vert', x: -3 },
      { t: 'vert', x: 3 },
    ],
    alt: 'График производной и горизонтальная прямая игрек равно одному: она пересекает график в точках минус три и три',
  });
  return { fig, rezhim: 'teacher' };
}

/* ── Первообразная ───────────────────────────────────────────────── */

function bigFZnakF(): Stsena {
  const uzly: Uzel[] = [
    { x: -6, y: -2 },
    { x: -3, y: 3, m: 0 },
    { x: 1, y: -2, m: 0 },
    { x: 4, y: 2, m: 0 },
    { x: 6, y: -1 },
  ];
  const fig = figura('F', 'F(x)', uzly, {
    metki: [-5, -1, 2, 5],
    alt: 'График первообразной: возрастает до точки минус три, убывает до точки один, возрастает до точки четыре, затем убывает',
  });
  return { fig, rezhim: 'teacher' };
}

function bigFEkstremumy(): Stsena {
  const uzly: Uzel[] = [
    { x: -6, y: 1 },
    { x: -3, y: 4, m: 0 },
    { x: 0, y: 0, m: 0 },
    { x: 3, y: 3, m: 0 },
    { x: 6, y: -1 },
  ];
  const fig = figura('F', 'F(x)', uzly, {
    pomoshch: [
      { t: 'vert', x: -3 },
      { t: 'vert', x: 0 },
      { t: 'vert', x: 3 },
    ],
    alt: 'График первообразной с горизонтальными касательными в точках минус три, ноль и три',
  });
  return { fig, rezhim: 'teacher' };
}

/** Ломаная из лучей и отрезков: F(b) − F(a) — площадь со знаком. */
function ploschadLomanaya(): Stsena {
  const uzly: Uzel[] = [
    { x: -3, y: 2 },
    { x: 0, y: 2 },
    { x: 2, y: 0 },
    { x: 4, y: -2 },
  ];
  const fig = figura('lomanaya', 'f(x)', uzly, {
    zalivka: { a: -3, b: 4 },
    levyy: 'closed',
    pravyy: 'closed',
    chislaY: 'vse',
    alt: 'График функции из отрезков: над осью абсцисс от минус трёх до двух, под осью от двух до четырёх; площади закрашены',
  });
  return { fig, rezhim: 'teacher' };
}

function ploschadParabola(): Stsena {
  const uzly: Uzel[] = [
    { x: 0, y: 0, m: 4 },
    { x: 1, y: 3, m: 2 },
    { x: 2, y: 4, m: 0 },
    { x: 3, y: 3, m: -2 },
    { x: 4, y: 0, m: -4 },
  ];
  const fig = figura('zalivka', 'f(x)', uzly, {
    zalivka: { a: 1, b: 4 },
    levyy: 'none',
    pravyy: 'none',
    alt: 'Парабола, ветви вниз; закрашена фигура между графиком и осью абсцисс от одного до четырёх',
  });
  return { fig, rezhim: 'teacher' };
}

const STSENY: Record<StsenaId, () => Stsena> = {
  'naklon-vverh': naklonVverh,
  'naklon-vniz': naklonVniz,
  'f-grafik': fGrafik,
  'f-proizvodnaya': fProizvodnaya,
  'smena-znaka': smenaZnaka,
  'kasanie-bez-smeny': kasanieBezSmeny,
  'otrezok-i-interval': otrezokIInterval,
  'parallel-pryamoy': parallelPryamoy,
  'F-znak-f': bigFZnakF,
  'F-ekstremumy': bigFEkstremumy,
  'ploschad-lomanaya': ploschadLomanaya,
  'ploschad-parabola': ploschadParabola,
};

export const STSENA_IDS = Object.keys(STSENY) as StsenaId[];

export function stsena(id: StsenaId): Stsena {
  return STSENY[id]();
}

/** SVG сцены: строка разметки движка. */
export function stsenaSvg(id: StsenaId): string {
  const s = stsena(id);
  return renderFigura(s.fig, { rezhim: s.rezhim });
}

/** Нарушения читаемости сцен: пусто — подписи не пересекаются нигде. */
export function sceny9Problemy(): string[] {
  const out: string[] = [];
  for (const id of STSENA_IDS) {
    const s = stsena(id);
    const rep = pustoyOtchet();
    renderFigura(s.fig, { rezhim: s.rezhim }, rep);
    out.push(...rep.problems.map((p) => `${id}: ${p}`));
  }
  return out;
}
