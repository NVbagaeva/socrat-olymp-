/**
 * №7 в ДЗ — «банковый» раздел (lib/dz/sborka/bank.ts): задачи
 * тренажёра из банка ФИПИ и аналогов, разбор — решатель прототипа (ОДЗ и
 * отбор корней выделены), подсказки-вопросы; опорные — сами задачи блока.
 */

import { SHAPKA7 } from '@/content/uravneniya7';
import { shagiIzResheniya, voprosyIzResheniya } from '@/components/tasks/zadanie7/shagi7';
import type { Solved } from '@/lib/zadanie7/types';
import { opornayaBanka, opornyeBanka, sozdatBank, type ZadachaBankaDz } from './bank';

const bank7 = sozdatBank<Solved, unknown>({
  dannye: () => import('@/lib/zadanie7/dannye') as never,
  prototip: () => import('@/lib/zadanie7/prototypes').then((m) => m.prototype) as never,
  shagi: shagiIzResheniya,
  voprosy: voprosyIzResheniya,
  schitaem: SHAPKA7.schitaem,
  istochnik: (z: ZadachaBankaDz) =>
    z.source === 'fipi' && z.no !== undefined ? `ФИПИ № ${z.no}` : `аналог ${z.id}`,
});

export const trenazher7 = bank7.trenazher;
export const zadacha7 = bank7.zadacha;
export const analogZadachi7 = bank7.analogZadachi;
export const opornaya7 = opornayaBanka;
export const opornye7 = opornyeBanka;
