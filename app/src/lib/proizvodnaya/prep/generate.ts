/**
 * Генерация микрозадачи опорного блока №9 по блоку, номеру и seed.
 * Чистая функция: один seed — одна задача; Math.random не используется.
 */

import { rngOf } from '../rng';
import { prepBlockById } from './blocks';
import type { PrepGenerated, PrepMicro } from './types';

const ATTEMPTS = 600;

/** Seed зафиксированного варианта: тот, что показывается на вкладке. */
export function fixedSeed(micro: PrepMicro): string {
  return `${micro.id}#1`;
}

/** no — номер микрозадачи в блоке: 1…10 или '01'…'10'. */
export function generatePrep(blockId: string, no: number | string, seed: string): PrepGenerated {
  const block = prepBlockById(blockId);
  if (block === undefined) {
    throw new Error(`Нет блока ${blockId}`);
  }
  const n = Number(no);
  const micro = block.zadachi[n - 1];
  if (micro === undefined) {
    throw new Error(`В блоке ${blockId} нет микрозадачи ${no}`);
  }
  const r = rngOf(`${micro.id}|${seed}`);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = micro.generate(r);
    if (draft !== null) {
      return draft;
    }
  }
  throw new Error(`Микрозадача ${micro.id}: не подобрались параметры на seed ${seed}`);
}

/** Удобный вариант по идентификатору микрозадачи P9-3-05. */
export function generatePrepById(microId: string, seed: string): PrepGenerated {
  const m = /^(P9-\d)-(\d\d)$/.exec(microId);
  if (m === null) {
    throw new Error(`Плохой идентификатор ${microId}`);
  }
  return generatePrep(m[1] as string, m[2] as string, seed);
}
