/**
 * Реестр чертежей задач тренажёра №18: id задачи → живая сцена движка
 * lib/skhemy. Тексты задач — content/zadanie18/trenazher/.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { KS_DVE_KASATELNYE, KS_OTREZKI, KS_PRYAM_TRAP, KS_VNUTR_KASANIE } from './kasatelnye';
import { OK_BRAHMAGUPTA, OK_HORDY, OK_ORTOCENTR, OK_SEKUSHCHIE } from './okruzhnost';
import { OT_CHEVA, OT_MEDIANY, OT_MENELAY, OT_PARALLELOGRAMM } from './otnosheniya';
import { PL_BISSEKTRISA, PL_OBSHCHAYA_VYSOTA, PL_OBSHCHIY_UGOL, PL_RELSY } from './ploshchadi';
import { TP_BABOCHKA, TP_RAVNOBOKAYA, TP_SREDLIN, TP_UGOL_90 } from './trapeciya';
import { TR_INCENTR, TR_MEDIANA, TR_SREDLIN, TR_VYSOTY } from './treugolnik';

const SCENY: readonly ZhivayaSkhema[] = [
  TR_SREDLIN,
  TR_VYSOTY,
  TR_INCENTR,
  TR_MEDIANA,
  OK_HORDY,
  OK_ORTOCENTR,
  OK_SEKUSHCHIE,
  OK_BRAHMAGUPTA,
  KS_OTREZKI,
  KS_DVE_KASATELNYE,
  KS_VNUTR_KASANIE,
  KS_PRYAM_TRAP,
  TP_SREDLIN,
  TP_RAVNOBOKAYA,
  TP_BABOCHKA,
  TP_UGOL_90,
  OT_MEDIANY,
  OT_MENELAY,
  OT_CHEVA,
  OT_PARALLELOGRAMM,
  PL_OBSHCHAYA_VYSOTA,
  PL_OBSHCHIY_UGOL,
  PL_RELSY,
  PL_BISSEKTRISA,
];

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  SCENY.map((s) => [s.id, s]),
);

export function scenaTrenazhera18(id: string): ZhivayaSkhema | undefined {
  return REESTR[id];
}

export function trebuetsyaScenaTrenazhera18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет чертежа задачи тренажёра ${id}`);
  return s;
}
