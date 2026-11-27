/**
 * Тексты живой сцены справочника №2 (векторы): components/zhivye/vektory2.
 * Формулы — в $…$; ключи svg* и aria* — обычный текст.
 */

import type { TekstyUpravleniya } from '@/components/zhivye/Elementy';
import { ru, ruTex } from '@/lib/zhivye/hod';

const UPRAVLENIE: TekstyUpravleniya = {
  zapustit: 'Запустить',
  prodolzhit: 'Продолжить',
  pauza: 'Пауза',
  snachala: 'Сначала',
  eshche: 'Ещё раз',
  skorostPokaza: 'Скорость показа',
  klaviatura: 'Пробел — пуск и пауза, стрелки — шаг вперёд и назад.',
};

type Para = readonly [number, number];
const par = (p: Para) => `(${ruTex(p[0])};\\,${ruTex(p[1])})`;
const parTekst = (p: Para) => `(${ru(p[0])}; ${ru(p[1])})`;

export const DEYSTVIYA2 = {
  nad: 'Посмотри, как это работает',
  zag: 'Сумма, разность и умножение на число',
  lead: 'Действия с векторами — это действия с их координатами: складываем и вычитаем по одноимённым координатам, а при умножении на число умножаем каждую.',
  alt: 'Координатная сетка с векторами a и b из начала координат; копия b переезжает к концу a, в сумме получается вектор a+b; затем вектор a−b из конца b в конец a; затем вектор a растягивается вдвое.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  nabor: 'Векторы',
  nabory: { pervyy: 'первая пара', vtoroy: 'вторая пара', tretiy: 'третья пара' } as Record<
    string,
    string
  >,
  ariaVremya: 'Шаг показа',
  puzyr: ['$\\vec a+\\vec b$', '$\\vec a-\\vec b$', '$2\\vec a$'],
  metki: ['a + b', 'a − b', '2a'],
  svgA: 'a',
  svgB: 'b',
  svgRez: ['a + b', 'a − b', '2a'],
  svgKoordinaty: (p: Para) => parTekst(p),
  status: {
    start: (a: Para, b: Para) =>
      `$\\vec a=${par(a)}$, $\\vec b=${par(b)}$. Запусти — сложим, вычтем и умножим на число.`,
    summa: (a: Para, b: Para, r: Para) =>
      `Сумма: $\\vec b$ переносим к концу $\\vec a$, а сумма идёт из начала в конец. Координаты складываются: $${par(a)}+${par(b)}=${par(r)}$.`,
    raznost: (a: Para, b: Para, r: Para) =>
      `Разность: $\\vec a-\\vec b$ идёт из конца $\\vec b$ в конец $\\vec a$. Координаты вычитаются: $${par(a)}-${par(b)}=${par(r)}$.`,
    kratnoe: (a: Para, r: Para) =>
      `Умножение на число: $2\\vec a$ вдвое длиннее $\\vec a$ и смотрит туда же. Каждая координата умножается на $2$: $2\\cdot${par(a)}=${par(r)}$.`,
  },
};
