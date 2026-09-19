/**
 * Генерация задачи задания №8 по прототипу, seed и уровню.
 *
 * Чистая функция: один и тот же seed всегда даёт одну и ту же
 * задачу. Работает и на сборке (банк), и в браузере (свежие seed):
 * ответ считается здесь же и дальше идёт только в закрытом виде.
 */

import { paramsKey } from './prototypes/common';
import { prototypeById } from './prototypes';
import { rngOf } from './rng';
import type { Generated, Level, Podtip, Prototype } from './types';

/** Сколько раз подтип может не подобрать параметры на одном seed. */
const ATTEMPTS = 400;

/** Подтипы прототипа для уровня; null — все. */
export function podtipyFor(prototype: Prototype, level: Level | null): Podtip[] {
  const fit = level === null ? prototype.podtipy : prototype.podtipy.filter((p) => p.level === level);
  return fit.length > 0 ? fit : prototype.podtipy;
}

/** Есть ли у прототипа подтипы этого уровня. */
export function hasLevel(prototype: Prototype, level: Level): boolean {
  return prototype.podtipy.some((p) => p.level === level);
}

/**
 * Задача прототипа на seed. Подтип выбирается тем же источником
 * случайных чисел, что и параметры, поэтому seed определяет всё.
 * Если ни одна попытка не подошла — исключение: ограничения
 * генератора написаны с ошибкой, и это должен ловить автотест.
 */
export function generate(prototypeId: string, seed: string, level: Level | null): Generated {
  const prototype = prototypeById(prototypeId);
  if (prototype === undefined) {
    throw new Error(`Нет прототипа ${prototypeId}`);
  }
  const r = rngOf(`${prototypeId}|${seed}|${level ?? 'any'}`);
  const podtipy = podtipyFor(prototype, level);
  const banned = new Set(prototype.isklyucheniya ?? []);
  /* Подтип выбирается один раз, до подбора параметров: иначе подтип
     с редким попаданием в ограничения вытеснялся бы «удачливым»
     соседом, и в тренажёре одни формы условия встречались бы чаще
     других. Если выбранный подтип не подобрался — берётся следующий. */
  const start = r.int(0, podtipy.length - 1);
  for (let shift = 0; shift < podtipy.length; shift += 1) {
    const podtip = podtipy[(start + shift) % podtipy.length] as Podtip;
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const draft = podtip.generate(r);
      if (draft === null || banned.has(paramsKey(draft.params))) {
        continue;
      }
      return { ...draft, prototype: prototypeId, podtip: podtip.id, level: podtip.level, seed };
    }
  }
  throw new Error(`Прототип ${prototypeId}: не подобрались параметры на seed ${seed}`);
}
