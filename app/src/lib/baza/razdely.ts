/**
 * Наполненные разделы базы: номер задания → данные раздела.
 * Серверный модуль: его берут страницы на сборке и скрипты. В браузер
 * прототипы грузятся отдельно, по требованию (lib/baza/zagruzka.ts).
 */

import { RAZDEL_05 } from '@/content/baza/z05';
import type { RazdelBazy } from './types';

const RAZDELY: Readonly<Record<string, RazdelBazy>> = {
  '5': RAZDEL_05,
};

/** Раздел задания базы; undefined — наполнения ещё нет. */
export function razdelBazy(slug: string): RazdelBazy | undefined {
  return RAZDELY[slug];
}

export function napolnennyeRazdely(): RazdelBazy[] {
  return Object.values(RAZDELY);
}
