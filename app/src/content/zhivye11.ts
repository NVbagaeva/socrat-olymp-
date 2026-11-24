/**
 * Кадры «экскурсий» живых графиков теории №11 (components/zhivye/
 * Ekskursiya.tsx): параметры кадра и пояснение (формулы — в $…$).
 * Первый кадр совпадает с начальными значениями ползунков.
 */

import type { Kadr } from '@/components/zhivye/Ekskursiya';

export const KADRY_PARABOLY: readonly Kadr<{ a: number; c: number }>[] = [
  { s: { a: 2, c: 0 }, tex: '$y=2x^2$: ветви вверх, вершина в начале координат.' },
  { s: { a: 1, c: 0 }, tex: '$a=1$ — основная парабола $y=x^2$.' },
  { s: { a: 0.25, c: 0 }, tex: '$0<a<1$ — ветви шире: график прижимается к оси $Ox$.' },
  { s: { a: 3, c: 0 }, tex: '$a>1$ — ветви уже: график вытягивается вверх.' },
  { s: { a: -1, c: 0 }, tex: '$a<0$ — ветви вниз: график отражается относительно оси $Ox$.' },
  { s: { a: -1, c: 3 }, tex: '$c=3$ поднимает вершину в точку $(0;\\,3)$.' },
  { s: { a: -1, c: -2 }, tex: '$c<0$ опускает вершину: $(0;\\,-2)$.' },
  { s: { a: 0, c: -2 }, tex: 'При $a=0$ квадрата нет — это прямая $y=c$, а не парабола.' },
];

export type TrigFn = 'cos' | 'sin' | 'tg';

export const KADRY_TRIG: readonly Kadr<{ fn: TrigFn; a: number; b: number }>[] = [
  { s: { fn: 'cos', a: 2, b: 0 }, tex: '$y=2\\cos x$: волна от $-2$ до $2$.' },
  { s: { fn: 'cos', a: 1, b: 0 }, tex: '$a=1$ — волна от $-1$ до $1$: $a$ задаёт размах.' },
  { s: { fn: 'cos', a: -1, b: 0 }, tex: '$a<0$ — волна отражается относительно оси $Ox$.' },
  { s: { fn: 'cos', a: -1, b: 2 }, tex: '$b=2$ поднимает график: середина волны — прямая $y=2$.' },
  {
    s: { fn: 'sin', a: 1, b: 0 },
    tex: '$y=\\sin x$ — та же волна, сдвинутая на $\\dfrac{\\pi}{2}$.',
  },
  {
    s: { fn: 'tg', a: 1, b: 0 },
    tex: '$y=\\operatorname{tg}x$: ветви между асимптотами, период $\\pi$.',
  },
  {
    s: { fn: 'tg', a: 2, b: -1 },
    tex: '$a=2$ растягивает ветви, $b=-1$ опускает: через $(0;\\,-1)$.',
  },
];

export interface StepenS {
  baseIndex: number;
  b: number;
  kIndex: number;
  mode: 'y' | 'x';
  mirror?: boolean;
}

/** Основания: 0 → 1/4, 1 → 1/3, 2 → 1/2, 3 → 2, 4 → 3, 5 → 4 (как в ползунке). */
export const KADRY_LOG: readonly Kadr<StepenS>[] = [
  {
    s: { baseIndex: 3, b: 0, kIndex: 1, mode: 'y', mirror: false },
    tex: '$y=\\log_2 x$: возрастает, асимптота — ось $Oy$, проходит через $(1;\\,0)$.',
  },
  {
    s: { baseIndex: 5, b: 0, kIndex: 1, mode: 'y', mirror: false },
    tex: 'Основание $4$ — растёт медленнее, но через ту же точку $(1;\\,0)$.',
  },
  {
    s: { baseIndex: 2, b: 0, kIndex: 1, mode: 'y', mirror: false },
    tex: 'Основание $\\dfrac12<1$ — функция убывает.',
  },
  {
    s: { baseIndex: 3, b: 2, kIndex: 1, mode: 'y', mirror: false },
    tex: '$\\log_2 x+2$ — график поднимается на $2$: точка $(1;\\,2)$.',
  },
  {
    s: { baseIndex: 3, b: 2, kIndex: 1, mode: 'x', mirror: false },
    tex: '$\\log_2(x+2)$ — сдвиг влево на $2$: асимптота $x=-2$.',
  },
  {
    s: { baseIndex: 3, b: 0, kIndex: 1, mode: 'y', mirror: true },
    tex: 'Обратная функция — $y=2^x$: графики симметричны относительно прямой $y=x$.',
  },
];

export const KADRY_EXP: readonly Kadr<StepenS>[] = [
  {
    s: { baseIndex: 3, b: 0, kIndex: 1, mode: 'y' },
    tex: '$y=2^x$: возрастает, асимптота $y=0$, проходит через $(0;\\,1)$.',
  },
  {
    s: { baseIndex: 5, b: 0, kIndex: 1, mode: 'y' },
    tex: 'Основание $4$ — растёт быстрее, но через ту же точку $(0;\\,1)$.',
  },
  {
    s: { baseIndex: 2, b: 0, kIndex: 1, mode: 'y' },
    tex: 'Основание $\\dfrac12<1$ — функция убывает.',
  },
  {
    s: { baseIndex: 3, b: 2, kIndex: 1, mode: 'y' },
    tex: '$2^x+2$ — график поднимается на $2$: асимптота $y=2$.',
  },
  {
    s: { baseIndex: 3, b: 2, kIndex: 1, mode: 'x' },
    tex: '$2^{x+2}$ — сдвиг влево на $2$: точка $(-2;\\,1)$.',
  },
  {
    s: { baseIndex: 3, b: 0, kIndex: 2, mode: 'y' },
    tex: '$k=2$ растягивает график вдоль $Oy$: точка $(0;\\,2)$.',
  },
];

/** Смешение кадров с дискретными полями: числа — плавно, остальное — в середине перехода. */
export function smeshatStepen(a: StepenS, b: StepenS, u: number): StepenS {
  const d = u < 0.5 ? a : b;
  return { ...d, b: a.b + (b.b - a.b) * u };
}

export function smeshatTrig(
  a: { fn: TrigFn; a: number; b: number },
  b: { fn: TrigFn; a: number; b: number },
  u: number,
): { fn: TrigFn; a: number; b: number } {
  /* Смена функции — в середине перехода; размах через ноль не проходит:
     при смене знака a идёт через малое значение, а не через 0. */
  const fn = u < 0.5 ? a.fn : b.fn;
  let aa = a.a + (b.a - a.a) * u;
  if (Math.abs(aa) < 0.1) aa = aa < 0 || (aa === 0 && b.a < 0) ? -0.1 : 0.1;
  return { fn, a: aa, b: a.b + (b.b - a.b) * u };
}
