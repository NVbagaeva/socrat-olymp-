import {
  asBool,
  asNumberOrNull,
  asOneOf,
  asString,
  asStringRecord,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана задачи №3, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, раскладка) — всё, что ученик успел
 * сделать на текущем задании: ответ, его проверка, открытые подсказка
 * и решение, замены «Похожая задача». Сам текст решения не хранится:
 * он закрыт отпечатком задания и раскрывается заново.
 */
export interface Trenazher3Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Открыто ли решение у текущего задания. */
  solutionOpen: boolean;
  /** Открыта ли подсказка у текущего задания. */
  hintOpen: boolean;
  misses: number;
  /** Была ли ошибка в текущем задании. */
  failed: boolean;
  /** Когда начато текущее задание, мс активного времени. */
  taskFrom: number | null;
  /** «Похожая задача»: номер в тренировке → ключ другого варианта того же прототипа. */
  pohozhie: Record<string, string>;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher3Ui(base: BaseUi): Trenazher3Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const misses = raw['misses'];
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    solutionOpen: asBool(raw['solutionOpen']),
    hintOpen: asBool(raw['hintOpen']),
    misses: typeof misses === 'number' && Number.isInteger(misses) && misses >= 0 ? misses : 0,
    failed: asBool(raw['failed']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
    pohozhie: asStringRecord(raw['pohozhie']),
  };
}
