'use client';

/**
 * Запомненный уровень экзамена — в хранилище кабинета (lib/storage.ts).
 *
 * Адрес важнее памяти: на /baza/… уровень всегда «база», на главной,
 * в банке и вариантах профиля — «профиль», и запомненное значение
 * обновляется. На страницах, чей адрес об уровне молчит, действует
 * запомненный.
 */

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { levelOfPath, type Level } from './level';
import { persistent } from './storage';

const store = persistent<Level>('level', 'profile');

function read(): Level {
  return store.read() === 'base' ? 'base' : 'profile';
}

/** Уровень открытой страницы: по адресу, иначе запомненный. */
export function useLevel(): Level {
  const byPath = levelOfPath(usePathname());
  const saved = useSyncExternalStore<Level>(store.subscribe, read, () => 'profile');
  useEffect(() => {
    if (byPath !== null && byPath !== read()) store.write(byPath);
  }, [byPath]);
  return byPath ?? saved;
}
