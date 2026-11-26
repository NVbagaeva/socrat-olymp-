'use client';

import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.vitrina.tablica;
const N = 10;
const CHISLA = Array.from({ length: N }, (_, i) => i + 1);

/**
 * Мини-таблица умножения 10 × 10 на витрине: наведение на клетку
 * подсвечивает строку и столбец и показывает «a × b = ?», нажатие —
 * ответ. С клавиатуры — одна остановка Tab, по клеткам стрелками.
 */
export function MiniTablica() {
  const [vybor, setVybor] = useState<[number, number] | null>(null);
  const [otvet, setOtvet] = useState(false);
  const [fokus, setFokus] = useState<[number, number]>([1, 1]);
  const setka = useRef<HTMLDivElement>(null);

  const navesti = (a: number, b: number) => {
    if (vybor?.[0] !== a || vybor[1] !== b) {
      setVybor([a, b]);
      setOtvet(false);
    }
  };
  const fokusKletki = (a: number, b: number) => {
    setFokus([a, b]);
    navesti(a, b);
    setka.current
      ?.querySelector<HTMLButtonElement>(`[data-a="${a}"][data-b="${b}"]`)
      ?.focus({ preventScroll: true });
  };

  const podpis =
    vybor === null
      ? T.podskazka
      : otvet
        ? T.otvet(vybor[0], vybor[1])
        : T.vopros(vybor[0], vybor[1]);

  return (
    <div className="us-mt">
      <p className={clsx('us-mt__podpis', otvet && 'is-otvet')} aria-live="polite">
        {podpis}
      </p>
      <div
        ref={setka}
        className="us-mt__setka"
        role="grid"
        aria-label={T.setka}
        onMouseLeave={() => {
          setVybor(null);
          setOtvet(false);
        }}
      >
        {CHISLA.map((a) => (
          <div key={a} className="us-mt__stroka" role="row">
            {CHISLA.map((b) => {
              const v = vybor !== null && (vybor[0] === a || vybor[1] === b);
              const tut = vybor !== null && vybor[0] === a && vybor[1] === b;
              return (
                <span key={b} role="gridcell" className="us-mt__yach">
                  <button
                    type="button"
                    className={clsx(
                      'us-mt__k',
                      a === b && 'is-diag',
                      v && 'is-liniya',
                      tut && 'is-tut',
                      tut && otvet && 'is-otvet',
                    )}
                    data-a={a}
                    data-b={b}
                    tabIndex={fokus[0] === a && fokus[1] === b ? 0 : -1}
                    aria-label={tut && otvet ? T.otvet(a, b) : T.vopros(a, b)}
                    onMouseEnter={() => navesti(a, b)}
                    onFocus={() => navesti(a, b)}
                    onClick={() => {
                      navesti(a, b);
                      setOtvet(true);
                    }}
                    onKeyDown={(e) => {
                      const d: Record<string, [number, number]> = {
                        ArrowUp: [-1, 0],
                        ArrowDown: [1, 0],
                        ArrowLeft: [0, -1],
                        ArrowRight: [0, 1],
                      };
                      const s = d[e.key];
                      if (s === undefined) return;
                      e.preventDefault();
                      const na = Math.min(N, Math.max(1, a + s[0]));
                      const nb = Math.min(N, Math.max(1, b + s[1]));
                      fokusKletki(na, nb);
                    }}
                  >
                    {tut && otvet ? a * b : ''}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
