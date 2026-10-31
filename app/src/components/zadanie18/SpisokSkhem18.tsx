'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui';
import { SPISOK_18, STATUSY_18, ZADANIE18, type Status18 } from '@/content/zadanie18';
import { SPISOK_SKHEM, skhema18 } from '@/content/zadanie18/spisok';
import { GRUPPY_18, type Gruppa18 } from '@/content/zadanie18/tipy';
import { status18, useProgress18 } from '@/lib/zadanie18/progress';
import { ZADANIYA } from '@/lib/paths';
import { MiniChertezh18 } from './MiniChertezh18';
import { TON_STATUSA } from './ZnayuNeZnayu18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;
const STATUSY: readonly Status18[] = ['known', 'learning', 'new'];

/**
 * Список схем: фильтры по теме и статусу и плитки. Собранная схема —
 * плитка-ссылка с мини-чертежом и статусом; несобранная — приглушённая
 * плитка «Скоро». Плитки сгруппированы по темам в согласованном порядке.
 */
export function SpisokSkhem18() {
  const progress = useProgress18();
  const [gruppa, setGruppa] = useState<Gruppa18 | null>(null);
  const [status, setStatus] = useState<Status18 | null>(null);

  const vidimye = SPISOK_SKHEM.filter((s) => {
    if (gruppa !== null && s.gruppa !== gruppa) return false;
    if (status !== null) {
      /* Фильтр по статусу — только среди собранных схем. */
      if (skhema18(s.id) === undefined) return false;
      if (status18(progress[s.id]) !== status) return false;
    }
    return true;
  });

  return (
    <section className="z18-spisok-skhem" aria-labelledby="z18-spisok-title">
      <h2 id="z18-spisok-title" className="t-h2">
        {SPISOK_18.title}
      </h2>

      <div className="z18-filtry">
        <div className="z18-filtry__ryad" role="group" aria-label={SPISOK_18.filtrGruppy}>
          <span className="z18-filtry__metka">{SPISOK_18.filtrGruppy}</span>
          <button
            type="button"
            className={clsx('chip', gruppa === null && 'is-active')}
            aria-pressed={gruppa === null}
            onClick={() => setGruppa(null)}
          >
            {SPISOK_18.vse}
          </button>
          {GRUPPY_18.map((g) => (
            <button
              key={g.id}
              type="button"
              className={clsx('chip', gruppa === g.id && 'is-active')}
              aria-pressed={gruppa === g.id}
              onClick={() => setGruppa(gruppa === g.id ? null : g.id)}
            >
              {g.title}
            </button>
          ))}
        </div>
        <div className="z18-filtry__ryad" role="group" aria-label={SPISOK_18.filtrStatusa}>
          <span className="z18-filtry__metka">{SPISOK_18.filtrStatusa}</span>
          <button
            type="button"
            className={clsx('chip', status === null && 'is-active')}
            aria-pressed={status === null}
            onClick={() => setStatus(null)}
          >
            {SPISOK_18.vse}
          </button>
          {STATUSY.map((st) => (
            <button
              key={st}
              type="button"
              className={clsx('chip', status === st && 'is-active')}
              aria-pressed={status === st}
              onClick={() => setStatus(status === st ? null : st)}
            >
              {STATUSY_18[st]}
            </button>
          ))}
        </div>
      </div>

      {vidimye.length === 0 ? <p className="z18-pusto">{SPISOK_18.pusto}</p> : null}

      {GRUPPY_18.map((g) => {
        const vGruppe = vidimye.filter((s) => s.gruppa === g.id);
        if (vGruppe.length === 0) return null;
        return (
          <div key={g.id} className="z18-gruppa">
            <h3 className="z18-gruppa__title">{g.title}</h3>
            <ul className="z18-plitki">
              {vGruppe.map((s) => {
                const sobrana = skhema18(s.id) !== undefined;
                if (!sobrana) {
                  return (
                    <li key={s.id} className="z18-plitka z18-plitka--skoro">
                      <span className="z18-plitka__no">{s.no}</span>
                      <span className="z18-plitka__nazvanie">{s.nazvanie}</span>
                      <Badge tone="neutral">{SPISOK_18.skoro}</Badge>
                    </li>
                  );
                }
                const st = status18(progress[s.id]);
                return (
                  <li key={s.id} className="z18-plitka">
                    <Link className="z18-plitka__ssylka" href={`${BASE}/skhemy/${s.id}/`}>
                      <span className="z18-plitka__mini">
                        <MiniChertezh18 id={s.id} nazvanie={s.nazvanie} />
                      </span>
                      <span className="z18-plitka__niz">
                        <span className="z18-plitka__no">{s.no}</span>
                        <span className="z18-plitka__nazvanie">{s.nazvanie}</span>
                      </span>
                      <span className="z18-plitka__status">
                        <Badge tone={TON_STATUSA[st]}>{STATUSY_18[st]}</Badge>
                        <span className="z18-plitka__otkryt">{SPISOK_18.otkryt} ›</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
