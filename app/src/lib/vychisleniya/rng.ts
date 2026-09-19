/**
 * Источник случайных чисел генераторов задания №8.
 *
 * Своего генератора у раздела нет: берётся тот же `rng()`, что у
 * банков №4 и №5, — он построен на `seeded()` задания №3. Здесь
 * только перевод строкового seed в число: seed у №8 — строка вида
 * «8.A#3» или «s-…», чтобы вариант банка и свежая тренировка
 * собирались одним и тем же кодом.
 */

import { rng, type Rng } from '../veroyatnost/generator';

export type { Rng };

/** Число из строки: FNV-1a, как у отпечатков, без соли. */
export function zerno(seed: string): number {
  let hash = 0x811c9dc5;
  for (const ch of seed) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Источник случайных чисел по строковому seed. */
export function rngOf(seed: string): Rng {
  return rng(zerno(seed));
}
