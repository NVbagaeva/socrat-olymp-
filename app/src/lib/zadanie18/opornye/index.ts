/**
 * Реестр чертежей опорных задач №18: id задачи → живая сцена движка
 * lib/skhemy. Тексты задач — content/zadanie18/opornye/.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { OP_KAS_OKR, OP_KAS_SEK, OP_OPIS_TRAP } from './kasatelnye';
import { OP_DVE_VERSHINY, OP_KVADRAT, OP_TREZUBEC } from './okruzhnost';
import { OP_BISS_MED, OP_MENELAY } from './otnosheniya';
import { OP_RASSTOYANIYA, OP_TRI_UGLA } from './ploshchadi';
import { SCENY_NOVYE } from './novye';
import { OP_BABOCHKA, OP_CHETYRE, OP_PERP_DIAG } from './trapeciya';
import { OP_BISSEKTRISA, OP_MEDIANA, OP_VYSOTY } from './treugolnik';

const SCENY: readonly ZhivayaSkhema[] = [
  OP_VYSOTY,
  OP_BISSEKTRISA,
  OP_MEDIANA,
  OP_TREZUBEC,
  OP_KVADRAT,
  OP_DVE_VERSHINY,
  OP_KAS_SEK,
  OP_OPIS_TRAP,
  OP_KAS_OKR,
  OP_BABOCHKA,
  OP_CHETYRE,
  OP_PERP_DIAG,
  OP_MENELAY,
  OP_BISS_MED,
  OP_TRI_UGLA,
  OP_RASSTOYANIYA,
  ...SCENY_NOVYE,
];

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  SCENY.map((s) => [s.id, s]),
);

export function scenaOpornoy18(id: string): ZhivayaSkhema | undefined {
  return REESTR[id];
}

export function trebuetsyaScenaOpornoy18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет чертежа опорной задачи ${id}`);
  return s;
}
