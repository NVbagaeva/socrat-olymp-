import {
  asBool,
  asNumber,
  asNumberList,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана задания №9, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, ошибки) — всё, что ученик успел
 * сделать на текущем задании: ответ и его проверка, лесенка подсказки
 * (открыта ли, сколько вопросов пройдено, какие кнопки уже нажаты
 * неверно), открытое решение. Текст решения не хранится: он закрыт
 * отпечатком задания и раскрывается заново.
 */
export interface Trenazher9Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  hintOn: boolean;
  hintStep: number;
  hintWrong: number[];
  /** Открыто ли полное решение у текущего задания. */
  solution: boolean;
  /** Неверных проверок за тренировку. */
  misses: number;
  /** Когда открыто текущее задание, мс активного времени. */
  taskFrom: number;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher9Ui(base: BaseUi): Trenazher9Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    hintOn: asBool(raw['hintOn']),
    hintStep: count(raw['hintStep']),
    hintWrong: asNumberList(raw['hintWrong']),
    solution: asBool(raw['solution']),
    misses: count(raw['misses']),
    taskFrom: Math.max(0, asNumber(raw['taskFrom'])),
  };
}
