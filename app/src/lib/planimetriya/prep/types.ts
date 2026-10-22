/**
 * Тренировки навыков вкладки «Опорные задачи» задания №1.
 *
 * Микрозадача — один навык, одно действие: найти третий угол,
 * смежный угол, катет против 30°, площадь, вписанный угол. У блока
 * десять зафиксированных задач, у каждой — «Ещё вариант» на новом
 * seed. Ответ — число. Рисунок условия — движок планиметрии в режиме
 * ученика (без построений и чисел, кроме данных), рисунок разбора — в
 * режиме учителя.
 */

import type { Rng } from '../../veroyatnost/generator';
import type { Scena } from '../types';

export interface MikroGenerated {
  /** Условие с формулами в $…$. */
  uslovie: string;
  /** Чертёж или null. */
  risunok: Scena | null;
  otvet: number;
  /** Разбор: строки с формулами в $…$. */
  razbor: string[];
}

export interface Mikro {
  /** Идентификатор: P1-1-03. */
  id: string;
  nazvanie: string;
  /** Формула-подсказка, TeX без долларов. Ответа в ней нет. */
  formula: string;
  generate(r: Rng): MikroGenerated | null;
}

export interface Blok {
  /** Идентификатор блока: P1-1. */
  id: string;
  /** Часть адреса: /opornye-zadachi/{slug}/. */
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  /** Плашка «Запомни»: формулы блока, TeX. */
  formuly: string[];
  zadachi: Mikro[];
}
