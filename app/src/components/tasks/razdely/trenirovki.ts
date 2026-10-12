'use client';

import { useSyncExternalStore } from 'react';

/**
 * Разделы, в которых есть незавершённая тренировка: по ним в меню
 * разделов ставится метка «тренировка не завершена».
 *
 * Тренировки хранит тренажёр (PR #131, lib/trainerSession/store.ts):
 * одна запись на раздел под ключом budetege:trainer:<раздел>:session,
 * раздел — «12:linear». Запись удаляется, когда тренировку завершают.
 * Здесь только смотрим, какие ключи есть, — записи не разбираем и не
 * трогаем: меню не должно зависеть от формата тренировки.
 *
 * Пока хранилища тренировок на сайте нет, ключей нет и метки тоже.
 */

const PREFIX = 'budetege:trainer:';
const SUFFIX = ':session';
const EMPTY = '';

/** Разделы с записью тренировки через «|»: строка, чтобы снимок сравнивался по значению. */
function snapshot(): string {
  try {
    const store = window.localStorage;
    const found: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key !== null && key.startsWith(PREFIX) && key.endsWith(SUFFIX)) {
        found.push(key.slice(PREFIX.length, key.length - SUFFIX.length));
      }
    }
    return found.sort().join('|');
  } catch {
    /* Приватное окно: хранилище недоступно — меток нет. */
    return EMPTY;
  }
}

function subscribe(listener: () => void): () => void {
  /* Тренировку закончили в соседней вкладке браузера. В этой вкладке
     меню перечитывает ключи при каждом открытии (оно монтируется
     заново), так что своего события не нужно. */
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

/** Есть ли незавершённая тренировка в разделе или в его подразделах. */
export function useNezavershennye(): (scope: string) => boolean {
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const scopes = raw === EMPTY ? [] : raw.split('|');
  return (scope) => scopes.some((item) => item === scope || item.startsWith(`${scope}:`));
}
