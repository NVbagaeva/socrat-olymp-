/**
 * Шаблон опорной задачи №18. Задачи составлены для сайта в духе
 * задания 18 профильного ЕГЭ: условие с пунктами а) «докажите» и
 * б) «найдите», чертёж (lib/zadanie18/opornye), ключевые схемы,
 * из которых собрано решение, и решение по шагам.
 *
 * Строки — с формулами в долларах (lib/razmetka.ts). У шага решения —
 * группы подсветки чертежа, как у шагов доказательства схемы.
 * Утверждение а) и ответ б) проверены численно:
 * scripts/verify_opornye18 (pnpm test:opornye-18).
 */

import type { Gruppa18, Podsvechennoe } from '../tipy';

export interface SkhemaVZadache {
  /** id ключевой схемы из content/zadanie18/spisok.ts. */
  id: string;
  /** Чем схема помогает в этой задаче. */
  zachem: string;
}

export interface Opornaya18 {
  id: string;
  no: number;
  gruppa: Gruppa18;
  nazvanie: string;
  /** Общая часть условия. */
  uslovie: string;
  /** Пункт а): что доказать. */
  a: string;
  /** Пункт б): что найти и при каких данных. */
  b: string;
  skhemy: readonly SkhemaVZadache[];
  reshenieA: readonly Podsvechennoe[];
  reshenieB: readonly Podsvechennoe[];
  /** Ответ пункта б): формула в долларах. */
  otvet: string;
}
