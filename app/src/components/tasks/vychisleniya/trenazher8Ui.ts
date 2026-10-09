import { asBool, asNumberOrNull, asOneOf, asString, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана задания №8, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, раскладка) — всё, что ученик успел
 * сделать на текущем задании: ответ, его проверка, открытое решение.
 * Сам текст решения не хранится: он закрыт отпечатком задания и
 * раскрывается заново.
 */
export interface Trenazher8Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Открыто ли решение у текущего задания. */
  solutionOpen: boolean;
  misses: number;
  /** Была ли ошибка в текущем задании. */
  failed: boolean;
  /** Когда начато текущее задание, мс активного времени. */
  taskFrom: number | null;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher8Ui(base: BaseUi): Trenazher8Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const misses = raw['misses'];
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    solutionOpen: asBool(raw['solutionOpen']),
    misses: typeof misses === 'number' && Number.isInteger(misses) && misses >= 0 ? misses : 0,
    failed: asBool(raw['failed']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
