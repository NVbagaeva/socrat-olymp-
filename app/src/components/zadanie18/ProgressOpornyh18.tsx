'use client';

import { clsx } from 'clsx';
import { ProgressBar } from '@/components/ui';
import { OPORNYE_18_UI } from '@/content/zadanie18/opornye';
import { opornye18, otmetit18, otmetka18, resheno18 } from '@/lib/zadanie18/opornye/progress';

const UI = OPORNYE_18_UI;

/**
 * Отметка на странице задачи: «Решил» / «Не решил». Нажатая кнопка
 * показывает нынешнюю отметку; другую можно поставить в любой момент.
 */
export function OtmetkaOpornoy18({ id }: { id: string }) {
  const progress = opornye18.useProgress();
  const otmetka = otmetka18(progress, id);
  return (
    <section className="z18-blok z18-op-otmetka" aria-labelledby="z18-op-otmetka">
      <h3 id="z18-op-otmetka" className="z18-blok__title">
        {UI.otmetka}
      </h3>
      <p className="z18-blok__podskazka">{UI.otmetkaPodskazka}</p>
      <div className="z18-op-knopki">
        <button
          type="button"
          className={clsx('btn btn--sm', otmetka === 'right' ? 'btn--primary' : 'btn--secondary')}
          aria-pressed={otmetka === 'right'}
          onClick={() => otmetit18(id, 'right')}
        >
          {UI.reshil}
        </button>
        <button
          type="button"
          className={clsx('btn btn--sm', otmetka === 'wrong' ? 'btn--primary' : 'btn--secondary')}
          aria-pressed={otmetka === 'wrong'}
          onClick={() => otmetit18(id, 'wrong')}
        >
          {UI.neReshil}
        </button>
      </div>
      <p className="z18-op-otmetka__itog" aria-live="polite">
        {otmetka === 'right' ? UI.otmechenoReshil : otmetka === 'wrong' ? UI.otmechenoNe : ''}
      </p>
    </section>
  );
}

/** Значок отметки на плитке задачи: нет отметки — ничего. */
export function StatusOpornoy18({ id }: { id: string }) {
  const progress = opornye18.useProgress();
  const otmetka = otmetka18(progress, id);
  if (otmetka === null) return null;
  return (
    <span className={clsx('z18-op-status', otmetka === 'right' ? 'is-reshena' : 'is-ne')}>
      {otmetka === 'right' ? `✓ ${UI.statusReshena}` : UI.statusNe}
    </span>
  );
}

/** Счётчик над списком: «Решено N из M», полоса и сброс отметок. */
export function SchetchikOpornyh18({ ids }: { ids: readonly string[] }) {
  const progress = opornye18.useProgress();
  const reshenoN = resheno18(progress, ids);
  const otmecheno = ids.some((id) => otmetka18(progress, id) !== null);
  return (
    <div className="z18-op-schet">
      <p className="z18-op-schet__tekst">
        <b>{reshenoN}</b> {UI.reshenoIz(ids.length)}
      </p>
      <ProgressBar
        className="z18-op-schet__polosa"
        value={ids.length === 0 ? 0 : (reshenoN / ids.length) * 100}
        label={UI.reshenoLabel(reshenoN, ids.length)}
      />
      {otmecheno ? (
        <button
          type="button"
          className="btn btn--ghost btn--sm z18-op-schet__sbros"
          onClick={() => {
            if (window.confirm(UI.sbrosVopros)) opornye18.reset();
          }}
        >
          {UI.sbros}
        </button>
      ) : null}
    </div>
  );
}
