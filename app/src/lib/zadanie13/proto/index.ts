/** Реестр прототипов задания №13 (docs/13-economics/03-prototypes.md). */

import type { Prototype } from './types';
import { PROTO_A } from './a';
import { PROTO_B } from './b';
import { PROTO_C } from './c';
import { PROTO_D } from './d';
import { PROTO_P } from './p';

export const PROTOTYPES: Prototype[] = [...PROTO_A, ...PROTO_B, ...PROTO_C, ...PROTO_D, ...PROTO_P];

export const PROTOTYPE_BY_ID: Record<string, Prototype> = Object.fromEntries(
  PROTOTYPES.map((p) => [p.id, p]),
);
