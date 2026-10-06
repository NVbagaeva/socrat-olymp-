'use client';

import { Button } from '@/components/ui';
import { markSectionsRead, useSectionsRead } from '@/lib/theoryRead';

export interface ReadMarkProps {
  /** Ключ отметок: «theory:12:rational», «methods:12:rational». */
  storeKey: string;
  /** Разделы вкладки, которые идут в счёт прогресса. */
  ids: readonly string[];
  /** Что отмечено: «теория», «методы» — для подписи «Теория прочитана». */
  done: string;
}

/**
 * Кнопка «Прочитано» внизу вкладки.
 *
 * Дочитанное засчитывается и само, по прокрутке; кнопка — для того,
 * кто прочитал вкладку раньше или читает её не подряд. Нажатие
 * отмечает все разделы вкладки, и пункт в кольце прогресса закрыт.
 */
export function ReadMark({ storeKey, ids, done }: ReadMarkProps) {
  const read = useSectionsRead(storeKey);
  if (ids.length === 0) {
    return null;
  }
  const all = ids.every((id) => read.includes(id));

  return (
    <div className="read-mark">
      {all ? (
        <p className="read-mark__done" role="status">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12.5 10 17.5 19 7" />
          </svg>
          {done}
        </p>
      ) : (
        <Button variant="secondary" onClick={() => markSectionsRead(storeKey, ids)}>
          Прочитано
        </Button>
      )}
    </div>
  );
}
