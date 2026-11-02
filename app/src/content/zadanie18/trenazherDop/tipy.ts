/**
 * Перенесённая задача тренажёра №18: один набор чисел, текст целиком.
 * В общий банк (content/zadanie18/trenazher.ts) она попадает типом
 * TipZadachi18 с одним вариантом — trenazherDop/index.ts.
 */

import type { Uroven } from '@/lib/trenazher/types';
import type { SkhemaVZadache } from '../opornye/tipy';
import type { Podsvechennoe } from '../tipy';

export interface ZadachaDop18 {
  /** Тип задачи в банке и ключ чертежа (lib/zadanie18/trenazher/dop). */
  id: string;
  uroven: Uroven;
  /** Название — для отчёта проверки. */
  nazvanie: string;
  uslovie: string;
  a: string;
  b: string;
  /**
   * Ключевые схемы задачи: первая — чип фильтра (тема — её группа), все
   * вместе — вопросы подсказки «какая схема здесь».
   */
  skhemy: readonly SkhemaVZadache[];
  /** Наводящая мысль: с чего начать, не раскрывая решения. */
  podskazka: string;
  /** Доказательство пункта а) по шагам. */
  dokazatelstvo: readonly Podsvechennoe[];
  /** Решение пункта б) по шагам. */
  reshenieB: readonly Podsvechennoe[];
  /** Ответ пункта б). */
  otvet: number;
}
