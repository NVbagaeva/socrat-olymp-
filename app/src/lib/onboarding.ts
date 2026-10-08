'use client';

/**
 * Состояние онбординга: видел ли человек окно «Впервые здесь?», какой
 * тур идёт и на каком шаге остановились.
 *
 * Хранится через lib/storage (localStorage, префикс budetege:). Входа на
 * сайте нет, поэтому другого места нет: на новом устройстве окно
 * покажется снова — это честно, тур там ещё не проходили.
 *
 * Компоненты читают состояние через useOnboarding() и меняют его только
 * функциями отсюда: так окно, кнопка «?» и тур видят одно и то же.
 */

import { useSyncExternalStore } from 'react';
import { storage } from '@/lib/storage';
import type { TourId } from '@/content/onboarding';

export interface TourProgress {
  /** Индекс шага, на котором остановились; число шагов — финал. */
  step: number;
  done: boolean;
}

export interface OnboardingState {
  /** Окно «Впервые здесь?» уже показывали. */
  welcomeSeen: boolean;
  /** Идущий сейчас тур. */
  active: TourId | null;
  tours: Partial<Record<TourId, TourProgress>>;
}

const KEY = 'onboarding:v1';
const EVENT = 'budetege:onboarding';

const EMPTY: OnboardingState = { welcomeSeen: false, active: null, tours: {} };

let cache: OnboardingState | null = null;

function read(): OnboardingState {
  if (cache === null) {
    const raw = storage.get<Partial<OnboardingState>>(KEY, {});
    cache = {
      welcomeSeen: raw.welcomeSeen === true,
      active: raw.active ?? null,
      tours: raw.tours ?? {},
    };
  }
  return cache;
}

function write(next: OnboardingState): void {
  cache = next;
  storage.set(KEY, next);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  const fromStorage = (event: StorageEvent) => {
    /* Другая вкладка поменяла состояние: перечитать. */
    if (event.key === null || event.key.endsWith(KEY)) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', fromStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', fromStorage);
  };
}

let welcomeAtLoad: boolean | null = null;
const noSubscribe = () => () => {};

/**
 * Нужно ли окно «Впервые здесь?» — по состоянию на момент загрузки
 * страницы. Окно отмечает себя показанным в момент показа и не должно
 * от этого исчезать. На сервере и при гидратации — false: окно
 * появляется только после неё, разметка сервера и браузера совпадает.
 */
export function useWelcomeAtLoad(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      if (welcomeAtLoad === null) welcomeAtLoad = !read().welcomeSeen;
      return welcomeAtLoad;
    },
    () => false,
  );
}

/** Текущее состояние; на сервере и до гидратации — пустое. */
export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function markWelcomeSeen(): void {
  const s = read();
  if (!s.welcomeSeen) write({ ...s, welcomeSeen: true });
}

/** Запустить тур с шага step (по умолчанию — сначала). */
export function startTour(id: TourId, step = 0): void {
  const s = read();
  write({
    ...s,
    welcomeSeen: true,
    active: id,
    tours: { ...s.tours, [id]: { step, done: false } },
  });
}

/** Перейти на шаг тура. */
export function setTourStep(id: TourId, step: number): void {
  const s = read();
  const prev = s.tours[id] ?? { step: 0, done: false };
  write({ ...s, tours: { ...s.tours, [id]: { ...prev, step } } });
}

/** Закрыть тур, запомнив шаг: из «?» его можно продолжить. */
export function pauseTour(): void {
  const s = read();
  if (s.active !== null) write({ ...s, active: null });
}

/** Тур пройден до конца. */
export function finishTour(id: TourId): void {
  const s = read();
  write({
    ...s,
    active: null,
    tours: { ...s.tours, [id]: { step: 0, done: true } },
  });
}
