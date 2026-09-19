'use client';

/**
 * Фабрика хранилищ прогресса.
 *
 * Хранилище задания №12 (lib/trainerProgress.ts) одно на весь сайт:
 * ключ и список ошибок общие, «Сбросить» стирает всё. Тренажёру
 * задания №4 и режиму «Узнай метод» нужны свои счётчики со своими
 * ключами — иначе сброс в одном месте обнулял бы другое, а список
 * ошибок смешивал бы задачи разных заданий.
 *
 * Поэтому здесь то же устройство, но с ключом-параметром: каждое
 * хранилище живёт под своим именем в localStorage, читается через
 * useSyncExternalStore и на сервере всегда пустое — первая
 * отрисовка показывает нули, и расхождению при гидратации взяться
 * неоткуда. Форма записи та же, что у задания №12: типы берутся
 * оттуда, а его экспорт не меняется.
 *
 * Правильных ответов здесь нет: только счётчики, идентификаторы
 * задач, в которых ученик ошибся, и чем каждая задача закрылась.
 */

import { useSyncExternalStore } from 'react';
import type { TrainerAttempt, TrainerKindTally, TrainerProgress } from './trainerProgress';

/** Чем закрылась задача. Список ошибок этого не различает. */
export type TaskOutcome = 'right' | 'wrong' | 'revealed';

/**
 * Попытка с исходом. Поле `itog` необязательное: тренажёрам хватает
 * счётчиков и списка ошибок, а подготовке нужен цвет кружка — и он
 * должен пережить перезагрузку ровно таким, каким был.
 */
export interface StoreAttempt extends TrainerAttempt {
  itog?: TaskOutcome;
}

/** Прогресс хранилища: счётчики задания №12 плюс исходы задач. */
export interface StoreProgress extends TrainerProgress {
  /** Идентификатор задачи → чем она закрылась. */
  outcomes: Record<string, TaskOutcome>;
}

export interface ProgressStore {
  /** Ключ в localStorage. */
  key: string;
  /** Прогресс целиком. Перерисовка происходит сама при каждой записи. */
  useProgress(): StoreProgress;
  /**
   * Записать закрытую задачу. Задача, пройденная начисто, уходит из
   * списка ошибочных; ошибка или открытое решение — ставит её туда.
   * Передан `itog` — он же запоминается как исход задачи.
   */
  recordAttempt(attempt: StoreAttempt): void;
  /** Очистить это хранилище. Остальные не трогаются. */
  reset(): void;
}

/* Пустой снимок — одна и та же ссылка: иначе useSyncExternalStore
   зациклится, сверяя снимки. */
const EMPTY: StoreProgress = { kinds: {}, mistakes: [], outcomes: {} };

const ISHODY: readonly TaskOutcome[] = ['right', 'wrong', 'revealed'];

function outcome(value: unknown): TaskOutcome | null {
  return ISHODY.includes(value as TaskOutcome) ? (value as TaskOutcome) : null;
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Разбор записи из хранилища. Мусор и чужой формат считаем пустотой. */
function parse(raw: string | null): StoreProgress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const source = value as { kinds?: unknown; mistakes?: unknown; outcomes?: unknown };
    const kinds: Record<string, TrainerKindTally> = {};
    if (typeof source.kinds === 'object' && source.kinds !== null) {
      Object.entries(source.kinds as Record<string, unknown>).forEach(([id, tally]) => {
        if (typeof tally === 'object' && tally !== null) {
          const item = tally as Record<string, unknown>;
          kinds[id] = {
            done: number(item.done),
            right: number(item.right),
            seconds: number(item.seconds),
          };
        }
      });
    }
    const mistakes = Array.isArray(source.mistakes)
      ? source.mistakes.filter((item): item is string => typeof item === 'string')
      : [];
    /* Записи старого формата поля не имеют — тогда исходов просто нет,
       и кружки красятся по счётчикам, как раньше. */
    const outcomes: Record<string, TaskOutcome> = {};
    if (typeof source.outcomes === 'object' && source.outcomes !== null) {
      Object.entries(source.outcomes as Record<string, unknown>).forEach(([id, item]) => {
        const ishod = outcome(item);
        if (ishod !== null) {
          outcomes[id] = ishod;
        }
      });
    }
    return { kinds, mistakes, outcomes };
  } catch {
    return EMPTY;
  }
}

export function createProgressStore(key: string): ProgressStore {
  let cache: StoreProgress | null = null;
  const listeners = new Set<() => void>();

  function read(): StoreProgress {
    /* Приватный режим и запрет на хранилище: обращение само по себе
       может бросить исключение, поэтому в try завёрнуто и оно. */
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      return EMPTY;
    }
  }

  function snapshot(): StoreProgress {
    if (cache === null) {
      cache = read();
    }
    return cache;
  }

  function serverSnapshot(): StoreProgress {
    return EMPTY;
  }

  function notify(): void {
    listeners.forEach((fn) => fn());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    /* Вторая вкладка того же браузера: там решали — здесь показываем. */
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        cache = null;
        notify();
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', sync);
    };
  }

  function save(next: StoreProgress): void {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Хранилище недоступно — счётчики живут до перезагрузки. */
    }
    notify();
  }

  return {
    key,
    useProgress() {
      return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    },
    recordAttempt(attempt) {
      const current = snapshot();
      const tally = current.kinds[attempt.kind] ?? { done: 0, right: 0, seconds: 0 };
      const kinds: Record<string, TrainerKindTally> = {
        ...current.kinds,
        [attempt.kind]: {
          done: tally.done + 1,
          right: tally.right + (attempt.right ? 1 : 0),
          seconds: tally.seconds + Math.max(0, Math.round(attempt.seconds)),
        },
      };
      const mistakes = attempt.clean
        ? current.mistakes.filter((id) => id !== attempt.taskId)
        : current.mistakes.includes(attempt.taskId)
          ? current.mistakes
          : [...current.mistakes, attempt.taskId];
      /* Исход запоминается, только если его передали: тренажёрам он
         не нужен, и лишнего в их записи не появится. */
      const outcomes =
        attempt.itog === undefined
          ? current.outcomes
          : { ...current.outcomes, [attempt.taskId]: attempt.itog };
      save({ kinds, mistakes, outcomes });
    },
    reset() {
      cache = EMPTY;
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* Нечего чистить — значит и записать не удавалось. */
      }
      notify();
    },
  };
}
