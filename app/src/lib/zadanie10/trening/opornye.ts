'use client';

/**
 * Прогресс опорных задач №10 для общего экрана блока
 * (components/tasks/opornye/OpornyeBanka): тот же ключ и та же форма
 * записи, что у прежнего экрана Opornye10, — { ключ задачи: верно ли }.
 * Переносить нечего: прежняя запись читается как есть, новая пишется в
 * том же виде, поэтому прежний код (если вкладка открыта со старой
 * версией сайта) её тоже понимает.
 *
 * Хранилище показывает её общему экрану в форме ProgressStore
 * (lib/progressStore): «верно» — 'right', «неверно» — 'wrong'. Ответов
 * здесь нет.
 */

import { useSyncExternalStore } from 'react';
import type { ProgressStore, StoreProgress } from '@/lib/progressStore';

export const OPORNYE10_KEY = 'budetege:zadanie-10:opornye:v1';

type Itogi = Record<string, boolean>;

const EMPTY: StoreProgress = { kinds: {}, mistakes: [], outcomes: {} };

/** Прежняя запись → исходы задач; мусор и чужой формат — пустота. */
export function razobratOpornye10(raw: string | null): StoreProgress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return EMPTY;
    }
    const outcomes: StoreProgress['outcomes'] = {};
    for (const [id, verno] of Object.entries(value as Record<string, unknown>)) {
      if (typeof verno === 'boolean') {
        outcomes[id] = verno ? 'right' : 'wrong';
      }
    }
    return { kinds: {}, mistakes: [], outcomes };
  } catch {
    return EMPTY;
  }
}

function createOpornye10(): ProgressStore {
  let kesh: { raw: string | null; progress: StoreProgress } | null = null;
  const slushateli = new Set<() => void>();

  function prochitatRaw(): string | null {
    try {
      return window.localStorage.getItem(OPORNYE10_KEY);
    } catch {
      return kesh?.raw ?? null;
    }
  }

  function snimok(): StoreProgress {
    const raw = prochitatRaw();
    if (kesh === null || kesh.raw !== raw) {
      kesh = { raw, progress: razobratOpornye10(raw) };
    }
    return kesh.progress;
  }

  function zapisat(itogi: Itogi | null) {
    const raw = itogi === null ? null : JSON.stringify(itogi);
    try {
      if (raw === null) window.localStorage.removeItem(OPORNYE10_KEY);
      else window.localStorage.setItem(OPORNYE10_KEY, raw);
    } catch {
      /* без хранилища — прогресс живёт до перезагрузки */
    }
    kesh = { raw, progress: razobratOpornye10(raw) };
    slushateli.forEach((f) => f());
  }

  return {
    key: OPORNYE10_KEY,
    useProgress() {
      return useSyncExternalStore(
        (f) => {
          slushateli.add(f);
          return () => slushateli.delete(f);
        },
        snimok,
        () => EMPTY,
      );
    },
    recordAttempt(attempt) {
      const prezhnie: Itogi = {};
      for (const [id, ishod] of Object.entries(snimok().outcomes)) {
        prezhnie[id] = ishod === 'right';
      }
      zapisat({ ...prezhnie, [attempt.taskId]: attempt.right });
    },
    reset() {
      zapisat(null);
    },
  };
}

export const opornye10 = createOpornye10();
