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
  /**
   * Оформление шага: рамка «Вспоминаем …» или рамка «Внимание на
   * формулировку». Нет — обычный шаг.
   */
  vid?: 'ramka' | 'vnimanie';
  /** Куски шага по порядку после текста: формулы, плашки, пропорции, таблицы. */
  bloki?: ShagBlok[];
}

/** Кусок шага решения. Текст — с формулами в $…$, формула — KaTeX без $…$. */
export type ShagBlok =
  | { vid: 'formula'; tex: string }
  | { vid: 'text'; text: string }
  /** Плашка-пояснение: почему сделали именно так. */
  | { vid: 'plashka'; text: string }
  /** Мелкий текст под формулами. */
  | { vid: 'melko'; text: string }
  /** Пропорция «100 % — S, r % — ?» и вывод из неё. */
  | { vid: 'proporciya'; rows: [string, string][]; vyvod: string }
  | { vid: 'tablitsa'; t: TablitsaPeremennye };

/**
 * Таблица дифференцированного платежа в переменных: клетки — TeX без
 * $…$, сокращённые строки 1, 2, 3, …, n − 1, n. Над шапкой — стрелка от
 * «Переплаты» к «Долгу на начало» с подписью.
 */
export interface TablitsaPeremennye {
  /** Подпись над таблицей: «Первый банк: $n = 11$, $r = 7$». */
  podpis: string;
  period: 'month' | 'year';
  /** Строки: подпись периода и четыре клетки; null — строка «…». */
  rows: ({ label: string; cells: [string, string, string, string] } | null)[];
  /** Итого: сумма изменения долга и переплата. */
  itog: [string, string];
  /** Подпись стрелки, текст с формулами в $…$. */
  strelka: string;
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

/**
 * Тип вопроса задачи — от него зависит последний шаг решения: что
 * берём за 100 % и что вычитаем (ответ на вопрос задачи).
 *  ot-summy     «на сколько процентов от суммы кредита» — разность процентов
 *  ot-pereplaty «на сколько процентов переплата … чем в другом» — за 100 %
 *               переплата того банка, с которым сравнивают
 *  vo-skolko    «во сколько раз» — отношение, без процентов
 *  procent      «на сколько процентов больше кредита заплатить» — переплата в %
 *  rubli        переплата или разница в рублях
 *  summa        найти сумму кредита
 *  stavka       найти ставку
 *  srok         найти срок
 */
export type Vopros13 =
  'ot-summy' | 'ot-pereplaty' | 'vo-skolko' | 'procent' | 'rubli' | 'summa' | 'stavka' | 'srok';

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
  /** Таблица в условии (график долга): подписи и строки. */
  conditionTable?: ConditionTable;
  /** Ответ в единицах условия. В браузер уходит только отпечаток. */
  answer: number;
  units: Units;
  /** Тип вопроса: от него зависит последний шаг решения. */
  vopros?: Vopros13;
  solution: SolutionStep[];
  hints: HintStep[];
  tableModel: TableModel;
  plot: Plot;
  params: Record<string, number>;
}

/** Таблица условия: «Дата | 15.01 | 15.02 …», «Долг | 100 % | 90 % …». */
export interface ConditionTable {
  head: string[];
  rows: string[][];
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
