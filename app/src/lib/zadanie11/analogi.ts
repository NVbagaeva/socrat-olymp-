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

import dp01 from '../../data/zadanie11/analogs/DP-01.json';
import dp02 from '../../data/zadanie11/analogs/DP-02.json';
import dp03 from '../../data/zadanie11/analogs/DP-03.json';
import dp04 from '../../data/zadanie11/analogs/DP-04.json';
import dp05 from '../../data/zadanie11/analogs/DP-05.json';
import dp06 from '../../data/zadanie11/analogs/DP-06.json';
import dp08 from '../../data/zadanie11/analogs/DP-08.json';
import dp09 from '../../data/zadanie11/analogs/DP-09.json';
import dp10 from '../../data/zadanie11/analogs/DP-10.json';
import dp11 from '../../data/zadanie11/analogs/DP-11.json';
import dp12 from '../../data/zadanie11/analogs/DP-12.json';
import dp13 from '../../data/zadanie11/analogs/DP-13.json';
import dp07 from '../../data/zadanie11/analogs/DP-07.json';
import sm01 from '../../data/zadanie11/analogs/SM-01.json';
import sm02 from '../../data/zadanie11/analogs/SM-02.json';
import sm03 from '../../data/zadanie11/analogs/SM-03.json';
import sm04 from '../../data/zadanie11/analogs/SM-04.json';
import sm05 from '../../data/zadanie11/analogs/SM-05.json';
import sm06 from '../../data/zadanie11/analogs/SM-06.json';
import sm08 from '../../data/zadanie11/analogs/SM-08.json';
import sm07 from '../../data/zadanie11/analogs/SM-07.json';
import pr01 from '../../data/zadanie11/analogs/PR-01.json';
import pr02 from '../../data/zadanie11/analogs/PR-02.json';
import pr03 from '../../data/zadanie11/analogs/PR-03.json';
import pr04 from '../../data/zadanie11/analogs/PR-04.json';
import pr05 from '../../data/zadanie11/analogs/PR-05.json';
import pr06 from '../../data/zadanie11/analogs/PR-06.json';
import pr07 from '../../data/zadanie11/analogs/PR-07.json';
import pt01 from '../../data/zadanie11/analogs/PT-01.json';
import pt02 from '../../data/zadanie11/analogs/PT-02.json';
import pt03 from '../../data/zadanie11/analogs/PT-03.json';
import pt04 from '../../data/zadanie11/analogs/PT-04.json';
import rz01 from '../../data/zadanie11/analogs/RZ-01.json';
import rz02 from '../../data/zadanie11/analogs/RZ-02.json';
import rz03 from '../../data/zadanie11/analogs/RZ-03.json';
import rz04 from '../../data/zadanie11/analogs/RZ-04.json';
import rz05 from '../../data/zadanie11/analogs/RZ-05.json';
import rz06 from '../../data/zadanie11/analogs/RZ-06.json';
import rz07 from '../../data/zadanie11/analogs/RZ-07.json';
import rz08 from '../../data/zadanie11/analogs/RZ-08.json';
import rz09 from '../../data/zadanie11/analogs/RZ-09.json';
import rz10 from '../../data/zadanie11/analogs/RZ-10.json';
import rz11 from '../../data/zadanie11/analogs/RZ-11.json';
import rz12 from '../../data/zadanie11/analogs/RZ-12.json';
import rz13 from '../../data/zadanie11/analogs/RZ-13.json';
import rz14 from '../../data/zadanie11/analogs/RZ-14.json';
import rz15 from '../../data/zadanie11/analogs/RZ-15.json';
import rz16 from '../../data/zadanie11/analogs/RZ-16.json';
import rz17 from '../../data/zadanie11/analogs/RZ-17.json';
import rz18 from '../../data/zadanie11/analogs/RZ-18.json';
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
  'PR-01': pr01 as unknown as Analog[],
  'PR-02': pr02 as unknown as Analog[],
  'PR-03': pr03 as unknown as Analog[],
  'PR-04': pr04 as unknown as Analog[],
  'PR-05': pr05 as unknown as Analog[],
  'PR-06': pr06 as unknown as Analog[],
  'PR-07': pr07 as unknown as Analog[],
  'PT-01': pt01 as unknown as Analog[],
  'PT-02': pt02 as unknown as Analog[],
  'PT-03': pt03 as unknown as Analog[],
  'PT-04': pt04 as unknown as Analog[],
  'RZ-01': rz01 as unknown as Analog[],
  'RZ-02': rz02 as unknown as Analog[],
  'RZ-03': rz03 as unknown as Analog[],
  'RZ-04': rz04 as unknown as Analog[],
  'RZ-05': rz05 as unknown as Analog[],
  'RZ-06': rz06 as unknown as Analog[],
  'RZ-07': rz07 as unknown as Analog[],
  'RZ-08': rz08 as unknown as Analog[],
  'RZ-09': rz09 as unknown as Analog[],
  'RZ-10': rz10 as unknown as Analog[],
  'RZ-11': rz11 as unknown as Analog[],
  'RZ-12': rz12 as unknown as Analog[],
  'RZ-13': rz13 as unknown as Analog[],
  'RZ-14': rz14 as unknown as Analog[],
  'RZ-15': rz15 as unknown as Analog[],
  'RZ-16': rz16 as unknown as Analog[],
  'RZ-17': rz17 as unknown as Analog[],
  'RZ-18': rz18 as unknown as Analog[],
  'DP-01': dp01 as unknown as Analog[],
  'DP-02': dp02 as unknown as Analog[],
  'DP-03': dp03 as unknown as Analog[],
  'DP-04': dp04 as unknown as Analog[],
  'DP-05': dp05 as unknown as Analog[],
  'DP-06': dp06 as unknown as Analog[],
  'DP-08': dp08 as unknown as Analog[],
  'DP-09': dp09 as unknown as Analog[],
  'DP-10': dp10 as unknown as Analog[],
  'DP-11': dp11 as unknown as Analog[],
  'DP-12': dp12 as unknown as Analog[],
  'DP-13': dp13 as unknown as Analog[],
  'DP-07': dp07 as unknown as Analog[],
  'SM-01': sm01 as unknown as Analog[],
  'SM-02': sm02 as unknown as Analog[],
  'SM-03': sm03 as unknown as Analog[],
  'SM-04': sm04 as unknown as Analog[],
  'SM-05': sm05 as unknown as Analog[],
  'SM-06': sm06 as unknown as Analog[],
  'SM-08': sm08 as unknown as Analog[],
  'SM-07': sm07 as unknown as Analog[],
};

export const ANALOGI: Analog[] = Object.values(POOL_ANALOGOV).flat();
