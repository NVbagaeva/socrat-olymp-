'use client';

import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import type { HintStep } from '@/lib/zadanie14/tipy';

/**
 * Подсказка — цепочка вопросов с кнопками-ответами, как в других
 * разделах: следующий вопрос открывается после верного ответа,
 * пройденные остаются на экране. Состояние — у экрана (для сессии).
 */
export function Podskazki14({
  shagi,
  otkryto,
  mimo,
  onVerno,
  onMimo,
}: {
  shagi: HintStep[];
  otkryto: number;
  mimo: number[];
  onVerno: () => void;
  onMimo: (j: number) => void;
}) {
  return (
    <ol className="z14-podskazki">
      {shagi.slice(0, Math.min(otkryto, shagi.length)).map((h, i) => {
        const tekushchiy = i === otkryto - 1 && otkryto <= shagi.length;
        return (
          <li key={h.question} className="z14-podskazki__shag">
            <p className="z14-podskazki__vopros">
              <Tex text={h.question} />
            </p>
            <div className="z14-podskazki__knopki" role="group" aria-label="Варианты ответа">
              {h.options.map((o, j) => {
                const verna = j === h.correct;
                const mimoTut = tekushchiy && mimo.includes(j);
                return (
                  <button
                    type="button"
                    key={o}
                    className={clsx(
                      'z14-podskazki__knopka',
                      !tekushchiy && verna ? 'is-verno' : '',
                      mimoTut ? 'is-neverno' : '',
                    )}
                    disabled={!tekushchiy || mimoTut}
                    aria-pressed={!tekushchiy && verna}
                    onClick={() => (verna ? onVerno() : onMimo(j))}
                  >
                    <Tex text={o} />
                  </button>
                );
              })}
            </div>
            {!tekushchiy ? (
              <p className="z14-podskazki__otklik is-verno" role="status">
                {h.comment ? <Tex text={`Верно. ${h.comment}`} /> : 'Верно.'}
              </p>
            ) : mimo.length > 0 ? (
              <p className="z14-podskazki__otklik" role="status">
                Подумай ещё — попробуй другой вариант.
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
