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
import { otvetText, shagHtml, tekstHtml, voprosHtml, vvodText } from '@/lib/ustnyySchet/vyvod';
import { VSPYSHKA_MS } from '@/lib/ustnyySchet/taymer';
import { randomSeed } from '@/lib/randomSeed';
import { USTNYY } from '@/content/ustnyySchet';
import { KorniPolet } from './KorniPolet';
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
  /* Второе поле — у уравнений с двумя корнями (Primer.otvety). */
  const [vvod2, setVvod2] = useState('');
  const [pole, setPole] = useState<0 | 1>(0);
  /* Последний верный ответ с корнями — для полёта точек на прямую. */
  const [polet, setPolet] = useState<{ n: number; korni: readonly string[] } | null>(null);
  const [faza, setFaza] = useState<Faza>('vvod');
  const [posledniy, setPosledniy] = useState<Hod | null>(null);
  const [vspyshka, setVspyshka] = useState<'verno' | 'neverno' | null>(null);
  const [formatErr, setFormatErr] = useState(false);
  const [live, setLive] = useState('');
  const [podskazka, setPodskazka] = useState(false);
  const [naPauze, setNaPauze] = useState(false);
  const [vyshlo, setVyshlo] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
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
    (st: Sostoyanie, ms: number, zaderzhka = 0) => {
      if (konchilos.current) return;
      konchilos.current = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (zaderzhka === 0) {
        onKonec(zakonchit(st), ms);
        return;
      }
      /* Время вышло: ответы уже не принимаются, а итоги — после
         короткой вспышки таймера на нуле. */
      setVyshlo(true);
      timer.current = window.setTimeout(() => onKonec(zakonchit(st), ms), zaderzhka);
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
      setVvod2('');
      setPole(0);
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
    (text: string | readonly string[]) => {
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
      const msg = h.verno
        ? T.verno
        : h.primer.otvety !== undefined
          ? T.nevernoKorni(otvetText(h.primer))
          : T.neverno(displayAnswer(h.primer.otvet));
      if (h.verno && h.primer.otvety !== undefined) {
        const korni = h.primer.otvety;
        setPolet((prev) => ({ n: (prev?.n ?? 0) + 1, korni }));
      }
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
    if (lim !== null) zavershit(s, lim, VSPYSHKA_MS);
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

  const dvaPolya = primer?.otvety !== undefined;

  function onChange(v: string) {
    setVvod(v);
    setFormatErr(false);
    if (dvaPolya) return;
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
    if (dvaPolya && pole === 1) {
      setVvod2(applyKey(vvod2, k));
      setFormatErr(false);
      return;
    }
    onChange(applyKey(vvod, k));
  }

  /** Ответить: у уравнения — оба поля. */
  function otvetitPolya() {
    if (dvaPolya) otvet([vvod, vvod2]);
    else otvet(vvod);
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

      {primer?.deystvie === 'uravneniya' && (
        <div className="us-igra__polet">
          {polet !== null && <KorniPolet key={polet.n} korni={polet.korni} />}
        </div>
      )}

      <div className="us-igra__karta" key={s.hody.length}>
        <p className="us-igra__vopros" data-expr={primer?.expr}>
          <span dangerouslySetInnerHTML={{ __html: voprosH }} />
          {primer?.v !== 'obr' && primer?.v !== 'kv' && primer?.deystvie !== 'uravneniya' && (
            <span className="us-igra__ravno"> =</span>
          )}
        </p>
        {primer?.deystvie === 'uravneniya' && (
          <p className="us-igra__korni-podpis">
            {dvaPolya ? T.korniPodpis : primer.v === 'bol' ? T.egeBol : T.egeMen}
          </p>
        )}

        <form
          className={clsx('us-igra__forma', dvaPolya && 'us-igra__forma--dva')}
          onSubmit={(e) => {
            e.preventDefault();
            if (faza === 'vvod') otvetitPolya();
          }}
        >
          <label className={dvaPolya ? 'us-igra__metka' : 'sr-only'} htmlFor="us-otvet">
            {dvaPolya ? (
              <>
                <span aria-hidden="true">{T.koren1}</span>
                <span className="sr-only">{T.korenPole(1)}</span>
              </>
            ) : (
              T.otvet
            )}
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
                faza === 'vvod'
                  ? vvod
                  : posledniy !== null
                    ? displayAnswer(posledniy.vvody?.[0] ?? posledniy.vvod)
                    : vvod
              }
              readOnly={faza !== 'vvod' || vyshlo}
              aria-invalid={formatErr}
              aria-describedby={formatErr ? 'us-format' : undefined}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setPole(0)}
              onKeyDown={(e) => {
                /* Enter в первом поле корня — ко второму. */
                if (dvaPolya && e.key === 'Enter') {
                  e.preventDefault();
                  input2.current?.focus();
                }
              }}
            />
            {primer?.ed === '%' && <span className="us-igra__ed">%</span>}
          </span>
          {dvaPolya && (
            <>
              <label className="us-igra__metka" htmlFor="us-otvet-2">
                <span aria-hidden="true">{T.koren2}</span>
                <span className="sr-only">{T.korenPole(2)}</span>
              </label>
              <span className="us-igra__pole">
                <input
                  ref={input2}
                  id="us-otvet-2"
                  className={clsx('us-igra__input', formatErr && 'is-oshibka')}
                  type="text"
                  inputMode={coarse ? 'none' : 'decimal'}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  value={
                    faza === 'vvod'
                      ? vvod2
                      : posledniy?.vvody?.[1] !== undefined
                        ? displayAnswer(posledniy.vvody[1])
                        : vvod2
                  }
                  readOnly={faza !== 'vvod' || vyshlo}
                  aria-invalid={formatErr}
                  aria-describedby={formatErr ? 'us-format' : undefined}
                  onFocus={() => setPole(1)}
                  onChange={(e) => {
                    setVvod2(e.target.value);
                    setFormatErr(false);
                  }}
                />
              </span>
            </>
          )}
          {!coarse && (
            <button
              type="submit"
              className="btn btn--primary us-igra__ok"
              disabled={faza !== 'vvod' || vyshlo}
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
            {posledniy.vvody !== undefined && (
              <p className="us-igra__tvoy">
                {USTNYY.itogi.tvoyOtvet}: <s>{vvodText(posledniy)}</s>
              </p>
            )}
            <p className="us-igra__verniy">
              {posledniy.primer.otvety !== undefined
                ? T.nevernoKorni(otvetText(posledniy.primer))
                : T.neverno(displayAnswer(posledniy.primer.otvet))}
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
            disabled={faza !== 'vvod' || vyshlo}
            ok={{
              label: T.klavishi.ok,
              onOk: () => {
                if (dvaPolya && pole === 0) {
                  setPole(1);
                  input2.current?.focus({ preventScroll: true });
                } else otvetitPolya();
              },
            }}
          />
        </div>
      )}

      <p className="sr-only" aria-live="polite" role="status">
        {live}
      </p>
    </div>
  );
}
