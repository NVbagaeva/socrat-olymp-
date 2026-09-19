'use client';

import { clsx } from 'clsx';
import { METODY_4, type Method } from '@/lib/veroyatnost/model';

export interface MethodPickerProps {
  /** Что нажал ученик. null — ещё не отвечал. */
  vybor: Method | null;
  /** Верный метод: известен только после ответа. */
  verny: Method | null;
  onPick: (metod: Method) => void;
  label: string;
}

/**
 * Пять кнопок с названиями методов — всегда все пять, в порядке
 * референса. После ответа кнопки замирают: выбранная верная —
 * зелёная, выбранная неверная — красная, а рядом подсвечивается
 * верная. Второй попытки нет.
 */
export function MethodPicker({ vybor, verny, onPick, label }: MethodPickerProps) {
  const otvecheno = vybor !== null;
  return (
    <div className="z4-picker" role="group" aria-label={label}>
      {METODY_4.map((m) => {
        const eto = m.id === vybor;
        const pravilny = verny !== null && m.id === verny;
        return (
          <button
            key={m.id}
            type="button"
            className={clsx(
              'z4-picker__btn',
              eto && pravilny && 'z4-picker__btn--correct',
              eto && !pravilny && 'z4-picker__btn--incorrect',
              !eto && pravilny && 'z4-picker__btn--answer',
            )}
            aria-pressed={eto}
            disabled={otvecheno}
            onClick={() => onPick(m.id)}
          >
            <span className="z4-picker__no" aria-hidden="true">
              {m.nomer}
            </span>
            <span className="z4-picker__name">{m.nazvanie}</span>
          </button>
        );
      })}
    </div>
  );
}
