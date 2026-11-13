/**
 * №6 в ДЗ — «банковый» раздел (lib/dz/sborka/bank.ts): задачи тренажёра
 * (исходные задачи и аналоги) с рисунком условия — диаграмма Эйлера,
 * дерево, таблица, запись распределения; разбор с таблицей решения в
 * шаге; опорные — сами задачи блока.
 */

import { createElement } from 'react';
import { SHAPKA6 } from '@/content/sluchainye6';
import { Ris6 } from '@/components/tasks/zadanie6/Ris6';
import { shagiIzResheniya6, voprosyIzResheniya6 } from '@/components/tasks/zadanie6/shagi6';
import type { Prototype, Solved } from '@/lib/zadanie6/types';
import { opornayaBanka, opornyeBanka, sozdatBank, type ZadachaBankaDz } from './bank';

const bank6 = sozdatBank<Solved, Prototype>({
  dannye: () => import('@/lib/zadanie6/dannye') as never,
  prototip: () => import('@/lib/zadanie6/prototypes').then((m) => m.prototype) as never,
  shagi: shagiIzResheniya6,
  voprosy: voprosyIzResheniya6,
  schitaem: SHAPKA6.schitaem,
  risunok: (z, p) => {
    const ris = p.ris(z.params as never);
    return ris === undefined ? null : createElement(Ris6, { ris });
  },
  istochnik: (z: ZadachaBankaDz) =>
    z.source === 'demo' ? 'демоверсия ФИПИ' : z.source === 'obrazec' ? 'образец' : `аналог ${z.id}`,
});

export const trenazher6 = bank6.trenazher;
export const zadacha6 = bank6.zadacha;
export const analogZadachi6 = bank6.analogZadachi;
export const opornaya6 = opornayaBanka;
export const opornye6 = opornyeBanka;
