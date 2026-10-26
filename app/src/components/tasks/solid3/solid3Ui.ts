import {
  asBool,
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана заданий №3, как оно хранится в сессии.
 *
 * Раскладка подхода — общее поле `order`: индексы пула заданий в
 * порядке показа, замена варианта меняет в нём один индекс. Кроме
 * общих полей — всё, что ученик успел сделать на текущем задании.
 * Разбор в записи не лежит: хранится только то, что он открыт, а
 * сам текст раскрывается заново из закрытого разбора банка.
 */
export interface Solid3Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  solution: boolean;
  /** Ошибался ли ученик в текущем задании. */
  missed: boolean;
  /** Когда начато текущее задание, мс активного времени. null — ещё не начато. */
  taskFrom: number | null;
  /** Неверных проверок за тренировку: строка «Неверных попыток» в итогах. */
  misses: number;
  /** Открыта ли подсказка к текущему заданию. */
  hint: boolean;
  /** Неверных проверок в текущем задании: после второй предлагается решение. */
  oshibok: number;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readSolid3Ui(base: BaseUi): Solid3Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const misses = asNumberOrNull(raw['misses']);
  const oshibok = asNumberOrNull(raw['oshibok']);
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    solution: asBool(raw['solution']),
    missed: asBool(raw['missed']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
    misses: misses !== null && Number.isInteger(misses) && misses >= 0 ? misses : 0,
    hint: asBool(raw['hint']),
    oshibok: oshibok !== null && Number.isInteger(oshibok) && oshibok >= 0 ? oshibok : 0,
  };
}
