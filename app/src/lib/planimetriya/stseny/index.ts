/**
 * Реестр прототипов чертежей: блоки I–IX (Блок 1 ФИПИ) и X
 * (дополнительные — из курса, которых нет в Блоке 1).
 */

import { BLOK_I } from './blok1';
import { BLOK_II_IV } from './blok2';
import { BLOK_V_IX } from './blok3';
import { BLOK_X } from './blok10';
import type { PrototipChertezha } from './dsl';

export type { PrototipChertezha } from './dsl';

export const PROTOTIPY: readonly PrototipChertezha[] = [
  ...BLOK_I,
  ...BLOK_II_IV,
  ...BLOK_V_IX,
  ...BLOK_X,
];

export function prototip(id: number): PrototipChertezha {
  const p = PROTOTIPY.find((x) => x.id === id);
  if (p === undefined) throw new Error(`прототип чертежа ${id} не найден`);
  return p;
}
