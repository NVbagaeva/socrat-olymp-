'use client';

import { useEffect, useRef } from 'react';

/**
 * Обработчик «перед досрочным завершением тренировки».
 *
 * Экран регистрирует здесь то, что раньше делала его собственная кнопка
 * «Завершить»: например, записать в историю начатую, но не закрытую
 * задачу как ошибку. Оболочка вызывает обработчик один раз, до того как
 * собрать итоги. Берётся всегда последняя версия функции.
 */
export function useBeforeFinish(
  register: ((handler: (() => void) | null) => void) | undefined,
  handler: () => void,
): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (register === undefined) {
      return undefined;
    }
    register(() => latest.current());
    return () => register(null);
  }, [register]);
}
