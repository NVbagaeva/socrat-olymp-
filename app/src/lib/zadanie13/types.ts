/**
 * Модель задания №13 «Экономические задачи» (кредиты и вклады).
 *
 * Тип → подтип → прототип → задача. Задача строится движком
 * `generate(prototypeId, seed)` детерминированно и проверяется
 * независимым солвером (`solver.ts`): прямой пересчёт таблицы по
 * периодам точными дробями. Описание — docs/13-economics/02-design.md, § 8.
 *
 * Буквы типов — внутренний код. Ученику типы называются словами
 * (решение автора от 23.10.2026): см. TYPE_NAMES.
 */

import type { HintStep } from '../zadanie11/types';

export type { HintStep };

/** A — дифференцированный, B — «поломанный», C — аннуитет, D — вклады. */
export type TypeCode = 'A' | 'B' | 'C' | 'D';

export const TYPE_NAMES: Record<TypeCode, string> = {
  A: 'Дифференцированный платёж',
  B: '«Поломанный» дифференцированный платёж',
  C: 'Аннуитет',
  D: 'Вклад',
};

/** Единицы ответа, которые требует условие. */
export type Units = 'rub' | 'thous' | 'mln' | 'percent' | 'months' | 'years' | 'none';

export type Difficulty = 'base' | 'hard';
export type Source = 'fipi' | 'own';

/** Шаг решения: подпись «что делаем и почему», пояснение и формула. */
export interface SolutionStep {
  title: string;
  text: string;
  /** Формула KaTeX без $…$. */
  formula?: string;
  /** На этом шаге показывается таблица задачи. */
  table?: boolean;
}

/**
 * Формат таблицы (решение автора, 01-analysis.md § 3.1):
 * dif — Долг на начало · Сумма изменения долга · Переплата · Долг на конец;
 * ann — Долг на начало · Долг с процентами · Платёж · Долг на конец;
 * dep — Вклад на начало · После начисления % · Пополнение / Снятие · Вклад на конец.
 */
export type TableScheme = 'dif' | 'ann' | 'dep';

export interface PeriodRow {
  i: number;
  start: number;
  afterInterest: number;
  /** Переплата периода — начисленные проценты. */
  interest: number;
  /** Сумма изменения долга: start − end (у вклада — end − start). */
  change: number;
  /** Платёж; у вклада — пополнение (> 0) или снятие (< 0). */
  payment: number;
  end: number;
  /** Ставка периода в процентах. */
  rate: number;
  /** Запись в общем виде для показа: «S − S/n», «kS». */
  symbolic?: Partial<
    Record<'start' | 'afterInterest' | 'interest' | 'change' | 'payment' | 'end', string>
  >;
}

export interface TableModel {
  scheme: TableScheme;
  period: 'month' | 'year';
  /** Подписи периодов: «1», «2», … или «15.02», «2027». */
  labels: string[];
  rows: PeriodRow[];
  /** Номера показываемых строк (с 1); 0 — строка «…». */
  show: number[];
  totals?: { change: number; interest: number; payment: number };
}

export interface Plot {
  /** Тема колоды: путешествия, учёба и курсы и т. д. */
  deck: string;
  who: string;
  goal: string;
  city?: string;
  year: number;
}

export interface Task13 {
  /** «13.C-08:9f2k» — прототип и seed. */
  id: string;
  taskNumber: 13;
  type: TypeCode;
  /** Подтип классификации: «В5». */
  subtype: string;
  prototypeId: string;
  source: Source;
  /** «по задаче ЕГЭ-2020», «по А. Малковой», «Ларин». */
  sourceNote?: string;
  difficulty: Difficulty;
  seed: string;
  /** Условие: текст, формулы в $…$. */
  condition: string;
  /** Ответ в единицах условия. В браузер уходит только отпечаток. */
  answer: number;
  units: Units;
  solution: SolutionStep[];
  hints: HintStep[];
  tableModel: TableModel;
  plot: Plot;
  params: Record<string, number>;
}

/** Запись реестра прототипов: для генератора, тренажёра и «Собрать вариант». */
export interface PrototypeInfo {
  id: string;
  type: TypeCode;
  subtype: string;
  source: Source;
  sourceNote?: string;
  difficulty: Difficulty;
  units: Units;
  /** Короткое описание для учителя: «по переплате найти срок». */
  title: string;
}
