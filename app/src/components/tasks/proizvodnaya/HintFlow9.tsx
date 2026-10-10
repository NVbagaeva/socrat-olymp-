'use client';

import { clsx } from 'clsx';
import { HintIcon } from '../prep/PrepIcons';
import type { Vopros9 } from '@/lib/proizvodnaya/session';

export interface HintFlow9Props {
  voprosy: Vopros9[];
  /** Сколько вопросов пройдено верно. */
  step: number;
  /** Кнопки текущего вопроса, на которые уже нажали и ошиблись. */
  wrong: number[];
  /** Нажата кнопка k текущего вопроса. */
  onPick: (k: number) => void;
}

/**
 * Пошаговая подсказка №9: вопрос с кнопками ответов. Верная кнопка
 * открывает следующий вопрос (и рисунок показывает следующее
 * построение), неверная гаснет и объясняет, почему не так, — можно
 * выбрать снова. Пройденные вопросы остаются на экране: из них
 * складывается ход решения. Готового решения подсказка не даёт.
 * Состояние хранит экран сессии, поэтому подсказка переживает
 * переход на другую вкладку.
 */
export function HintFlow9({ voprosy, step, wrong, onPick }: HintFlow9Props) {
  const total = voprosy.length;
  const shown = voprosy.slice(0, Math.min(step + 1, total));
  return (
    <aside className="ptask__hint z9-hint" aria-live="polite" aria-label="Подсказка">
      <p className="ptask__hint-head">
        <HintIcon />
        Подсказка
      </p>
      <ol className="z9-hint__list">
        {shown.map((q, i) => {
          const passed = i < step;
          return (
            <li key={i} className={clsx('z9-hint__step', passed && 'is-passed')}>
              <p className="z9-hint__no">
                Вопрос {i + 1} из {total}
              </p>
              <div className="z9-hint__q" dangerouslySetInnerHTML={{ __html: q.voprosHtml }} />
              <div className="z9-hint__opts">
                {q.varianty.map((v, k) => {
                  const right = passed && v.verno;
                  const off = !passed && wrong.includes(k);
                  if (passed && !v.verno) {
                    return null;
                  }
                  return (
                    <button
                      key={k}
                      type="button"
                      className={clsx('z9-hint__opt', right && 'is-right', off && 'is-wrong')}
                      disabled={passed || off}
                      onClick={() => onPick(k)}
                      dangerouslySetInnerHTML={{ __html: v.tekstHtml }}
                    />
                  );
                })}
              </div>
              {passed && q.itogHtml !== null ? (
                <div className="z9-hint__itog" dangerouslySetInnerHTML={{ __html: q.itogHtml }} />
              ) : null}
              {!passed
                ? wrong.map((k) => {
                    const why = q.varianty[k]?.pochemuHtml ?? '';
                    return (
                      <div
                        key={k}
                        className="z9-hint__oops"
                        role="status"
                        dangerouslySetInnerHTML={{
                          __html: why === '' ? 'Не так. Выберите другой вариант.' : why,
                        }}
                      />
                    );
                  })
                : null}
            </li>
          );
        })}
      </ol>
      {step >= total ? (
        <p className="z9-hint__done">
          Подсказка пройдена. Теперь найдите ответ сами и введите его в поле.
        </p>
      ) : null}
    </aside>
  );
}
