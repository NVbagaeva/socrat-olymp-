/**
 * Все приёмы устного счёта: список, поиск по адресу, группы и миксы
 * «по действию».
 */

import { DELENIE } from './priyomy/delenie';
import { DOLI } from './priyomy/doli';
import { KVADRATY } from './priyomy/kvadraty';
import { SLOZHENIE } from './priyomy/slozhenie';
import { tablica } from './priyomy/tablica';
import { UMNOZHENIE } from './priyomy/umnozhenie';
import { VIETA } from './priyomy/vieta';
import type { Deystvie, GruppaId, Priyom, PriyomId } from './types';

/** Приёмы со своими страницами — по группам, в порядке витрины. */
export const PRIYOMY: readonly Priyom[] = [
  ...KVADRATY,
  ...UMNOZHENIE,
  ...DELENIE,
  ...SLOZHENIE,
  ...DOLI,
  ...VIETA,
];

/** Все генераторы, включая таблицу умножения. */
export const VSE: readonly Priyom[] = [...PRIYOMY, tablica];

const PO_ID = new Map<PriyomId, Priyom>(VSE.map((p) => [p.id, p]));

export function priyom(id: PriyomId): Priyom {
  const p = PO_ID.get(id);
  if (p === undefined) throw new Error(`Нет приёма ${id}`);
  return p;
}

export function estPriyom(id: string): id is PriyomId {
  return PO_ID.has(id as PriyomId);
}

export const GRUPPY: readonly GruppaId[] = [
  'kvadraty',
  'umnozhenie',
  'delenie',
  'slozhenie',
  'doli',
  'uravneniya',
];

export function priyomyGruppy(g: GruppaId): Priyom[] {
  return PRIYOMY.filter((p) => p.gruppa === g);
}

/** Генераторы, которые дают примеры на действие. */
export function priyomyDeystviya(d: Deystvie): Priyom[] {
  if (d === 'tablica') return [tablica];
  return PRIYOMY.filter((p) => p.deystviya.includes(d));
}
