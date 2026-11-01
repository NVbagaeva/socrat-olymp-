/**
 * Опорные задачи 7–15 записаны со схемами «Какие схемы здесь»: у каждой
 * схемы — чем она помогает в этой задаче. В общий список
 * (content/zadanie18/opornye.ts) они попадают в формате Opornaya18:
 * id схем — в skhemy, пояснения — в zachem в том же порядке.
 */

import type { Opornaya18 } from '../opornye';

export interface SkhemaVZadache {
  /** id ключевой схемы из content/zadanie18/spisok.ts. */
  id: string;
  /** Чем схема помогает в этой задаче. */
  zachem: string;
}

export type OpornayaDop18 = Omit<Opornaya18, 'skhemy' | 'signal' | 'zachem'> & {
  skhemy: readonly SkhemaVZadache[];
};
