'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { SHAPKA1 } from '@/content/planimetriya1';
import { dataUrl } from '@/lib/dataUrl';
import type { Primer1 as Dannye } from '@/lib/planimetriya/trening/primer';
import { RAZDEL1 } from '@/lib/planimetriya/trening/links';

/**
 * Разобранный пример типа на вкладке «О задании» №1 — с закреплённым
 * чертежом, как у №3. Чертёж стоит рядом с шагами решения: нажатие на
 * шаг показывает на чертеже его построение (слой подсказки), последний
 * шаг — все построения. На широком экране чертёж слева, шаги справа; на
 * телефоне он закреплён сверху и не выше трети экрана, шаги
 * прокручиваются под ним, кнопка сворачивает чертёж.
 */
export function Primer1View({
  primer,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  primer: Dannye;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const [shag, setShag] = useState(0);
  const [svernut, setSvernut] = useState(false);
  /* Чертёж выбранного шага; у шага без своего построения — ближайший
     предыдущий, до первого — чертёж условия. */
  let svg = primer.usloviyeSvg;
  for (let i = 0; i < shag; i += 1) {
    svg = primer.shagi[i]?.svg ?? svg;
  }
  const posledniy = shag === primer.shagi.length && shag > 0;
  return (
    <div className="kz-primer z1-primer">
      <p className="kz-primer__metka">
        {SHAPKA1.primer}
        <span className="z1-primer__istochnik">
          {' · '}
          {primer.fipi === null ? SHAPKA1.neIzBanka : SHAPKA1.zadachaBanka(primer.fipi)}
        </span>
      </p>
      <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: primer.uslovieHtml }} />
      <div className="z1-primer__telo">
        <div className={clsx('z1-primer__chertezh', svernut && 'is-svernut')}>
          <div
            className="z1-primer__holst pl-wrap"
            hidden={svernut}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="z1-primer__panel">
            <p className="z1-primer__gde" aria-live="polite">
              {shag === 0
                ? SHAPKA1.chertezhUsloviya
                : posledniy
                  ? SHAPKA1.vsePostroeniya
                  : SHAPKA1.naChertezhe(shag)}
            </p>
            <button
              type="button"
              className="stk-ssylka z1-primer__svernut"
              aria-expanded={!svernut}
              onClick={() => setSvernut(!svernut)}
            >
              {svernut ? SHAPKA1.razvernut : SHAPKA1.svernut}
            </button>
          </div>
        </div>
        <div className="z1-primer__reshenie">
          <ol className="z1-primer__shagi">
            {primer.shagi.map((s, i) => (
              <li key={i} className={clsx('z1-shag', shag === i + 1 && 'is-on')}>
                <button
                  type="button"
                  className="z1-shag__knopka"
                  aria-pressed={shag === i + 1}
                  title={SHAPKA1.shagKnopka}
                  onClick={() => setShag(shag === i + 1 ? 0 : i + 1)}
                >
                  <span className="z1-shag__no">{i + 1}</span>
                  <span
                    className="z1-shag__zag"
                    dangerouslySetInnerHTML={{ __html: s.zagolovokHtml }}
                  />
                </button>
                <div className="stk-shag__chto" dangerouslySetInnerHTML={{ __html: s.chtoHtml }} />
                {s.formulaHtml === '' ? null : (
                  <div
                    className="stk-shag__formula"
                    dangerouslySetInnerHTML={{ __html: s.formulaHtml }}
                  />
                )}
              </li>
            ))}
          </ol>
          {primer.sokrashchenie.length === 0 ? null : (
            <details className="trn-posle z1-primer__sokr">
              <summary className="stk-summary">
                {SHAPKA1.priznaki}
                <span className="stk-shevron" aria-hidden="true" />
              </summary>
              <ul>
                {primer.sokrashchenie.map((k, i) => (
                  <li key={i}>
                    <span dangerouslySetInnerHTML={{ __html: k.tekst }} />
                    {k.formula === '' ? null : (
                      <span
                        className="trn-posle__tex"
                        dangerouslySetInnerHTML={{ __html: k.formula }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="z1-primer__sverka">
            <b>{SHAPKA1.sverka}.</b>{' '}
            <span dangerouslySetInnerHTML={{ __html: primer.sverkaHtml }} />
          </p>
        </div>
      </div>
      {opasnoHtml === '' ? null : (
        <p className="kz-lovushka">
          <b>{SHAPKA1.lovushka}.</b> <span dangerouslySetInnerHTML={{ __html: opasnoHtml }} />
        </p>
      )}
      <p className="kz-otvet">
        {SHAPKA1.otvet}: <b dangerouslySetInnerHTML={{ __html: primer.otvetHtml }} />
      </p>
      <div className="kz-knopki">
        {/* Обычные ссылки: тренажёр читает тип из адреса при входе. */}
        <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
          {SHAPKA1.trenirovat}
        </a>
        <a className="stk-btn stk-btn--tihaya" href={opornyeHref}>
          {SHAPKA1.opornye}
        </a>
      </div>
    </div>
  );
}

const KESH = new Map<string, Promise<Dannye>>();

function zagruzit(tip: string): Promise<Dannye> {
  let zhdyot = KESH.get(tip);
  if (zhdyot === undefined) {
    zhdyot = fetch(dataUrl(`${RAZDEL1}dannye/primer/${tip}.json`)).then((r) => {
      if (!r.ok) throw new Error(`${tip}.json: ${r.status}`);
      return r.json() as Promise<Dannye>;
    });
    KESH.set(tip, zhdyot);
    zhdyot.catch(() => {
      KESH.delete(tip);
    });
  }
  return zhdyot;
}

/**
 * Пример типа, который приезжает файлом, когда ученик раскрыл карточку
 * (<details>). До этого в разметке только заглушка: страница не несёт
 * все 75 примеров с чертежами шагов сразу.
 */
export function Primer1Lazy({
  tip,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  tip: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Dannye | null | 'net'>(null);

  useEffect(() => {
    const details = anchor.current?.closest('details');
    if (details === null || details === undefined) {
      return undefined;
    }
    let alive = true;
    let started = false;
    const load = () => {
      if (started || !details.open) {
        return;
      }
      started = true;
      zagruzit(tip)
        .then((dannye) => {
          if (alive) setPrimer(dannye);
        })
        .catch(() => {
          if (alive) setPrimer('net');
        });
    };
    load();
    details.addEventListener('toggle', load);
    return () => {
      alive = false;
      details.removeEventListener('toggle', load);
    };
  }, [tip]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA1.primerZhdyot : SHAPKA1.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <Primer1View
        primer={primer}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
      />
    </div>
  );
}
