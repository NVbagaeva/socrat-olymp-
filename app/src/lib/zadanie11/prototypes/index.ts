/**
 * Все подтипы задания №11 по разделам.
 */

import type { Subtype } from '../types';
import { PR } from './pr';
import { SM } from './sm';
import { DP } from './dp';
import { PT } from './pt';
import { VD } from './vd';
import { OK } from './ok';
import { RB } from './rb';
import { PG } from './pg';
import { RZ } from './rz';

export const SUBTYPES: Subtype[] = [...RZ, ...PR, ...SM, ...DP, ...PT, ...VD, ...OK, ...RB, ...PG];

const BY_ID = new Map(SUBTYPES.map((s) => [s.id, s]));

export function subtype(id: string): Subtype {
  const s = BY_ID.get(id);
  if (!s) {
    throw new Error(`нет подтипа ${id}`);
  }
  return s;
}
