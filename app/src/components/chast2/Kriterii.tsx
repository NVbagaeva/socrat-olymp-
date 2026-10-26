'use client';

import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import type { Kriteriy } from '@/content/variantOnline/kriterii';

export interface KriteriiProps {
  kriterii: readonly Kriteriy[];
  max: number;
  ball: number | undefined;
  /** Выбранная строка «балл:номер»; без строки — балл кнопкой. */
  stroka: string | undefined;
  onPick: (ball: number, stroka: string | null) => void;
  readOnly?: boolean;
  /** Префикс data-testid. */
  testId: string;
  /** Подпись итога: у ученика — «Ваша оценка», у учителя — «Оценка». */
  itog?: (ball: number, max: number) => string;
}

/**
 * Таблица критериев: каждая строка «ИЛИ» нажимается отдельно и ставит
 * свой балл; над таблицей — кнопки 0…максимум. Одна и та же у ученика
 * (самопроверка) и у учителя.
 */
export function Kriterii({
  kriterii,
  max,
  ball,
  stroka,
  onPick,
  readOnly = false,
  testId,
  itog = T.samoBall,
}: KriteriiProps) {
  return (
    <div className="c2-krit">
      <div className="c2-krit__bally" role="radiogroup" aria-label="Балл">
        {Array.from({ length: max + 1 }, (_, b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={ball === b}
            disabled={readOnly}
            className={clsx('c2-krit__ball', ball === b && 'is-on')}
            data-testid={`${testId}-ball-${b}`}
            onClick={() => onPick(b, null)}
          >
            {b}
          </button>
        ))}
      </div>
      <div className="c2-krit__wrap">
        <table className="c2-krit__table">
          <thead>
            <tr>
              <th scope="col">Содержание критерия</th>
              <th scope="col">Баллы</th>
            </tr>
          </thead>
          <tbody>
            {kriterii.map((k) => (
              <tr key={k.ball} className={clsx(ball === k.ball && 'is-ball')}>
                <td>
                  {k.ili.map((s, j) => {
                    const key = `${k.ball}:${j}`;
                    return (
                      <span key={key} className="c2-krit__ili">
                        {j > 0 ? <span className="c2-krit__or">ИЛИ</span> : null}
                        <button
                          type="button"
                          className={clsx('c2-krit__row', stroka === key && 'is-on')}
                          aria-pressed={stroka === key}
                          disabled={readOnly}
                          data-testid={`${testId}-row-${key.replace(':', '-')}`}
                          onClick={() => onPick(k.ball, key)}
                        >
                          <Tex text={s} />
                        </button>
                      </span>
                    );
                  })}
                </td>
                <td className="c2-krit__num">{k.ball}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="c2-krit__itog" aria-live="polite">
        {ball === undefined ? T.samoNet : itog(ball, max)}
      </p>
    </div>
  );
}
