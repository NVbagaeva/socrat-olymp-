/**
 * Генерация задачи задания №9 по прототипу и seed.
 *
 * Чистая функция: один и тот же seed всегда даёт одну и ту же задачу.
 * Работает и на сборке (банк), и в браузере (свежие seed). Задача с
 * рисунком принимается только тогда, когда движок не нашёл нарушений
 * читаемости и подписи не пересекаются во всех режимах рисунка —
 * это проверяет сам прототип через sobrat() из prototypes/common.ts.
 */

import { paramsKey } from './prototypes/common';
import { prototypeById } from './prototypes';
import { rngOf } from './rng';
import type { Generated } from './types';

/** Сколько раз прототип может не подобрать рисунок или числа на одном seed. */
const ATTEMPTS = 600;

export function generate(prototypeId: string, seed: string): Generated {
  const prototype = prototypeById(prototypeId);
  if (prototype === undefined) {
    throw new Error(`Нет прототипа ${prototypeId}`);
  }
  const r = rngOf(`${prototypeId}|${seed}`);
  const banned = new Set(prototype.isklyucheniya ?? []);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = prototype.generate(r);
    if (draft === null || banned.has(paramsKey(draft.params))) {
      continue;
    }
    return { ...draft, prototype: prototypeId, seed, istochnik: prototype.istochnik };
  }
  throw new Error(`Прототип ${prototypeId}: не подобрались параметры на seed ${seed}`);
}

/** Seed опорной задачи прототипа: одна разобранная задача на прототип. */
export function opornayaSeed(prototypeId: string): string {
  return `${prototypeId}#opornaya`;
}
