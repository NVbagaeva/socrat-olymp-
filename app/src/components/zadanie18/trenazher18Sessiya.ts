/**
 * Тренажёр №18 на общей сессии (docs/trenazher-sessiya.md).
 *
 * Задачи №18 — готовые задачи банка (content/zadanie18/trenazher), их
 * условия, чертежи и решения собираются на странице. Поэтому в записи
 * сессии лежат только id задач: запись лёгкая, упаковка (pack/unpack)
 * не нужна. Задача, которой больше нет в банке (сайт обновился),
 * делает запись негодной — тренировка сбрасывается.
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

export interface Payload18 {
  ids: string[];
}

export function isPayload18(value: unknown, known: ReadonlySet<string>): value is Payload18 {
  return (
    isRecord(value) &&
    Array.isArray(value['ids']) &&
    value['ids'].length > 0 &&
    value['ids'].every((id) => typeof id === 'string' && known.has(id))
  );
}

const CHECKED = ['right', 'wrong'] as const;

/** Состояние экрана: общая часть и то, что ученик успел сделать в задаче. */
export interface Ui18 extends BaseUi {
  /** Ответ пункта б) в поле. */
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Подсказка открыта: зачёт не снимает. */
  hintOpen: boolean;
  /** Решение б) открыто: до верного ответа задача не засчитывается. */
  solutionOpen: boolean;
  /** Доказательство а) открыто. */
  proofOpen: boolean;
  /** Самооценка пункта а) по позициям показа: true — «Доказал», false — «Не доказал». */
  proved: Record<number, boolean>;
  misses: number;
}

function readProved(value: unknown, size: number): Record<number, boolean> {
  const out: Record<number, boolean> = {};
  if (!isRecord(value)) return out;
  for (const [k, v] of Object.entries(value)) {
    const i = Number(k);
    if (Number.isInteger(i) && i >= 0 && i < size && typeof v === 'boolean') out[i] = v;
  }
  return out;
}

export function readUi18(raw: BaseUi, poolSize: number): Ui18 {
  const base = normalizeBase(raw, poolSize);
  const r = raw as unknown as Record<string, unknown>;
  return {
    ...base,
    value: asString(r['value']),
    checked: asOneOf(r['checked'], CHECKED),
    hintOpen: asBool(r['hintOpen']),
    solutionOpen: asBool(r['solutionOpen']),
    proofOpen: asBool(r['proofOpen']),
    proved: readProved(r['proved'], poolSize),
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
