/**
 * Реестр прототипов чертежей: блоки I–IX (Блок 1 ФИПИ) и X
 * (дополнительные — из курса, которых нет в Блоке 1).
 */

import { BLOK_I } from './blok1';
import { BLOK_II_IV } from './blok2';
import { BLOK_V_IX } from './blok3';
import { BLOK_X } from './blok10';
import type { PrototipChertezha } from './dsl';
import { PROTOTIPY_POVYSHENNYE } from './povyshennye';
import { PROTOTIPY_EZHEMESYACHNYE } from './ezhemesyachnye';

export type { PrototipChertezha } from './dsl';

export const PROTOTIPY: readonly PrototipChertezha[] = [
  ...BLOK_I,
  ...BLOK_II_IV,
  ...BLOK_V_IX,
  ...BLOK_X,
];

export function prototip(id: number): PrototipChertezha {
  /* Прототипы вариантов повышенной сложности и ежемесячных — не в общем реестре:
     в банк, тренажёр и генератор №1 они не попадают. */
  const p =
    PROTOTIPY.find((x) => x.id === id) ??
    PROTOTIPY_POVYSHENNYE.find((x) => x.id === id) ??
    PROTOTIPY_EZHEMESYACHNYE.find((x) => x.id === id);
  if (p === undefined) throw new Error(`прототип чертежа ${id} не найден`);
  return p;
}
