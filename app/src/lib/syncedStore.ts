'use client';

/**
 * Хранилище одного ключа localStorage, которое умеет жить в аккаунте.
 *
 * Как и прежние хранилища прогресса: значение читается через
 * useSyncExternalStore, на сервере снимок пустой, вторая вкладка видит
 * запись первой (событие storage). Добавлено двое:
 *
 *   - после каждой записи — событие LOCAL_CHANGE_EVENT с ключом: по нему
 *     синхронизация с аккаунтом (lib/accountSync) отправляет новое на
 *     сервер. Гостю событие ничего не стоит: его никто не слушает;
 *   - событие SYNC_APPLIED_EVENT: синхронизация записала в localStorage
 *     то, что пришло с другого устройства, — хранилище перечитывает ключ.
 *
 * Модуль крошечный и без зависимостей: его берут экраны тренажёров, а
 * код синхронизации грузится отдельно и только вошедшему.
 */

import { useSyncExternalStore } from 'react';

/** Записано локально: detail.key — ключ localStorage. */
export const LOCAL_CHANGE_EVENT = 'budetege:local-change';
/** Синхронизация обновила ключи: detail.keys — их список. */
export const SYNC_APPLIED_EVENT = 'budetege:sync-applied';

/** Сообщить, что ключ записан на этом устройстве. */
export function notifyLocalChange(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: { key } }));
  } catch {
    /* Старый браузер без CustomEvent: синхронизация подхватит при следующем входе. */
  }
}

export interface SyncedStore<T> {
  key: string;
  /** Текущее значение (в браузере), пустое на сервере. */
  get(): T;
  /** Записать новое значение целиком. */
  set(next: T): void;
  /** Изменить значение функцией. */
  update(change: (current: T) => T): void;
  /** Значение в React: перерисовка при каждой записи, в том числе из другой вкладки. */
  use(): T;
  /** Стереть ключ. */
  reset(): void;
  /** Перечитать ключ из localStorage (после записи в обход хранилища). */
  reload(): void;
}

/**
 * Хранилище ключа. parse получает разобранный JSON (или null, если
 * ключа нет) и обязан вернуть годное значение: мусор и чужой формат —
 * пустое значение, а не исключение.
 */
export function createSyncedStore<T>(key: string, parse: (raw: unknown) => T, empty: T): SyncedStore<T> {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? empty : parse(JSON.parse(raw));
    } catch {
      return empty;
    }
  }

  function get(): T {
    if (typeof window === 'undefined') return empty;
    if (cache === null) cache = read();
    return cache;
  }

  function notify(): void {
    listeners.forEach((fn) => fn());
  }

  function reload(): void {
    cache = null;
    notify();
  }

  function set(next: T): void {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Хранилище недоступно — значение живёт до перезагрузки. */
    }
    notify();
    notifyLocalChange(key);
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const fromTab = (event: StorageEvent) => {
      if (event.key === key || event.key === null) reload();
    };
    const fromSync = (event: Event) => {
      const keys = (event as CustomEvent<{ keys?: string[] }>).detail?.keys;
      if (!Array.isArray(keys) || keys.includes(key)) reload();
    };
    window.addEventListener('storage', fromTab);
    window.addEventListener(SYNC_APPLIED_EVENT, fromSync);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', fromTab);
      window.removeEventListener(SYNC_APPLIED_EVENT, fromSync);
    };
  }

  return {
    key,
    get,
    set,
    update(change) {
      set(change(get()));
    },
    use() {
      return useSyncExternalStore(subscribe, get, () => empty);
    },
    reset() {
      cache = empty;
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* Нечего чистить. */
      }
      notify();
      notifyLocalChange(key);
    },
    reload,
  };
}
