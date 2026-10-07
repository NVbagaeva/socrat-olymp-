/**
 * Генерация задач задания №11 по подтипу и seed — на сервере и в
 * автотестах: «похожесть» сверяется с открытым банком и разминкой
 * из JSON. Само ядро — gen/core.ts (без банка, для браузера).
 */

import { BANK, RAZMINKA } from '../bank';
import { generateBez, pohozhaNa, type Generated } from './core';

export { GENERATORS, paramsKey, pohozhaNa, generateBez } from './core';
export type { Generated, Pohozha, UslovieBanka } from './core';

/** Похожа ли задача на задачу открытого банка или разминки. */
export const pohozhaNaBank = pohozhaNa([...BANK, ...RAZMINKA]);

export function generate(id: string, seed: string): Generated {
  return generateBez(id, seed, pohozhaNaBank);
}
