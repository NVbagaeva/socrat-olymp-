'use client';

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
      {USTNYY.itogi.rekordPrezhniy}:{' '}
      <strong>{rez.tip === 'vremya' ? `${r.verno} из ${r.vsego}` : dlitelnost(itogMs(r))}</strong>
    </p>
  );
}

/** Сводка на витрине: тренировки, примеры, точность. */
export function MoyaStatistika() {
  const stat = ustnyyStat.use();
  const T = USTNYY.stat;
  const n = stat.sessii.length;
  const vsego = stat.sessii.reduce((s, x) => s + x.vsego, 0);
  const verno = stat.sessii.reduce((s, x) => s + x.verno, 0);
  return (
    <section className="us-stat" aria-labelledby="us-stat-zag">
      <h2 id="us-stat-zag" className="t-h3">
        {T.zag}
      </h2>
      {n === 0 ? (
        <p className="us-stat__pusto">{T.pusto}</p>
      ) : (
        <dl className="us-stat__plitki">
          <div className="us-plitka">
            <dt>{T.trenirovok}</dt>
            <dd>{n}</dd>
          </div>
          <div className="us-plitka">
            <dt>{T.primerov}</dt>
            <dd>{vsego}</dd>
          </div>
          <div className="us-plitka">
            <dt>{T.tochnost}</dt>
            <dd>{tochnostProc({ verno, vsego })}&nbsp;%</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
