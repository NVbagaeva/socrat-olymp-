/**
 * Часть 2 ежемесячных вариантов: запись варианта → задача (формат —
 * lib/povyshennye/chast2/types.ts). Шаблоны — свои (по файлу на
 * вариант) и, если понадобится, общий реестр вариантов повышенной
 * сложности.
 *
 * Модуль тяжёлый (движки чертежей): грузится вместе с набором варианта.
 */

import { SHABLONY_2 } from '@/lib/povyshennye/chast2';
import type { Chast2Zadacha, Shablon2 } from '@/lib/povyshennye/chast2/types';
import { zagruzitVariant } from '../dannye';
import type { Zapis } from '../types';
import { CHAST2_M01 } from './m01';
import { CHAST2_M02 } from './m02';
import { CHAST2_M03 } from './m03';
import { CHAST2_M04 } from './m04';

/* eslint-disable @typescript-eslint/no-explicit-any -- параметры у каждого шаблона свои */
export const SHABLONY_2_EV: Readonly<Record<string, Shablon2<any>>> = {
  ...CHAST2_M01,
  ...CHAST2_M02,
  ...CHAST2_M03,
  ...CHAST2_M04,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function zadacha2EV(z: Zapis): Chast2Zadacha {
  const sh = SHABLONY_2_EV[z.s] ?? SHABLONY_2[z.s];
  if (sh === undefined) throw new Error(`часть 2: нет шаблона ${z.s}`);
  return sh.sobrat(z.p);
}

/** Задачи 14–20 варианта k; null — у варианта части 2 нет. */
export async function chast2EV(k: number): Promise<Chast2Zadacha[] | null> {
  const d = await zagruzitVariant(k);
  const zapisi = d?.chast2?.[0];
  return zapisi === undefined ? null : zapisi.map(zadacha2EV);
}
