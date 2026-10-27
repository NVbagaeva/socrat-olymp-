'use client';

import { clsx } from 'clsx';
import './shagi.css';

/** Шаг подсказки: вопрос с кнопками-вариантами, верный — correct. */
export interface ShagVoprosa {
  question: string;
  options: string[];
  correct: number;
  /** Пояснение после верного ответа; null — нет. */
  comment: string | null;
}

export interface ShagiSost {
  /** Пройдено шагов. */
  shag: number;
  /** Неверные варианты текущего шага. */
  mimo: number[];
}

/** Состояние из записи сессии; что не прочиталось — с начала. */
export function shagiSost(raw: Record<string, unknown> | null): ShagiSost {
  const shag = raw?.['shag'];
  const mimo = raw?.['mimo'];
  return {
    shag: typeof shag === 'number' && Number.isInteger(shag) && shag >= 0 ? shag : 0,
    mimo: Array.isArray(mimo) ? mimo.filter((x): x is number => typeof x === 'number') : [],
  };
}

/**
 * Подсказка вопросами по шагам (№11, №1, №13): текущий вопрос с
 * кнопками, неверная кнопка гаснет; под ним — пройденный шаг с
 * верным ответом и пояснением. Когда шаги кончились — onDone.
 */
export function ShagiVoprosy({
  shagi,
  sost,
  onChange,
  onMiss,
  onDone,
  slova,
}: {
  shagi: readonly ShagVoprosa[];
  sost: ShagiSost;
  onChange: (next: ShagiSost) => void;
  onMiss: () => void;
  onDone: () => void;
  slova: { shag: (i: number, n: number) => string; neverno: string; vse: string };
}) {
  const tek = shagi[sost.shag];
  const pred = sost.shag > 0 ? shagi[sost.shag - 1] : undefined;

  function vybrat(k: number) {
    if (tek === undefined) return;
    if (k !== tek.correct) {
      onChange({ ...sost, mimo: [...sost.mimo, k] });
      onMiss();
      return;
    }
    onChange({ shag: sost.shag + 1, mimo: [] });
    if (sost.shag + 1 >= shagi.length) onDone();
  }

  return (
    <>
      {tek === undefined ? null : (
        <div className="trz-q">
          <p className="trz-q__no">{slova.shag(sost.shag + 1, shagi.length)}</p>
          <p className="trz-q__prompt" dangerouslySetInnerHTML={{ __html: tek.question }} />
          <div className="trz-q__options" role="group">
            {tek.options.map((o, k) => (
              <button
                key={k}
                type="button"
                className={clsx('trz-q__option', sost.mimo.includes(k) && 'is-wrong')}
                disabled={sost.mimo.includes(k)}
                onClick={() => vybrat(k)}
                dangerouslySetInnerHTML={{ __html: o }}
              />
            ))}
          </div>
          {sost.mimo.length > 0 ? (
            <p className="trz-q__oops" role="status">
              {slova.neverno}
            </p>
          ) : null}
        </div>
      )}
      {pred === undefined ? null : (
        <div className="trz-q__pred">
          <p>
            <span dangerouslySetInnerHTML={{ __html: pred.question }} />{' '}
            <b dangerouslySetInnerHTML={{ __html: pred.options[pred.correct] ?? '' }} />
          </p>
          {pred.comment === null || pred.comment === '' ? null : (
            <p className="trz-q__comment" dangerouslySetInnerHTML={{ __html: pred.comment }} />
          )}
          {sost.shag >= shagi.length ? <p className="trz-q__done">{slova.vse}</p> : null}
        </div>
      )}
    </>
  );
}
