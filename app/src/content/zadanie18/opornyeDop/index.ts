/**
 * Опорные задачи 7–15 №18 — составлены для сайта в формате задания 18
 * (а) докажите, б) найдите) и идут за задачами 1–6 общего списка
 * (content/zadanie18/opornye.ts). Чертежи — lib/zadanie18/opornyeDop,
 * проверка — scripts/verify_schemes/opornyeDop (pnpm test:opornye-18):
 * ответ б) пересчитан по данным в координатах без кода сайта,
 * утверждение а) — на 1000 случайных фигурах.
 */

import type { Opornaya18 } from '../opornye';
import { OP18_OPIS_TRAP } from './kasatelnye';
import { OP18_DVE_VERSHINY, OP18_KVADRAT } from './okruzhnost';
import { OP18_BISS_MED, OP18_MENELAY } from './otnosheniya';
import { OP18_RASSTOYANIYA, OP18_TRI_UGLA } from './ploshchadi';
import type { OpornayaDop18 } from './tipy';
import { OP18_CHETYRE } from './trapeciya';
import { OP18_MEDIANA } from './treugolnik';

const ISHODNYE: readonly OpornayaDop18[] = [
  OP18_MEDIANA,
  OP18_KVADRAT,
  OP18_DVE_VERSHINY,
  OP18_OPIS_TRAP,
  OP18_CHETYRE,
  OP18_MENELAY,
  OP18_BISS_MED,
  OP18_TRI_UGLA,
  OP18_RASSTOYANIYA,
];

export const OPORNYE_18_DOP: readonly Opornaya18[] = ISHODNYE.map((z) => ({
  ...z,
  skhemy: z.skhemy.map((s) => s.id),
  zachem: z.skhemy.map((s) => s.zachem),
}));
