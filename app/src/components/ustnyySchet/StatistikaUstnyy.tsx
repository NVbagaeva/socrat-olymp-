'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { api } from '@/lib/ustnyySchet/api';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import { FORMATY, REYTING_FORMATY, type ReytingFormatId } from '@/lib/ustnyySchet/formaty';
import { itogMs, tochnostProc } from '@/lib/ustnyySchet/ochki';
import { PRIYOMY } from '@/lib/ustnyySchet/registry';
import { osvoennost, rekordKey, svodkaPriyoma } from '@/lib/ustnyySchet/statistika/model';
import { ustnyyStat } from '@/lib/ustnyySchet/statistika/store';
import { rezhimFormata } from '@/lib/ustnyySchet/zapros';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.statistika;
const DEN = 24 * 3600 * 1000;

type Rezultaty = Awaited<ReturnType<typeof api.moiRezultaty>>;

function useSeychas(): number {
  const [t] = useState(() => Date.now());
  return t;
}

/**
 * Блок «Устный счёт» в /statistika/: личная статистика (локальная, она же
 * в аккаунте через синхронизацию), слабые приёмы, рекорды форматов и —
 * вошедшему ученику — лучшие результаты в рейтинге с сервера.
 */
export function StatistikaUstnyy() {
  const stat = ustnyyStat.use();
  const user = useSessionUser();
  const seychas = useSeychas();
  const [reyting, setReyting] = useState<Rezultaty | null>(null);

  useEffect(() => {
    if (!AUTH_ENABLED || user === null || user.role !== 'student') return;
    let otmena = false;
    api
      .moiRezultaty()
      .then((r) => !otmena && setReyting(r))
      .catch(() => undefined);
    return () => {
      otmena = true;
    };
  }, [user]);

  const sessii = stat.sessii;
  const za7 = sessii.filter((s) => s.at > seychas - 7 * DEN);
  const vsego = sessii.reduce((a, s) => a + s.vsego, 0);
  const verno = sessii.reduce((a, s) => a + s.verno, 0);
  const osvoeno = Object.values(stat.tablica).filter((c) => osvoennost(c) === 4).length;
  const slabye = PRIYOMY.map((p) => ({ p, s: svodkaPriyoma(stat, p.id) }))
    .filter(({ s }) => s.n >= 5)
    .sort((a, b) => a.s.ok / a.s.n - b.s.ok / b.s.n)
    .slice(0, 3)
    .filter(({ s }) => s.ok / s.n < 0.9);
  const rekordy = FORMATY.map((f) => {
    const rez = rezhimFormata(f.id);
    const key = rekordKey(`f:${f.id}`, rez);
    return { f, rez, r: key === null ? undefined : stat.rekordy[key] };
  }).filter((x) => x.r !== undefined);
  const sReytingom = (reyting ?? []).filter((r) => r.luchshiy !== null);
  const tipOf = (id: ReytingFormatId) => REYTING_FORMATY.find((f) => f.id === id)?.tip ?? 'vremya';

  return (
    <section className="us-stat us-stat--kabinet" aria-labelledby="us-stat-kab">
      <h2 id="us-stat-kab" className="t-h2">
        {T.zag}
      </h2>
      {sessii.length === 0 && sReytingom.length === 0 ? (
        <>
          <p className="us-stat__pusto">{T.pusto}</p>
          <Link className="btn btn--primary" href={href(USTNYY_HREF)}>
            {T.nachat}
          </Link>
        </>
      ) : (
        <>
          <p className="us-blok__lead">{T.lead}</p>
          <dl className="us-stat__plitki">
            <div className="us-plitka">
              <dt>{T.trenirovok}</dt>
              <dd>
                {sessii.length}
                <span className="us-plitka__iz">
                  {' '}
                  · {T.za7.toLowerCase()} {za7.length}
                </span>
              </dd>
            </div>
            <div className="us-plitka">
              <dt>{T.primerov}</dt>
              <dd>{vsego}</dd>
            </div>
            <div className="us-plitka">
              <dt>{T.tochnost}</dt>
              <dd>{tochnostProc({ verno, vsego })}&nbsp;%</dd>
            </div>
            <div className="us-plitka">
              <dt>{T.tablica}</dt>
              <dd>{T.tablicaIz(osvoeno)}</dd>
            </div>
          </dl>

          <div className="us-blok">
            <h3 className="t-h4">{T.slabye}</h3>
            {slabye.length === 0 ? (
              <p className="us-stat__pusto">{T.slabyePusto}</p>
            ) : (
              <ul className="us-stat__spisok">
                {slabye.map(({ p, s }) => (
                  <li key={p.id}>
                    <Link href={href(USTNYY_HREF, p.id)}>{USTNYY.priyomy[p.id].nazvanie}</Link>
                    <span className="us-reyting__pod">
                      {' '}
                      · {tochnostProc({ verno: s.ok, vsego: s.n })}&nbsp;% из {s.n}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rekordy.length > 0 && (
            <div className="us-blok">
              <h3 className="t-h4">{T.rekordy}</h3>
              <ul className="us-stat__spisok">
                {rekordy.map(({ f, rez, r }) =>
                  r === undefined ? null : (
                    <li key={f.id}>
                      {USTNYY.formaty[f.id].nazvanie}:{' '}
                      <strong>
                        {rez.tip === 'vremya' ? `${r.verno} из ${r.vsego}` : dlitelnost(itogMs(r))}
                      </strong>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {sReytingom.length > 0 && (
            <div className="us-blok">
              <h3 className="t-h4">{T.reytingZag}</h3>
              <ul className="us-stat__spisok">
                {sReytingom.map((r) =>
                  r.luchshiy === null ? null : (
                    <li key={r.format}>
                      {USTNYY.formaty[r.format].nazvanie}:{' '}
                      <strong>
                        {tipOf(r.format) === 'vremya'
                          ? `${r.luchshiy.verno} из ${r.luchshiy.vsego}`
                          : dlitelnost(r.luchshiy.score_ms)}
                      </strong>
                      <span className="us-reyting__pod"> · {T.popytok(r.popytok)}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
