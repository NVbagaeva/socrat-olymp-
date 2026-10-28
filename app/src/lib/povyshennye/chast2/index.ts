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
import { E14_LOG_KOREN } from './e14';
import { E15_PRIZMA_TRAPECIYA } from './e15';
import { E16_POKAZ_RAZLOZH } from './e16';
import { E17_SNOS } from './e17';
import { E18_VYSOTY_RAVNOBEDR } from './e18';
import { E19_OKR_PRYAMYE } from './e19';
import { E20_PERESTANOVKA } from './e20';
import { F14_KOREN3 } from './f14';
import { F15_PIRAMIDA_MEDIANY } from './f15';
import { F16_DROB_LOG } from './f16';
import { F17_RASPREDELENIE } from './f17';
import { F18_TRAPECIYA_OKR } from './f18';
import { F19_MODULI_KOREN } from './f19';
import { F20_ALBOMY } from './f20';
import { G14_POKAZ_KVADRAT } from './g14';
import { G15_PRIZMA_SECHENIE } from './g15';
import { G16_LOG_DROB } from './g16';
import { G18_ROMB_VYSOTA } from './g18';
import { G19_DVA_MODULYA } from './g19';
import { G20_SUMMY_NABORA } from './g20';
import { H14_LOG_KUB } from './h14';
import { H15_PRAV_PIRAMIDA } from './h15';
import { H16_KOREN_POKAZ } from './h16';
import { H18_TRAPECIYA_DVE_OKR } from './h18';
import { H19_PRYAMYE_OKR } from './h19';
import { H20_CHISLO_PROIZV } from './h20';
import { J14_TRIG_DROB } from './j14';
import { J15_PRIZMA_PERP } from './j15';
import { J16_KOREN_DROB } from './j16';
import { J18_OKR_V_UGLE } from './j18';
import { J19_COS_KORNI } from './j19';
import { J20_SUMMY_CIFR } from './j20';
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
  'e14.logKoren': E14_LOG_KOREN,
  'e15.prizmaTrapeciya': E15_PRIZMA_TRAPECIYA,
  'e16.pokazRazlozh': E16_POKAZ_RAZLOZH,
  'e17.snos': E17_SNOS,
  'e18.vysotyRavnobedr': E18_VYSOTY_RAVNOBEDR,
  'e19.okrPrjamye': E19_OKR_PRYAMYE,
  'e20.perestanovkaCifr': E20_PERESTANOVKA,
  'f14.koren3': F14_KOREN3,
  'f15.piramidaMediany': F15_PIRAMIDA_MEDIANY,
  'f16.drobLog': F16_DROB_LOG,
  'f17.raspredelenie': F17_RASPREDELENIE,
  'f18.trapeciyaOkr': F18_TRAPECIYA_OKR,
  'f19.moduliKoren': F19_MODULI_KOREN,
  'f20.albomy': F20_ALBOMY,
  /* Семья G: варианты 13 и 14 (№17 — b17.dzhoul). */
  'g14.pokazKvadrat': G14_POKAZ_KVADRAT,
  'g15.prizmaSechenie': G15_PRIZMA_SECHENIE,
  'g16.logDrob': G16_LOG_DROB,
  'g18.rombVysota': G18_ROMB_VYSOTA,
  'g19.dvaModulya': G19_DVA_MODULYA,
  'g20.summyNabora': G20_SUMMY_NABORA,
  /* Семья H: варианты 15 и 16 (№17 — c17.maksvell). */
  'h14.logKub': H14_LOG_KUB,
  'h15.pravPiramida': H15_PRAV_PIRAMIDA,
  'h16.korenPokaz': H16_KOREN_POKAZ,
  'h18.trapeciyaDveOkr': H18_TRAPECIYA_DVE_OKR,
  'h19.pryamyeOkr': H19_PRYAMYE_OKR,
  'h20.chisloProizv': H20_CHISLO_PROIZV,
  /* Семья J: варианты 17 и 18 (№17 — z17.kachka). */
  'j14.trigDrob': J14_TRIG_DROB,
  'j15.prizmaPerp': J15_PRIZMA_PERP,
  'j16.korenDrob': J16_KOREN_DROB,
  'j18.okrVUgle': J18_OKR_V_UGLE,
  'j19.cosKorni': J19_COS_KORNI,
  'j20.summyCifr': J20_SUMMY_CIFR,
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
