'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Callout, Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { SKHEMA_18, ZADANIE18 } from '@/content/zadanie18';
import { SOBRANNYE, skhema18 } from '@/content/zadanie18/spisok';
import { GRUPPY_18 } from '@/content/zadanie18/tipy';
import { ZADANIYA } from '@/lib/paths';
import { ZhivoyChertezh18 } from './ZhivoyChertezh18';
import { ZnayuNeZnayu18 } from './ZnayuNeZnayu18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;

/**
 * Страница ключевой схемы. Слева (на телефоне — сверху) живой
 * чертёж, справа — текст по шаблону: суть, «Дано», следствия,
 * доказательство по шагам, как узнать, где пригождается, запоминалка
 * и «Знаю / Не знаю».
 *
 * Подсветка чертежа: наведённое (или нажатое) следствие, а пока
 * открыто доказательство — его текущий шаг. Наведение важнее шага:
 * можно свериться со следствием, не теряя место в доказательстве.
 */
export function Skhema18Stranica({ id }: { id: string }) {
  const s = skhema18(id);
  const [navedeno, setNavedeno] = useState<number | null>(null);
  const [vybrano, setVybrano] = useState<number | null>(null);
  const [dokOtkryto, setDokOtkryto] = useState(false);
  const [shag, setShag] = useState(0);
  if (s === undefined) return null;

  const nomer = SOBRANNYE.findIndex((x) => x.id === id);
  const pred = nomer > 0 ? SOBRANNYE[nomer - 1] : undefined;
  const sled = nomer + 1 < SOBRANNYE.length ? SOBRANNYE[nomer + 1] : undefined;
  const gruppa = GRUPPY_18.find((g) => g.id === s.gruppa)?.title ?? '';

  const aktivnoeSledstvie = navedeno ?? (dokOtkryto ? null : vybrano);
  const lit =
    aktivnoeSledstvie !== null
      ? (s.sledstviya[aktivnoeSledstvie]?.gruppy ?? [])
      : dokOtkryto
        ? (s.dokazatelstvo[shag]?.gruppy ?? [])
        : [];

  const vsegoShagov = s.dokazatelstvo.length;

  return (
    <article className="z18-sk">
      <Link className="z18-nazad" href={`${BASE}/`}>
        <span aria-hidden="true">‹</span> {SKHEMA_18.nazad}
      </Link>

      <header className="z18-sk__head">
        <p className="z18-sk__eyebrow">
          Схема {s.no} · {gruppa}
        </p>
        <h2 className="t-h2">{s.nazvanie}</h2>
        <p className="z18-sk__sut">
          <Tex text={s.sut} />
        </p>
      </header>

      <div className="z18-sk__grid">
        <div className="z18-sk__chertezh">
          <ZhivoyChertezh18 id={s.id} nazvanie={s.nazvanie} lit={lit} />
        </div>

        <div className="z18-sk__tekst">
          <section className="z18-blok z18-blok--dano" aria-labelledby="z18-dano">
            <h3 id="z18-dano" className="z18-blok__title">
              {SKHEMA_18.dano}
            </h3>
            <p>
              <Tex text={s.dano} />
            </p>
          </section>

          <section className="z18-blok" aria-labelledby="z18-sled">
            <h3 id="z18-sled" className="z18-blok__title">
              {SKHEMA_18.sledstviya}
            </h3>
            <p className="z18-blok__podskazka">{SKHEMA_18.sledstviyaPodskazka}</p>
            <ol className="z18-sled">
              {s.sledstviya.map((f, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={clsx('z18-sled__fakt', aktivnoeSledstvie === i && 'is-active')}
                    aria-pressed={vybrano === i}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') setNavedeno(i);
                    }}
                    onPointerLeave={() => setNavedeno(null)}
                    onFocus={() => setNavedeno(i)}
                    onBlur={() => setNavedeno(null)}
                    onClick={() => {
                      setVybrano(vybrano === i ? null : i);
                      setDokOtkryto(false);
                    }}
                  >
                    <span className="z18-sled__no">{i + 1}</span>
                    <Tex className="z18-sled__tekst" text={f.tekst} />
                  </button>
                  {f.podrobno === undefined ? null : (
                    <Details className="z18-podrobno" title={f.podrobno.title}>
                      {f.podrobno.abzacy.map((a, k) => (
                        <p key={k}>
                          <Tex text={a} />
                        </p>
                      ))}
                    </Details>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="z18-blok" aria-labelledby="z18-dok">
            <h3 id="z18-dok" className="z18-blok__title">
              {SKHEMA_18.dokazatelstvo}
            </h3>
            <Callout tone="layfhak" label="Сначала сам">
              <p>{SKHEMA_18.dokazhiSam}</p>
            </Callout>
            <button
              type="button"
              className={clsx(
                'btn btn--sm',
                dokOtkryto ? 'btn--ghost' : 'btn--secondary',
                'z18-dok__toggle',
              )}
              aria-expanded={dokOtkryto}
              aria-controls="z18-dok-shagi"
              onClick={() => {
                setDokOtkryto(!dokOtkryto);
                setVybrano(null);
              }}
            >
              {dokOtkryto ? SKHEMA_18.skryt : SKHEMA_18.pokazat}
            </button>
            {dokOtkryto ? (
              <div id="z18-dok-shagi" className="z18-dok">
                <div className="z18-dok__tochki" aria-hidden="true">
                  {s.dokazatelstvo.map((_, i) => (
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
                  {SKHEMA_18.shag(shag + 1, vsegoShagov)}
                </p>
                <p key={shag} className="z18-dok__tekst">
                  <Tex text={s.dokazatelstvo[shag]?.tekst ?? ''} />
                </p>
                <div className="z18-dok__knopki">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    disabled={shag === 0}
                    onClick={() => setShag(shag - 1)}
                  >
                    ‹ {SKHEMA_18.nazadShag}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={shag + 1 >= vsegoShagov}
                    onClick={() => setShag(shag + 1)}
                  >
                    {SKHEMA_18.dalee} ›
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className="z18-sk__dalshe">
        <section className="z18-blok" aria-labelledby="z18-uznat">
          <h3 id="z18-uznat" className="z18-blok__title">
            {SKHEMA_18.kakUznat}
          </h3>
          <ul className="z18-spisok">
            {s.kakUznat.map((x, i) => (
              <li key={i}>
                <Tex text={x} />
              </li>
            ))}
          </ul>
        </section>

        <section className="z18-blok" aria-labelledby="z18-gde">
          <h3 id="z18-gde" className="z18-blok__title">
            {SKHEMA_18.gde}
          </h3>
          <ul className="z18-gde">
            {s.gde.map((x, i) => (
              <li key={i}>
                <span className="z18-gde__punkt">{x.punkt})</span>
                <Tex text={x.tekst} />
              </li>
            ))}
          </ul>
        </section>

        {s.zapominalka === null ? null : (
          <Callout tone="zapomni" label={SKHEMA_18.zapominalka}>
            <p>
              <Tex text={s.zapominalka} />
            </p>
          </Callout>
        )}

        <ZnayuNeZnayu18 id={s.id} />
      </div>

      <nav className="z18-sk__nav" aria-label="Другие схемы">
        {pred === undefined ? (
          <span />
        ) : (
          <Link className="z18-sk__nav-link" href={`${BASE}/skhemy/${pred.id}/`}>
            <span className="z18-sk__nav-metka">‹ {SKHEMA_18.predydushchaya}</span>
            {pred.nazvanie}
          </Link>
        )}
        {sled === undefined ? null : (
          <Link
            className="z18-sk__nav-link z18-sk__nav-link--vpered"
            href={`${BASE}/skhemy/${sled.id}/`}
          >
            <span className="z18-sk__nav-metka">{SKHEMA_18.sleduyushchaya} ›</span>
            {sled.nazvanie}
          </Link>
        )}
      </nav>
    </article>
  );
}
