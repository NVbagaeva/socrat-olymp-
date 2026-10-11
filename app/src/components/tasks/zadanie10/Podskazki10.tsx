'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import type { HintStep } from '@/lib/zadanie10/types';

/**
 * Подсказка — цепочка вопросов с кнопками-ответами: «Что нужно найти?»,
 * «Что подставить вместо S?», «Какой корень подходит?». Следующий вопрос
 * открывается после верного ответа на предыдущий.
 */
export function Podskazki10({ shagi }: { shagi: HintStep[] }) {
  const [otkryto, setOtkryto] = useState(1);
  const [vybor, setVybor] = useState<Record<number, number>>({});
  return (
    <ol className="z10-podskazki">
      {shagi.slice(0, otkryto).map((h, i) => {
        const v = vybor[i];
        const verno = v === h.correct;
        return (
          <li key={h.question} className="z10-podskazki__shag">
            <p className="z10-podskazki__vopros">
              <Tex text={h.question} />
            </p>
            <div className="z10-podskazki__knopki" role="group" aria-label="Варианты ответа">
              {h.options.map((o, j) => (
                <button
                  type="button"
                  key={o}
                  className={clsx(
                    'z10-podskazki__knopka',
                    v === j ? (j === h.correct ? 'is-verno' : 'is-neverno') : '',
                  )}
                  aria-pressed={v === j}
                  onClick={() => {
                    setVybor((x) => ({ ...x, [i]: j }));
                    if (j === h.correct && i + 1 === otkryto && otkryto < shagi.length) {
                      setOtkryto(otkryto + 1);
                    }
                  }}
                >
                  <Tex text={o} />
                </button>
              ))}
            </div>
            {v !== undefined ? (
              <p className={clsx('z10-podskazki__otklik', verno ? 'is-verno' : '')} role="status">
                {verno ? (
                  h.comment ? (
                    <Tex text={`Верно. ${h.comment}`} />
                  ) : (
                    'Верно.'
                  )
                ) : (
                  'Подумайте ещё.'
                )}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
