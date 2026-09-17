/**
 * Банк задания №3: прототипы по разделам.
 *
 * Список разделов здесь один на всё приложение: и банк, и чертежи,
 * и витрина берут его отсюда. Новый раздел добавляется только в
 * RAZDELY — ни страницу, ни автотест трогать не нужно. Раньше
 * витрина перечисляла разделы у себя, и забытая строчка ловилась
 * только на сборке.
 */

import { RAZDEL_1 } from './razdel1';
import { RAZDEL_2 } from './razdel2';
import { RAZDEL_3 } from './razdel3';
import { RAZDEL_4 } from './razdel4';
import { RAZDEL_5 } from './razdel5';
import { RAZDEL_6 } from './razdel6';
import { RAZDEL_7 } from './razdel7';
import { type Prototype } from './types';

export interface Razdel {
  /** Римский номер раздела, как в задачнике. */
  nomer: string;
  nazvanie: string;
  prototipy: readonly Prototype[];
}

export const RAZDELY: readonly Razdel[] = [
  { nomer: 'I', nazvanie: 'Параллелепипед и куб', prototipy: RAZDEL_1 },
  { nomer: 'II', nazvanie: 'Призма', prototipy: RAZDEL_2 },
  { nomer: 'III', nazvanie: 'Пирамида', prototipy: RAZDEL_3 },
  { nomer: 'IV', nazvanie: 'Конус', prototipy: RAZDEL_4 },
  { nomer: 'V', nazvanie: 'Цилиндр', prototipy: RAZDEL_5 },
  { nomer: 'VI', nazvanie: 'Шар', prototipy: RAZDEL_6 },
  { nomer: 'VII', nazvanie: 'Вписанный и описанный цилиндр', prototipy: RAZDEL_7 },
];

export const BANK: readonly Prototype[] = RAZDELY.flatMap((razdel) => [...razdel.prototipy]);

export function prototypeById(id: string): Prototype | undefined {
  return BANK.find((p) => p.id === id);
}

export { RAZDEL_1, RAZDEL_2, RAZDEL_3, RAZDEL_4, RAZDEL_5, RAZDEL_6, RAZDEL_7 };
