/**
 * Банк задания №3: прототипы по разделам.
 *
 * Пока собран раздел I. Остальные разделы добавляются сюда же,
 * поэтому ни страницы, ни автотест менять не придётся.
 */

import { RAZDEL_1 } from './razdel1';
import { type Prototype } from './types';

export const BANK: readonly Prototype[] = [...RAZDEL_1];

export function prototypeById(id: string): Prototype | undefined {
  return BANK.find((p) => p.id === id);
}

export { RAZDEL_1 };
