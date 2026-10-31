'use client';

import { Badge, type BadgeTone } from '@/components/ui';
import { KARTOCHKI_18, SKHEMA_18, STATUSY_18, type Status18 } from '@/content/zadanie18';
import { otmetit18, status18, useProgress18 } from '@/lib/zadanie18/progress';

export const TON_STATUSA: Readonly<Record<Status18, BadgeTone>> = {
  known: 'success',
  learning: 'warning',
  new: 'neutral',
};

/** Статус схемы бейджем: «Знаю», «Учу», «Не начинал». */
export function StatusSkhemy18({ id }: { id: string }) {
  const progress = useProgress18();
  const st = status18(progress[id]);
  return <Badge tone={TON_STATUSA[st]}>{STATUSY_18[st]}</Badge>;
}

/**
 * «Знаю / Не знаю» на странице схемы. Пишет в то же хранилище, что
 * карточки (lib/zadanie18/progress): ответ здесь сразу виден на
 * плитке, в карточках и в индикаторе вводной плашки.
 */
export function ZnayuNeZnayu18({ id }: { id: string }) {
  const progress = useProgress18();
  const z = progress[id];
  return (
    <section className="z18-otmetka" aria-label={SKHEMA_18.status}>
      <div className="z18-otmetka__status">
        <span className="z18-otmetka__metka">{SKHEMA_18.status}</span>
        <StatusSkhemy18 id={id} />
        {z === undefined ? null : (
          <span className="z18-otmetka__korobka">{KARTOCHKI_18.korobka(z.korobka)}</span>
        )}
      </div>
      <div className="z18-otmetka__knopki">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => otmetit18(id, false)}
        >
          {SKHEMA_18.neZnayu}
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => otmetit18(id, true)}
        >
          {SKHEMA_18.znayu}
        </button>
      </div>
    </section>
  );
}
