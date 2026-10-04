'use client';

/**
 * Прочитанные разделы теории и ключевых методов подтемы.
 *
 * Раздел теории засчитывается, когда ученик долистал до его конца и
 * раздел пробыл на экране не меньше READ_DWELL_MS (lib/topicProgress.ts):
 * пролистанное одним рывком прочитанным не считается. Метод — когда
 * его окно дочитано до конца. Кнопка «Прочитано» внизу вкладки
 * отмечает все разделы сразу. Отметки живут в браузере под ключом
 * подтемы: «theory:12:rational», «methods:12:rational».
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

/* Версия в ключе: прежние записи (theory:…) набирались прокруткой
   без проверки времени на экране, и пролистанная одним рывком теория
   считалась прочитанной. Им веры нет, счёт начинается заново. */
function storageKey(key: string): string {
  return `read:v2:${key}`;
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

/** Запомнить, что разделы прочитаны. Повтор ничего не меняет. */
export function markSectionsRead(key: string, ids: readonly string[]): void {
  const current = snapshot(key);
  const fresh = ids.filter((id) => !current.includes(id));
  if (fresh.length === 0) {
    return;
  }
  const next = [...current, ...fresh];
  cache.set(key, next);
  storage.set(storageKey(key), next);
  notify(key);
}

/** Запомнить, что раздел прочитан. */
export function markSectionRead(key: string, id: string): void {
  markSectionsRead(key, [id]);
}

/** Прочитанные разделы по ключу. Ключ null — отметок нет, список пуст. */
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
