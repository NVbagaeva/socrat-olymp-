/**
 * Данные задач тренажёра №11 для браузера.
 *
 * Файлы public/data/zadanie11/<подтип>.json («DP-07.json») — условия и
 * параметры задач подтипа: открытого банка ФИПИ, разминки и пула
 * аналогов. **Ответов там нет**: только отпечаток `seal`
 * (lib/zadanie11/secret.ts). Разбор, таблицу модели и подсказки браузер
 * строит сам — функцией подтипа по параметрам (lib/zadanie11/trening/reshatel.ts).
 *
 * Ключ задачи — тот же, что у прежнего тренажёра №11 и в журнале
 * попыток: «DP-07|b12» (банк, номер задачи в списке), «|r1001»
 * (разминка), «|a2001» (аналог). Так прежние ошибки, решённые задачи и
 * закладки остаются на своих задачах.
 *
 * Файлы собирает `pnpm build:bank-11`; `pnpm test:progress-11` сверяет их с банком.
 */

import { dataUrl } from '../../dataUrl';
import type { Params } from '../types';

export const PAPKA_DANNYH_11 = '/data/zadanie11';

/** Откуда задача: открытый банк ФИПИ, разминка (не ЕГЭ) или аналог из пула. */
export type Istochnik11 = 'fipi' | 'razminka' | 'analog';

/** Задача без ответа. */
export interface ZadachaLite11 {
  id: string;
  prototypeId: string;
  source: Istochnik11;
  /** Условие с формулами в $…$. */
  text: string;
  params: Params;
  /** Отпечаток ответа (число или номер варианта). */
  seal: string;
  /** Варианты ответа (РЗ-17 «что больше»): ответ — номер варианта с единицы. */
  vybory?: string[];
  /** Лайфхаки теории, которые пригодятся в задаче. */
  lh?: string[];
}

/** Ключи задач №11. */
export const KLYUCH11 = /^(RZ|PR|SM|DP|PT|VD|OK|RB|PG)-\d\d\|[bra]\d+$/;

export function urlDannyh11(fail: string): string {
  return dataUrl(`${PAPKA_DANNYH_11}/${fail}.json`);
}
