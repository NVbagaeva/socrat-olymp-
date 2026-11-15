/**
 * База №12 «Планиметрия», часть 3: задачи 243–463 задачника —
 * синус, косинус и тангенс острого угла, центральные и вписанные
 * углы, средняя линия трапеции, отношения площадей, правильные
 * многоугольники, длина дуги.
 *
 * Прототипы P61–P91: в каждом — аналоги одного вида (одинаковый
 * чертёж и способ решения), числа — из таблиц chast3-dannye.ts.
 * У каждого прототипа свой чертёж условия (движок планиметрии
 * профиля, lib/planimetriya), построенный по числам задачи.
 */

import type { GruppaBazy, Prototip } from '../types';
import { PROTOTIPY_CHETYREH } from './chast3-chetyreh';
import type { PrototipChasti3 } from './chast3-obshchee';
import { PROTOTIPY_OKR } from './chast3-okr';
import { PROTOTIPY_PROCHEE } from './chast3-prochee';
import { PROTOTIPY_TREUG } from './chast3-treug';

export const GRUPPY_12_3: GruppaBazy[] = [
  {
    id: '3A',
    nazvanie: 'Прямоугольный треугольник: синус, косинус, тангенс',
    znak: '\\sin A',
    ton: 'blue',
  },
  { id: '3B', nazvanie: 'Равнобедренный треугольник и внешний угол', znak: 'AB=BC', ton: 'navy' },
  {
    id: '3C',
    nazvanie: 'Трапеция, прямоугольник, ромб: тригонометрия',
    znak: '\\mathrm{tg}\\,\\alpha',
    ton: 'orange',
  },
  { id: '3D', nazvanie: 'Центральные и вписанные углы', znak: '\\angle ACB', ton: 'terra' },
  { id: '3E', nazvanie: 'Диаметр и точка на окружности', znak: '2R', ton: 'green' },
  {
    id: '3F',
    nazvanie: 'Средняя линия трапеции и отношения площадей',
    znak: '\\dfrac{S_1}{S_2}',
    ton: 'blue',
  },
  {
    id: '3G',
    nazvanie: 'Правильные многоугольники и длина дуги',
    znak: '\\dfrac{360^\\circ}{n}',
    ton: 'navy',
  },
];

/** Прототипы с таблицами аналогов (для сверки с ключом). */
export const PROTOTIPY_12_3_SVERKA: PrototipChasti3[] = [
  ...PROTOTIPY_TREUG,
  ...PROTOTIPY_CHETYREH,
  ...PROTOTIPY_OKR,
  ...PROTOTIPY_PROCHEE,
];

export const PROTOTIPY_12_3: Prototip[] = PROTOTIPY_12_3_SVERKA;
