/**
 * Примеры чертежей и заданий для служебной витрины №16
 * (/zadaniya/16/vitrina/) и автотеста scripts/check-zadanie16.mjs.
 * Числа свои. У каждого примера ответ записан отдельно: тест
 * сверяет его с тем, что показывает чертёж.
 */

import { metodIntervalov16, type Chertezh16 } from './chertezh';

export interface PrimerChertezha16 {
  id: string;
  /** Подпись: неравенство, $…$. */
  title: string;
  spec: Chertezh16;
  /** Ответ, который показывает чертёж (для прямой без второго слоя). */
  otvet?: string;
}

export const PRIMERY_CHERTEZHEY_16: PrimerChertezha16[] = [
  {
    id: 'kratnost',
    title: '$(x+3)(x-1)^2(x-4)\\ge0$',
    spec: metodIntervalov16({
      korni: [
        { x: -3, tex: '-3' },
        { x: 1, tex: '1', kratnost: 2 },
        { x: 4, tex: '4' },
      ],
      sprava: '+',
      znak: '>=',
    }),
    otvet: '(-\\infty;\\,-3]\\cup\\{1\\}\\cup[4;\\,+\\infty)',
  },
  {
    id: 'drob',
    title: '$\\dfrac{x-2}{x+5}\\le0$',
    spec: metodIntervalov16({
      korni: [
        { x: -5, tex: '-5', znamenatel: true },
        { x: 2, tex: '2' },
      ],
      sprava: '+',
      znak: '<=',
    }),
    otvet: '(-5;\\,2]',
  },
  {
    id: 'zmeyka',
    title: '$(x-1)(x-4)>0$',
    spec: metodIntervalov16({
      korni: [
        { x: 1, tex: '1' },
        { x: 4, tex: '4' },
      ],
      sprava: '+',
      znak: '>',
      dugi: true,
    }),
    otvet: '(-\\infty;\\,1)\\cup(4;\\,+\\infty)',
  },
  {
    id: 'tesno',
    title: 'Тесно: $\\prod(x-a_i)\\le0$, семь нулей с длинными подписями',
    spec: metodIntervalov16({
      korni: [
        { x: -2 * Math.sqrt(3), tex: '-2\\sqrt{3}' },
        { x: -3, tex: '-3' },
        { x: -7 / 3, tex: '-\\tfrac{7}{3}' },
        { x: -Math.sqrt(5), tex: '-\\sqrt{5}' },
        { x: 0.25, tex: '0{,}25' },
        { x: Math.SQRT2, tex: '\\sqrt{2}' },
        { x: 3 * Math.sqrt(2), tex: '3\\sqrt{2}' },
      ],
      sprava: '+',
      znak: '<=',
    }),
  },
  {
    id: 'sistema-tri',
    title: '$\\begin{cases}x>-3,\\\\x\\le2,\\\\x\\ne0\\end{cases}$',
    spec: {
      vid: 'sistema',
      tochki: [
        { x: -3, tex: '-3' },
        { x: 0, tex: '0' },
        { x: 2, tex: '2' },
      ],
      ryady: [
        { tex: 'x>-3', mnozhestvo: '(-3;\\,+\\infty)' },
        { tex: 'x\\le2', mnozhestvo: '(-\\infty;\\,2]' },
        { tex: 'x\\ne0', mnozhestvo: '(-\\infty;\\,0)\\cup(0;\\,+\\infty)' },
      ],
    },
    otvet: '(-3;\\,0)\\cup(0;\\,2]',
  },
  {
    id: 'parabola-oy',
    title: '$(x-5)^2>0$, ось $Oy$',
    spec: {
      vid: 'parabola',
      vetvi: 'vverh',
      oy: true,
      korni: [{ x: 5, tex: '5', zakrashena: false }],
      shtrikh: 'nad',
    },
  },
  {
    id: 'parabola-oy-ryadom',
    title: '$x^2-4x<0$, ось $Oy$: нуль в начале координат',
    spec: {
      vid: 'parabola',
      vetvi: 'vverh',
      oy: true,
      korni: [
        { x: 0, tex: '0', zakrashena: false },
        { x: 4, tex: '4', zakrashena: false },
      ],
      shtrikh: 'pod',
    },
  },
  {
    id: 'sistema',
    title: '$\\begin{cases}x>-1,\\\\x\\le3\\end{cases}$',
    spec: {
      vid: 'pryamaya',
      tochki: [
        { x: -1, tex: '-1', zakrashena: false },
        { x: 3, tex: '3', zakrashena: true },
      ],
      shtrikh: [
        { ot: 0, do: 2 },
        { ot: -1, do: 1, sloy: 1 },
      ],
    },
  },
  {
    id: 'parabola-dva',
    title: '$x^2-x-6<0$',
    spec: {
      vid: 'parabola',
      vetvi: 'vverh',
      korni: [
        { x: -2, tex: '-2', zakrashena: false },
        { x: 3, tex: '3', zakrashena: false },
      ],
      shtrikh: 'pod',
      znaki: true,
    },
  },
  {
    id: 'parabola-kasanie',
    title: '$(x-2)^2>0$',
    spec: {
      vid: 'parabola',
      vetvi: 'vverh',
      korni: [{ x: 2, tex: '2', zakrashena: false }],
      shtrikh: 'nad',
    },
  },
  {
    id: 'parabola-net',
    title: '$-x^2+2x-5<0$',
    spec: { vid: 'parabola', vetvi: 'vniz', korni: [], shtrikh: 'pod', znaki: true },
  },
];

/** Пробная работа витрины: три задания, чтобы проверить поле ответа. */
export const PROBNAYA_RABOTA_16 = [
  { id: 'v1', uslovie: 'Решите неравенство $x^2-7x+10\\le0$.', otvet: '[2;\\,5]' },
  {
    id: 'v2',
    uslovie: 'Решите неравенство $\\dfrac{x+4}{x-3}>0$.',
    otvet: '(-\\infty;\\,-4)\\cup(3;\\,+\\infty)',
  },
  { id: 'v3', uslovie: 'Решите неравенство $(x-1)^2(x+2)<0$.', otvet: '(-\\infty;\\,-2)' },
];
