/**
 * База, задание №12 «Планиметрия», часть 2: задачи 115–242 задачника —
 * «Площадь. Теорема Пифагора» и «Подобные треугольники».
 *
 * Тридцать прототипов P31–P60, у каждого — числа готовых аналогов
 * (chast2-dannye.ts), разбор по шагам и свой чертёж условия.
 */

import type { GruppaBazy, Prototip } from '../types';
import { PIFAGOR_12_2 } from './chast2-pifagor';
import { PLOSHCHAD_12_2 } from './chast2-ploshchad';
import { PODOBIE_12_2 } from './chast2-podobie';

export const GRUPPY_12_2: GruppaBazy[] = [
  { id: '2A', nazvanie: 'Площадь параллелограмма и ромба', znak: 'ah', ton: 'blue' },
  { id: '2B', nazvanie: 'Трапеция', znak: '\\dfrac{a+b}{2}\\,h', ton: 'orange' },
  { id: '2C', nazvanie: 'Равнобедренный треугольник', znak: '\\triangle', ton: 'green' },
  { id: '2D', nazvanie: 'Прямоугольный треугольник', znak: 'c^2', ton: 'navy' },
  {
    id: '2E',
    nazvanie: 'Пифагор в ромбе и прямоугольнике',
    znak: 'd^2',
    ton: 'terra',
  },
  {
    id: '2F',
    nazvanie: 'Подобие и средняя линия',
    znak: '\\sim',
    ton: 'blue',
  },
];

export const PROTOTIPY_12_2: Prototip[] = [...PLOSHCHAD_12_2, ...PIFAGOR_12_2, ...PODOBIE_12_2];
