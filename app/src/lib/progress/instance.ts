'use client';

/**
 * Экземпляр задачи на экране: одна задача от показа до перехода к другой.
 *
 * Все попытки экземпляра несут один instanceId — по нему журнал кладёт
 * в окно навыка только итог экземпляра. Здесь же помнится, была ли на
 * экземпляре ошибка и открывался ли разбор: «с первой проверки» и «без
 * подсказки» считаются по экземпляру, а не по задаче вообще.
 *
 * Новый экземпляр начинается, когда меняется ключ задачи (опорные
 * задачи: ученик перешёл к другой) или по reset() (тренажёр: следующее
 * задание подхода, новый подход). Идентификатор создаётся лениво,
 * в обработчике, — при отрисовке ни часов, ни случайных чисел нет.
 */

import { useMemo, useRef } from 'react';

interface State {
  key: string;
  id: string;
  missed: boolean;
  hinted: boolean;
}

export interface InstanceSnapshot {
  id: string;
  /** Была ли на экземпляре неверная проверка. */
  missed: boolean;
  /** Открывался ли на экземпляре разбор, подсказка или решение. */
  hinted: boolean;
}

export interface TaskInstance {
  current(key: string): InstanceSnapshot;
  markMissed(key: string): void;
  markHinted(key: string): void;
  reset(): void;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTaskInstance(): TaskInstance {
  const ref = useRef<State | null>(null);
  return useMemo<TaskInstance>(() => {
    function state(key: string): State {
      if (ref.current === null || ref.current.key !== key) {
        ref.current = { key, id: makeId(), missed: false, hinted: false };
      }
      return ref.current;
    }
    return {
      current(key) {
        const { id, missed, hinted } = state(key);
        return { id, missed, hinted };
      },
      markMissed(key) {
        state(key).missed = true;
      },
      markHinted(key) {
        state(key).hinted = true;
      },
      reset() {
        ref.current = null;
      },
    };
  }, []);
}
