/**
 * Опорные задачи задания №8: модель.
 *
 * Микро-задача — одно свойство и один шаг. У каждой есть генератор с
 * seed; на вкладке показывается зафиксированный вариант, «Ещё
 * вариант» берёт новый seed в браузере. Формула-подсказка — точная
 * формула свойства, без чисел варианта.
 */

import type { Rng } from '../rng';

export type PrepGroup = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface PrepChoice {
  /** Номер варианта: '1', '2'. */
  number: string;
  /** Текст варианта: «плюс», «минус». */
  label: string;
}

/** Что даёт генератор — ещё с ответом (только сборка и память браузера). */
export interface PrepGenerated {
  /** Условие: текст с формулами в $…$. */
  uslovie: string;
  /** Ответ числом или номер верного варианта. */
  otvet: number | string;
  /** Одна строка разбора с подставленными числами, с формулами в $…$. */
  razbor: string;
  /** Независимый численный счёт для самотеста. Для выбора — null. */
  proverka: number | null;
}

export interface PrepMicro {
  /** Идентификатор: P8-1-01. */
  id: string;
  /** Что отрабатывается: «Произведение степеней». */
  nazvanie: string;
  /** Формула-подсказка, TeX без долларов. Показывается после ошибки. */
  formula: string;
  answerType: 'number' | 'choice';
  choices?: PrepChoice[];
  generate(r: Rng): PrepGenerated | null;
}

export interface PrepBlock {
  /** Идентификатор: P8-1. */
  id: string;
  group: PrepGroup;
  /** Часть адреса: /opornye-zadachi/{slug}/. */
  slug: string;
  /** Номер на карточке: 01 … 05. */
  no: string;
  nazvanie: string;
  lead: string;
  /** Формула на карточке блока, TeX. */
  formula: string;
  /** Плашка «Запомни!»: формулы блока, TeX. */
  formuly: string[];
  zadachi: PrepMicro[];
}
