/**
 * Опорные задачи задания №11: блоки навыков по 10 микрозадач.
 *
 * Микрозадача — один шаг навыка: найти процент, перевести минуты в
 * часы, выбрать выражение для клетки таблицы, составить уравнение,
 * подобрать корень. Ответ — число или выбор варианта. Подсказка —
 * пошаговые вопросы с кнопками, разбор — строки с формулами. Таблицы —
 * по методике docs/zadanie-11/metodika.md.
 */

import type { Rng } from '../gen/types';
import type { HintStep, SectionId, Tablitsa } from '../types';

export interface MikroVybor {
  /** Номер варианта: «1»…«4». Он же ответ. */
  number: string;
  /** Подпись с формулами в $…$. */
  label: string;
}

export interface MikroZadacha {
  uslovie: string;
  /** Таблица в условии; клетка «?» — то, что ищут. */
  tablitsa?: Tablitsa;
  answerType: 'number' | 'choice';
  /** Число или номер верного варианта. */
  otvet: number | string;
  vybory?: MikroVybor[];
  hints: HintStep[];
  /** Разбор: строки с формулами в $…$; последняя — ответ. */
  razbor: string[];
  /** Заполненная таблица в разборе. */
  razborTablitsa?: Tablitsa;
}

export interface Mikro {
  /** P11-03-07: блок 03, задача 7. */
  id: string;
  nazvanie: string;
  generate(r: Rng): MikroZadacha | null;
}

/** Раздел блока: раздел дерева задач или «общие навыки». */
export type RazdelBloka = SectionId | 'OB';

export interface Blok {
  id: string;
  slug: string;
  /** Номер на карточке: 00 (разминка), 01 … 11. */
  no: string;
  razdel: RazdelBloka;
  nazvanie: string;
  lead: string;
  /** Плашка «Запомни»: строки с формулами в $…$. */
  zapomni: string[];
  /** Зачем этот навык — строка на карточке (content/opornye11.ts). */
  zachem: string;
  /** «Теория к этому блоку»: правило → пример, строки с $…$. */
  teoriya: string[];
  /** Раздел теории для кнопки «Теория раздела». */
  teoriyaRazdel: string;
  zadachi: Mikro[];
}
