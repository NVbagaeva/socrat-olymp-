/**
 * Чертежи перенесённых задач тренажёра №18 (content/zadanie18/trenazherDop):
 * тип задачи → неподвижная сцена по данным пункта б) набора чисел. Общий
 * реестр чертежей тренажёра — sceny.ts.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import type { Parametry } from '../sceny';
import { KS_DVE_KASATELNYE, KS_OTREZKI, KS_PRYAM_TRAP, KS_VNUTR_KASANIE } from './kasatelnye';
import { OK_BRAHMAGUPTA, OK_ORTOCENTR, OK_SEKUSHCHIE } from './okruzhnost';
import { OT_CHEVA, OT_MEDIANY, OT_MENELAY, OT_PARALLELOGRAMM } from './otnosheniya';
import { PL_BISSEKTRISA, PL_OBSHCHAYA_VYSOTA } from './ploshchadi';
import { TP_BABOCHKA, TP_RAVNOBOKAYA, TP_UGOL_90 } from './trapeciya';
import { TR_INCENTR, TR_SREDLIN } from './treugolnik';

export const SCENY_DOP: Readonly<Record<string, (p: Parametry) => ZhivayaSkhema>> = {
  'tr-sredlin': TR_SREDLIN,
  'tr-incentr': TR_INCENTR,
  'ok-ortocentr': OK_ORTOCENTR,
  'ok-sekushchie': OK_SEKUSHCHIE,
  'ok-brahmagupta': OK_BRAHMAGUPTA,
  'ks-otrezki': KS_OTREZKI,
  'ks-dve-kasatelnye': KS_DVE_KASATELNYE,
  'ks-vnutr-kasanie': KS_VNUTR_KASANIE,
  'ks-pryam-trap': KS_PRYAM_TRAP,
  'tp-ravnobokaya': TP_RAVNOBOKAYA,
  'tp-babochka': TP_BABOCHKA,
  'tp-ugol-90': TP_UGOL_90,
  'ot-mediany': OT_MEDIANY,
  'ot-menelay': OT_MENELAY,
  'ot-cheva': OT_CHEVA,
  'ot-parallelogramm': OT_PARALLELOGRAMM,
  'pl-obshchaya-vysota': PL_OBSHCHAYA_VYSOTA,
  'pl-bissektrisa': PL_BISSEKTRISA,
};
