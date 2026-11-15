'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import type { Nabor } from '@/lib/ustnyySchet/nabor';
import { priyom } from '@/lib/ustnyySchet/registry';
import { kletka, STROKI_VSE } from '@/lib/ustnyySchet/priyomy/tablica';
import type { Rezhim } from '@/lib/ustnyySchet/sessiya';
import { osvoennost, trudnyeKletki, type Stat } from '@/lib/ustnyySchet/statistika/model';
import { ustnyyStat } from '@/lib/ustnyySchet/statistika/store';
import { trenirovkaHref } from '@/lib/ustnyySchet/zapros';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.tablica;
const N = USTNYY.nastroyki;
const OSNOVNYE = [2, 3, 4, 5, 6, 7, 8, 9];

type Forma = 'net' | 'da' | 'smes';

const REZHIMY: { id: string; rezhim: Rezhim; label: string }[] = [
  { id: 's', rezhim: { tip: 'svobodnyy' }, label: N.svobodnyy },
  { id: 's20', rezhim: { tip: 'seriya', n: 20 }, label: `${N.seriya} · 20` },
  { id: 'v60', rezhim: { tip: 'vremya', sek: 60 }, label: `${N.vremya} · ${N.minut(1)}` },
];

/**
 * Режим таблицы умножения: строки, порядок, прямая или обратная форма,
 * сетка освоенности и работа над ошибками.
 */
export function TablicaRezhim() {
  const [stroki, setStroki] = useState<number[]>(OSNOVNYE);
  const [poryadok, setPoryadok] = useState<'vrazbros' | 'po-poryadku'>('vrazbros');
  const [forma, setForma] = useState<Forma>('net');
  const [rezhimId, setRezhimId] = useState('s20');
  /* При сборке и гидратации — пусто, затем данные этого браузера. */
  const stat: Stat = ustnyyStat.use();

  const toggle = (n: number) =>
    setStroki((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n].sort((a, b) => a - b)));
  const rezhim = (REZHIMY.find((r) => r.id === rezhimId) ?? REZHIMY[1])!.rezhim;
  const nabor: Nabor = { tip: 'tablica', stroki, obratnaya: forma, poryadok };
  const trudnye = trudnyeKletki(stat);
  const tb = priyom('tablica');
  const kolonki = stroki.includes(10) ? STROKI_VSE : OSNOVNYE;

  return (
    <div className="us-tablica">
      <div className="us-nastroyki">
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.stroki}</legend>
          <div className="us-chips" role="group" aria-label={T.stroki}>
            {STROKI_VSE.map((n) => (
              <button
                key={n}
                type="button"
                className={clsx('us-chip', stroki.includes(n) && 'is-on')}
                aria-pressed={stroki.includes(n)}
                onClick={() => toggle(n)}
              >
                ×{n}
              </button>
            ))}
            <button
              type="button"
              className="us-chip us-chip--tekst"
              onClick={() => setStroki(OSNOVNYE)}
            >
              {T.vse}
            </button>
          </div>
        </fieldset>
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.poryadok}</legend>
          <div className="us-chips" role="group" aria-label={T.poryadok}>
            {(
              [
                ['vrazbros', T.vrazbros],
                ['po-poryadku', T.poPoryadku],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={clsx('us-chip', poryadok === id && 'is-on')}
                aria-pressed={poryadok === id}
                onClick={() => setPoryadok(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.forma}</legend>
          <div className="us-chips" role="group" aria-label={T.forma}>
            {(
              [
                ['net', T.pryamaya],
                ['da', T.obratnaya],
                ['smes', T.smes],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={clsx('us-chip', forma === id && 'is-on')}
                aria-pressed={forma === id}
                onClick={() => setForma(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{N.rezhim}</legend>
          <div className="us-chips" role="group" aria-label={N.rezhim}>
            {REZHIMY.map((r) => (
              <button
                key={r.id}
                type="button"
                className={clsx('us-chip', rezhimId === r.id && 'is-on')}
                aria-pressed={rezhimId === r.id}
                onClick={() => setRezhimId(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
        {stroki.length === 0 ? (
          <p className="us-nastroyki__pust">{T.stroki}: выбери хотя бы одну</p>
        ) : (
          <Link
            className="btn btn--primary btn--lg us-nastroyki__start"
            href={trenirovkaHref({ nabor, rezhim, go: true })}
          >
            {N.start}
          </Link>
        )}
      </div>

      <section className="us-blok" aria-labelledby="us-setka">
        <h2 id="us-setka" className="t-h2">
          {T.setka}
        </h2>
        <div className="us-setka-wrap">
          <table className="us-setka">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">×</span>
                </th>
                {kolonki.map((b) => (
                  <th key={b} scope="col">
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kolonki.map((a) => (
                <tr key={a}>
                  <th scope="row">{a}</th>
                  {kolonki.map((b) => {
                    const c = stat.tablica[kletka(a, b)];
                    const lvl = osvoennost(c);
                    const sek = c === undefined || c.ok === 0 ? '—' : dlitelnost(c.ms);
                    return (
                      <td
                        key={b}
                        className={`us-setka__k is-${lvl}`}
                        title={T.kletka(a, b, c?.n ?? 0, c?.ok ?? 0, sek)}
                      >
                        <span className="sr-only">
                          {T.kletka(a, b, c?.n ?? 0, c?.ok ?? 0, sek)}
                        </span>
                        <span aria-hidden="true">{a * b}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="us-legenda" aria-label={T.setka}>
          {T.legenda.map((l, i) => (
            <li key={l}>
              <span className={`us-legenda__k is-${i}`} aria-hidden="true" />
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="us-blok" aria-labelledby="us-oshibki">
        <h2 id="us-oshibki" className="t-h3">
          {T.rabotaNadOshibkami}
        </h2>
        <p className="us-blok__lead">{T.rabotaLead}</p>
        {trudnye.length === 0 ? (
          <p className="us-stat__pusto">{T.netOshibok}</p>
        ) : (
          <Link
            className="btn btn--secondary"
            href={trenirovkaHref({
              nabor: {
                tip: 'spisok',
                primery: trudnye.map((k) => {
                  const [a = 2, b = 2] = k.split('x').map(Number);
                  return tb.iz([String(b), String(a)], 2);
                }),
              },
              go: true,
            })}
          >
            {T.rabotaNadOshibkami} · {trudnye.length}
          </Link>
        )}
      </section>
    </div>
  );
}
