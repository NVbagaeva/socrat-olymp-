/**
 * №10 в ДЗ — «банковый» раздел (lib/dz/sborka/bank.ts): задачи
 * тренажёра (ФИПИ и аналоги), у задачи о мосте (П-01) — чертёж моста
 * в режиме ученика; разбор этапами и подсказки-вопросы — общим
 * переводом разбора банка; опорные — сами задачи блока.
 */

import { createElement } from 'react';
import { Most10 } from '@/components/tasks/zadanie10/Most10';
import { shagiIzEtapov, voprosyIzRazbora } from '@/components/tasks/trening/bank/shagi';
import type { Params, Solved } from '@/lib/zadanie10/types';
import { opornayaBanka, opornyeBanka, sozdatBank, type ZadachaBankaDz } from './bank';

const bank10 = sozdatBank<Solved, unknown>({
  dannye: () => import('@/lib/zadanie10/dannye') as never,
  prototip: () => import('@/lib/zadanie10/prototypes').then((m) => m.prototype) as never,
  shagi: (s) => shagiIzEtapov(s.etapy),
  voprosy: (s) => voprosyIzRazbora(s.hints),
  schitaem: 'Считаем с умом',
  risunok: (z) =>
    z.prototypeId === 'P01'
      ? createElement(Most10, { params: z.params as Params, rezhim: 'uchenik' })
      : null,
  istochnik: (z: ZadachaBankaDz) =>
    z.source === 'fipi' && z.no !== undefined ? `ФИПИ № ${z.no}` : `аналог ${z.id}`,
});

export const trenazher10 = bank10.trenazher;
export const zadacha10 = bank10.zadacha;
export const analogZadachi10 = bank10.analogZadachi;
export const opornaya10 = opornayaBanka;
export const opornye10 = opornyeBanka;
