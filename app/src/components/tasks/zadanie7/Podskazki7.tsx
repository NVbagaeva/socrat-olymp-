'use client';

import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_7 } from '@/content/zadanie7';
import type { HintStep } from '@/lib/zadanie7/types';

/**
 * Подсказка — цепочка вопросов с кнопками-ответами: «К какому
 * основанию привести обе части?», «Что значит $\log_a A=c$?», «Подходит
 * ли корень по ОДЗ?». Следующий вопрос открывается после верного ответа
 * на предыдущий; пройденные шаги остаются на экране. Состояние (сколько
 * шагов открыто, какие кнопки мимо) — у экрана: оно сохраняется в сессии.
 */
export function Podskazki7({
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
    <ol className="z7-podskazki">
      {shagi.slice(0, Math.min(otkryto, shagi.length)).map((h, i) => {
        /* Текущий шаг — последний открытый; когда пройдены все, текущего нет. */
        const tekushchiy = i === otkryto - 1 && otkryto <= shagi.length;
        return (
          <li key={h.question} className="z7-podskazki__shag">
            <p className="z7-podskazki__vopros">
              <Tex text={h.question} />
            </p>
            <div className="z7-podskazki__knopki" role="group" aria-label="Варианты ответа">
              {h.options.map((o, j) => {
                const verna = j === h.correct;
                const mimoTut = tekushchiy && mimo.includes(j);
                return (
                  <button
                    type="button"
                    key={o}
                    className={clsx(
                      'z7-podskazki__knopka',
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
              <p className="z7-podskazki__otklik is-verno" role="status">
                {h.comment ? <Tex text={`Верно. ${h.comment}`} /> : 'Верно.'}
              </p>
            ) : mimo.length > 0 ? (
              <p className="z7-podskazki__otklik" role="status">
                {TRENAZHER_7.podumayte}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
