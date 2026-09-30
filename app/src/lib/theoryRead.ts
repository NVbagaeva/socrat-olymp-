'use client';

/**
 * Прочитанные разделы теории подтемы.
 *
 * Кольцо в шапке темы показывает, сколько разделов изучено. У линейной
 * подтемы это число демонстрационное (data/demo.ts) — витрина кабинета,
 * которой ещё нет. У подтемы с признаком `theoryProgress` оно считается
 * честно: раздел засчитывается, когда ученик долистал до его конца, и
 * запоминается в браузере под ключом подтемы. Пока не долистал ни
 * одного — «0 из 7», и это правда.
 *
 * Устройство то же, что у счётчиков тренажёра (lib/progressStore.ts):
 * внешний источник, который React читает через useSyncExternalStore.
 * На сервере источник пуст, поэтому первая отрисовка показывает ноль
 * и расхождению при гидратации взяться неоткуда.
 *
 * Здесь только идентификаторы разделов: ни ответов, ни задач.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { storage } from './storage';

/** Пустой снимок — одна и та же ссылка: иначе подписка зациклится. */
const EMPTY: readonly string[] = [];

const cache = new Map<string, readonly string[]>();
const listeners = new Map<string, Set<() => void>>();

function storageKey(key: string): string {
  return `theory:${key}`;
}

function load(key: string): readonly string[] {
  const raw = storage.get<unknown>(storageKey(key), null);
  if (!Array.isArray(raw)) {
    return EMPTY;
  }
  const ids = raw.filter((item): item is string => typeof item === 'string');
  return ids.length === 0 ? EMPTY : ids;
}

function snapshot(key: string): readonly string[] {
  const known = cache.get(key);
  if (known !== undefined) {
    return known;
  }
  const value = load(key);
  cache.set(key, value);
  return value;
}

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

/** Запомнить, что раздел прочитан. Повтор ничего не меняет. */
export function markSectionRead(key: string, id: string): void {
  const current = snapshot(key);
  if (current.includes(id)) {
    return;
  }
  const next = [...current, id];
  cache.set(key, next);
  storage.set(storageKey(key), next);
  notify(key);
}

/**
 * Прочитанные разделы подтемы. Ключ null — подтема считает разделы
 * не здесь, а витринным числом кабинета: тогда список всегда пуст.
 */
export function useSectionsRead(key: string | null): readonly string[] {
  const api = useMemo(() => {
    if (key === null) {
      return {
        subscribe: () => () => undefined,
        get: () => EMPTY,
      };
    }
    return {
      subscribe: (listener: () => void) => {
        const set = listeners.get(key) ?? new Set<() => void>();
        set.add(listener);
        listeners.set(key, set);
        return () => {
          set.delete(listener);
        };
      },
      get: () => snapshot(key),
    };
  }, [key]);

  return useSyncExternalStore(api.subscribe, api.get, () => EMPTY);
}
