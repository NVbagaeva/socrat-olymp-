/**
 * Часть 2 вариантов раздела: запись версии → задача (chast2/types.ts).
 *
 * Шаблоны тяжёлые (движки чертежей, точная арифметика), поэтому модуль
 * грузится отдельным куском — вместе с набором версии, а не экраном
 * раздела.
 */

import { zagruzitVariant } from '../dannye';
import type { Zapis } from '../types';
import type { Chast2Zadacha, Shablon2 } from './types';
import { Z14_LOG_TRIG } from './z14';
import { Z15_ROMB_PIRAMIDA } from './z15';
import { Z16_POKAZ_KOREN } from './z16';
import { Z17_KACHKA } from './z17';
import { Z18_PYATIUGOLNIK } from './z18';
import { Z19_LOG_KOREN } from './z19';
import { Z20_ZABOR } from './z20';

/* eslint-disable @typescript-eslint/no-explicit-any -- параметры у каждого шаблона свои */
export const SHABLONY_2: Readonly<Record<string, Shablon2<any>>> = {
  'z14.logTrig': Z14_LOG_TRIG,
  'z15.rombPiramida': Z15_ROMB_PIRAMIDA,
  'z16.pokazKoren': Z16_POKAZ_KOREN,
  'z17.kachka': Z17_KACHKA,
  'z18.pyatiugolnik': Z18_PYATIUGOLNIK,
  'z19.logKoren': Z19_LOG_KOREN,
  'z20.zabor': Z20_ZABOR,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function zadacha2(z: Zapis): Chast2Zadacha {
  const sh = SHABLONY_2[z.s];
  if (sh === undefined) throw new Error(`часть 2: нет шаблона ${z.s}`);
  return sh.sobrat(z.p);
}

/** Задачи 14–20 версии k.v; null — у варианта части 2 ещё нет. */
export async function chast2Versii(k: number, v: number): Promise<Chast2Zadacha[] | null> {
  const d = await zagruzitVariant(k);
  const zapisi = d?.chast2?.[v - 1];
  return zapisi === undefined ? null : zapisi.map(zadacha2);
}
