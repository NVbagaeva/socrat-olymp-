/**
 * Банк задания №3: прототипы по разделам.
 *
 * Собраны разделы I–VII. Остальные разделы добавляются сюда же,
 * поэтому ни страницы, ни автотест менять не придётся.
 */

import { RAZDEL_1 } from './razdel1';
import { RAZDEL_2 } from './razdel2';
import { RAZDEL_3 } from './razdel3';
import { RAZDEL_4 } from './razdel4';
import { RAZDEL_5 } from './razdel5';
import { RAZDEL_6 } from './razdel6';
import { RAZDEL_7 } from './razdel7';
import { type Prototype } from './types';

export const BANK: readonly Prototype[] = [
  ...RAZDEL_1,
  ...RAZDEL_2,
  ...RAZDEL_3,
  ...RAZDEL_4,
  ...RAZDEL_5,
  ...RAZDEL_6,
  ...RAZDEL_7,
];

export function prototypeById(id: string): Prototype | undefined {
  return BANK.find((p) => p.id === id);
}

export { RAZDEL_1, RAZDEL_2, RAZDEL_3, RAZDEL_4, RAZDEL_5, RAZDEL_6, RAZDEL_7 };
