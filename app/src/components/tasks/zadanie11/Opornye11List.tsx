'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { OPORNYE_11 } from '@/content/zadanie11';
import { mikroResheno11, opornye11 } from '@/lib/zadanie11/progress';
import type { RazdelBloka } from '@/lib/zadanie11/prep/types';
import { PrepCardLink } from '../prep/PrepScroll';
import { IkonkaBloka, Piktogramma } from './Piktogrammy';

export interface BlokKartochka {
  id: string;
  slug: string;
  razdel: RazdelBloka;
  nazvanie: string;
  total: number;
  /** Разделы фильтра, в которых карточка видна. */
  filtry: RazdelBloka[];
}

type Filtr = 'all' | RazdelBloka;

export interface FiltrKnopka {
  id: RazdelBloka;
  label: string;
}

/** Маленькое кольцо: доля решённых; 10 из 10 — галочка. */
function Kolco({ solved, total }: { solved: number; total: number }) {
  const R = 22;
  const L = 2 * Math.PI * R;
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  const done = total > 0 && solved >= total;
  return (
    <span className={clsx('z11-kolco', done && 'is-done')}>
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle className="z11-kolco__track" cx={28} cy={28} r={R} />
        <circle
          className="z11-kolco__fill"
          cx={28}
          cy={28}
          r={R}
          strokeDasharray={L.toFixed(2)}
          strokeDashoffset={(L * (1 - pct / 100)).toFixed(2)}
        />
      </svg>
      <span className="z11-kolco__c" aria-hidden="true">
        {done ? <Piktogramma name="check" /> : `${pct}%`}
      </span>
      <span className="sr-only">
        Решено {solved} из {total}
      </span>
    </span>
  );
}

/**
 * Список блоков «Опорных задач» №11 по макету: лента фильтра со
 * значками разделов и отдельной кнопкой «Общие навыки», карточки —
 * значок, название без формул, «10 задач», кольцо и кнопка. Разминка
 * первая, в жёлтой рамке и с плашкой «не входит в ЕГЭ».
 *
 * Фильтр раздела показывает блоки самого раздела и те, что стоят
 * в «перед разделом» на вкладке «О задании»; это считает страница.
 */
export function Opornye11List({
  bloki,
  filtry,
  listHref,
}: {
  bloki: BlokKartochka[];
  /** Кнопки фильтра без «Все»: разделы и «Общие навыки». */
  filtry: FiltrKnopka[];
  listHref: string;
}) {
  const progress = opornye11.useProgress();
  const [filtr, setFiltr] = useState<Filtr>('all');
  const knopki: { id: Filtr; label: string }[] = [{ id: 'all', label: OPORNYE_11.vse }, ...filtry];
  const vidny = bloki.filter((b) => filtr === 'all' || b.filtry.includes(filtr));
  return (
    <>
      <div className="z11-filtr" role="toolbar" aria-label="Раздел">
        {knopki.map((k) => (
          <button
            key={k.id}
            type="button"
            className={clsx('z11-filtr__btn', filtr === k.id && 'is-active')}
            aria-pressed={filtr === k.id}
            onClick={() => setFiltr(k.id)}
          >
            {k.id === 'all' ? (
              <span className="z11-ikonka z11-filtr__vse" aria-hidden="true">
                <Piktogramma name="grid" />
              </span>
            ) : (
              <IkonkaBloka razdel={k.id} />
            )}
            <span className="z11-filtr__label">{k.label}</span>
          </button>
        ))}
      </div>

      <ul className="z11-bloki">
        {vidny.map((b) => {
          const solved = mikroResheno11(progress, b.id, b.total);
          const nachato = Object.keys(progress.outcomes).some((key) => key.startsWith(`${b.id}:`));
          const knopka =
            solved >= b.total
              ? OPORNYE_11.povtorit
              : nachato
                ? OPORNYE_11.prodolzhit
                : OPORNYE_11.nachat;
          return (
            <li key={b.id}>
              <PrepCardLink
                className={clsx('z11-blok', b.razdel === 'RZ' && 'z11-blok--razminka')}
                href={`${listHref}${b.slug}/`}
              >
                <IkonkaBloka razdel={b.razdel} className="z11-blok__ikonka" />
                <span className="z11-blok__text">
                  {b.razdel === 'RZ' ? (
                    <span className="z11-blok__badge">{OPORNYE_11.razminkaBadge}</span>
                  ) : null}
                  <span className="z11-blok__title">{b.nazvanie}</span>
                  <span className="z11-blok__count">{OPORNYE_11.zadach(b.total)}</span>
                </span>
                <Kolco solved={solved} total={b.total} />
                <span className="z11-blok__btn">
                  {knopka}
                  <span aria-hidden="true"> ›</span>
                </span>
              </PrepCardLink>
            </li>
          );
        })}
      </ul>
      {vidny.length === 0 ? <p className="z11-bloki__pusto">{OPORNYE_11.pusto}</p> : null}
    </>
  );
}
