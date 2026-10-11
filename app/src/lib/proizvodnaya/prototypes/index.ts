/**
 * Реестр прототипов задания №9: 9.1.1 … 9.5.6.
 */

import type { Prototype } from '../types';
import { FIZICHESKIY } from './fizicheskiy';
import { KASATELNAYA } from './kasatelnaya';
import { PERVOOBRAZNAYA } from './pervoobraznaya';
import { PO_GRAFIKU_F } from './po-grafiku-f';
import { PO_GRAFIKU_FPRIME } from './po-grafiku-fprime';

export const PROTOTYPES: Prototype[] = [
  ...FIZICHESKIY,
  ...KASATELNAYA,
  ...PO_GRAFIKU_F,
  ...PO_GRAFIKU_FPRIME,
  ...PERVOOBRAZNAYA,
];

const byId = new Map(PROTOTYPES.map((p) => [p.id, p]));

export function prototypeById(id: string): Prototype | undefined {
  return byId.get(id);
}
