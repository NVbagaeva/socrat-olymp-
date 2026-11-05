'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { OTCHET_STRANICA as T } from '@/content/otchet';
import { bezopasnyyPut, raskodirovat, type Raskodirovano } from '@/lib/otchet/kod';
import { itogiPoTemam, svet, verno, type Otchet, type Svet } from '@/lib/otchet/types';
import { typesetText } from '@/lib/tex';
import './otchet.css';

const ZNAK: Record<Svet, string> = { green: '🟢', yellow: '🟡', red: '🔴' };
const SVET_SLOVO: Record<Svet, string> = {
  green: 'хорошо',
  yellow: 'есть ошибки',
  red: 'нужно повторить',
};

/** Название с формулами: KaTeX, всё вне формул экранируется — данные пришли из ссылки. */
function Tex({ text }: { text: string }) {
  const html = useMemo(() => typesetText(text), [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function data(ms: number): string {
  return new Date(ms).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function vremya(ms: number): string {
  return new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function dlitelnost(sek: number): string {
  const s = Math.round(sek);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин ${s % 60} с`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

/** Ссылка «Открыть эти задачи»: тренажёр раздела с типами, где были ошибки. */
function ssylkaNaZadachi(o: Otchet): { href: string; s_oshibkami: boolean } | null {
  const put = bezopasnyyPut(o.put) ?? (o.nomer === null ? null : `/zadaniya/${o.nomer}/trenazher/`);
  if (put === null) return null;
  const tipy = [
    ...new Set(
      o.zadachi
        .filter((z) => z.itog === 'wrong' || z.itog === 'hinted' || z.itog === 'skipped')
        .flatMap((z) => (z.tipId === undefined ? [] : [z.tipId])),
    ),
  ].filter((t) => /^[\w.-]+$/.test(t));
  return tipy.length === 0
    ? { href: put, s_oshibkami: false }
    : { href: `${put}?t=${encodeURIComponent(tipy.join(','))}`, s_oshibkami: true };
}

function Kartochka({ o }: { o: Otchet }) {
  const v = verno(o);
  const n = o.zadachi.length;
  const procent = n === 0 ? 0 : Math.round((v / n) * 100);
  const temy = itogiPoTemam(o.zadachi);
  const ssylka = ssylkaNaZadachi(o);
  const razdel = o.nomer === null ? o.razdel : `№${o.nomer} · ${o.razdel}`;
  return (
    <article className="rez" aria-labelledby="rez-name">
      <section className="rez__card">
        <div className="rez__head">
          <div>
            <p className="rez__kicker">
              {T.title} · {razdel}
            </p>
            <h1 className="rez__name" id="rez-name">
              {o.imya}
            </h1>
          </div>
          <p className="rez__score" data-testid="rez-score">
            <span className={`rez__percent rez__percent--${svet(v, n)}`}>{procent}%</span>
            <span className="rez__of">
              {T.verno} {v} {T.iz} {n}
            </span>
          </p>
        </div>
        <dl className="rez__meta">
          <div>
            <dt>{T.data}</dt>
            <dd>{data(o.vremya)}</dd>
          </div>
          <div>
            <dt>{T.vremya}</dt>
            <dd>{vremya(o.vremya)}</dd>
          </div>
          <div>
            <dt>{T.dlitelnost}</dt>
            <dd>{dlitelnost(o.sekund)}</dd>
          </div>
          {o.rezhim === undefined ? null : (
            <div>
              <dt>{T.rezhim}</dt>
              <dd>{o.rezhim}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rez__card" aria-labelledby="rez-temy">
        <h2 className="rez__h" id="rez-temy">
          {T.temy}
        </h2>
        <ul className="rez-temy">
          {temy.map((t) => {
            const s = svet(t.verno, t.vsego);
            return (
              <li className="rez-tema" key={t.tema} data-svet={s}>
                <span className="rez-tema__svet" role="img" aria-label={SVET_SLOVO[s]}>
                  {ZNAK[s]}
                </span>
                <span className="rez-tema__name">
                  <Tex text={t.tema} />
                </span>
                <span className="rez-tema__score">
                  {t.verno} {T.iz} {t.vsego}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rez__card" aria-labelledby="rez-zadachi">
        <h2 className="rez__h" id="rez-zadachi">
          {T.zadachi}
        </h2>
        <div className="rez-table-wrap">
          <table className="rez-table">
            <thead>
              <tr>
                <th scope="col">{T.kolonki.no}</th>
                <th scope="col">{T.kolonki.tip}</th>
                <th scope="col">{T.kolonki.istochnik}</th>
                <th scope="col">{T.kolonki.itog}</th>
                <th scope="col">{T.kolonki.otvet}</th>
              </tr>
            </thead>
            <tbody>
              {o.zadachi.map((z, i) => (
                <tr key={i} data-itog={z.itog}>
                  <td className="rez-table__no">{i + 1}</td>
                  <td>
                    <Tex text={z.tip} />
                  </td>
                  <td className="rez-table__ist" data-k={T.kolonki.istochnik}>
                    {z.istochnik ?? '—'}
                  </td>
                  <td>
                    <span className={`rez-itog rez-itog--${z.itog}`}>{T.itogi[z.itog]}</span>
                  </td>
                  <td data-k={z.otvet === undefined ? undefined : T.kolonki.otvet}>
                    {z.otvet ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rez__actions">
        {ssylka === null ? null : (
          <a className="btn btn--primary" href={ssylka.href} title={T.otkrytLead}>
            {ssylka.s_oshibkami ? T.otkryt : T.otkrytVse}
          </a>
        )}
        <Button variant="secondary" onClick={() => window.print()}>
          {T.raspechatat}
        </Button>
      </div>
      <p className="rez__note">{T.nePovereno}</p>
    </article>
  );
}

/**
 * Страница учителя: результат тренировки из ссылки (всё после «#»).
 * Сервер его не видит — разбирается только здесь, в браузере.
 */
export function RezultatUchitelya() {
  const [r, setR] = useState<Raskodirovano | null>(null);
  useEffect(() => {
    const read = () => setR(raskodirovat(window.location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  if (r === null) {
    return (
      <p className="rez__note" role="status" aria-busy="true">
        {T.zagruzka}
      </p>
    );
  }
  if (r.status !== 'ok') {
    const t = r.status === 'pusto' ? T.pusto : T.povrezhdena;
    return (
      <section className="rez__card rez__state" role={r.status === 'pusto' ? undefined : 'alert'}>
        <h1>{t.title}</h1>
        <p>{t.text}</p>
      </section>
    );
  }
  return <Kartochka o={r.otchet} />;
}
