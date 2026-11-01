'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE18 } from '@/content/zadanie18';
import { OPORNYE_18, OPORNYE_18_UI as UI, opornaya18 } from '@/content/zadanie18/opornye';
import { skhema18 } from '@/content/zadanie18/spisok';
import type { Podsvechennoe } from '@/content/zadanie18/tipy';
import { ZADANIYA } from '@/lib/paths';
import { ChertezhOpornoy18 } from './ChertezhOpornoy18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;

type Punkt = 'a' | 'b';

/**
 * Страница опорной задачи. Слева (на телефоне — сверху) чертёж по
 * числам условия, справа — условие, подсказка «какие схемы узнать»,
 * решения пунктов а) и б) по шагам и ответ. Открытый шаг решения
 * подсвечивает на чертеже свои элементы.
 */
export function Opornaya18Stranica({ id }: { id: string }) {
  const z = opornaya18(id);
  const [podskazka, setPodskazka] = useState(false);
  const [otkryto, setOtkryto] = useState<Punkt | null>(null);
  const [shag, setShag] = useState(0);
  const [otvet, setOtvet] = useState(false);
  if (z === undefined) return null;

  const nomer = OPORNYE_18.findIndex((x) => x.id === id);
  const pred = nomer > 0 ? OPORNYE_18[nomer - 1] : undefined;
  const sled = nomer + 1 < OPORNYE_18.length ? OPORNYE_18[nomer + 1] : undefined;

  const shagi: Record<Punkt, readonly Podsvechennoe[]> = { a: z.reshenieA, b: z.reshenieB };
  const lit = otkryto === null ? [] : (shagi[otkryto][shag]?.gruppy ?? []);

  function pereklyuchit(p: Punkt): void {
    setOtkryto(otkryto === p ? null : p);
    setShag(0);
  }

  return (
    <article className="z18-sk z18-op">
      <Link className="z18-nazad" href={`${BASE}/opornye-zadachi/`}>
        <span aria-hidden="true">‹</span> {UI.nazad}
      </Link>

      <header className="z18-sk__head">
        <p className="z18-sk__eyebrow">{UI.zadacha(z.no)}</p>
        <h2 className="t-h2">{z.nazvanie}</h2>
      </header>

      <div className="z18-sk__grid">
        <div className="z18-sk__chertezh">
          <figure className="z18-ch">
            <div className="z18-ch__pole">
              <ChertezhOpornoy18 id={z.id} opisanie={UI.chertezh(z.no)} lit={lit} />
            </div>
          </figure>
        </div>

        <div className="z18-sk__tekst">
          <section className="z18-blok z18-blok--dano" aria-labelledby="z18-op-uslovie">
            <h3 id="z18-op-uslovie" className="z18-blok__title">
              {UI.uslovie}
            </h3>
            <p>
              <Tex text={z.uslovie} />
            </p>
            <ol className="z18-op__punkty">
              <li>
                <span className="z18-gde__punkt">а)</span> <Tex text={z.a} />
              </li>
              <li>
                <span className="z18-gde__punkt">б)</span> <Tex text={z.b} />
              </li>
            </ol>
          </section>

          <section className="z18-blok" aria-labelledby="z18-op-skhemy">
            <h3 id="z18-op-skhemy" className="z18-blok__title">
              {UI.kakieSkhemy}
            </h3>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              aria-expanded={podskazka}
              aria-controls="z18-op-podskazka"
              onClick={() => setPodskazka(!podskazka)}
            >
              {podskazka ? UI.skrytSkhemy : UI.pokazatSkhemy}
            </button>
            {podskazka ? (
              <div id="z18-op-podskazka" className="z18-op__podskazka">
                <p>
                  <Tex text={z.signal} />
                </p>
                <ul className="z18-op__skhemy">
                  {z.skhemy.map((sid) => {
                    const s = skhema18(sid);
                    if (s === undefined) return null;
                    return (
                      <li key={sid}>
                        <Link className="chip" href={`${BASE}/skhemy/${sid}/`}>
                          Схема {s.no}. {s.nazvanie}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>

          <Callout tone="layfhak" label="Сначала сам">
            <p>{UI.sam}</p>
          </Callout>

          {(['a', 'b'] as const).map((p) => (
            <Reshenie
              key={p}
              punkt={p}
              shagi={shagi[p]}
              otkryto={otkryto === p}
              shag={shag}
              onToggle={() => pereklyuchit(p)}
              onShag={setShag}
            />
          ))}

          <section className="z18-blok" aria-labelledby="z18-op-otvet">
            <h3 id="z18-op-otvet" className="z18-blok__title">
              {UI.otvet}
            </h3>
            {otvet ? (
              <p className="z18-op__otvet">
                б) <Tex text={z.otvet} />
              </p>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setOtvet(true)}
              >
                {UI.pokazatOtvet}
              </button>
            )}
          </section>
        </div>
      </div>

      <nav className="z18-sk__nav" aria-label="Другие опорные задачи">
        {pred === undefined ? (
          <span />
        ) : (
          <Link className="z18-sk__nav-link" href={`${BASE}/opornye-zadachi/${pred.id}/`}>
            <span className="z18-sk__nav-metka">‹ {UI.predydushchaya}</span>
            {pred.nazvanie}
          </Link>
        )}
        {sled === undefined ? null : (
          <Link
            className="z18-sk__nav-link z18-sk__nav-link--vpered"
            href={`${BASE}/opornye-zadachi/${sled.id}/`}
          >
            <span className="z18-sk__nav-metka">{UI.sleduyushchaya} ›</span>
            {sled.nazvanie}
          </Link>
        )}
      </nav>
    </article>
  );
}

function Reshenie({
  punkt,
  shagi,
  otkryto,
  shag,
  onToggle,
  onShag,
}: {
  punkt: Punkt;
  shagi: readonly Podsvechennoe[];
  otkryto: boolean;
  shag: number;
  onToggle: () => void;
  onShag: (i: number) => void;
}) {
  const idBloka = `z18-op-reshenie-${punkt}`;
  const vsego = shagi.length;
  return (
    <section className="z18-blok" aria-labelledby={`${idBloka}-title`}>
      <h3 id={`${idBloka}-title`} className="z18-blok__title">
        {punkt === 'a' ? UI.reshenieA : UI.reshenieB}
      </h3>
      <button
        type="button"
        className={clsx(
          'btn btn--sm',
          otkryto ? 'btn--ghost' : 'btn--secondary',
          'z18-dok__toggle',
        )}
        aria-expanded={otkryto}
        aria-controls={idBloka}
        onClick={onToggle}
      >
        {otkryto ? UI.skryt : UI.pokazat}
      </button>
      {otkryto ? (
        <div id={idBloka} className="z18-dok">
          <div className="z18-dok__tochki" aria-hidden="true">
            {shagi.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'z18-dok__tochka',
                  i === shag && 'is-active',
                  i < shag && 'is-done',
                )}
              />
            ))}
          </div>
          <p className="z18-dok__nomer" aria-live="polite">
            {UI.shag(shag + 1, vsego)}
          </p>
          <p key={shag} className="z18-dok__tekst">
            <Tex text={shagi[shag]?.tekst ?? ''} />
          </p>
          <div className="z18-dok__knopki">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={shag === 0}
              onClick={() => onShag(shag - 1)}
            >
              ‹ {UI.nazadShag}
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={shag + 1 >= vsego}
              onClick={() => onShag(shag + 1)}
            >
              {UI.dalee} ›
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
