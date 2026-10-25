/**
 * Устройство прототипа задания №13.
 *
 * Прототип по seed выбирает параметры «от ответа», пишет условие,
 * решение по шагам и подсказки. Ответ считается дважды: формулой типа
 * (`answer`) и независимым солвером (`verify`, только прямой пересчёт
 * таблицы по периодам из solver.ts). Генератор принимает задачу, только
 * если они совпали и все проверки пройдены.
 */

import type { Drob } from '../drob';
import type { PlotFull } from '../plots';
import type { Rng } from '../rng';
import type { Row } from '../solver';
import type {
  Zapros13,
  ConditionTable,
  HintStep,
  PrototypeInfo,
  SolutionStep,
  TableScheme,
  Units,
  Vopros13,
} from '../types';

export interface Ctx {
  rng: Rng;
  plot: PlotFull;
}

export interface Draft {
  condition: string;
  conditionTable?: ConditionTable;
  /** Ответ по формуле типа, в единицах условия. */
  answer: Drob;
  /** Тот же ответ, найденный солвером. */
  verify: Drob;
  params: Record<string, number>;
  /** Таблица решения из солвера. */
  rows: Row[];
  scheme: TableScheme;
  period: 'month' | 'year';
  labels?: string[];
  /** Строки, которые надо показать в сокращённой таблице (платёж 11-го месяца). */
  extra?: number[];
  solution: SolutionStep[];
  hints: HintStep[];
  /** Единицы ответа, если у этой формулировки они свои («во сколько раз» — без единиц). */
  units?: Units;
  /** Тип вопроса задачи. */
  vopros?: Vopros13;
  /** Найденные нарушения: непустой список — задача отбрасывается. */
  problems?: string[];
  /** «Таблица руками»: что спрашивают и про какой период (формула ответа в «Заполни таблицу»). */
  zapros?: Zapros13;
}

export interface Prototype extends PrototypeInfo {
  /** Наборы чисел из источников: совпадение всех ключей — задача отбрасывается. */
  forbid?: Record<string, number>[];
  /** Сюжет: кредит или вклад; можно ли организацию. */
  plot?: { kind?: 'credit' | 'deposit'; allowFirm?: boolean };
  /** Сколько знаков после запятой допустимо в ответе (по умолчанию 2). */
  maxDecimals?: number;
  make(ctx: Ctx): Draft | null;
}

export type { Units };
