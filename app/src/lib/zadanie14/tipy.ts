/**
 * Задачи задания №14 (тригонометрические уравнения): данные одной
 * задачи и блока опорных задач.
 *
 * Ответы нигде не пишутся руками: пункт а — серии (эталон), пункт б —
 * корни серий на промежутке, их считает lib/zadanie14/ugol.ts. Функция
 * `f` (левая часть минус правая) нужна самотесту
 * (scripts/check-zadanie14.mjs): каждая серия обращает её в ноль, и на
 * $[-2\pi;\,2\pi]$ у уравнения нет других корней.
 */

import type { HintStep } from '../zadanie7/types';
import type { Promezhutok, Seriya } from './ugol';

export type { HintStep };

/** Методы — они же блоки опорных задач и фильтр тренажёра. */
export type Metod14 =
  | 'prosteyshie'
  | 'argument'
  | 'obedinenie'
  | 'otbor-krug'
  | 'otbor-nerav'
  | 'privedenie'
  | 'privedenie-kvadrat'
  | 'dvoynoy'
  | 'slozhenie'
  | 'zamena'
  | 'zamena-preobr'
  | 'odnorodnye-1'
  | 'odnorodnye-2'
  | 'vspomogatelnyy'
  | 'abc';

/** Уравнение в формате №14: пункт а — решить, пункт б — отобрать корни. */
export interface Uravnenie14 {
  vid: 'uravnenie';
  id: string;
  /** Уравнение, TeX без долларов. */
  uravnenie: string;
  /** Левая часть минус правая; для уравнений с ОДЗ — вместе с `odz`. */
  f: (x: number) => number;
  /** Область допустимых значений (знаменатель, логарифм, корень). */
  odz?: (x: number) => boolean;
  /** Эталон пункта а. */
  serii: Seriya[];
  /**
   * Своя запись ответа пункта а (TeX строк серий без «, k∈ℤ»), например
   * через $(-1)^k$; нет — собирается из серий (± склеивается сам).
   */
  zapisA?: string[];
  /** Промежуток пункта б; нет — у задачи только пункт а. */
  promezhutok?: Promezhutok;
  /** Как разобран пункт б: по окружности или двойным неравенством. */
  otbor?: 'krug' | 'nerav';
  metody: Metod14[];
  /** Решение пункта а по шагам: строки с $…$ и **…**. */
  reshenie: string[];
  /** Подсказка — вопросы с кнопками. */
  podskazki: HintStep[];
  /** Служебная пометка, откуда задача (на сайте не показывается). */
  iz?: string;
}

/**
 * Разминка в формате части 1: «наименьший положительный» или
 * «наибольший отрицательный» корень. Аргумент вида $\frac{\pi(x+b)}{n}$:
 * корни — обычные числа, ответ — одно число.
 */
export interface Razminka14 {
  vid: 'razminka';
  id: string;
  uravnenie: string;
  vopros: 'min-pol' | 'max-otr';
  f: (x: number) => number;
  /** Серии корней в числах: $x=x_0+h k$. */
  serii: { x0: number; h: number; tex: string }[];
  otvet: number;
  metody: Metod14[];
  reshenie: string[];
  podskazki: HintStep[];
  iz?: string;
}

export type Zadacha14 = Uravnenie14 | Razminka14;

export interface Blok14 {
  id: Metod14;
  slug: string;
  no: number;
  /** Название блока; формула — в $…$ (выводится через Tex). */
  nazvanie: string;
  /** Для карточки блока — без формул (docs/razdel-pravila.md, п. 3). */
  opisanie: string;
  /** «Запомни»: правило блока, с формулами. */
  zapomni: string;
  /** Пример к правилу «Запомни» (у рамки-правила всегда есть пример). */
  primer: string;
  /** Первая задача — с полным разбором, остальные — с подсказками. */
  zadachi: Zadacha14[];
}
