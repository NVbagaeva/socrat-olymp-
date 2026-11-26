'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { displayAnswer } from '@/lib/otvet';
import { randomSeed } from '@/lib/randomSeed';
import { PRIYOMY } from '@/lib/ustnyySchet/registry';
import { createRng } from '@/lib/ustnyySchet/rng';
import { sverit } from '@/lib/ustnyySchet/sessiya';
import type { Primer } from '@/lib/ustnyySchet/types';
import { shagHtml, voprosHtml } from '@/lib/ustnyySchet/vyvod';
import { priyom } from '@/lib/ustnyySchet/registry';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.vitrina.vyzov;
const LIMIT_MS = 10_000;

/* Пример с одним ответом: уравнения с двумя корнями сюда не берём. */
const ISTOCHNIKI = PRIYOMY.filter((p) => p.gruppa !== 'uravneniya');

function noviyPrimer(): Primer {
  const rng = createRng(randomSeed());
  for (let i = 0; i < 50; i += 1) {
    const p = rng.pick(ISTOCHNIKI).sozdat(rng, {
      uroven: 1,
      desyatichnye: true,
      otricatelnye: true,
    });
    if (p !== null) return p;
  }
  return priyom('tablica').iz(['7', '8'], 1);
}

type Faza = 'vvod' | 'verno' | 'neverno' | 'vremya';

/** Сцена шапки: ободок секундомера и всплеск знаков. */
function scena(): HTMLElement | null {
  return document.getElementById('us-scena');
}

/**
 * «Реши за 10 секунд»: один случайный пример уровня 1 из движка, поле
 * ответа и оранжевый ободок секундомера, который заполняется за 10 с.
 * Верно — всплеск знаков и «+1» к серии этого захода; неверно или
 * время вышло — правильный ответ и одна строка разбора. В общую
 * статистику не пишется.
 */
export function Vyzov10() {
  const [primer, setPrimer] = useState<Primer>(noviyPrimer);
  const [vvod, setVvod] = useState('');
  const [faza, setFaza] = useState<Faza>('vvod');
  const [seriya, setSeriya] = useState(0);
  const [format, setFormat] = useState(false);
  const [ostalos, setOstalos] = useState(10);
  const input = useRef<HTMLInputElement>(null);
  const eshche = useRef<HTMLButtonElement>(null);
  const start = useRef(0);

  /* Новый пример: таймер и ободок с нуля. */
  useEffect(() => {
    if (faza !== 'vvod') return undefined;
    start.current = performance.now();
    const s = scena();
    if (s !== null) {
      s.removeAttribute('data-vyzov');
      void s.offsetWidth;
      s.setAttribute('data-vyzov', 'idet');
    }
    input.current?.focus({ preventScroll: true });
    const tik = window.setInterval(() => {
      const ms = performance.now() - start.current;
      setOstalos(Math.max(0, Math.ceil((LIMIT_MS - ms) / 1000)));
    }, 250);
    const konec = window.setTimeout(() => setFaza('vremya'), LIMIT_MS);
    return () => {
      window.clearInterval(tik);
      window.clearTimeout(konec);
    };
  }, [primer, faza]);

  /* Конец примера: ободок замирает, где был. */
  useEffect(() => {
    if (faza === 'vvod') return;
    const s = scena();
    if (s !== null) {
      const dolya = Math.min(1, (performance.now() - start.current) / LIMIT_MS);
      s.style.setProperty('--us-obodok-ostatok', String(Math.round(100 * (1 - dolya))));
      s.setAttribute('data-vyzov', 'konec');
      if (faza === 'verno') {
        s.classList.remove('is-vsplesk');
        void s.offsetWidth;
        s.classList.add('is-vsplesk');
        window.setTimeout(() => s.classList.remove('is-vsplesk'), 800);
      }
    }
    eshche.current?.focus({ preventScroll: true });
  }, [faza]);

  /* Ушёл со страницы — ободок на сцене не остаётся. */
  useEffect(
    () => () => {
      scena()?.removeAttribute('data-vyzov');
    },
    [],
  );

  const otvetit = useCallback(() => {
    if (faza !== 'vvod') return;
    const r = sverit(primer, vvod);
    if (r === null) {
      setFormat(true);
      return;
    }
    setFormat(false);
    if (r.verno) {
      setSeriya((n) => n + 1);
      setFaza('verno');
    } else {
      setSeriya(0);
      setFaza('neverno');
    }
  }, [faza, primer, vvod]);

  const dalshe = () => {
    setPrimer(noviyPrimer());
    setVvod('');
    setFormat(false);
    setOstalos(10);
    setFaza('vvod');
  };

  const vopros = useMemo(() => voprosHtml(primer), [primer]);
  const otvetStr = `${displayAnswer(primer.otvet)}${primer.ed === '%' ? ' %' : ''}`;
  const razbor = useMemo(() => {
    if (faza !== 'neverno' && faza !== 'vremya') return null;
    const sh = priyom(primer.priyom)
      .razbor(primer)
      .find((x) => x.cep.length > 0);
    return sh === undefined ? null : shagHtml(sh).cep;
  }, [faza, primer]);
  const ravno = primer.v !== 'obr' && primer.v !== 'kv';

  return (
    <div className={clsx('us-vyzov', `is-${faza}`)} data-expr={primer.expr}>
      <div className="us-vyzov__verh">
        <p className="us-vyzov__vopros">
          <span dangerouslySetInnerHTML={{ __html: vopros }} />
          {ravno && <span className="us-vyzov__ravno"> = ?</span>}
        </p>
        {faza === 'vvod' && (
          <p className="us-vyzov__ostalos" aria-hidden="true">
            {T.ostalos(ostalos)}
          </p>
        )}
      </div>
      <form
        className="us-vyzov__forma"
        onSubmit={(e) => {
          e.preventDefault();
          otvetit();
        }}
      >
        <label className="sr-only" htmlFor="us-vyzov-otvet">
          {T.otvet}
        </label>
        <input
          ref={input}
          id="us-vyzov-otvet"
          className={clsx('us-vyzov__input', format && 'is-oshibka')}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          value={vvod}
          readOnly={faza !== 'vvod'}
          aria-invalid={format}
          onChange={(e) => {
            setVvod(e.target.value);
            setFormat(false);
          }}
        />
        {primer.ed === '%' && <span className="us-vyzov__ed">%</span>}
        {faza === 'vvod' ? (
          <button type="submit" className="btn btn--primary us-vyzov__ok">
            {T.proverit}
          </button>
        ) : (
          <button
            ref={eshche}
            type="button"
            className="btn btn--primary us-vyzov__ok"
            onClick={dalshe}
          >
            {T.eshche}
          </button>
        )}
      </form>
      <div className="us-vyzov__itog" role="status" aria-live="polite">
        {format && <p className="us-vyzov__format">{T.format}</p>}
        {faza === 'verno' && (
          <p className="us-vyzov__verno">
            {T.verno} <span className="us-vyzov__plus">+1</span> · {T.seriya(seriya)}
          </p>
        )}
        {(faza === 'neverno' || faza === 'vremya') && (
          <>
            <p className="us-vyzov__neverno">
              {faza === 'neverno' ? T.neverno(otvetStr) : T.vremya(otvetStr)}
            </p>
            {razbor !== null && (
              <p className="us-vyzov__razbor" dangerouslySetInnerHTML={{ __html: razbor }} />
            )}
          </>
        )}
      </div>
      <p className="us-vyzov__pod">{T.neVStatistike}</p>
    </div>
  );
}
