/**
 * Генерация задачи задания №2 по прототипу и seed.
 *
 * Чистая функция: один и тот же seed всегда даёт одну и ту же задачу.
 * Работает и на сборке (банк), и в браузере (свежие seed). Задача с
 * рисунком принимается только тогда, когда движок рисунков не нашёл
 * ни одного нарушения — ни на самом рисунке, ни в режиме подсказки с
 * катетами: подписи обязаны поместиться в обоих.
 */

import { rngOf } from '../vychisleniya/rng';
import { paramsKey } from './prototypes/common';
import { prototypeById } from './prototypes';
import { emptyReport, renderVectorPlane } from './render';
import type { Generated, Risunok } from './types';

/** Сколько раз прототип может не подобрать числа или расположение на одном seed. */
const ATTEMPTS = 400;

/** Чист ли рисунок по отчёту движка — и без катетов, и с ними. */
export function risunokChist(risunok: Risunok): boolean {
  for (const hints of [false, true]) {
    const report = emptyReport();
    renderVectorPlane({ ...risunok, hints }, report);
    if (report.problems.length > 0) {
      return false;
    }
  }
  return true;
}

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
    if (draft.risunok !== null && !risunokChist(draft.risunok)) {
      continue;
    }
    return { ...draft, prototype: prototypeId, seed };
  }
  throw new Error(`Прототип ${prototypeId}: не подобрались параметры на seed ${seed}`);
}

/** Seed опорной задачи прототипа: одна разобранная задача на прототип. */
export function opornayaSeed(prototypeId: string): string {
  return `${prototypeId}#opornaya`;
}
