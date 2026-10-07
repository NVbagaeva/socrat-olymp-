/**
 * Пул аналогов задания №11: по 10 вычитанных «новых» задач на
 * прототип (data/zadanie11/analogs/<код>.json). Аналог — та же модель
 * и та же функция solve, что у прототипа банка, другие числа и сюжет;
 * условие написано вручную (поле text), решение и подсказки строит
 * solve(params) — слова сюжета приходят параметрами (герой, вещество).
 *
 * Модуль серверный: в файлах лежат ответы. В браузер аналоги уходят
 * как условия банка — без ответа (trenazher/dannye.ts).
 */

import dp07 from '../../data/zadanie11/analogs/DP-07.json';
import sm07 from '../../data/zadanie11/analogs/SM-07.json';
import type { Params } from './types';

export interface Analog {
  /** «ДП-07-a01». */
  id: string;
  /** Код прототипа в данных: «DP-07». */
  prototypeId: string;
  source: 'analog';
  level: 1 | 2 | 3;
  params: Params;
  text: string;
  /** Вариант вопроса (AB/BA, pct/kg…) — для распределения поровну. */
  ask: string;
  answer: number;
  /** Короткая метка сюжета: «лыжник», «катер». */
  plotTag: string;
}

/** Пул по прототипам; новый прототип — новая строка. */
export const POOL_ANALOGOV: Record<string, Analog[]> = {
  'DP-07': dp07 as Analog[],
  'SM-07': sm07 as Analog[],
};

export const ANALOGI: Analog[] = Object.values(POOL_ANALOGOV).flat();
