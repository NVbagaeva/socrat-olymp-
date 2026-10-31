/**
 * Главы теории задания №19: четыре вводные и по главе на метод.
 *
 * Порядок методов утверждён планом раздела: инвариант стоит после
 * симметрии, метод прямой параметра — после аналитического. Главы
 * методов, которые ещё не написаны, стоят «Скоро»: в содержании
 * с замком, в «О задании» без ссылки.
 */

import { GLAVA_M01 } from './m01';
import { GLAVA_M02 } from './m02';
import { GLAVA_M03 } from './m03';
import type { Glava19, Opornaya19, Razbor19, Zadacha19 } from './tipy';
import { VVEDENIE_19 } from './vvedenie';

/** Названия 14 методов — по порядку. */
export const METODY_19 = [
  'Графический способ',
  'Геометрический способ',
  'Метод областей',
  'Условия касания',
  'Чётность функций',
  'Симметрия уравнений и систем',
  'Метод инварианта',
  'Метод оценки',
  'Аналитический способ',
  'Метод прямой параметра',
  'Квадратные уравнения и неравенства с параметром',
  'Тригонометрические уравнения с параметром',
  'Свойства функций: непрерывность, монотонность, нечётность',
  'Метод упрощающего значения',
] as const;

const GOTOVYE: Glava19[] = [GLAVA_M01, GLAVA_M02, GLAVA_M03];

function skoro(metod: number): Glava19 {
  return {
    id: `m${String(metod).padStart(2, '0')}`,
    metod,
    title: METODY_19[metod - 1]!,
    skoro: true,
    teoriya: [],
    razbory: [],
    opornye: [],
    zadachi: [],
  };
}

export const GLAVY_19: Glava19[] = [
  ...VVEDENIE_19,
  ...METODY_19.map((_, i) => GOTOVYE.find((g) => g.metod === i + 1) ?? skoro(i + 1)),
];

/** Номер метода — его глава. */
export function glavaMetoda19(metod: number): Glava19 | undefined {
  return GLAVY_19.find((g) => g.metod === metod);
}

/** Все задачи раздела с ответами — для проверочных скриптов и банка. */
export function vseZadachi19(): {
  razbory: Razbor19[];
  opornye: Opornaya19[];
  zadachi: Zadacha19[];
} {
  return {
    razbory: GLAVY_19.flatMap((g) => g.razbory),
    opornye: GLAVY_19.flatMap((g) => g.opornye),
    zadachi: GLAVY_19.flatMap((g) => g.zadachi),
  };
}

export * from './tipy';
