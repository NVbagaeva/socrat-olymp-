/**
 * Тренажёр №19 на общей сессии (docs/trenazher-sessiya.md).
 *
 * Задания №19 — готовые задачи банка, их условия и решения набраны на
 * странице. Поэтому в записи сессии лежат только id задач: запись лёгкая,
 * упаковка (pack/unpack) не нужна. Задача, которой больше нет в банке
 * (сайт обновился), делает запись негодной — тренировка сбрасывается.
 */

import {
  asBool,
  asNumber,
  asOneOf,
  asString,
  isRecord,
  normalizeBase,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

export interface Payload19 {
  ids: string[];
}

export function isPayload19(value: unknown, known: ReadonlySet<string>): value is Payload19 {
  return (
    isRecord(value) &&
    Array.isArray(value['ids']) &&
    value['ids'].length > 0 &&
    value['ids'].every((id) => typeof id === 'string' && known.has(id))
  );
}

const CHECKED = ['right', 'wrong'] as const;

/** Состояние экрана: общая часть и то, что ученик успел сделать в задании. */
export interface Ui19 extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Подсказка открыта: зачёт не снимает. */
  hintOpen: boolean;
  /** Решение открыто: до верного ответа задача не засчитывается. */
  solutionOpen: boolean;
  failed: boolean;
  misses: number;
}

export function readUi19(raw: BaseUi, poolSize: number): Ui19 {
  const base = normalizeBase(raw, poolSize);
  const r = raw as unknown as Record<string, unknown>;
  return {
    ...base,
    value: asString(r['value']),
    checked: asOneOf(r['checked'], CHECKED),
    hintOpen: asBool(r['hintOpen']),
    solutionOpen: asBool(r['solutionOpen']),
    failed: asBool(r['failed']),
    misses: asNumber(r['misses']),
  };
}

/** Перемешать (Фишер — Йетс): порядок задач в тренировке. */
export function peremeshat<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
