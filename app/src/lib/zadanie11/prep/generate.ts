/**
 * Микрозадача по идентификатору и seed: чистая функция, как
 * generate() у подтипов. Неудачный набор чисел (null) — следующая
 * попытка на том же генераторе случайных чисел.
 */

import { rngOf } from '../../vychisleniya/rng';
import { mikroById } from './bloki';
import type { Mikro, MikroZadacha } from './types';

const ATTEMPTS = 400;

/** Зафиксированный вариант блока: первый seed задачи. */
export function fixedSeed(m: Mikro): string {
  return `${m.id}#1`;
}

export function generateMikro(id: string, seed: string): MikroZadacha {
  const m = mikroById(id);
  if (m === undefined) {
    throw new Error(`Нет микрозадачи ${id}`);
  }
  const r = rngOf(`${id}|${seed}`);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = m.generate(r);
    if (draft !== null) {
      return draft;
    }
  }
  throw new Error(`Микрозадача ${id}: не подобрались параметры на seed ${seed}`);
}

/** Seed для кнопки «Ещё вариант»: время и случайный хвост. */
export function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
