'use client';

import { clsx } from 'clsx';
import { OPORNYE_13 } from '@/content/zadanie13';
import { opornye13, resheno13 } from '@/lib/zadanie13/progress';
import { PrepCardLink } from '../prep/PrepScroll';

export interface BlokKartochka13 {
  id: string;
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  total: number;
}

/** Маленькое кольцо: доля решённых; всё решено — галочка. */
function Kolco({ solved, total }: { solved: number; total: number }) {
  const R = 22;
  const L = 2 * Math.PI * R;
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  const done = total > 0 && solved >= total;
  return (
    <span className={clsx('z13-kolco', done && 'is-done')}>
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle className="z13-kolco__track" cx={28} cy={28} r={R} />
        <circle
          className="z13-kolco__fill"
          cx={28}
          cy={28}
          r={R}
          strokeDasharray={L.toFixed(2)}
          strokeDashoffset={(L * (1 - pct / 100)).toFixed(2)}
        />
      </svg>
      <span className="z13-kolco__c" aria-hidden="true">
        {done ? (
          <svg className="z13-kolco__check" viewBox="0 0 24 24" focusable="false">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        ) : (
          `${pct}%`
        )}
      </span>
      <span className="sr-only">
        Решено {solved} из {total}
      </span>
    </span>
  );
}

/**
 * Список блоков «Опорных задач» №13: группы по схемам, в карточке —
 * номер, название и описание без формул, «10 задач», кольцо и кнопка.
 */
export function Opornye13List({ bloki, listHref }: { bloki: BlokKartochka13[]; listHref: string }) {
  const progress = opornye13.useProgress();
  return (
    <div className="z13-gruppy">
      {OPORNYE_13.gruppy.map((g) => (
        <section key={g.title} className="z13-gruppa">
          <h3 className="z13-gruppa__title">{g.title}</h3>
          <ul className="z13-karty">
            {bloki
              .filter((b) => (g.bloki as readonly string[]).includes(b.no))
              .map((b) => {
                const solved = resheno13(progress, b.id, b.total);
                const nachato = Object.keys(progress.outcomes).some((key) =>
                  key.startsWith(`${b.id}:`),
                );
                const knopka =
                  solved >= b.total
                    ? OPORNYE_13.povtorit
                    : nachato
                      ? OPORNYE_13.prodolzhit
                      : OPORNYE_13.nachat;
                return (
                  <li key={b.id}>
                    <PrepCardLink className="z13-kart" href={`${listHref}${b.slug}/`}>
                      <span className="z13-kart__no" aria-hidden="true">
                        {b.no}
                      </span>
                      <span className="z13-kart__text">
                        <span className="z13-kart__title">{b.nazvanie}</span>
                        <span className="z13-kart__lead">{b.lead}</span>
                        <span className="z13-kart__count">{OPORNYE_13.zadach(b.total)}</span>
                      </span>
                      <Kolco solved={solved} total={b.total} />
                      <span className="z13-kart__btn">
                        {knopka}
                        <span aria-hidden="true"> ›</span>
                      </span>
                    </PrepCardLink>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
