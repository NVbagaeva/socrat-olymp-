'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import type { PodskazkaShag } from '@/lib/veroyatnost/razbor';
import { HintIcon } from '../prep/PrepIcons';

export const PODSKAZKA_SLOVA = {
  title: 'Подсказка по шагам',
  shag: (i: number, n: number): string => `Шаг ${i} из ${n}`,
  neVerno: 'Не совсем. Попробуйте другой вариант.',
  gotovo: 'Все шаги пройдены — теперь введите ответ.',
};

/**
 * Подсказка в карточке задачи: вопрос — кнопки с вариантами ответа.
 * Неверная кнопка гаснет, верная оставляет только себя, показывает
 * комментарий и открывает следующий вопрос. Пройденные шаги остаются
 * на экране: получается ход решения, который ученик прошёл сам.
 */
export function HintFlow({ shagi }: { shagi: readonly PodskazkaShag[] }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const total = shagi.length;
  return (
    <aside className="pc-hint" aria-live="polite">
      <p className="pc-hint__head">
        <HintIcon />
        {PODSKAZKA_SLOVA.title}
      </p>
      <ol className="pc-hint__list">
        {shagi.slice(0, step + 1).map((s, i) => {
          const passed = i < step;
          return (
            <li key={i} className={clsx('pc-hint__step', passed && 'is-passed')}>
              <p className="pc-hint__no">{PODSKAZKA_SLOVA.shag(i + 1, total)}</p>
              <p className="pc-hint__q" dangerouslySetInnerHTML={{ __html: s.question }} />
              <div className="pc-hint__opts">
                {s.options.map((o, k) => {
                  const right = passed && k === s.correct;
                  const off = !passed && wrong.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      className={clsx('pc-hint__opt', right && 'is-right', off && 'is-wrong')}
                      disabled={passed || off}
                      onClick={() => {
                        if (k === s.correct) {
                          setStep(i + 1);
                          setWrong([]);
                        } else {
                          setWrong([...wrong, k]);
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: o }}
                    />
                  );
                })}
              </div>
              {passed && s.comment !== null ? (
                <p className="pc-hint__comment" dangerouslySetInnerHTML={{ __html: s.comment }} />
              ) : null}
              {!passed && wrong.length > 0 ? (
                <p className="pc-hint__oops" role="status">
                  {PODSKAZKA_SLOVA.neVerno}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {step >= total ? <p className="pc-hint__done">{PODSKAZKA_SLOVA.gotovo}</p> : null}
    </aside>
  );
}
