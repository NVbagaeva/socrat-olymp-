/**
 * Пять блоков подготовки задания №8. Состав — из документа этапа 2.
 */

import { BUKVENNYE } from './micro/bukvennye';
import { FORMULY } from './micro/formuly';
import { LOGARIFMY } from './micro/logarifmy';
import { STEPENI } from './micro/stepeni';
import { ZNAKI } from './micro/znaki';
import type { PrepBlock, PrepMicro } from './types';

export const PREP_BLOCKS: PrepBlock[] = [
  {
    id: 'P8-1',
    group: 'I',
    slug: 'stepeni-korni',
    no: '01',
    nazvanie: 'Степени и корни',
    lead: 'Свойства степеней и корней по одному',
    formula: 'a^{m} \\cdot a^{n} = a^{m+n}',
    formuly: STEPENI.map((m) => m.formula),
    zadachi: STEPENI,
  },
  {
    id: 'P8-2',
    group: 'II',
    slug: 'logarifmy',
    no: '02',
    nazvanie: 'Логарифмы',
    lead: 'Определение и свойства логарифма',
    formula: '\\log_a b = c \\Leftrightarrow a^c = b',
    formuly: LOGARIFMY.map((m) => m.formula),
    zadachi: LOGARIFMY,
  },
  {
    id: 'P8-3',
    group: 'III',
    slug: 'znaki-chetverti',
    no: '03',
    nazvanie: 'Знаки и четверти',
    lead: 'Четверть, знак функции, основное тождество',
    formula: '\\sin^2\\alpha + \\cos^2\\alpha = 1',
    formuly: ZNAKI.map((m) => m.formula),
    zadachi: ZNAKI,
  },
  {
    id: 'P8-4',
    group: 'IV',
    slug: 'formuly-trigonometrii',
    no: '04',
    nazvanie: 'Формулы тригонометрии',
    lead: 'Таблица, приведение, двойной угол',
    formula: '\\sin 2x = 2\\sin x\\cos x',
    formuly: FORMULY.map((m) => m.formula),
    zadachi: FORMULY,
  },
  {
    id: 'P8-5',
    group: 'V',
    slug: 'bukvennye',
    no: '05',
    nazvanie: 'Буквенные выражения',
    lead: 'Формулы сокращённого умножения и подстановка',
    formula: 'a^2 - b^2 = (a - b)(a + b)',
    formuly: BUKVENNYE.map((m) => m.formula),
    zadachi: BUKVENNYE,
  },
];

export function prepBlockBySlug(slug: string): PrepBlock | undefined {
  return PREP_BLOCKS.find((block) => block.slug === slug);
}

export function prepMicroById(id: string): PrepMicro | undefined {
  return PREP_BLOCKS.flatMap((block) => block.zadachi).find((m) => m.id === id);
}
