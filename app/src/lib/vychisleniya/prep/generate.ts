/**
 * Генерация микро-задачи по идентификатору и seed.
 */

import { rngOf } from '../rng';
import { prepMicroById } from './blocks';
import type { PrepGenerated, PrepMicro } from './types';

const ATTEMPTS = 400;

/** Seed зафиксированного варианта: тот, что показывается на вкладке. */
export function fixedSeed(micro: PrepMicro): string {
  return `${micro.id}#1`;
}

export function generatePrep(microId: string, seed: string): PrepGenerated {
  const micro = prepMicroById(microId);
  if (micro === undefined) {
    throw new Error(`Нет микро-задачи ${microId}`);
  }
  const r = rngOf(`${microId}|${seed}`);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = micro.generate(r);
    if (draft !== null) {
      return draft;
    }
  }
  throw new Error(`Микро-задача ${microId}: не подобрались параметры на seed ${seed}`);
}
