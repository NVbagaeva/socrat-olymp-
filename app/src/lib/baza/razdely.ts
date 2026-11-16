/**
 * Наполненные разделы базы: номер задания → данные раздела.
 * Серверный модуль: его берут страницы на сборке и скрипты. В браузер
 * прототипы грузятся отдельно, по требованию (lib/baza/zagruzka.ts).
 */

import { RAZDEL_05 } from '@/content/baza/z05';
import { RAZDEL_12 } from '@/content/baza/z12';
import { RAZDEL_13 } from '@/content/baza/z13';
import { RAZDEL_14 } from '@/content/baza/z14';
import { RAZDEL_15 } from '@/content/baza/z15';
import { RAZDEL_16 } from '@/content/baza/z16';
import { RAZDEL_17 } from '@/content/baza/z17';
import type { RazdelBazy } from './types';

const RAZDELY: Readonly<Record<string, RazdelBazy>> = {
  '5': RAZDEL_05,
  '12': RAZDEL_12,
  '13': RAZDEL_13,
  '14': RAZDEL_14,
  '15': RAZDEL_15,
  '16': RAZDEL_16,
  '17': RAZDEL_17,
};

/** Раздел задания базы; undefined — наполнения ещё нет. */
export function razdelBazy(slug: string): RazdelBazy | undefined {
  return RAZDELY[slug];
}

export function napolnennyeRazdely(): RazdelBazy[] {
  return Object.values(RAZDELY);
}
