'use client';

import { mmss } from '@/lib/ustnyySchet/chasy';
import type { TaymerKadr } from '@/lib/ustnyySchet/taymer';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.trenirovka;

/**
 * Цифры таймера — обычный текст поверх кольца (чёткие при любом
 * масштабе и доступные скринридеру). Объявление вслух — только на
 * отметках 60, 30, 10 и 0 секунд: текст живой области меняется лишь
 * на них.
 */
export function TaymerCifry({ k }: { k: TaymerKadr }) {
  const obyavlenie =
    k.otmetka === null ? '' : k.otmetka === 0 ? T.vremyaVyshlo : T.ostalos(mmss(k.otmetka * 1000));
  return (
    <>
      <div
        className="us-taymer__cifry"
        role="timer"
        aria-label={k.vniz ? T.ostalos(k.cifry) : T.proshlo(k.cifry)}
      >
        <span aria-hidden="true">{k.cifry}</span>
      </div>
      <span className="sr-only" aria-live="polite">
        {obyavlenie}
      </span>
    </>
  );
}
