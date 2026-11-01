/**
 * Чертежи опорных задач 7–15 (content/zadanie18/opornyeDop): id задачи →
 * неподвижная сцена. Реестр всех чертежей — lib/zadanie18/opornye.ts.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { OP_OPIS_TRAP } from './kasatelnye';
import { OP_DVE_VERSHINY, OP_KVADRAT } from './okruzhnost';
import { OP_BISS_MED, OP_MENELAY } from './otnosheniya';
import { OP_RASSTOYANIYA, OP_TRI_UGLA } from './ploshchadi';
import { OP_CHETYRE } from './trapeciya';
import { OP_MEDIANA } from './treugolnik';

export const CHERTEZHI_OPORNYH_DOP: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  [
    OP_MEDIANA,
    OP_KVADRAT,
    OP_DVE_VERSHINY,
    OP_OPIS_TRAP,
    OP_CHETYRE,
    OP_MENELAY,
    OP_BISS_MED,
    OP_TRI_UGLA,
    OP_RASSTOYANIYA,
  ].map((s) => [s.id, s]),
);
