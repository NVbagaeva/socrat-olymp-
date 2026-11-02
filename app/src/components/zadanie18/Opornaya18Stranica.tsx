'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE18 } from '@/content/zadanie18';
import { OPORNYE_18, OPORNYE_18_UI, opornaya18 } from '@/content/zadanie18/opornye';
import { skhema18 } from '@/content/zadanie18/spisok';
import { GRUPPY_18, type Podsvechennoe } from '@/content/zadanie18/tipy';
import { ZADANIYA } from '@/lib/paths';
import { trebuetsyaScenaOpornoy18 } from '@/lib/zadanie18/opornye';
import { ZhivoyChertezh18 } from './ZhivoyChertezh18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;
const UI = OPORNYE_18_UI;

type Chast = 'a' | 'b';

/**
 * Страница опорной задачи №18. Слева (на телефоне — сверху, липко)
 * живой чертёж по данным пункта б); справа — условие, ключевые схемы
 * задачи и решения пунктов а) и б), которые открываются по шагу.
 * Открытый шаг подсвечивает на чертеже свои элементы; нажатие на
 * открытый раньше шаг возвращает его подсветку. Ответ — после
 * последнего шага б) или по отдельной кнопке.
 */
export function Opornaya18Stranica({ id }: { id: string }) {
  const o = opornaya18(id);
  const [pokazano, setPokazano] = useState<Record<Chast, number>>({ a: 0, b: 0 });
  const [aktivnyy, setAktivnyy] = useState<{ chast: Chast; i: number } | null>(null);
  const [otvetOtkryt, setOtvetOtkryt] = useState(false);
  if (o === undefined) return null;

  const skhema = trebuetsyaScenaOpornoy18(o.id);
  const shagi: Record<Chast, readonly Podsvechennoe[]> = { a: o.reshenieA, b: o.reshenieB };
  const lit = aktivnyy === null ? [] : (shagi[aktivnyy.chast][aktivnyy.i]?.gruppy ?? []);
  const vidnoOtvet = otvetOtkryt || pokazano.b >= o.reshenieB.length;

  const nomer = OPORNYE_18.findIndex((x) => x.id === id);
  const pred = nomer > 0 ? OPORNYE_18[nomer - 1] : undefined;
  const sled = nomer + 1 < OPORNYE_18.length ? OPORNYE_18[nomer + 1] : undefined;
  const gruppa = GRUPPY_18.find((g) => g.id === o.gruppa)?.title ?? '';
  const bazovaya = o.variaciya === undefined ? undefined : opornaya18(o.variaciya);

  function otkryt(chast: Chast, n: number): void {
    const vsego = shagi[chast].length;
    const k = Math.max(0, Math.min(vsego, n));
    setPokazano({ ...pokazano, [chast]: k });
    setAktivnyy(k === 0 ? (aktivnyy?.chast === chast ? null : aktivnyy) : { chast, i: k - 1 });
  }

  return (
    <article className="z18-sk z18-op">
      <Link className="z18-nazad" href={`${BASE}/opornye-zadachi/`}>
        <span aria-hidden="true">‹</span> {UI.nazad}
      </Link>

      <header className="z18-sk__head">
        <p className="z18-sk__eyebrow">
          {UI.zadacha(o.no)} · {gruppa} · {o.istochnik === 'kurs' ? UI.izKursa : UI.sostavleno}
        </p>
        <h2 className="t-h2">{o.nazvanie}</h2>
        {bazovaya === undefined ? null : (
          <p className="z18-op-variaciya">
            <Link href={`${BASE}/opornye-zadachi/${bazovaya.id}/`}>
              {UI.variaciya(bazovaya.no)}: {bazovaya.nazvanie}
            </Link>
          </p>
        )}
      </header>

      <div className="z18-sk__grid">
        <div className="z18-sk__chertezh">
          <ZhivoyChertezh18
            id={o.id}
            nazvanie={o.nazvanie}
            lit={lit}
            skhema={skhema}
            podskazka={skhema.podvizhnye.length > 0 ? UI.podskazkaTyani : UI.podskazkaChertezha}
          />
        </div>

        <div className="z18-sk__tekst">
          <section className="z18-blok z18-blok--dano" aria-labelledby="z18-op-uslovie">
            <h3 id="z18-op-uslovie" className="z18-blok__title">
              {UI.uslovie}
            </h3>
            <p>
              <Tex text={o.uslovie} />
            </p>
            <ol className="z18-op-punkty">
              <li>
                <span className="z18-op-punkty__bukva">а)</span> <Tex text={o.a} />
              </li>
              <li>
                <span className="z18-op-punkty__bukva">б)</span> <Tex text={o.b} />
              </li>
            </ol>
          </section>

          <section className="z18-blok" aria-labelledby="z18-op-skhemy">
            <h3 id="z18-op-skhemy" className="z18-blok__title">
              {UI.skhemy}
            </h3>
            <p className="z18-blok__podskazka">{UI.skhemyPodskazka}</p>
            <ul className="z18-op-skhemy">
              {o.skhemy.map((s) => {
                const sk = skhema18(s.id);
                if (sk === undefined) return null;
                return (
                  <li key={s.id}>
                    <Link className="z18-op-skhemy__ssylka" href={`${BASE}/skhemy/${s.id}/`}>
                      <span className="z18-op-skhemy__no">{sk.no}</span>
                      {sk.nazvanie}
                    </Link>
                    <span className="z18-op-skhemy__zachem">
                      <Tex text={s.zachem} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {o.podskazki === undefined || o.podskazki.length === 0 ? null : (
            <section className="z18-blok" aria-labelledby="z18-op-podskazki">
              <h3 id="z18-op-podskazki" className="z18-blok__title">
                {UI.podskazki}
              </h3>
              <p className="z18-blok__podskazka">{UI.podskazkiPodskazka}</p>
              <ol className="z18-op-podskazki">
                {o.podskazki.map((p, i) => (
                  <li key={i}>
                    <details className="z18-op-podskazka">
                      <summary>
                        <Tex text={p.vopros} />
                      </summary>
                      <p>
                        <span className="z18-op-podskazka__metka">{UI.podskazkaOtvet}: </span>
                        <Tex text={p.otvet} />
                      </p>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <Callout tone="layfhak" label="Сначала сам">
            <p>{UI.snachalaSam}</p>
          </Callout>

          {(['a', 'b'] as const).map((chast) => (
            <Reshenie
              key={chast}
              chast={chast}
              title={chast === 'a' ? UI.reshenieA : UI.reshenieB}
              shagi={shagi[chast]}
              pokazano={pokazano[chast]}
              aktivnyy={aktivnyy?.chast === chast ? aktivnyy.i : null}
              onPokazat={(n) => otkryt(chast, n)}
              onVybrat={(i) =>
                setAktivnyy(aktivnyy?.chast === chast && aktivnyy.i === i ? null : { chast, i })
              }
            />
          ))}

          <section className="z18-blok" aria-labelledby="z18-op-otvet">
            <h3 id="z18-op-otvet" className="z18-blok__title">
              {UI.otvet}
            </h3>
            {vidnoOtvet ? (
              <p className="z18-op-otvet" aria-live="polite">
                <span className="z18-op-punkty__bukva">б)</span> <Tex text={o.otvet} />
              </p>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--sm z18-op-otvet__knopka"
                onClick={() => setOtvetOtkryt(true)}
              >
                {UI.pokazatOtvet}
              </button>
            )}
          </section>

          {o.oshibki === undefined || o.oshibki.length === 0 ? null : (
            <section className="z18-blok" aria-labelledby="z18-op-oshibki">
              <h3 id="z18-op-oshibki" className="z18-blok__title">
                {UI.oshibki}
              </h3>
              <ul className="z18-op-oshibki">
                {o.oshibki.map((t, i) => (
                  <li key={i}>
                    <Tex text={t} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {o.vazhno === undefined ? null : (
            <Callout primer={<Tex text={o.vazhno.primer} />}>
              <p>
                <Tex text={o.vazhno.tekst} />
              </p>
            </Callout>
          )}
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

interface ReshenieProps {
  chast: Chast;
  title: string;
  shagi: readonly Podsvechennoe[];
  pokazano: number;
  aktivnyy: number | null;
  onPokazat: (n: number) => void;
  onVybrat: (i: number) => void;
}

/** Решение пункта по шагам: открытые шаги списком, текущий подсвечен. */
function Reshenie({ chast, title, shagi, pokazano, aktivnyy, onPokazat, onVybrat }: ReshenieProps) {
  const idZag = `z18-op-resh-${chast}`;
  const idShagov = `z18-op-shagi-${chast}`;
  const vsego = shagi.length;
  return (
    <section className="z18-blok" aria-labelledby={idZag}>
      <h3 id={idZag} className="z18-blok__title">
        {title}
      </h3>
      {pokazano > 0 ? (
        <>
          <p className="z18-blok__podskazka" aria-live="polite">
            {UI.shag(pokazano, vsego)}. {UI.shagPodskazka}
          </p>
          <ol id={idShagov} className="z18-sled z18-op-shagi">
            {shagi.slice(0, pokazano).map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={clsx('z18-sled__fakt', aktivnyy === i && 'is-active')}
                  aria-pressed={aktivnyy === i}
                  onClick={() => onVybrat(i)}
                >
                  <span className="z18-sled__no">{i + 1}</span>
                  <Tex className="z18-sled__tekst" text={s.tekst} />
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      <div className="z18-op-knopki">
        {pokazano < vsego ? (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            aria-controls={pokazano > 0 ? idShagov : undefined}
            onClick={() => onPokazat(pokazano + 1)}
          >
            {pokazano === 0 ? UI.pokazatShag : UI.sleduyushchiy} ›
          </button>
        ) : null}
        {pokazano < vsego ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPokazat(vsego)}>
            {UI.vse}
          </button>
        ) : null}
        {pokazano > 0 ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPokazat(0)}>
            {UI.skryt}
          </button>
        ) : null}
      </div>
    </section>
  );
}
