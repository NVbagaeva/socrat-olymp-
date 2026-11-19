'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useId, useState } from 'react';
import { NABORY, otvetProby, PROBA as T, type NaborProby } from '@/content/proba';

type Itog = 'pusto' | 'verno' | 'neverno' | null;

/** «0,6», «0.6», « ,6» → число; всё остальное — null. */
function chislo(stroka: string): number | null {
  const s = stroka.trim().replace(',', '.');
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return null;
  return Number(s);
}

/**
 * Живая задача на главной: решается на месте, без входа. Первый набор
 * чисел — в HTML сборки; «Другие числа» листает наборы по кругу.
 * Тексты и наборы — content/proba.ts, стили — app/landing.css.
 */
export function Proba() {
  const [nomer, setNomer] = useState(0);
  const [vvod, setVvod] = useState('');
  const [itog, setItog] = useState<Itog>(null);
  const [reshenie, setReshenie] = useState(false);
  const poleId = useId();
  const itogId = useId();
  const nabor = NABORY[nomer] as NaborProby;

  const proverit = () => {
    const x = chislo(vvod);
    if (x === null) setItog('pusto');
    else setItog(Math.abs(x - otvetProby(nabor)) < 1e-9 ? 'verno' : 'neverno');
  };
  const drugie = () => {
    setNomer((n) => (n + 1) % NABORY.length);
    setVvod('');
    setItog(null);
    setReshenie(false);
  };

  return (
    <section className="proba" aria-labelledby="proba-z">
      <div className="wrap">
        <div className="proba__karta">
          <div className="proba__tekst">
            <p className="proba__metka">{T.metka}</p>
            <h2 id="proba-z" className="proba__z">
              {T.zagolovok}
            </h2>
            <p className="proba__lid">{T.lid}</p>
          </div>

          <div className="proba__zadacha">
            <p className="proba__istochnik">{T.istochnik}</p>
            <p className="proba__uslovie">{T.uslovie(nabor)}</p>

            <form
              className="proba__forma"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                proverit();
              }}
            >
              <label className="proba__pole" htmlFor={poleId}>
                <span className="proba__pole-p">{T.pole}</span>
                <input
                  id={poleId}
                  className={clsx(
                    'input',
                    itog === 'verno' && 'is-success',
                    (itog === 'neverno' || itog === 'pusto') && 'is-error',
                  )}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={T.podskazkaPolya}
                  value={vvod}
                  aria-describedby={itogId}
                  onChange={(event) => {
                    setVvod(event.target.value);
                    setItog(null);
                  }}
                />
              </label>
              <button type="submit" className="btn btn--primary proba__proverit">
                {T.proverit}
              </button>
            </form>

            <p
              id={itogId}
              className={clsx('proba__itog', itog !== null && `proba__itog--${itog}`)}
              role="status"
            >
              {itog === 'pusto' ? T.pusto : null}
              {itog === 'neverno' ? T.neverno : null}
              {itog === 'verno' ? (
                <>
                  {T.verno}{' '}
                  <Link className="proba__dalshe" href={T.dalshe.href}>
                    {T.dalshe.tekst}
                  </Link>
                </>
              ) : null}
            </p>

            {reshenie ? (
              <ol className="proba__shagi">
                {T.shagi(nabor).map((shag) => (
                  <li key={shag}>{shag}</li>
                ))}
              </ol>
            ) : null}

            <div className="proba__eshche">
              <button type="button" className="proba__ssylka" onClick={drugie}>
                {T.drugie}
              </button>
              {itog === 'neverno' && !reshenie ? (
                <button type="button" className="proba__ssylka" onClick={() => setReshenie(true)}>
                  {T.reshenie}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
