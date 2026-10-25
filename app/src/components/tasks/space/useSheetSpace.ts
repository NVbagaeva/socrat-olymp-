'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT, normalizeSpace, type SheetSpace } from '@/lib/sheet/space.js';
import { storage } from '@/lib/storage';

/* Выбор учителя на этом устройстве — один на все генераторы разделов. */
const KEY = 'sheet:space';

const listeners = new Set<() => void>();
let cache: SheetSpace | null = null;

function read(): SheetSpace {
  if (cache === null) cache = normalizeSpace(storage.get<unknown>(KEY, null));
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(next: SheetSpace): void {
  cache = normalizeSpace({ ...next, per: {} });
  storage.set(KEY, cache);
  listeners.forEach((l) => l());
}

/**
 * Настройка «Место для решения» генераторов разделов: по умолчанию «нет»,
 * последний выбор помнится на устройстве. На сборке хранилища нет —
 * разметка сервера с настройкой по умолчанию.
 */
export function useSheetSpace(): [SheetSpace, (next: SheetSpace) => void] {
  const space = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return [space, write];
}
