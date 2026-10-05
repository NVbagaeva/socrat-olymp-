/**
 * Микрозадача по идентификатору и seed: чистая функция, как
 * generate() у прототипов. Рисунок принимается, только если движок
 * счёл его чистым и без катетов, и с ними.
 */

import { rngOf } from '../../vychisleniya/rng';
import { risunokChist } from '../generate';
import { paramsKey } from '../prototypes/common';
import { mikroById } from './bloki';
import type { Mikro, MikroGenerated } from './types';

const ATTEMPTS = 400;

/** Зафиксированный вариант блока: первый seed задачи. */
export function fixedSeed(m: Mikro): string {
  return `${m.id}#1`;
}

export function generateMikro(id: string, seed: string): MikroGenerated {
  const m = mikroById(id);
  if (m === undefined) {
    throw new Error(`Нет микрозадачи ${id}`);
  }
  const r = rngOf(`${id}|${seed}`);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = m.generate(r);
    if (draft === null) continue;
    if (draft.risunok !== null && !risunokChist(draft.risunok)) continue;
    return draft;
  }
  throw new Error(`Микрозадача ${id}: не подобрались параметры на seed ${seed}`);
}

/** Seed для кнопки «Ещё вариант»: время и случайный хвост. */
export function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export { paramsKey };
