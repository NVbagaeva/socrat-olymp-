'use client';

import { clsx } from 'clsx';
import { useState } from 'react';

const CHISLA = Array.from({ length: 20 }, (_, i) => 11 + i);

/**
 * Карточки «квадраты 11–30»: на лицевой стороне число, по нажатию —
 * его квадрат. Кнопки, а не переворот по наведению: работает с
 * клавиатуры и пальцем.
 */
export function KartochkiKvadratov() {
  const [otkryty, setOtkryty] = useState<ReadonlySet<number>>(new Set());
  const toggle = (n: number) =>
    setOtkryty((s) => {
      const next = new Set(s);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  return (
    <ul className="us-kartochki">
      {CHISLA.map((n) => {
        const on = otkryty.has(n);
        return (
          <li key={n}>
            <button
              type="button"
              className={clsx('us-kartochka', on && 'is-otkryta')}
              aria-pressed={on}
              aria-label={on ? `${n} в квадрате — ${n * n}` : `${n} в квадрате — показать`}
              onClick={() => toggle(n)}
            >
              <span className="us-kartochka__n">
                {n}
                <sup>2</sup>
              </span>
              <span className="us-kartochka__v" aria-hidden={!on}>
                {on ? n * n : '?'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
