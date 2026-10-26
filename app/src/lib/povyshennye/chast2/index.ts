/**
 * Часть 2 вариантов раздела: запись версии → задача (chast2/types.ts).
 *
 * Шаблоны тяжёлые (движки чертежей, точная арифметика), поэтому модуль
 * грузится отдельным куском — вместе с набором версии, а не экраном
 * раздела.
 */

import { zagruzitVariant } from '../dannye';
import type { Zapis } from '../types';
import { B14_POKAZ_STEPEN } from './b14';
import { B15_PRIZMA_PLOSKOST } from './b15';
import { B16_LOG_BIKVADRAT } from './b16';
import { B17_DZHOUL } from './b17';
import { B18_PRYAMOUGOLNIK } from './b18';
import { B19_KOREN4 } from './b19';
import { B20_POKUPKA } from './b20';
import { D14_POKAZ_TRIG } from './d14';
import { D15_PRIZMA_PYATIUGOLNIK } from './d15';
import { D16_LOG_LOG } from './d16';
import { D17_KATUSHKA } from './d17';
import { D18_PARALLELOGRAMM } from './d18';
import { D19_PARA_PRYAMYH } from './d19';
import { D20_RYAD_KVADRAT } from './d20';
import type { Chast2Zadacha, Shablon2 } from './types';
import { C14_TG_PODSTANOVKA } from './c14';
import { C15_SFERA_PIRAMIDA } from './c15';
import { C16_POKAZ_LOG } from './c16';
import { C17_MAKSVELL } from './c17';
import { C18_TRAPECIYA_SREDNYAYA } from './c18';
import { C19_MODUL } from './c19';
import { C20_SREDNIE } from './c20';
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
  'b14.pokazStepen': B14_POKAZ_STEPEN,
  'b15.prizmaPloskost': B15_PRIZMA_PLOSKOST,
  'b16.logBikvadrat': B16_LOG_BIKVADRAT,
  'b17.dzhoul': B17_DZHOUL,
  'b18.pryamougolnik': B18_PRYAMOUGOLNIK,
  'b19.koren4': B19_KOREN4,
  'b20.pokupka': B20_POKUPKA,
  /* Семья C: варианты 5 и 6. */
  'c14.tgPodstanovka': C14_TG_PODSTANOVKA,
  'c15.sferaPiramida': C15_SFERA_PIRAMIDA,
  'c16.pokazLog': C16_POKAZ_LOG,
  'c17.maksvell': C17_MAKSVELL,
  'c18.trapeciyaSrednyaya': C18_TRAPECIYA_SREDNYAYA,
  'c19.modul': C19_MODUL,
  'c20.srednie': C20_SREDNIE,
  /* Семья D: варианты 7 и 8. */
  'd14.pokazTrig': D14_POKAZ_TRIG,
  'd15.prizmaPyatiugolnik': D15_PRIZMA_PYATIUGOLNIK,
  'd16.logLog': D16_LOG_LOG,
  'd17.katushka': D17_KATUSHKA,
  'd18.parallelogrammBiss': D18_PARALLELOGRAMM,
  'd19.paraPryamyh': D19_PARA_PRYAMYH,
  'd20.ryadKvadrat': D20_RYAD_KVADRAT,
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
