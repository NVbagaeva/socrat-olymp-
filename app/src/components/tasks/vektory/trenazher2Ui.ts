import { asBool, asNumberOrNull, asOneOf, asString, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана задания №2, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, раскладка) — всё, что ученик успел
 * сделать на текущем задании: ответ, его проверка, число открытых
 * шагов разбора. Сам разбор не хранится: он закрыт отпечатком задания
 * и раскрывается заново.
 */
export interface Trenazher2Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Разбор раскрыт (открыта хотя бы подсказка или решение). */
  razborOpen: boolean;
  /** Сколько шагов разбора открыто подсказками. */
  shagov: number;
  /** Открыто полное решение. */
  polnoe: boolean;
  misses: number;
  /** Была ли ошибка в текущем задании. */
  failed: boolean;
  /** Когда начато текущее задание, мс активного времени. */
  taskFrom: number | null;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher2Ui(base: BaseUi): Trenazher2Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    razborOpen: asBool(raw['razborOpen']),
    shagov: count(raw['shagov']),
    polnoe: asBool(raw['polnoe']),
    misses: count(raw['misses']),
    failed: asBool(raw['failed']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
