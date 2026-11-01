/**
 * Часть 2 вариантов раздела: запись версии → задача (chast2/types.ts).
 *
 * Шаблоны тяжёлые (движки чертежей, точная арифметика), поэтому модуль
 * грузится отдельным куском — вместе с набором версии, а не экраном
 * раздела.
 */

import { zagruzitVariant } from '../dannye';
import type { Zapis } from '../types';
import { B17_DZHOUL } from './b17';
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
import { N14_LOG_KVADRAT } from './n14';
import { N15_PIRAMIDA_SEREDINA } from './n15';
import { N16_POKAZ_DROB } from './n16';
import { N17_KONCENTRACIYA } from './n17';
import { N18_PARALL_BISS } from './n18';
import { N19_KVADRAT_OKR } from './n19';
import { N20_PODRYAD } from './n20';
import { P14_TRIG_DROB_SIN } from './p14';
import { P15_PRIZMA_ABM } from './p15';
import { P16_KOREN_DROB } from './p16';
import { P17_KOROBKA } from './p17';
import { P18_KASATELNAYA_PARALLEL } from './p18';
import { P19_DVA_KRUGA } from './p19';
import { P20_GIRI } from './p20';
import { Q14_KOREN_POKAZ } from './q14';
import { Q15_PIRAMIDA_PERP } from './q15';
import { Q16_LOG_MNOZHITEL } from './q16';
import { Q17_CENA_SPROS } from './q17';
import { Q18_KVADRAT_PERP } from './q18';
import { Q19_OKR_KOREN } from './q19';
import { Q20_SREDNEE_NABORA } from './q20';
import { R14_TRIG } from './r14';
import { R15_STEREO } from './r15';
import { R16_NERAVENSTVO } from './r16';
import { R17_EKSTREMUM } from './r17';
import { R18_PLANIMETRIYA } from './r18';
import { R19_PARAMETR } from './r19';
import { R20_TEORIYA_CHISEL } from './r20';
import type { Chast2Zadacha, Shablon2 } from './types';
/* Семьи K, L, M: варианты 19–24 (свои задачи по кодификатору). */
import { K14_KOS_SUMMA } from './k14';
import { K15_PIRAMIDA_PERP } from './k15';
import { K16_LOG_DROB } from './k16';
import { K17_LAMPA } from './k17';
import { K18_VYSOTA_BISS } from './k18';
import { K19_KVADRAT_OKR } from './k19';
import { K20_SREDNEE } from './k20';
import { L14_CHETVERTYE } from './l14';
import { L15_MENELAY } from './l15';
import { L16_ODNORODNOE } from './l16';
import { L17_SPASATEL } from './l17';
import { L18_ROMB_KASANIE } from './l18';
import { L19_KORYTO } from './l19';
import { L20_FISHKA } from './l20';
import { M14_KVADRATY } from './m14';
import { M15_PRIZMA_UGOL } from './m15';
import { M16_GRUPPIROVKA } from './m16';
import { M17_SUDNO } from './m17';
import { M18_BISSEKTRISY } from './m18';
import { M19_GALOCHKA } from './m19';
import { M20_OSTATKI } from './m20';
import { C14_TG_PODSTANOVKA } from './c14';
import { C17_MAKSVELL } from './c17';
import { Z17_KACHKA } from './z17';
import { U14_TG_CTG } from './u14';
import { U15_KUB_PLOSK } from './u15';
import { U16_POKAZ_MODUL } from './u16';
import { U17_KREDIT2 } from './u17';
import { U18_DVE_OKR_KASAT } from './u18';
import { U19_TREHCHLEN_KOREN } from './u19';
import { U20_NEDELIMYE } from './u20';
import { V14_KOS_KOREN } from './v14';
import { V15_PRIZMA_MEDIANA } from './v15';
import { V16_KOREN_LOG } from './v16';
import { V18_DIAMETR_HORDA } from './v18';
import { V19_DVA_KORNYA } from './v19';
import { V20_UDVOENIE } from './v20';
import { W15_TETRAEDR } from './w15';
import { W16_LOG_MODUL } from './w16';
import { W17_ZABOR_STENA } from './w17';
import { W18_TRAPECIYA_PERP } from './w18';
import { W19_V_GRAFIK } from './w19';
import { W20_KAMNI } from './w20';

/* eslint-disable @typescript-eslint/no-explicit-any -- параметры у каждого шаблона свои */
export const SHABLONY_2: Readonly<Record<string, Shablon2<any>>> = {
  'z17.kachka': Z17_KACHKA,
  'b17.dzhoul': B17_DZHOUL,
  /* Семья C: варианты 5 и 6. */
  'c14.tgPodstanovka': C14_TG_PODSTANOVKA,
  'c17.maksvell': C17_MAKSVELL,
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
  /* Семьи K, L, M: варианты 19–20, 21–22, 23–24. */
  'k14.kosSumma': K14_KOS_SUMMA,
  'k15.piramidaPerp': K15_PIRAMIDA_PERP,
  'k16.logDrob': K16_LOG_DROB,
  'k17.lampa': K17_LAMPA,
  'k18.vysotaBiss': K18_VYSOTA_BISS,
  'k19.kvadratOkr': K19_KVADRAT_OKR,
  'k20.srednee': K20_SREDNEE,
  'l14.chetvertye': L14_CHETVERTYE,
  'l15.menelay': L15_MENELAY,
  'l16.odnorodnoe': L16_ODNORODNOE,
  'l17.spasatel': L17_SPASATEL,
  'l18.rombKasanie': L18_ROMB_KASANIE,
  'l19.koryto': L19_KORYTO,
  'l20.fishka': L20_FISHKA,
  'm14.kvadraty': M14_KVADRATY,
  'm15.prizmaUgol': M15_PRIZMA_UGOL,
  'm16.gruppirovka': M16_GRUPPIROVKA,
  'm17.sudno': M17_SUDNO,
  'm18.bissektrisy': M18_BISSEKTRISY,
  'm19.galochka': M19_GALOCHKA,
  'm20.ostatki': M20_OSTATKI,
  /* Семья N: варианты 25 и 26 — свои задачи по кодификатору. */
  'n14.logKvadrat': N14_LOG_KVADRAT,
  'n15.piramidaSeredina': N15_PIRAMIDA_SEREDINA,
  'n16.pokazDrob': N16_POKAZ_DROB,
  'n17.koncentraciya': N17_KONCENTRACIYA,
  'n18.parallBiss': N18_PARALL_BISS,
  'n19.kvadratOkr': N19_KVADRAT_OKR,
  'n20.podryad': N20_PODRYAD,
  /* Семья P: варианты 27 и 28. */
  'p14.trigDrobSin': P14_TRIG_DROB_SIN,
  'p15.prizmaABM': P15_PRIZMA_ABM,
  'p16.korenDrob': P16_KOREN_DROB,
  'p17.korobka': P17_KOROBKA,
  'p18.kasatelnayaParallel': P18_KASATELNAYA_PARALLEL,
  'p19.dvaKruga': P19_DVA_KRUGA,
  'p20.giri': P20_GIRI,
  /* Семья Q: варианты 29 и 30. */
  'q14.korenPokaz': Q14_KOREN_POKAZ,
  'q15.piramidaPerp': Q15_PIRAMIDA_PERP,
  'q16.logMnozhitel': Q16_LOG_MNOZHITEL,
  'q17.cenaSpros': Q17_CENA_SPROS,
  'q18.kvadratPerp': Q18_KVADRAT_PERP,
  'q19.okrKoren': Q19_OKR_KOREN,
  'q20.sredneeNabora': Q20_SREDNEE_NABORA,
  /* Семья R: варианты 31–36 — свои задачи раздела по темам номеров. */
  'r14.trig': R14_TRIG,
  'r15.stereo': R15_STEREO,
  'r16.neravenstvo': R16_NERAVENSTVO,
  'r17.ekstremum': R17_EKSTREMUM,
  'r18.planimetriya': R18_PLANIMETRIYA,
  'r19.parametr': R19_PARAMETR,
  'r20.teoriyaChisel': R20_TEORIYA_CHISEL,
  /* Семьи U, V, W: варианты 1–6 (свои задачи по кодификатору). */
  'u14.tgCtg': U14_TG_CTG,
  'u15.kubPlosk': U15_KUB_PLOSK,
  'u16.pokazModul': U16_POKAZ_MODUL,
  'u17.kredit2': U17_KREDIT2,
  'u18.dveOkrKasat': U18_DVE_OKR_KASAT,
  'u19.trehchlenKoren': U19_TREHCHLEN_KOREN,
  'u20.nedelimye': U20_NEDELIMYE,
  'v14.kosKoren': V14_KOS_KOREN,
  'v15.prizmaMediana': V15_PRIZMA_MEDIANA,
  'v16.korenLog': V16_KOREN_LOG,
  'v18.diametrHorda': V18_DIAMETR_HORDA,
  'v19.dvaKornya': V19_DVA_KORNYA,
  'v20.udvoenie': V20_UDVOENIE,
  'w15.tetraedr': W15_TETRAEDR,
  'w16.logModul': W16_LOG_MODUL,
  'w17.zaborStena': W17_ZABOR_STENA,
  'w18.trapeciyaPerp': W18_TRAPECIYA_PERP,
  'w19.vGrafik': W19_V_GRAFIK,
  'w20.kamni': W20_KAMNI,
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
