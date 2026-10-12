'use client';

import { useEffect, useRef } from 'react';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Сообщить оболочке сессии о состоянии экрана.
 *
 * Звать из экрана задания, передавая всё его состояние одним
 * объектом: ответ, отметки, шаг подсказки, номер задания. Оболочка
 * сохраняет его при каждом изменении. Повторное сообщение с тем же
 * содержимым ничего не пишет: сравнение идёт по JSON, а не по ссылке,
 * поэтому объект можно собирать прямо в теле компонента.
 *
 * Без `report` (экран открыт вне оболочки) хук ничего не делает.
 */
export function useSessionReport<U extends BaseUi>(
  report: ((ui: U) => void) | undefined,
  ui: U,
): void {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (report === undefined) {
      return;
    }
    let json: string;
    try {
      json = JSON.stringify(ui);
    } catch {
      return;
    }
    if (json !== last.current) {
      last.current = json;
      report(ui);
    }
  });
}
