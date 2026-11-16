/**
 * База, задание №16 «Вычисления и преобразования»: наполнение раздела.
 * Теория, опорные задачи и карточки — здесь; прототипы тренажёра —
 * lib/baza/z16.
 */

import { GRUPPY_16, PROTOTIPY_16 } from '@/lib/baza/z16/prototipy';
import type { RazdelBazy } from '@/lib/baza/types';
import { KOLODA_16 } from './kartochki';
import { OPORNYE_16 } from './opornye';
import { TEORIYA_16 } from './teoriya';

export const RAZDEL_16: RazdelBazy = {
  slug: '16',
  oZadanii: {
    title: 'Найти значение выражения',
    text: [
      'Выражение со степенями, корнями, логарифмами или синусами. Нужно найти его значение и записать целым числом или десятичной дробью.',
      'Считать «в лоб» почти никогда не надо: сначала упрощаем по свойствам — приводим степени к одному основанию, собираем корни под один знак, объединяем логарифмы, отбрасываем полные обороты угла, — и только потом считаем.',
    ],
    tipy: [
      {
        title: 'Степени с одним основанием',
        primer: 'Найдите значение выражения $\\dfrac{9^{5}}{3^{7}} : 27$.',
      },
      {
        title: 'Корни и логарифмы',
        primer: 'Найдите значение выражения $\\log_{4}2{,}5 + \\log_{4}6{,}4$.',
      },
      {
        title: 'Тригонометрия',
        primer:
          'Найдите $\\cos\\alpha$, если $\\sin\\alpha = -\\dfrac{3}{5}$ и $180^\\circ < \\alpha < 270^\\circ$.',
      },
    ],
  },
  teoriya: TEORIYA_16,
  gruppy: GRUPPY_16,
  prototipy: PROTOTIPY_16,
  opornye: OPORNYE_16,
  kartochki: KOLODA_16,
};
