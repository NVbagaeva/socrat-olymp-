'use client';

/**
 * Сборка запаса тренажёра в браузере учителя при выдаче: адаптер раздела
 * «Собрать вариант» (lib/variant), фильтр по прототипу. При
 * «индивидуальных числах» — свой seed у каждого ученика, поэтому и свой
 * набор задач.
 */

import { urovenZadachi } from '@/lib/zhurnal/uroven';
import { loadAdapters } from '@/lib/variant/load';
import type { EgeNo } from '@/lib/variant/types';
import { rngOf } from '@/lib/vychisleniya/rng';
import type { ZadachaDz } from './model';
import { zapasTrenazhera } from './zadachi';

export async function sobratZapas(
  taskNo: number,
  tipy: readonly string[],
  skolko: number,
  seed: string,
): Promise<ZadachaDz[]> {
  const no = taskNo as EgeNo;
  const { adapters } = await loadAdapters([no]);
  const adapter = adapters.get(no);
  if (adapter === undefined) throw new Error('adapter');
  return zapasTrenazhera(
    tipy,
    skolko,
    (prototype, uzhe, shag) =>
      adapter.getRandomTask(
        { subtypes: null, source: 'mix', stars: null, prototype, exclude: uzhe },
        rngOf(`${seed}|${prototype}|${shag}`),
      ),
    (z) => urovenZadachi(taskNo, z.taskId.endsWith('|advanced')),
  );
}
