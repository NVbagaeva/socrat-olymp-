'use client';

/**
 * Выбор тренировки №11 на время вкладки браузера (sessionStorage):
 * источник, подтипы, количество, уровень, подсказки. Устройство как
 * у lib/subtopicPick.ts — внешний источник для useSyncExternalStore;
 * на сервере и при первой отрисовке — настройки по умолчанию, так
 * что расхождению при гидратации взяться неоткуда.
 */

import { useSyncExternalStore } from 'react';
import type { Nastroyki } from './sessiya';

const KEY = 'budetege:zadanie-11:trenazher-vybor';

export const PO_UMOLCHANIYU: Nastroyki = {
  istochnik: 'bank',
  podtipy: [],
  count: 15,
  uroven: 0,
  podskazki: true,
};

const listeners = new Set<() => void>();
let current: Nastroyki | undefined;

function razobrat(raw: string | null): Nastroyki {
  if (raw === null) {
    return PO_UMOLCHANIYU;
  }
  try {
    const v = JSON.parse(raw) as Partial<Nastroyki>;
    return {
      istochnik: v.istochnik === 'mix' || v.istochnik === 'new' ? v.istochnik : 'bank',
      podtipy: Array.isArray(v.podtipy)
        ? v.podtipy.filter((x): x is string => typeof x === 'string')
        : [],
      count: typeof v.count === 'number' && v.count >= 1 && v.count <= 50 ? v.count : 15,
      uroven: v.uroven === 1 || v.uroven === 2 || v.uroven === 3 ? v.uroven : 0,
      podskazki: v.podskazki !== false,
    };
  } catch {
    return PO_UMOLCHANIYU;
  }
}

function snapshot(): Nastroyki {
  if (current === undefined) {
    try {
      current = razobrat(window.sessionStorage.getItem(KEY));
    } catch {
      current = PO_UMOLCHANIYU;
    }
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Сохранить выбор: экран перерисуется сам. */
export function zapisatNastroyki(n: Nastroyki): void {
  current = n;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* Приватный режим: выбор живёт в памяти до перезагрузки. */
  }
  listeners.forEach((listener) => listener());
}

export function useNastroyki(): Nastroyki {
  return useSyncExternalStore(subscribe, snapshot, () => PO_UMOLCHANIYU);
}

/** Выбор сейчас — для правок вне отрисовки. */
export function nastroykiSeychas(): Nastroyki {
  return snapshot();
}
