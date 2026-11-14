'use client';

/**
 * Данные задач тренажёра №11 в браузере — общий загрузчик
 * (lib/trening/zagruzka.ts) с файлами public/data/zadanie11 и решателем
 * подтипов №11. Формулы условия — крупными дробями, как в прежнем
 * тренажёре.
 */

import { createZagruzka } from '@/lib/trening/zagruzka';
import { urlDannyh11, type ZadachaLite11 } from './dannye';
import type { Razbor11 } from './reshatel';

export const ZAGRUZKA11 = createZagruzka<
  ZadachaLite11,
  Razbor11,
  { solve(params: Record<string, unknown>): Razbor11 }
>({
  url: urlDannyh11,
  reshatel: () =>
    import('./reshatel').then(
      (m) => (id: string) =>
        m.prototip11(id) as { solve(params: Record<string, unknown>): Razbor11 },
    ),
  nabor: () => import('./reshatel').then((m) => m.nabor11),
});
