/**
 * Решения прототипов по шагам: reshenie(proto, params). Ответ решения
 * сверяется с ответом прототипа в самотесте.
 */

import type { Params } from '../stseny/dsl';
import { RESHENIYA_1 } from './blok1';
import { RESHENIYA_2 } from './blok2';
import { RESHENIYA_3 } from './blok3';
import { RESHENIYA_POVYSHENNYE } from './povyshennye';
import type { Reshenie } from './types';

export type { Reshenie, ShagResheniya, VoprosPodskazki } from './types';

const VSE: Record<number, (p: Params) => Reshenie> = {
  ...RESHENIYA_1,
  ...RESHENIYA_2,
  ...RESHENIYA_3,
  ...RESHENIYA_POVYSHENNYE,
};

export function reshenie(proto: number, params: Params): Reshenie {
  const f = VSE[proto];
  if (f === undefined) throw new Error(`нет решения прототипа ${proto}`);
  return f(params);
}
