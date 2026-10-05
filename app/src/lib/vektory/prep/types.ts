/**
 * Тренировки навыков вкладки «Опорные задачи» задания №2.
 *
 * Микрозадача — один навык, одно действие: прочитать координаты с
 * рисунка, сложить векторы, найти длину, скалярное произведение,
 * косинус. У блока шесть зафиксированных задач, у каждой — кнопка
 * «Ещё вариант» на новом seed. Ответ — число или выбор из четырёх
 * вариантов (у координат: с подвохами «начало минус конец»,
 * «потерян знак», «перепутаны x и y»).
 */

import type { Rng } from '../../veroyatnost/generator';
import type { Risunok } from '../types';

export interface MikroVybor {
  /** Номер варианта: «1»…«4». Он же ответ. */
  number: string;
  /** Подпись варианта с формулами в $…$. */
  label: string;
}

export interface MikroGenerated {
  /** Условие с формулами в $…$. */
  uslovie: string;
  /** Рисунок без катетов или null. */
  risunok: Risunok | null;
  /** Ответ: число или номер верного варианта. */
  otvet: number | string;
  /** Разбор: строки с формулами в $…$. */
  razbor: string[];
  /** Варианты выбора; у числового ответа — нет. */
  vybory?: MikroVybor[];
}

export interface Mikro {
  /** Идентификатор: P2-1-03. */
  id: string;
  nazvanie: string;
  /** Формула-подсказка, TeX без долларов. Ответа в ней нет. */
  formula: string;
  answerType: 'number' | 'choice';
  generate(r: Rng): MikroGenerated | null;
}

export interface Blok {
  /** Идентификатор блока: P2-1. */
  id: string;
  /** Часть адреса: /opornye-zadachi/{slug}/. */
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  /** Формула на карточке блока, TeX. */
  formula: string;
  /** Плашка «Запомни»: формулы блока, TeX. */
  formuly: string[];
  zadachi: Mikro[];
}
