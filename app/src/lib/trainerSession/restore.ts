/**
 * Осторожное чтение сохранённого состояния экрана.
 *
 * Из хранилища приходит `unknown`: запись могла быть записана другой
 * версией сайта или испортиться. Экран берёт из неё поля через эти
 * функции и при любом несоответствии получает значение по умолчанию —
 * страница не ломается, а тренировка просто продолжается с того места,
 * которое удалось прочитать.
 */

import type { BaseUi, TaskMark } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Число или null: «ещё не начато». */
export function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Строка из списка допустимых или null. */
export function asOneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/** Словарь «строка → строка»: значения других типов отбрасываются. */
export function asStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') {
      out[key] = item;
    }
  }
  return out;
}

/** Список чисел; если хоть один элемент не число — пустой. */
export function asNumberList(value: unknown): number[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
    ? (value as number[])
    : [];
}

/** Список строк; если хоть один элемент не строка — пустой. */
export function asStringList(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? (value as string[])
    : [];
}

/**
 * Раскладка подхода: перестановка некоторых индексов пула. Что-то
 * другое — null, и экран соберёт подход заново.
 */
export function asOrder(value: unknown, poolSize: number): number[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > poolSize) {
    return null;
  }
  const seen = new Set<number>();
  for (const item of value) {
    if (
      typeof item !== 'number' ||
      !Number.isInteger(item) ||
      item < 0 ||
      item >= poolSize ||
      seen.has(item)
    ) {
      return null;
    }
    seen.add(item);
  }
  return value as number[];
}

/** Отметки заданий: только допустимые значения и индексы. */
export function asMarks(value: unknown): Record<number, TaskMark> {
  const out: Record<number, TaskMark> = {};
  if (!isRecord(value)) {
    return out;
  }
  for (const [key, item] of Object.entries(value)) {
    const at = Number(key);
    if (Number.isInteger(at) && at >= 0 && (item === 'right' || item === 'hinted')) {
      out[at] = item;
    }
  }
  return out;
}

/** Задания с ошибкой. */
export function asTried(value: unknown): Record<number, true> {
  const out: Record<number, true> = {};
  if (!isRecord(value)) {
    return out;
  }
  for (const [key, item] of Object.entries(value)) {
    const at = Number(key);
    if (Number.isInteger(at) && at >= 0 && item === true) {
      out[at] = true;
    }
  }
  return out;
}

/**
 * Общая часть состояния экрана читается строго: без номера задания и
 * отметок восстанавливать нечего, и сессия считается испорченной.
 */
export function isBaseUi(value: unknown): value is BaseUi {
  return (
    isRecord(value) &&
    typeof value['index'] === 'number' &&
    Number.isInteger(value['index']) &&
    value['index'] >= 0 &&
    isRecord(value['marks']) &&
    isRecord(value['tried']) &&
    (value['order'] === null || Array.isArray(value['order']))
  );
}

/** Только общая часть: отметки и номер приведены к допустимым значениям. */
export function normalizeBase(ui: BaseUi, poolSize: number): BaseUi {
  const order = asOrder(ui.order, poolSize);
  const total = order === null ? poolSize : order.length;
  return {
    ...ui,
    index: Math.min(ui.index, Math.max(0, total - 1)),
    marks: asMarks(ui.marks),
    tried: asTried(ui.tried),
    order,
  };
}
