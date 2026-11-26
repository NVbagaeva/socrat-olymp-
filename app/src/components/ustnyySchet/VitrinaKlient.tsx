'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import { itogMs, tochnostProc } from '@/lib/ustnyySchet/ochki';
import { rekordKey, svodkaPriyoma, type Stat } from '@/lib/ustnyySchet/statistika/model';
import { ustnyyStat } from '@/lib/ustnyySchet/statistika/store';
import { rezhimFormata } from '@/lib/ustnyySchet/zapros';
import type { FormatId } from '@/lib/ustnyySchet/formaty';
import type { PriyomId } from '@/lib/ustnyySchet/types';
import { USTNYY } from '@/content/ustnyySchet';

/* Статистика из браузера: при сборке и гидратации хранилище отдаёт
   пустое значение (разметка одна для всех), затем — своё. */
function useStat(): Stat | null {
  const stat = ustnyyStat.use();
  return stat.sessii.length === 0 && Object.keys(stat.tablica).length === 0 ? null : stat;
}

/** Строка на карточке приёма: сколько решено и с какой точностью. */
export function SvodkaPriyoma({ id }: { id: PriyomId }) {
  const stat = useStat();
  if (stat === null) return null;
  const s = svodkaPriyoma(stat, id);
  if (s.n === 0) return null;
  return (
    <p className="us-karta__svodka">
      {s.n}&nbsp;примеров · {tochnostProc({ verno: s.ok, vsego: s.n })}&nbsp;% верно
    </p>
  );
}

/** Личный рекорд формата. */
export function RekordFormata({ id }: { id: FormatId }) {
  const stat = useStat();
  if (stat === null) return null;
  const rez = rezhimFormata(id);
  const key = rekordKey(`f:${id}`, rez);
  const r = key === null ? undefined : stat.rekordy[key];
  if (r === undefined) return null;
  return (
    <p className="us-format__rekord">
      <span className="us-medal" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path className="us-medal__lenta" d="M7 2h4l2 6H9zM13 2h4l-2 6h-4z" />
          <circle className="us-medal__krug" cx="12" cy="15" r="6.5" />
          <path
            className="us-medal__zvezda"
            d="m12 11.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"
          />
        </svg>
      </span>
      {USTNYY.itogi.rekordPrezhniy}:{' '}
      <strong>{rez.tip === 'vremya' ? `${r.verno} из ${r.vsego}` : dlitelnost(itogMs(r))}</strong>
    </p>
  );
}

/** Освоен ли приём: решено не меньше 10 примеров и верно от 80 %. */
export function osvoen(stat: Stat, id: PriyomId): boolean {
  const s = svodkaPriyoma(stat, id);
  return s.n >= 10 && s.ok / s.n >= 0.8;
}

/** Строка у заголовка группы: «освоено N из M» — если в статистике что-то есть. */
export function OsvoenoGruppy({ ids }: { ids: readonly PriyomId[] }) {
  const stat = useStat();
  if (stat === null) return null;
  const n = ids.filter((id) => osvoen(stat, id)).length;
  return <p className="us-gruppa__osvoeno">{USTNYY.vitrina.osvoeno(n, ids.length)}</p>;
}

/** Мини-кольцо прогресса на карточке приёма: точность по сводке приёма. */
export function KoltsoPriyoma({ id }: { id: PriyomId }) {
  const stat = useStat();
  if (stat === null) return null;
  const s = svodkaPriyoma(stat, id);
  if (s.n === 0) return null;
  const p = tochnostProc({ verno: s.ok, vsego: s.n });
  return (
    <span className="us-mini-koltso" title={USTNYY.vitrina.progress(s.n, p)}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="us-mini-koltso__lozhe" cx="18" cy="18" r="15" pathLength={100} />
        <circle
          className="us-mini-koltso__hod"
          cx="18"
          cy="18"
          r="15"
          pathLength={100}
          strokeDasharray={`${p} 100`}
        />
      </svg>
      <span className="sr-only">{USTNYY.vitrina.progress(s.n, p)}</span>
      <span className="us-mini-koltso__n" aria-hidden="true">
        {s.n}
      </span>
    </span>
  );
}

/** Число досчитывается от нуля, когда блок появился на экране (при reduce — сразу). */
function useDoschet(cel: number, vidno: boolean): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!vidno) return undefined;
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.getAttribute('data-motion-level') === 'reduce';
    let raf = 0;
    if (reduce) {
      raf = requestAnimationFrame(() => setV(cel));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now();
    const shag = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(Math.round(cel * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(shag);
    };
    raf = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(raf);
  }, [cel, vidno]);
  return v;
}

/** Сводка на витрине: тренировки, примеры, точность кольцом; пусто — плашка с кнопкой. */
export function MoyaStatistika({ startHref }: { startHref: string }) {
  const stat = ustnyyStat.use();
  const T = USTNYY.stat;
  const n = stat.sessii.length;
  const vsego = stat.sessii.reduce((s, x) => s + x.vsego, 0);
  const verno = stat.sessii.reduce((s, x) => s + x.verno, 0);
  const tochnost = tochnostProc({ verno, vsego });
  const ref = useRef<HTMLElement>(null);
  const [vidno, setVidno] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      const raf = requestAnimationFrame(() => setVidno(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setVidno(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [n]);
  const dn = useDoschet(n, vidno);
  const dv = useDoschet(vsego, vidno);
  const dt = useDoschet(tochnost, vidno);
  return (
    <section ref={ref} className="us-stat" aria-labelledby="us-stat-zag">
      <h2 id="us-stat-zag" className="t-h3">
        {T.zag}
      </h2>
      {n === 0 ? (
        <div className="us-stat__plashka">
          <p className="us-stat__plashka-tekst">{T.pustoPlashka}</p>
          <Link className="btn btn--primary" href={startHref}>
            {T.pustoKnopka}
          </Link>
        </div>
      ) : (
        <dl className="us-stat__plitki">
          <div className="us-plitka">
            <dt>{T.trenirovok}</dt>
            <dd data-chislo={n}>{dn}</dd>
          </div>
          <div className="us-plitka">
            <dt>{T.primerov}</dt>
            <dd data-chislo={vsego}>{dv}</dd>
          </div>
          <div className="us-plitka us-plitka--koltso">
            <dt>{T.tochnost}</dt>
            <dd data-chislo={tochnost}>
              <svg className="us-stat__koltso" viewBox="0 0 48 48" aria-hidden="true">
                <circle className="us-stat__koltso-lozhe" cx="24" cy="24" r="20" pathLength={100} />
                <circle
                  className="us-stat__koltso-hod"
                  cx="24"
                  cy="24"
                  r="20"
                  pathLength={100}
                  strokeDasharray={`${dt} 100`}
                />
              </svg>
              <span>{dt}&nbsp;%</span>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
