/**
 * Задача тренажёра №18. Составлена для сайта в формате задания 18
 * профильного ЕГЭ: условие, а) «докажите», б) «найдите». Ответ б)
 * проверяется автоматически (lib/zadanie18/otvet.ts), доказательство
 * а) ученик сверяет сам по шагам и отмечает «Доказал / Не доказал».
 *
 * Строки — с формулами в долларах (lib/razmetka.ts). У шага —
 * группы подсветки чертежа (lib/zadanie18/trenazher). Утверждение а)
 * и ответ б) проверены численно: scripts/verify_trenazher18
 * (pnpm test:trenazher-18).
 */

import type { SkhemaVZadache } from '../opornye/tipy';
import type { Gruppa18, Podsvechennoe } from '../tipy';

export type Uroven18 = 'razminka' | 'ege' | 'povyshennyy';

export interface Zadacha18 {
  id: string;
  no: number;
  gruppa: Gruppa18;
  uroven: Uroven18;
  nazvanie: string;
  /** Общая часть условия. */
  uslovie: string;
  /** Пункт а): что доказать. */
  a: string;
  /** Пункт б): что найти и при каких данных. */
  b: string;
  /** Ключевые схемы задачи — подсказка со ссылками на страницы схем. */
  skhemy: readonly SkhemaVZadache[];
  /** Наводящая мысль: с чего начать, не раскрывая решения. */
  podskazka: string;
  /** Доказательство пункта а) по шагам. */
  dokazatelstvo: readonly Podsvechennoe[];
  /** Решение пункта б) по шагам. */
  reshenieB: readonly Podsvechennoe[];
  /** Ответ пункта б): число формулой в долларах. Его же принимает поле ответа. */
  otvet: string;
}
