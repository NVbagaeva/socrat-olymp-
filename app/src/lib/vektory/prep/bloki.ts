/**
 * Блоки тренировок навыков задания №2 — порядок, названия, адреса.
 */

import {
  BLOK_DEYSTVIYA,
  BLOK_DLINA,
  BLOK_KOORDINATY,
  BLOK_KOSINUS,
  BLOK_SKALYARNOE,
} from './mikro';
import type { Blok, Mikro } from './types';

export const BLOKI: Blok[] = [
  {
    id: 'P2-1',
    slug: 'koordinaty',
    no: '01',
    nazvanie: 'Координаты вектора по рисунку',
    lead: 'Катеты в клетках и знак по направлению',
    formula: '\\vec{AB}\\,(x_2 - x_1;\\ y_2 - y_1)',
    formuly: [
      '\\vec{AB}\\,(x_2 - x_1;\\ y_2 - y_1)',
      'x_2 > x_1 \\Rightarrow x > 0,\\quad x_2 < x_1 \\Rightarrow x < 0',
    ],
    zadachi: BLOK_KOORDINATY,
  },
  {
    id: 'P2-2',
    slug: 'deystviya',
    no: '02',
    nazvanie: 'Действия с векторами',
    lead: 'Сумма, разность и умножение на число покоординатно',
    formula: 'k\\vec{a} + m\\vec{b} = (kx_1 + mx_2;\\ ky_1 + my_2)',
    formuly: [
      '\\vec{a} + \\vec{b} = (x_1 + x_2;\\ y_1 + y_2)',
      '\\vec{a} - \\vec{b} = (x_1 - x_2;\\ y_1 - y_2)',
      'k\\vec{a} = (kx;\\ ky)',
    ],
    zadachi: BLOK_DEYSTVIYA,
  },
  {
    id: 'P2-3',
    slug: 'dlina',
    no: '03',
    nazvanie: 'Длина вектора',
    lead: 'По координатам и по рисунку',
    formula: '|\\vec{a}| = \\sqrt{x^2 + y^2}',
    formuly: [
      '|\\vec{a}| = \\sqrt{x^2 + y^2}',
      '3^2 + 4^2 = 5^2,\\quad 5^2 + 12^2 = 13^2,\\quad 8^2 + 15^2 = 17^2',
    ],
    zadachi: BLOK_DLINA,
  },
  {
    id: 'P2-4',
    slug: 'skalyarnoe',
    no: '04',
    nazvanie: 'Скалярное произведение по координатам',
    lead: 'Абсциссы на абсциссы, ординаты на ординаты, сложить',
    formula: '\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2',
    formuly: [
      '\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2',
      '\\vec{a}\\cdot\\vec{b} = |\\vec{a}|\\cdot|\\vec{b}|\\cdot\\cos\\alpha',
    ],
    zadachi: BLOK_SKALYARNOE,
  },
  {
    id: 'P2-5',
    slug: 'kosinus',
    no: '05',
    nazvanie: 'Косинус угла',
    lead: 'Скалярное произведение, длины, деление',
    formula: '\\cos\\alpha = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|\\cdot|\\vec{b}|}',
    formuly: [
      '\\cos\\alpha = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|\\cdot|\\vec{b}|}',
      '\\cos\\alpha = \\dfrac{x_1x_2 + y_1y_2}{\\sqrt{x_1^2 + y_1^2}\\cdot\\sqrt{x_2^2 + y_2^2}}',
    ],
    zadachi: BLOK_KOSINUS,
  },
];

export function blokBySlug(slug: string): Blok | undefined {
  return BLOKI.find((b) => b.slug === slug);
}

export function mikroById(id: string): Mikro | undefined {
  for (const b of BLOKI) {
    const found = b.zadachi.find((m) => m.id === id);
    if (found !== undefined) return found;
  }
  return undefined;
}
