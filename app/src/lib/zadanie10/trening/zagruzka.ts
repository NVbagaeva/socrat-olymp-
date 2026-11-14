'use client';

/**
 * Данные задач тренажёра №10 в браузере — общий загрузчик
 * (lib/trening/zagruzka.ts) с файлами public/data/zadanie10 и решателем
 * прототипов №10.
 */

import { createZagruzka } from '@/lib/trening/zagruzka';
import { urlDannyh, type ZadachaLite } from '../dannye';
import type { Prototype, Solved } from '../types';

export const ZAGRUZKA10 = createZagruzka<ZadachaLite, Solved, Prototype>({
  url: urlDannyh,
  reshatel: () => import('../prototypes').then((m) => m.prototype),
});
