/**
 * Опорные задачи №9: блоки умений по десять микрозадач.
 *
 * Блок — одно умение («наклон прямой по двум узлам», «знак
 * производной по графику»). На карточке блока формул нет; формулы —
 * внутри блока: плашка «Запомни» и подсказка к микрозадаче.
 * Микрозадача отвечает числом или выбором из вариантов; рисунок —
 * тот же движок (render.ts), в режиме условия — без построений.
 */

import type { Rng } from '../../veroyatnost/generator';
import type { Figura, Params, Vopros } from '../types';

export interface PrepGenerated {
  /** Условие: текст с формулами в $…$. */
  uslovie: string;
  risunok: Figura | null;
  /** Ответ числом (для answerType 'number') или индекс верного варианта (для 'choice'). */
  otvet: number;
  /** Варианты кнопок для answerType 'choice': тексты с формулами. */
  varianty?: string[];
  /** Независимый второй счёт ответа. */
  proverka: number;
  /** Разбор по этапам: строки с формулами в $…$. */
  razbor: string[];
  /** Лесенка вопросов-подсказок с кнопками. */
  podskazka: Vopros[];
  params: Params;
}

export interface PrepMicro {
  /** P9-1-01 … P9-6-10 */
  id: string;
  nazvanie: string;
  answerType: 'number' | 'choice';
  generate(r: Rng): PrepGenerated | null;
}

export interface PrepBlock {
  /** P9-1 … P9-6 */
  id: string;
  /** Адрес: nakl, znak, … */
  slug: string;
  /** 01 … 06 */
  no: string;
  nazvanie: string;
  /** Короткое описание для карточки: без формул. */
  lead: string;
  /** Формулы плашки «Запомни» внутри блока: строки с $…$. */
  zapomni: string[];
  zadachi: PrepMicro[];
}
