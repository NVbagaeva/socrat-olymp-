'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { href, USTNYY as USTNYY_HREF, USTNYY_TAIL } from '@/lib/paths';
import { api, type Reyting } from '@/lib/ustnyySchet/api';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import { REYTING_FORMATY, type ReytingFormatId } from '@/lib/ustnyySchet/formaty';
import { USTNYY } from '@/content/ustnyySchet';
import './ustnyy.css';

const K = USTNYY.klass;
const R = USTNYY.reyting;

/**
 * Рейтинг класса для репетитора — в карточке страницы класса: лучшие
 * результаты учеников за всё время, с именами (функция ustnyy_reyting
 * отдаёт имена только владельцу класса).
 */
export function ReytingKlassa({ klassId }: { klassId: string }) {
  const [format, setFormat] = useState<ReytingFormatId>('vyzov-dnya');
  const [data, setData] = useState<Reyting | null>(null);
  const [oshibka, setOshibka] = useState(false);

  useEffect(() => {
    let otmena = false;
    api
      .reyting(format, 'vse', klassId)
      .then((r) => {
        if (otmena) return;
        setData(r);
        setOshibka(false);
      })
      .catch(() => {
        if (otmena) return;
        setOshibka(true);
      });
    return () => {
      otmena = true;
    };
  }, [format, klassId]);

  const tip = REYTING_FORMATY.find((f) => f.id === format)?.tip ?? 'vremya';
  const tekushie = data !== null && data.format === format ? data : null;

  return (
    <div className="us-reyting us-reyting--klass">
      <p className="us-blok__lead">{K.lead}</p>
      <div className="us-chips" role="group" aria-label="Формат">
        {REYTING_FORMATY.map((f) => (
          <button
            key={f.id}
            type="button"
            className={clsx('us-chip', format === f.id && 'is-on')}
            aria-pressed={format === f.id}
            onClick={() => setFormat(f.id)}
          >
            {USTNYY.formaty[f.id].nazvanie}
          </button>
        ))}
      </div>
      {oshibka ? (
        <p className="us-blok__lead">{R.oshibka}</p>
      ) : tekushie === null ? (
        <p className="us-blok__lead" aria-busy="true">
          {R.zagruzka}
        </p>
      ) : tekushie.rows.length === 0 ? (
        <p className="us-blok__lead">{K.pusto}</p>
      ) : (
        <div className="us-reyting__wrap">
          <table className="us-reyting__tablica">
            <thead>
              <tr>
                <th scope="col">{R.mesto}</th>
                <th scope="col">{R.uchenik}</th>
                <th scope="col">{R.rezultat}</th>
              </tr>
            </thead>
            <tbody>
              {tekushie.rows.map((r) => (
                <tr key={r.mesto}>
                  <td>{r.mesto}</td>
                  <td>
                    {r.imya ?? r.nick}
                    <span className="us-reyting__pod"> · {r.nick}</span>
                  </td>
                  <td>
                    {tip === 'vremya' ? (
                      R.verno(r.verno, r.vsego)
                    ) : (
                      <>
                        {dlitelnost(r.score_ms)}
                        <span className="us-reyting__pod"> · {R.oshibok(r.vsego - r.verno)}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link
        className="btn btn--secondary btn--sm"
        href={href(USTNYY_HREF, USTNYY_TAIL.reyting, `?klass=${klassId}`)}
      >
        {K.vse}
      </Link>
    </div>
  );
}
