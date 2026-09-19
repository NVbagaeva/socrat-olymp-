/**
 * Закрытая часть задачи — то, что раскрывается по просьбе ученика.
 *
 * Модуль без импортов банка: его читает браузер. Здесь только форма
 * закрытого разбора и разбор строки, которую открыл `openText`.
 */

import type { Podsvetka } from './model';
import { openText } from './secret';

export interface RazborShag {
  /** Пояснение шага словами. Дробей и выкладок в нём нет — они в формуле. */
  text: string;
  /** Формула шага в TeX — из неё набираются печатные листы. */
  tex?: string;
  /** Та же формула, набранная KaTeX на сборке — готовый HTML. */
  html?: string;
  /** Та же формула словами: для alt и для мест без KaTeX. */
  plain?: string;
}

export interface Razbor {
  /** Фраза после «Метод:». */
  metod: string;
  shagi: RazborShag[];
  /** Подсветка благоприятного на рисунке. */
  podsvetka: Podsvetka;
  /** Ответ, как его записать: «0,25». */
  otvet: string;
}

/** Открыть закрытый разбор по отпечатку верного ответа. */
export function otkrytRazbor(steps: string, seal: string): Razbor {
  return JSON.parse(openText(steps, seal)) as Razbor;
}
