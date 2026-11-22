'use client';

/**
 * Данные задач тренажёра №6 в браузере — общий загрузчик
 * (lib/trening/zagruzka.ts) с файлами public/data/zadanie6 и решателем
 * прототипов №6.
 */

import { createZagruzka } from '@/lib/trening/zagruzka';
import { urlDannyh, type ZadachaLite } from '../dannye';
import type { Prototype, Solved } from '../types';

export const ZAGRUZKA6 = createZagruzka<ZadachaLite, Solved, Prototype>({
  url: urlDannyh,
  reshatel: () => import('../prototypes').then((m) => m.prototype),
});
