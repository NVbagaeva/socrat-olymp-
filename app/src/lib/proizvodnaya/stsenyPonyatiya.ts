/**
 * Рисунки блока теории «Понятие производной» (задание №9).
 *
 * Все рисунки строит движок графиков №9 (render.ts): кривая, прямые через
 * две точки (секущая, касательная), треугольник приращений, подписанные
 * точки. Каждая сцена — функция с параметром: тот же рисунок рисуют и
 * статичная теория, и живой рисунок со слайдером (Δx, Δt).
 *
 * Функции подобраны так, чтобы числа на живых рисунках были точными:
 *   секущая и касательная — f(x) = (x − 2)²/4 + 1,5 в точке x = 4:
 *     tg β = Δf/Δx = 1 + Δx/4, tg α = f′(4) = 1;
 *   мгновенная скорость — s(t) = t²/2 в момент t = 2:
 *     Δs = 2Δt + Δt²/2, v_ср = 2 + Δt/2, v = 2;
 *   модуль — y = |x| в нуле: Δy/Δx = 1 при Δx > 0 и −1 при Δx < 0.
 */

import type { Figura, Pomoshch, Uzel } from './types';

/* ── Секущая и касательная ───────────────────────────────────────── */

/** Функция рисунков секущей: f(x) = (x − 2)²/4 + 1,5, точка M при x = 4. */
export const SEK = {
  f: (x: number) => ((x - 2) * (x - 2)) / 4 + 1.5,
  x0: 4,
  /** tg угла секущей MM₁ при приращении Δx. */
  tgBeta: (dx: number) => 1 + dx / 4,
  /** tg угла касательной: f′(4) = 1. */
  tgAlpha: 1,
  /** Значения слайдера Δx: конечные дроби — числа на панели точные. */
  shkala: [4, 3, 2, 1, 0.5, 0.2, 0.1, 0.01],
} as const;

function krivayaSek(): Pick<Figura, 'okno' | 'uzly' | 'analitika' | 'cell'> {
  const xmax = 8.3;
  return {
    okno: { xmin: -3, xmax: 10, ymin: -1, ymax: 12 },
    uzly: [
      { x: -0.8, y: SEK.f(-0.8) },
      { x: xmax, y: SEK.f(xmax) },
    ],
    analitika: SEK.f,
    cell: 30,
  };
}

function osnova(extra: Partial<Figura>): Figura {
  return {
    rezhim: 'f',
    podpis: 'f(x)',
    levyy: 'none',
    pravyy: 'none',
    chisla: 'net',
    chislaY: 'net',
    okno: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
    uzly: [],
    teoriya: true,
    ...extra,
  };
}

/**
 * Секущая MM₁ и касательная MT при приращении Δx (живой рисунок и
 * рисунок «приращения»). podrobno — с треугольником MAM₁, пунктирами к
 * осям и подписями x, x + Δx, f(x), f(x + Δx).
 */
export function sekushchayaFig(dx: number, podrobno: boolean): Figura {
  const x0 = SEK.x0;
  const y0 = SEK.f(x0);
  const x1 = x0 + dx;
  const y1 = SEK.f(x1);
  /* Угол α касательной — у оси Ox, угол β секущей — в точке M, между
     лучом MA (он параллелен Ox) и секущей: это угол треугольника MAM₁.
     Секущая начинается чуть левее M и не заходит в угол α у оси.
     Пока M₁ близко к M, дуга β сливается с касательной — числа на панели. */
  const pomoshch: Pomoshch[] = [
    { t: 'liniya', a: [x0, y0], b: [x0 + 1, y0 + SEK.tgAlpha], podpis: 'T', ugol: 'α' },
    {
      t: 'liniya',
      a: [x0, y0],
      b: [x1, y1],
      vid: 'blednaya',
      ot: x0 - 0.7,
      ...(dx >= 1 ? { ugol: 'β', ugolU: 'tochka' as const } : {}),
    },
  ];
  if (podrobno) {
    pomoshch.push({
      t: 'prirashchenie',
      x1: x0,
      x2: x1,
      dx: 'Δx',
      dy: 'Δf',
      vershina: 'A',
      ...(dx >= 1.5 ? { osi: { x1: 'x', x2: 'x + Δx', y1: 'f(x)', y2: 'f(x + Δx)' } } : {}),
    });
  }
  pomoshch.push(
    { t: 'tochka', x: x0, y: y0, podpis: 'M' },
    { t: 'tochka', x: x1, y: y1, podpis: 'M₁' },
  );
  return osnova({
    ...krivayaSek(),
    pomoshch,
    alt:
      `График функции, точка M и точка M₁, сдвинутая по оси абсцисс на ${String(dx).replace('.', ',')}; ` +
      'секущая MM₁ образует с осью абсцисс угол бета (он отмечен в точке M), касательная MT — угол альфа',
  });
}

/** Секущие поворачиваются около M и стремятся к касательной MT. */
export function sekushchieFig(): Figura {
  const x0 = SEK.x0;
  const y0 = SEK.f(x0);
  const tochka = (dx: number) => [x0 + dx, SEK.f(x0 + dx)] as const;
  const pomoshch: Pomoshch[] = [
    ...[4, 2.6].map((dx): Pomoshch => ({
      t: 'liniya',
      a: [x0, y0],
      b: tochka(dx),
      vid: 'blednaya',
    })),
    { t: 'liniya', a: [x0, y0], b: tochka(1.6), vid: 'blednaya' },
    { t: 'liniya', a: [x0, y0], b: [x0 + 1, y0 + 1], podpis: 'T' },
    ...[4, 2.6].map((dx): Pomoshch => ({ t: 'tochka', x: x0 + dx, y: SEK.f(x0 + dx) })),
    { t: 'tochka', x: x0 + 1.6, y: SEK.f(x0 + 1.6), podpis: 'M₁' },
    { t: 'tochka', x: x0, y: y0, podpis: 'M' },
  ];
  return osnova({
    ...krivayaSek(),
    pomoshch,
    alt: 'Кривая, точка M и три положения точки M₁; секущие MM₁ поворачиваются около M и приближаются к касательной MT',
  });
}

/* ── Функции, у которых нет производной в точке ──────────────────── */

/** Вертикальная касательная: y = 2·∛(x − 3) + 3, касательная x = 3. */
export function vertikalnayaFig(): Figura {
  const f = (x: number) => 2 * Math.cbrt(x - 3) + 3;
  return osnova({
    okno: { xmin: -1, xmax: 8, ymin: -1, ymax: 7 },
    uzly: [
      { x: 0, y: f(0) },
      { x: 7, y: f(7) },
    ],
    analitika: f,
    cell: 34,
    pomoshch: [
      { t: 'vert', x: 3, podpis: 'x₀' },
      { t: 'liniya', a: [3, 3], b: [3, 6.6], podpis: 'M' },
      { t: 'liniya', a: [3, 3], b: [6, f(6)], vid: 'blednaya' },
      { t: 'tochka', x: 3, y: 3, podpis: 'A' },
      { t: 'tochka', x: 6, y: f(6), podpis: 'M₁' },
    ],
    alt: 'Кривая с вертикальной касательной AM в точке x₀; секущая AM₁ при приближении M₁ к A становится вертикальной',
  });
}

/** «Острие»: y = 1,8·√|x|, касательная в нуле — ось Oy. */
export function ostrieFig(): Figura {
  const f = (x: number) => 1.8 * Math.sqrt(Math.abs(x));
  return osnova({
    okno: { xmin: -5, xmax: 6, ymin: -1, ymax: 6 },
    uzly: [
      { x: -4.6, y: f(-4.6) },
      { x: 5.2, y: f(5.2) },
    ],
    analitika: f,
    cell: 34,
    pomoshch: [
      { t: 'liniya', a: [0, 0], b: [0, 5.6], podpis: 'M₂' },
      { t: 'liniya', a: [0, 0], b: [4, f(4)], vid: 'blednaya' },
      { t: 'tochka', x: 4, y: f(4), podpis: 'M₁' },
    ],
    alt: 'График с острием в начале координат; секущая OM₁ при M₁ → O прижимается к оси Oy, касательная OM₂ вертикальна',
  });
}

/** Функция модуля: y = |x| — излом в нуле (наклон −1 слева, 1 справа). */
export const MODUL = {
  /** Значения слайдера Δx (нуля нет: делить на ноль нельзя). */
  shkala: [-2, -1, -0.5, -0.1, 0.1, 0.5, 1, 2],
} as const;

function modulUzly(): Uzel[] {
  return [
    { x: -4, y: 4, m: -1 },
    { x: 0, y: 0, m: 1, mL: -1 },
    { x: 4, y: 4, m: 1 },
  ];
}

/**
 * «Галочка» y = |x|. Без dx — статичный рисунок с двумя односторонними
 * касательными y = x и y = −x; с dx — живой: точка M₁ при x = Δx и секущая OM₁.
 */
export function galochkaFig(dx?: number): Figura {
  const pomoshch: Pomoshch[] =
    dx === undefined
      ? [
          { t: 'liniya', a: [0, 0], b: [3, 3], podpis: 'y = x', podpisU: 'niz', vid: 'blednaya' },
          {
            t: 'liniya',
            a: [0, 0],
            b: [-3, 3],
            podpis: 'y = −x',
            podpisU: 'niz',
            vid: 'blednaya',
          },
        ]
      : [
          { t: 'liniya', a: [0, 0], b: [dx, Math.abs(dx)], vid: 'blednaya' },
          /* Совсем рядом с нулём подписи M₁ места нет: точку видно по секущей. */
          { t: 'tochka', x: dx, y: Math.abs(dx), ...(Math.abs(dx) >= 0.5 ? { podpis: 'M₁' } : {}) },
        ];
  return osnova({
    okno: { xmin: -5, xmax: 5, ymin: -3, ymax: 5 },
    uzly: modulUzly(),
    podpis: '|x|',
    cell: 34,
    pomoshch,
    alt:
      dx === undefined
        ? 'График модуля икс — «галочка»: справа от нуля наклон равен единице, слева — минус единице; двух разных касательных в нуле не бывает'
        : `График модуля икс и секущая через начало координат и точку графика ${dx > 0 ? 'справа' : 'слева'} от нуля`,
  });
}

/* ── Мгновенная скорость ─────────────────────────────────────────── */

/** Закон движения s(t) = t²/2 (метры, секунды), момент t = 2. */
export const SKOROST = {
  s: (t: number) => (t * t) / 2,
  t0: 2,
  vSr: (dt: number) => 2 + dt / 2,
  v: 2,
  /** Значения слайдера Δt. */
  shkala: [2, 1, 0.5, 0.2, 0.1, 0.01],
} as const;
