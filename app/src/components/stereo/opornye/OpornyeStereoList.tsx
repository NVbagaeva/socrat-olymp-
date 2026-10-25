'use client';

import { clsx } from 'clsx';
import { PrepCardLink } from '@/components/tasks/prep/PrepScroll';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { opornye3 } from '@/lib/stereo/opornye3/progress';

export interface BlokKartochka3 {
  id: string;
  slug: string;
  no: number;
  nazvanie: string;
  umenie: string;
  lead: string;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
  gotov: boolean;
}

/**
 * Список блоков опорных задач №3: номер, название и умение без формул,
 * описание, «решено r из n». Блоки, которые ещё пишутся, — «скоро».
 */
export function OpornyeStereoList({ bloki, listHref }: { bloki: BlokKartochka3[]; listHref: string }) {
  const progress = opornye3.useProgress();
  return (
    <ul className="o3-karty">
      {bloki.map((b) => {
        const resheno = b.zadachi.filter((id) => progress.outcomes[id] === 'right').length;
        const telo = (
          <>
            <span className="o3-kart__no" aria-hidden="true">
              {b.no}
            </span>
            <span className="o3-kart__text">
              <span className="o3-kart__umenie">{b.umenie}</span>
              <span className="o3-kart__title">{b.nazvanie}</span>
              <span className="o3-kart__lead">{b.lead}</span>
              <span className="o3-kart__count">
                {b.gotov ? OPORNYE_3.resheno(resheno, b.zadachi.length) : OPORNYE_3.skoro}
              </span>
            </span>
          </>
        );
        return (
          <li key={b.id}>
            {b.gotov ? (
              <PrepCardLink className="o3-kart" href={`${listHref}${b.slug}/`}>
                {telo}
                <span className="o3-kart__go" aria-hidden="true">
                  ›
                </span>
              </PrepCardLink>
            ) : (
              <div className={clsx('o3-kart', 'is-skoro')} aria-disabled="true">
                {telo}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
