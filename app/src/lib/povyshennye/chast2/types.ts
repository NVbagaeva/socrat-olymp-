/**
 * Часть 2 (задания 14–20) в вариантах повышенной сложности.
 *
 * Версия хранит семь записей «шаблон + параметры» (как часть 1), задачу
 * целиком собирает шаблон: условие, пункты с полями ответа, ответ,
 * решение учителя по этапам, разбор ученика и чертёж движком раздела.
 *
 * Формулы — в $…$. Ссылка на теорему справочника — {{t:id|текст}}:
 * на экране это кнопка, по ней открывается формулировка с чертежом
 * и доказательством (lib/teoremy); на листе — подчёркнутый текст
 * и список теорем в конце листа учителя.
 */

import type { Part2No } from '@/content/variantOnline/bally';
import type { Pole } from '@/lib/chast2/sravnenie';

export interface Punkt {
  /** «а», «б», «в» или null — у задачи без пунктов. */
  bukva: string | null;
  /** Поле ответа; null — пункт без ответа (доказательство). */
  pole: Pole | null;
  /** Подпись к полю: «Корни на отрезке», «Множество значений a». */
  podpis?: string;
}

/**
 * Рамка в решении: «теория» — справка с главной формулой перед
 * выкладками этапа; «примечание» — сноска после ответа (почему выбран
 * этот путь). Строки — с $…$, formula — TeX без долларов, набирается
 * крупно по центру.
 */
export interface Ramka {
  vid: 'teoriya' | 'primechanie';
  title: string;
  lines: string[];
  formula?: string;
  /** Строки после формулы. */
  posle?: string[];
}

/** Этап решения учителя: подпись и строки; у этапа может быть свой чертёж. */
export interface Etap {
  title: string;
  lines: string[];
  /** Чертёж к этапу (SVG движка) — лист учителя и решение на экране. */
  risunok?: string;
  /** Рамка теории перед строками этапа. */
  ramka?: Ramka;
  /** Пояснения мелким шрифтом после строк этапа. */
  melko?: string[];
}

/** Шаг разбора ученика: шаг словами и формула. */
export interface RazborShag {
  slovo: string;
  formula?: string;
}

export interface Chast2Zadacha {
  no: Part2No;
  /** Шаблон и версия — для отчёта и автотеста. */
  shablon: string;
  /** Условие с формулами в $…$; абзацы — через \n. */
  uslovie: string;
  /** Чертёж условия (SVG движка) — у 15 и 18. */
  risunok: string | null;
  punkty: Punkt[];
  /** Верный ответ для показа: «а) …; б) …». */
  otvet: string;
  reshenie: Etap[];
  razbor: RazborShag[];
  /** Сноска в рамке после ответа. */
  snoska?: Ramka;
  /** Уточнения критериев (место {u} в kriterii.ts). */
  utochnenie?: Record<string, string>;
  /**
   * Числа для автотеста: ответ, посчитанный шаблоном по формуле, — тест
   * сверяет его со вторым способом (перебор, координаты, sympy).
   */
  kontrol: Record<string, number | number[] | boolean>;
}

/** Запись версии: шаблон и его параметры. */
export interface Zapis2 {
  s: string;
  p: Record<string, unknown>;
}

export interface Shablon2<P> {
  no: Part2No;
  /** Прототип словами — для отчёта. */
  prototip: string;
  sobrat: (p: P) => Chast2Zadacha;
}
