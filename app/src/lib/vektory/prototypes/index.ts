/**
 * Реестр прототипов задания №2: A1 … C2.
 */

import type { Prototype } from '../types';
import { DLINA } from './dlina';
import { KOSINUS } from './kosinus';
import { SKALYARNOE } from './skalyarnoe';

export const PROTOTYPES: Prototype[] = [...DLINA, ...SKALYARNOE, ...KOSINUS];

const byId = new Map(PROTOTYPES.map((p) => [p.id, p]));

export function prototypeById(id: string): Prototype | undefined {
  return byId.get(id);
}
