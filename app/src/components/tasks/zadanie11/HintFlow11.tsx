'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { OPORNYE_11 } from '@/content/zadanie11';
import type { ShagHtml } from '@/lib/zadanie11/prep/seal';
import { HintIcon } from '../prep/PrepIcons';

/**
 * Пошаговая подсказка №11: вопрос — кнопки с вариантами. Неверная
 * кнопка гаснет, верная открывает комментарий и следующий шаг.
 * Пройденные шаги остаются на экране — получается ход решения.
 * Общий для «Опорных задач» и тренажёра.
 */
export function HintFlow11({ shagi }: { shagi: ShagHtml[] }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const total = shagi.length;
  return (
    <aside className="ptask__hint z11-hint" aria-live="polite">
      <p className="ptask__hint-head">
        <HintIcon />
        {OPORNYE_11.podskazka}
      </p>
      <ol className="z11-hint__list">
        {shagi.slice(0, step + 1).map((s, i) => {
          const passed = i < step;
          return (
            <li key={i} className={clsx('z11-hint__step', passed && 'is-passed')}>
              <p className="z11-hint__no">{OPORNYE_11.shag(i + 1, total)}</p>
              <p className="z11-hint__q" dangerouslySetInnerHTML={{ __html: s.question }} />
              <div className="z11-hint__opts">
                {s.options.map((o, k) => {
                  const right = passed && k === s.correct;
                  const off = !passed && wrong.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      className={clsx('z11-hint__opt', right && 'is-right', off && 'is-wrong')}
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
                <p className="z11-hint__comment" dangerouslySetInnerHTML={{ __html: s.comment }} />
              ) : null}
              {!passed && wrong.length > 0 ? (
                <p className="z11-hint__oops">{OPORNYE_11.neVerno}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {step >= total ? <p className="z11-hint__done">{OPORNYE_11.podskazkaGotova}</p> : null}
    </aside>
  );
}
