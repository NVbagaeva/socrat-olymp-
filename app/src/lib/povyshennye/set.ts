/**
 * Набор версий варианта k в форме «Собрать вариант» (`VariantSet`):
 * шесть «вариантов партии» — это версии k.1 … k.6. Поэтому онлайн-режим,
 * листы, результаты и статистика «Собрать вариант» работают с разделом
 * без второго решателя: им нужен только набор.
 */

import { EGE_NUMBERS, type VariantSet } from '@/lib/variant/types';
import { zagruzitVariant } from './dannye';
import { povKod } from './kod';
import { zadachaVersii } from './shablony';
import type { Zapis } from './types';

/** Версия набора: меняется, когда меняются шаблоны или данные. */
export const POV_VERSION = 'pv1';

export async function povSet(k: number): Promise<VariantSet | null> {
  const d = await zagruzitVariant(k);
  if (d === null) return null;
  return povSetIz(d.k, d.versii);
}

/** То же без загрузки — для автотеста на Node. */
export function povSetIz(k: number, versii: Zapis[][]): VariantSet {
  const code = povKod(k);
  return {
    code,
    seed: code,
    version: POV_VERSION,
    config: {
      tasks: [...EGE_NUMBERS],
      subtypes: {},
      source: 'own',
      stars: [],
      count: versii.length,
      parallel: true,
    },
    zameny: {},
    variants: versii.map((zapisi, i) => ({
      index: i + 1,
      tasks: zapisi.map((z) => zadachaVersii(k, i + 1, z)),
    })),
    createdAt: '2026-10-24T00:00:00.000Z',
  };
}
