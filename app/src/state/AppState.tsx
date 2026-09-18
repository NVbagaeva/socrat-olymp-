'use client';

/**
 * Состояние кабинета: то, что переживает перезагрузку страницы.
 *
 * Хранится через lib/storage.ts, поэтому подмена хранилища на сервер
 * не заденет ни один компонент. Отдельной библиотеки состояния в
 * проекте нет и не заводится: хранить пока нечего, кроме числа
 * изученных разделов темы.
 *
 * Здесь была ещё и подборка заданий с настройками генератора —
 * набросок, оставшийся от прежнего замысла вкладки. Тренажёр и
 * генератор его не использовали ни дня: тренировку собирает
 * lib/trainerSession.ts в браузере, вариант для печати —
 * lib/generatorSheet.ts, а счётчики тренажёра лежат в
 * lib/trainerProgress.ts своим ключом. Набросок убран.
 */

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { demoStudied } from '@/data/demo';
import { persistent } from '@/lib/storage';

/** То, что переживает перезагрузку страницы. */
interface Persisted {
  /** Сколько разделов теории изучено. Общее число не хранится:
      оно равно длине списка разделов и считается на месте показа. */
  studied: number;
}

const INITIAL: Persisted = {
  /* DEMO-значение приходит из demo.ts и живёт дальше как обычные
     данные: число меняется по мере изучения. */
  studied: demoStudied,
};

/* Хранилище — внешний источник: React читает из него снимок, а не
   догоняет его эффектом после отрисовки. */
const store = persistent<Persisted>('state', INITIAL);

export type AppState = Persisted;

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  /* Сборка получает начальный снимок, браузер — сохранённый. Подмену
     React делает сам при подключении разметки. */
  const stored = useSyncExternalStore(store.subscribe, store.read, store.initial);

  /* Запись могла остаться от прежней раскладки состояния, где вместо
     числа лежала пара «изучено и всего». Тогда берётся начальное
     значение: иначе на экране оказалось бы «из undefined». */
  const value = useMemo<AppState>(
    () => (typeof stored.studied === 'number' ? { studied: stored.studied } : INITIAL),
    [stored],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Состояние кабинета. Вне провайдера вызывать нельзя — это ошибка сборки. */
export function useAppState(): AppState {
  const value = useContext(Ctx);
  if (value === null) {
    throw new Error('useAppState вызван вне AppStateProvider');
  }
  return value;
}
