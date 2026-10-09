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
 * Состояние экрана задания №12, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, раскладка) — всё, что ученик успел
 * сделать на текущем задании: ответ, открытая подсказка и её шаг,
 * введённое в полях шагов.
 */
export interface TrainerUi extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  hint: boolean;
  solution: boolean;
  solutionStep: number;
  step: number;
  fields: Record<string, string>;
  stepMark: 'right' | 'wrong' | null;
  answered: number;
  picked: number | null;
  note: string | null;
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
export function readTrainerUi(base: BaseUi): TrainerUi {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    hint: asBool(raw['hint']),
    solution: asBool(raw['solution']),
    solutionStep: count(raw['solutionStep']),
    step: count(raw['step']),
    fields: asStringRecord(raw['fields']),
    stepMark: asOneOf(raw['stepMark'], ['right', 'wrong'] as const),
    answered: count(raw['answered']),
    picked: asNumberOrNull(raw['picked']),
    note: typeof raw['note'] === 'string' ? raw['note'] : null,
    misses: count(raw['misses']),
    failed: asBool(raw['failed']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
