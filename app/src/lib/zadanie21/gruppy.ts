/**
 * Группы задания «Наибольшее и наименьшее значение функции» — вид
 * функции (types.ts, VidId). Порядок — как в открытом банке: от
 * многочленов к сложным функциям.
 */

import { PROTOTYPES } from './prototypes';
import type { Prototype, VidId } from './types';

export interface Gruppa21 {
  id: VidId;
  title: string;
  lead: string;
}

export const GRUPPY21: readonly Gruppa21[] = [
  { id: 1, title: 'Многочлены', lead: 'Кубический многочлен: производная — квадратный трёхчлен.' },
  {
    id: 2,
    title: 'Функции с корнем',
    lead: 'Слагаемое $x\\sqrt{x}$: производная содержит $\\sqrt{x}$.',
  },
  { id: 3, title: 'Дробные функции', lead: 'Производная частного, точка $x = 0$ выколота.' },
  {
    id: 4,
    title: 'Произведение с экспонентой',
    lead: 'Производная произведения; $e^x > 0$ — на знак не влияет.',
  },
  {
    id: 5,
    title: 'Функции с логарифмом',
    lead: 'Область определения логарифма и производная $\\ln x$.',
  },
  {
    id: 6,
    title: 'Тригонометрические функции',
    lead: 'Часто производная не меняет знак — ответ на конце отрезка.',
  },
  {
    id: 7,
    title: 'Сложные функции',
    lead: 'Корень, логарифм или степень от трёхчлена: производная не нужна.',
  },
];

export function prototypesOfGruppa(id: VidId): Prototype[] {
  return PROTOTYPES.filter((p) => p.vid === id);
}
