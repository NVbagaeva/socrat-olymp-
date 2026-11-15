'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnswerKeypad,
  applyKey,
  useCoarsePointer,
  type KeypadKey,
} from '@/components/ui/AnswerKeypad';
import { displayAnswer } from '@/lib/otvet';
import { sozdatChasy, type Chasy } from '@/lib/ustnyySchet/chasy';
import {
  sozdatGenerator,
  type Generator,
  type Nabor,
  type Nastroyki,
} from '@/lib/ustnyySchet/nabor';
import { format } from '@/lib/ustnyySchet/formaty';
import { priyom } from '@/lib/ustnyySchet/registry';
import {
  dalee,
  limitMs,
  nachat,
  naVremya,
  otvetit,
  PAUZA_OSHIBKI_MS,
  zakonchit,
  type Hod,
  type Rezhim,
  type Sostoyanie,
} from '@/lib/ustnyySchet/sessiya';
import { shagHtml, tekstHtml, voprosHtml } from '@/lib/ustnyySchet/vyvod';
import { randomSeed } from '@/lib/randomSeed';
import { USTNYY } from '@/content/ustnyySchet';
import { RazborShagi } from './RazborShagi';
import { TaymerLive } from './TaymerLive';
import { useZvuk } from './zvuk';

const T = USTNYY.trenirovka;

export interface IgraProps {
  nabor: Nabor;
  rezhim: Rezhim;
  nast: Nastroyki;
  vozvrashchat?: boolean;
  zvuk: boolean;
  avto: boolean;
  onKonec: (s: Sostoyanie, ms: number) => void;
  onNazad: () => void;
}

type Faza = 'vvod' | 'neverno';

/** Цифр в записи ответа (для автопроверки). */
function cifr(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/**
 * Экран тренировки: пример крупно, поле ответа в фокусе, Enter —
 * ответить. Верно — зелёная вспышка и сразу следующий; неверно —
 * встряска, верный ответ и разбор (в свободном режиме дальше по
 * «Понятно», в режимах на время — через 1,5 с, разбор в итогах).
 */
export function Igra({
  nabor,
  rezhim,
  nast,
  vozvrashchat = false,
  zvuk,
  avto,
  onKonec,
  onNazad,
}: IgraProps) {
  /* Генератор, часы и первый пример — один раз, при появлении экрана.
     Экран рисуется только в браузере, после нажатия «Начать». */
  const [start] = useState(() => {
    const f = nabor.tip === 'format' ? format(nabor.id) : undefined;
    const g: Generator = sozdatGenerator(nabor, nast, {
      seed: randomSeed(),
      ...(f === undefined ? {} : { istochnik: f.istochnik }),
    });
    const c: Chasy = sozdatChasy();
    return { g, c, s0: nachat(g, rezhim, 0) };
  });
  const gen = start.g;
  const chasy = start.c;
  const [s, setS] = useState<Sostoyanie>(start.s0);
  const [vvod, setVvod] = useState('');
  const [faza, setFaza] = useState<Faza>('vvod');
  const [posledniy, setPosledniy] = useState<Hod | null>(null);
  const [vspyshka, setVspyshka] = useState<'verno' | 'neverno' | null>(null);
  const [formatErr, setFormatErr] = useState(false);
  const [live, setLive] = useState('');
  const [podskazka, setPodskazka] = useState(false);
  const [naPauze, setNaPauze] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const ponyatno = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const konchilos = useRef(false);
  const coarse = useCoarsePointer();
  const beep = useZvuk(zvuk);
  const vremya = naVremya(rezhim);
  const lim = limitMs(rezhim);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const zavershit = useCallback(
    (st: Sostoyanie, ms: number) => {
      if (konchilos.current) return;
      konchilos.current = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
      onKonec(zakonchit(st), ms);
    },
    [onKonec],
  );

  /* Ушёл со вкладки — пауза (это практика: время считаем мы). */
  useEffect(() => {
    const onVis = () => {
      const c = chasy;
      if (document.hidden) {
        c.pauza();
        setNaPauze(true);
      } else {
        c.dalshe();
        setNaPauze(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [chasy]);

  /* Вспышка гаснет сама: при prefers-reduced-motion анимации нет, и
     события animationend не будет. */
  useEffect(() => {
    if (vspyshka === null) return;
    const id = window.setTimeout(() => setVspyshka(null), 450);
    return () => window.clearTimeout(id);
  }, [vspyshka]);

  /* Поле в фокусе на каждом новом примере. */
  useEffect(() => {
    if (faza === 'vvod') input.current?.focus({ preventScroll: true });
    else ponyatno.current?.focus({ preventScroll: true });
  }, [faza, s.tekushiy]);

  const sleduyushiy = useCallback(
    (st: Sostoyanie) => {
      const c = chasy;
      const next = dalee(st, gen, c.proshlo(), { vozvrashchat });
      setVvod('');
      setFaza('vvod');
      setPodskazka(false);
      if (next.konec) {
        zavershit(next, lim !== null ? Math.min(lim, c.proshlo()) : c.proshlo());
        return;
      }
      setS(next);
    },
    [vozvrashchat, zavershit, lim, chasy, gen],
  );

  const otvet = useCallback(
    (text: string) => {
      const c = chasy;
      if (faza !== 'vvod' || konchilos.current) return;
      const t = c.proshlo();
      const r = otvetit(s, text, t);
      if (r.kind === 'format') {
        setFormatErr(true);
        return;
      }
      if (r.kind === 'pozdno') {
        zavershit(r.s, lim ?? t);
        return;
      }
      setFormatErr(false);
      const h = r.hod;
      setPosledniy(h);
      setVspyshka(h.verno ? 'verno' : 'neverno');
      beep(h.verno);
      /* Каждое объявление отличается от прошлого — скринридер прочтёт и повтор «Верно». */
      const msg = h.verno ? T.verno : T.neverno(displayAnswer(h.primer.otvet));
      setLive((prev) => (prev === msg ? `${msg}​` : msg));
      if (h.verno) {
        if (r.s.konec) zavershit(r.s, t);
        else sleduyushiy(r.s);
        return;
      }
      setS(r.s);
      setFaza('neverno');
      if (vremya) {
        timer.current = window.setTimeout(() => {
          timer.current = null;
          if (r.s.konec) zavershit(r.s, c.proshlo());
          else sleduyushiy(r.s);
        }, PAUZA_OSHIBKI_MS);
      }
    },
    [s, faza, zavershit, sleduyushiy, vremya, lim, beep, chasy],
  );

  const onVyshlo = useCallback(() => {
    if (lim !== null) zavershit(s, lim);
  }, [s, lim, zavershit]);

  const primer = s.tekushiy;
  const voprosH = useMemo(() => (primer === null ? '' : voprosHtml(primer)), [primer]);
  const razbor = useMemo(
    () =>
      faza === 'neverno' && posledniy !== null && !vremya
        ? priyom(posledniy.primer.priyom).razbor(posledniy.primer).map(shagHtml)
        : null,
    [faza, posledniy, vremya],
  );
  const pravilo = useMemo(() => {
    if (primer === null || primer.priyom === 'tablica') return null;
    const t = USTNYY.priyomy[primer.priyom];
    return { nazvanie: t.nazvanie, html: tekstHtml(t.pravilo) };
  }, [primer]);

  function onChange(v: string) {
    setVvod(v);
    setFormatErr(false);
    const minus = /^[-\u2212–]/.test(v.trim());
    if (
      avto &&
      primer !== null &&
      cifr(v) >= cifr(primer.otvet) &&
      minus === primer.otvet.startsWith('-')
    ) {
      otvet(v);
    }
  }

  function onKey(k: KeypadKey) {
    onChange(applyKey(vvod, k));
  }

  if (primer === null && !s.konec) {
    return (
      <div className="us-igra">
        <p className="us-igra__pusto">{T.nedostupno}</p>
        <button type="button" className="btn btn--secondary" onClick={onNazad}>
          {T.nazad}
        </button>
      </div>
    );
  }

  const nomer = s.hody.length + (faza === 'vvod' ? 1 : 0);
  const vsego = rezhim.tip === 'seriya' ? rezhim.n : null;

  return (
    <div className={clsx('us-igra', vspyshka !== null && `is-${vspyshka}`)}>
      <div className="us-igra__verh">
        <p className="us-igra__nomer">{T.primer(Math.max(1, nomer), vsego)}</p>
        <TaymerLive chasy={chasy} limitMs={lim} naPauze={naPauze} onVyshlo={onVyshlo} />
        <button
          type="button"
          className="btn btn--ghost btn--sm us-igra__stop"
          onClick={() =>
            zavershit(s, lim !== null ? Math.min(lim, chasy.proshlo()) : chasy.proshlo())
          }
        >
          {T.zakonchit}
        </button>
      </div>

      {naPauze && <p className="us-igra__pauza">{T.pauza}</p>}

      <div className="us-igra__karta" key={s.hody.length}>
        <p className="us-igra__vopros" data-expr={primer?.expr}>
          <span dangerouslySetInnerHTML={{ __html: voprosH }} />
          {primer?.v !== 'obr' && primer?.v !== 'kv' && <span className="us-igra__ravno"> =</span>}
        </p>

        <form
          className="us-igra__forma"
          onSubmit={(e) => {
            e.preventDefault();
            if (faza === 'vvod') otvet(vvod);
          }}
        >
          <label className="sr-only" htmlFor="us-otvet">
            {T.otvet}
          </label>
          <span className="us-igra__pole">
            <input
              ref={input}
              id="us-otvet"
              className={clsx('us-igra__input', formatErr && 'is-oshibka')}
              type="text"
              inputMode={coarse ? 'none' : 'decimal'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              value={
                faza === 'vvod' ? vvod : posledniy !== null ? displayAnswer(posledniy.vvod) : vvod
              }
              readOnly={faza !== 'vvod'}
              aria-invalid={formatErr}
              aria-describedby={formatErr ? 'us-format' : undefined}
              onChange={(e) => onChange(e.target.value)}
            />
            {primer?.ed === '%' && <span className="us-igra__ed">%</span>}
          </span>
          {!coarse && (
            <button
              type="submit"
              className="btn btn--primary us-igra__ok"
              disabled={faza !== 'vvod'}
            >
              {T.proverit}
            </button>
          )}
        </form>
        {formatErr && (
          <p id="us-format" className="us-igra__format">
            {T.formatOshibka}
          </p>
        )}

        {faza === 'neverno' && posledniy !== null && (
          <div className="us-igra__oshibka">
            <p className="us-igra__verniy">
              {T.neverno(displayAnswer(posledniy.primer.otvet))}
              {posledniy.primer.ed === '%' ? ' %' : ''}
            </p>
            {razbor !== null && <RazborShagi shagi={razbor} vse />}
            {!vremya && (
              <button
                ref={ponyatno}
                type="button"
                className="btn btn--primary"
                onClick={() => sleduyushiy(s)}
              >
                {T.ponyatno}
              </button>
            )}
          </div>
        )}

        {!vremya && faza === 'vvod' && pravilo !== null && (
          <div className="us-igra__podskazka">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              aria-expanded={podskazka}
              onClick={() => setPodskazka(!podskazka)}
            >
              {T.podskazka}
            </button>
            {podskazka && (
              <p className="us-igra__pravilo">
                <strong>{pravilo.nazvanie}.</strong>{' '}
                <span dangerouslySetInnerHTML={{ __html: pravilo.html }} />
              </p>
            )}
          </div>
        )}
      </div>

      {coarse && (
        <div className="us-igra__klaviatura">
          <AnswerKeypad
            label={T.klaviatura}
            names={T.klavishi}
            onKey={onKey}
            disabled={faza !== 'vvod'}
            ok={{ label: T.klavishi.ok, onOk: () => otvet(vvod) }}
          />
        </div>
      )}

      <p className="sr-only" aria-live="polite" role="status">
        {live}
      </p>
    </div>
  );
}
