'use client';

/**
 * Данные задач тренажёра №7 в браузере — общий загрузчик
 * (lib/trening/zagruzka.ts) с файлами public/data/zadanie7 и решателем
 * прототипов №7.
 */

import { createZagruzka } from '@/lib/trening/zagruzka';
import { urlDannyh, type ZadachaLite } from '../dannye';
import type { Solved } from '../types';

export const ZAGRUZKA7 = createZagruzka<ZadachaLite, Solved>({
  url: urlDannyh,
  reshatel: () => import('../prototypes').then((m) => m.prototype),
});

export const zagruzitPrototipy7 = ZAGRUZKA7.zagruzit;
export const zadachaIzKesha7 = ZAGRUZKA7.izKesha;
export const reshenieZadachi7 = ZAGRUZKA7.reshenie;
export const nabrat7 = ZAGRUZKA7.nabrat;
