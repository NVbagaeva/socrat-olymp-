/**
 * Случайные числа задания №13: общий `rngOf` (тот же, что у №8 и №11),
 * детерминированно по прототипу и seed.
 */

import { rngOf, type Rng } from '../vychisleniya/rng';

export type { Rng };

export const rng13 = (prototypeId: string, seed: string): Rng =>
  rngOf(`z13|${prototypeId}|${seed}`);
