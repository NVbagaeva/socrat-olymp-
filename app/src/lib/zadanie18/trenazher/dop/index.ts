/**
 * Чертежи перенесённых задач тренажёра №18 (content/zadanie18/trenazherDop):
 * тип задачи → неподвижная сцена по данным пункта б). У этих задач один
 * набор чисел, поэтому сцена от параметров варианта не зависит. Общий
 * реестр чертежей тренажёра — sceny.ts.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { KS_DVE_KASATELNYE, KS_OTREZKI, KS_PRYAM_TRAP, KS_VNUTR_KASANIE } from './kasatelnye';
import { OK_BRAHMAGUPTA, OK_ORTOCENTR, OK_SEKUSHCHIE } from './okruzhnost';
import { OT_CHEVA, OT_MEDIANY, OT_MENELAY, OT_PARALLELOGRAMM } from './otnosheniya';
import { PL_BISSEKTRISA, PL_OBSHCHAYA_VYSOTA } from './ploshchadi';
import { TP_BABOCHKA, TP_RAVNOBOKAYA, TP_UGOL_90 } from './trapeciya';
import { TR_INCENTR, TR_SREDLIN } from './treugolnik';

export const SCENY_DOP: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  [
    TR_SREDLIN,
    TR_INCENTR,
    OK_ORTOCENTR,
    OK_SEKUSHCHIE,
    OK_BRAHMAGUPTA,
    KS_OTREZKI,
    KS_DVE_KASATELNYE,
    KS_VNUTR_KASANIE,
    KS_PRYAM_TRAP,
    TP_RAVNOBOKAYA,
    TP_BABOCHKA,
    TP_UGOL_90,
    OT_MEDIANY,
    OT_MENELAY,
    OT_CHEVA,
    OT_PARALLELOGRAMM,
    PL_OBSHCHAYA_VYSOTA,
    PL_BISSEKTRISA,
  ].map((s) => [s.id, s]),
);
