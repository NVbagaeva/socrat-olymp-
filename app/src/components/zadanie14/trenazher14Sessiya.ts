import {
  asBool,
  asNumber,
  asNumberList,
  asNumberOrNull,
  asOneOf,
  asString,
  asStringList,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import { zadachaPoId14 } from '@/lib/zadanie14/dannye';
import type { Itog14, Punkt } from '@/lib/zadanie14/proverkaZadachi';

/**
 * Тренировка №14 в общей сессии: задачи — только id (сами задачи — в
 * бандле раздела), состояние экрана — ввод, итог проверки, подсказки и
 * открытое решение. Запись лёгкая, упаковка не нужна.
 */
export interface Trenazher14Payload {
  ids: string[];
}

export function isTrenazher14Payload(value: unknown): value is Trenazher14Payload {
  return (
    isRecord(value) &&
    Array.isArray(value['ids']) &&
    value['ids'].length > 0 &&
    value['ids'].every((id) => typeof id === 'string' && zadachaPoId14(id) !== undefined)
  );
}

export interface Trenazher14Ui extends BaseUi {
  serii: string[];
  korni: string;
  chislo: string;
  itog: Itog14 | null;
  oshibalsya: boolean;
  /** Сколько шагов подсказки открыто (0 — подсказка закрыта). */
  otkryto: number;
  mimo: number[];
  reshenie: boolean;
  taskFrom: number | null;
}

const PUNKTY: readonly Punkt[] = ['verno', 'neverno', 'ne-razobrano', 'pusto'];

function readItog(v: unknown): Itog14 | null {
  if (!isRecord(v)) return null;
  const a = asOneOf(v['a'], PUNKTY);
  if (a === null) return null;
  return { a, b: asOneOf(v['b'], PUNKTY), otklik: asStringList(v['otklik']) };
}

export function readTrenazher14Ui(base: BaseUi): Trenazher14Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const serii = asStringList(raw['serii']);
  return {
    ...base,
    serii: serii.length > 0 ? serii : [''],
    korni: asString(raw['korni']),
    chislo: asString(raw['chislo']),
    itog: readItog(raw['itog']),
    oshibalsya: asBool(raw['oshibalsya']),
    otkryto: Math.max(0, asNumber(raw['otkryto'], 0)),
    mimo: asNumberList(raw['mimo']),
    reshenie: asBool(raw['reshenie']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
