'use client';

import { useEffect, useMemo, useRef } from 'react';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import { itogMs, prohodit, tochnostProc } from '@/lib/ustnyySchet/ochki';
import { priyom } from '@/lib/ustnyySchet/registry';
import type { Itogi as ItogiT, Rezhim } from '@/lib/ustnyySchet/sessiya';
import type { Rekord } from '@/lib/ustnyySchet/statistika/model';
import { primerSOtvetomHtml, shagHtml, vvodText } from '@/lib/ustnyySchet/vyvod';
import { USTNYY } from '@/content/ustnyySchet';
import { RazborShagi } from './RazborShagi';
import Link from 'next/link';
import type { Final } from '@/lib/ustnyySchet/api';
import { href, USTNYY as USTNYY_HREF, USTNYY_TAIL } from '@/lib/paths';

const T = USTNYY.itogi;
const R = USTNYY.reytingIgra;

export interface ItogiProps {
  it: ItogiT;
  rezhim: Rezhim;
  rekord: boolean;
  prezhniy: Rekord | null;
  onPovtorit: (() => void) | null;
  onEshche: () => void;
  onNastroyki: () => void;
  /** Рейтинговая тренировка: итог сервера (null — не удалось сохранить). */
  reyting?: { final: Final | null };
}

function rekordText(r: Rekord, rezhim: Rezhim): string {
  if (rezhim.tip === 'vremya') return `${r.verno} верно из ${r.vsego}`;
  return dlitelnost(itogMs(r));
}

function ReytingItog({ final }: { final: Final | null }) {
  if (final === null) return <p className="us-itogi__rekord">{R.oshibki.seti}</p>;
  if (!final.valid) {
    return (
      <p className="us-itogi__rekord">{R.nePopal[final.reason ?? ''] ?? R.nePopal.abandoned}</p>
    );
  }
  return (
    <div className="us-itogi__reyting">
      {final.rekord && <p className="us-itogi__rekord is-novyy">{R.rekord}</p>}
      {final.mesto !== null && <p className="us-itogi__mesto">{R.vReytinge(final.mesto)}</p>}
      <Link className="btn btn--secondary btn--sm" href={href(USTNYY_HREF, USTNYY_TAIL.reyting)}>
        {R.kReytingu}
      </Link>
    </div>
  );
}

export function Itogi({
  it,
  rezhim,
  rekord,
  prezhniy,
  onPovtorit,
  onEshche,
  onNastroyki,
  reyting,
}: ItogiProps) {
  const zag = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    zag.current?.focus();
  }, []);

  const oshibki = useMemo(
    () =>
      it.spisokOshibok.map((h) => ({
        h,
        vopros: primerSOtvetomHtml(h.primer),
        shagi: priyom(h.primer.priyom).razbor(h.primer).map(shagHtml),
      })),
    [it],
  );
  const medlennye = useMemo(
    () => it.medlennye.map((h) => ({ h, html: primerSOtvetomHtml(h.primer) })),
    [it],
  );
  const r = { verno: it.verno, vsego: it.vsego, ms: it.ms, at: 0 };

  return (
    <section className="us-itogi" aria-labelledby="us-itogi-zag">
      <h2 id="us-itogi-zag" ref={zag} tabIndex={-1} className="t-h2 us-itogi__zag">
        {T.zag}
      </h2>

      {reyting !== undefined ? (
        <ReytingItog final={reyting.final} />
      ) : rekord ? (
        <p className="us-itogi__rekord is-novyy">{T.rekord}</p>
      ) : prezhniy !== null ? (
        <p className="us-itogi__rekord">
          {T.rekordPrezhniy}: {rekordText(prezhniy, rezhim)}
        </p>
      ) : rezhim.tip !== 'svobodnyy' && !prohodit(r) && it.vsego > 0 ? (
        <p className="us-itogi__rekord">{T.netRekorda}</p>
      ) : null}

      <dl className="us-itogi__plitki">
        <div className="us-plitka">
          <dt>{T.verno}</dt>
          <dd>
            {it.verno}
            <span className="us-plitka__iz"> из {it.vsego}</span>
          </dd>
        </div>
        <div className="us-plitka">
          <dt>{T.oshibki}</dt>
          <dd>{it.oshibki}</dd>
        </div>
        <div className="us-plitka">
          <dt>{T.tochnost}</dt>
          <dd>{tochnostProc(it)}&nbsp;%</dd>
        </div>
        <div className="us-plitka">
          <dt>{T.vremya}</dt>
          <dd>{dlitelnost(it.ms)}</dd>
        </div>
        <div className="us-plitka">
          <dt>{T.srednee}</dt>
          <dd>{dlitelnost(it.srednee)}</dd>
        </div>
        <div className="us-plitka">
          <dt>{T.seriya}</dt>
          <dd>{it.luchshayaSeriya}</dd>
        </div>
        {rezhim.tip === 'seriya' && it.oshibki > 0 && (
          <div className="us-plitka us-plitka--shir">
            <dt>{T.itogMs}</dt>
            <dd>{dlitelnost(itogMs(r))}</dd>
          </div>
        )}
      </dl>

      <div className="us-itogi__knopki">
        {onPovtorit !== null && (
          <button type="button" className="btn btn--primary" onClick={onPovtorit}>
            {T.povtoritOshibki}
          </button>
        )}
        <button
          type="button"
          className={onPovtorit === null ? 'btn btn--primary' : 'btn btn--secondary'}
          onClick={onEshche}
        >
          {T.eshche}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onNastroyki}>
          {T.nastroyki}
        </button>
      </div>

      {medlennye.length > 0 && (
        <div className="us-itogi__blok">
          <h3 className="t-h4">{T.medlennye}</h3>
          <ul className="us-itogi__spisok">
            {medlennye.map(({ h, html }, i) => (
              <li key={i}>
                <span dangerouslySetInnerHTML={{ __html: html }} />
                <span className="us-itogi__ms">{dlitelnost(h.ms)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="us-itogi__blok">
        <h3 className="t-h4">{T.oshibkiZag}</h3>
        {oshibki.length === 0 ? (
          <p className="us-itogi__bez">{T.bezOshibok}</p>
        ) : (
          <ul className="us-itogi__oshibki">
            {oshibki.map(({ h, vopros, shagi }, i) => (
              <li key={i} className="us-oshibka">
                <p className="us-oshibka__vopros" dangerouslySetInnerHTML={{ __html: vopros }} />
                <p className="us-oshibka__tvoy">
                  {T.tvoyOtvet}: <s>{vvodText(h)}</s>
                </p>
                <RazborShagi shagi={shagi} vse />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
