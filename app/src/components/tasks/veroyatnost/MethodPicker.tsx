'use client';

import { clsx } from 'clsx';
import { METODY_4, type Method, type MetodOpisanie } from '@/lib/veroyatnost/model';

export interface MethodPickerProps {
  /** Что нажал ученик. null — ещё не отвечал. */
  vybor: Method | null;
  /** Верный метод: известен только после ответа. */
  verny: Method | null;
  onPick: (metod: Method) => void;
  label: string;
  /** Какие методы предлагать: пять у задания №4, шесть у задания №5. */
  metody?: readonly MetodOpisanie[];
}

/**
 * Кнопки с названиями методов — всегда все, в порядке референса.
 * После ответа кнопки замирают: выбранная верная — зелёная, выбранная
 * неверная — красная, а рядом подсвечивается верная. Второй попытки
 * нет.
 */
export function MethodPicker({
  vybor,
  verny,
  onPick,
  label,
  metody = METODY_4,
}: MethodPickerProps) {
  const otvecheno = vybor !== null;
  return (
    <div className="z4-picker" role="group" aria-label={label}>
      {metody.map((m) => {
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
