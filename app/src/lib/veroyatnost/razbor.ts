/**
 * Закрытая часть задачи — то, что раскрывается по просьбе ученика.
 *
 * Модуль без импортов банка: его читает браузер. Здесь только форма
 * закрытого разбора и разбор строки, которую открыл `openText`.
 */

import type { AtomVykladki } from '../tex';
import type { Parametry, Podsvetka } from './model';
import { openText } from './secret';

export interface RazborShag {
  /** Пояснение шага словами. Дробей и выкладок в нём нет — они в формуле. */
  text: string;
  /** Формула шага в TeX — из неё набираются печатные листы. */
  tex?: string;
  /**
   * Та же формула выкладкой: утверждения, каждое атомами со знаками
   * между ними, набранными KaTeX на сборке. Строки из атомов
   * собирает карточка по ширине колонки (VykladkaKlient).
   */
  vykladka?: AtomVykladki[][];
  /** Та же формула словами: для alt и для мест без KaTeX. */
  plain?: string;
}

export interface Razbor {
  /** Фраза после «Метод:». */
  metod: string;
  shagi: RazborShag[];
  /**
   * Параметры рисунка: плитки с количествами, клетки таблицы,
   * вероятности на ветвях, доли групп. По ним ответ читается прямо
   * с рисунка, поэтому они закрыты вместе с разбором, а не лежат в
   * странице открыто. Нет у задачи без модели.
   */
  parametry?: Parametry;
  /** Подсветка благоприятного на рисунке. */
  podsvetka: Podsvetka;
  /** Ответ, как его записать: «0,25». */
  otvet: string;
}

/** Открыть закрытый разбор по отпечатку верного ответа. */
export function otkrytRazbor(steps: string, seal: string): Razbor {
  return JSON.parse(openText(steps, seal)) as Razbor;
}
