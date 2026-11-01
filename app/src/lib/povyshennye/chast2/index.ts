/**
 * Часть 2 вариантов раздела: запись версии → задача (chast2/types.ts).
 *
 * Шаблоны тяжёлые (движки чертежей, точная арифметика), поэтому модуль
 * грузится отдельным куском — вместе с набором версии, а не экраном
 * раздела.
 */

import { zagruzitVariant } from '../dannye';
import { O14_POKAZ_KOS } from './o14';
import { O15_PIRAMIDA_RASST } from './o15';
import { O16_MODUL_DROB } from './o16';
import { O18_BISS_VYSOTA_MEDIANA } from './o18';
import { O19_W_KOREN } from './o19';
import { O20_NOD_NOK } from './o20';
import { I14_KOS_TROYNOY } from './i14';
import { I15_PRIZMA_DIAG } from './i15';
import { I16_LOG_OSNOVANIE } from './i16';
import { I17_UCHASTOK } from './i17';
import { I18_DVE_OKR_KASANIE } from './i18';
import { I19_KUB_OTREZOK } from './i19';
import { I20_SUMMA_CIFR } from './i20';
import { AE14_LOG_OBRATNYY } from './ae14';
import { AE15_SHESTIUG_PIRAMIDA } from './ae15';
import { AE16_KOREN_TREHCHLEN } from './ae16';
import { AE17_POLUKRUG } from './ae17';
import { AE18_VNEVPISANNAYA } from './ae18';
import { AE19_POKAZ_OTREZOK } from './ae19';
import { AE20_PROGRESSIYA } from './ae20';
import type { Zapis } from '../types';
import { X14_TG_CTG } from './x14';
import { X15_PRIZMA_BD } from './x15';
import { X16_SUMMA_LOG } from './x16';
import { X17_UCHASTOK } from './x17';
import { X18_TRI_VPISANNYE } from './x18';
import { X19_MODUL_PARABOLY } from './x19';
import { X20_SUMMA_CIFR } from './x20';
import { Y14_POKAZ_SIMM } from './y14';
import { Y15_KUB_DIAGONAL } from './y15';
import { Y16_LOG_POLOVINA } from './y16';
import { Y17_KREDIT_DVA_GODA } from './y17';
import { Y18_TRAPECIYA_DIAGONALI } from './y18';
import { Y19_MODUL_VNUTRI } from './y19';
import { Y20_PROIZV_CIFR } from './y20';
import { A14_COS_RAZN } from './a14';
import { A15_PIRAMIDA_SKRESHCH } from './a15';
import { A16_LOG_OSNOVANIE_X } from './a16';
import { A17_PEREKRESTOK } from './a17';
import { A18_PERP_HORDY } from './a18';
import { A19_KVADRAT_PARAMETR } from './a19';
import { A20_MONETY } from './a20';
import { B17_DZHOUL } from './b17';
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
  'b17.dzhoul': B17_DZHOUL,
  /* Семья C: варианты 5 и 6. */
  'c14.tgPodstanovka': C14_TG_PODSTANOVKA,
  /* Семья D: варианты 7 и 8. */
  /* Семья G: варианты 13 и 14 (№17 — b17.dzhoul). */
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
  /* Семьи X, Y, A — варианты 7–12: свои задачи вместо шаблонов, близких к сборнику. */
  'x14.tgCtg': X14_TG_CTG,
  'x15.prizmaBD': X15_PRIZMA_BD,
  'x16.summaLog': X16_SUMMA_LOG,
  'x17.uchastok': X17_UCHASTOK,
  'x18.trivpisannye': X18_TRI_VPISANNYE,
  'x19.modulParaboly': X19_MODUL_PARABOLY,
  'x20.summaCifr': X20_SUMMA_CIFR,
  'y14.pokazSimm': Y14_POKAZ_SIMM,
  'y15.kubDiagonal': Y15_KUB_DIAGONAL,
  'y16.logPolovina': Y16_LOG_POLOVINA,
  'y17.kreditDvaGoda': Y17_KREDIT_DVA_GODA,
  'y18.trapeciyaDiagonali': Y18_TRAPECIYA_DIAGONALI,
  'y19.modulVnutri': Y19_MODUL_VNUTRI,
  'y20.proizvCifr': Y20_PROIZV_CIFR,
  'a14.cosRazn': A14_COS_RAZN,
  'a15.piramidaSkreshch': A15_PIRAMIDA_SKRESHCH,
  'a16.logOsnovanieX': A16_LOG_OSNOVANIE_X,
  'a17.perekrestok': A17_PEREKRESTOK,
  'a18.perpHordy': A18_PERP_HORDY,
  'a19.kvadratParametr': A19_KVADRAT_PARAMETR,
  'a20.monety': A20_MONETY,
  'o14.pokazKos': O14_POKAZ_KOS,
  'o15.piramidaRasst': O15_PIRAMIDA_RASST,
  'o16.modulDrob': O16_MODUL_DROB,
  'o18.bissVysotaMediana': O18_BISS_VYSOTA_MEDIANA,
  'o19.wKoren': O19_W_KOREN,
  'o20.nodNok': O20_NOD_NOK,
  'i14.kosTroynoy': I14_KOS_TROYNOY,
  'i15.prizmaDiag': I15_PRIZMA_DIAG,
  'i16.logOsnovanie': I16_LOG_OSNOVANIE,
  'i17.uchastok': I17_UCHASTOK,
  'i18.dveOkrKasanie': I18_DVE_OKR_KASANIE,
  'i19.kubOtrezok': I19_KUB_OTREZOK,
  'i20.summaCifr': I20_SUMMA_CIFR,
  'ae14.logObratnyy': AE14_LOG_OBRATNYY,
  'ae15.shestiugPiramida': AE15_SHESTIUG_PIRAMIDA,
  'ae16.korenTrehchlen': AE16_KOREN_TREHCHLEN,
  'ae17.polukrug': AE17_POLUKRUG,
  'ae18.vnevpisannaya': AE18_VNEVPISANNAYA,
  'ae19.pokazOtrezok': AE19_POKAZ_OTREZOK,
  'ae20.progressiya': AE20_PROGRESSIYA,
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
