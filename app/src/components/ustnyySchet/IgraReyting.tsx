'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnswerKeypad,
  applyKey,
  useCoarsePointer,
  type KeypadKey,
} from '@/components/ui/AnswerKeypad';
import { displayAnswer, normalizeAnswer } from '@/lib/otvet';
import { api, UstnyyError, type Final, type ServerPrimer, type Start } from '@/lib/ustnyySchet/api';
import { sozdatChasy, type Chasy } from '@/lib/ustnyySchet/chasy';
import { primerIzServera, reytingFormat, type ReytingFormatId } from '@/lib/ustnyySchet/formaty';
import {
  PAUZA_OSHIBKI_MS,
  type Hod,
  type Rezhim,
  type Sostoyanie,
} from '@/lib/ustnyySchet/sessiya';
import { VSPYSHKA_MS } from '@/lib/ustnyySchet/taymer';
import type { Primer } from '@/lib/ustnyySchet/types';
import { voprosHtml } from '@/lib/ustnyySchet/vyvod';
import { USTNYY } from '@/content/ustnyySchet';
import { TaymerLive } from './TaymerLive';
import { useZvuk } from './zvuk';

const T = USTNYY.trenirovka;
const R = USTNYY.reytingIgra;

export interface IgraReytingProps {
  format: ReytingFormatId;
  zvuk: boolean;
  avto: boolean;
  onKonec: (s: Sostoyanie, ms: number, final: Final | null) => void;
  onPraktika: () => void;
}

interface Zapusk {
  start: Start;
  chasy: Chasy;
  /** Лимит по часам этого браузера: срок сервера минус половина задержки сети. */
  limit: number | null;
  rezhim: Rezhim;
}

function cifr(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/**
 * Рейтинговая тренировка: примеры выдаёт и проверяет сервер
 * (lib/ustnyySchet/api.ts). В буфере — два примера вперёд: ответ уходит
 * на сервер в фоне, по очереди, а следующий пример показывается сразу.
 * Время считает сервер; таймер здесь — показ срока сервера по часам
 * браузера, без паузы на скрытой вкладке.
 */
export function IgraReyting({ format, zvuk, avto, onKonec, onPraktika }: IgraReytingProps) {
  const [zapusk, setZapusk] = useState<Zapusk | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [bufer, setBufer] = useState<Map<number, Primer>>(new Map());
  const [pos, setPos] = useState(1);
  const [hody, setHody] = useState<Hod[]>([]);
  const [vvod, setVvod] = useState('');
  const [neverno, setNeverno] = useState<Hod | null>(null);
  const [vspyshka, setVspyshka] = useState<'verno' | 'neverno' | null>(null);
  const [formatErr, setFormatErr] = useState(false);
  const [live, setLive] = useState('');
  const [otpravka, setOtpravka] = useState(false);
  const [konec, setKonec] = useState(false);
  const cepochka = useRef<Promise<void>>(Promise.resolve());
  const hodyRef = useRef<Hod[]>([]);
  const pokazanV = useRef(0);
  const konchilos = useRef(false);
  const timer = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const coarse = useCoarsePointer();
  const beep = useZvuk(zvuk);

  /* Старт на сервере. */
  useEffect(() => {
    let otmena = false;
    const t0 = performance.now();
    api
      .start(format)
      .then((start) => {
        if (otmena) return;
        const rtt = performance.now() - t0;
        const f = reytingFormat(format);
        const limit =
          start.tip === 'vremya' ? Math.max(0, start.deadline - start.server_now - rtt / 2) : null;
        const rezhim: Rezhim =
          start.tip === 'vremya'
            ? { tip: 'vremya', sek: start.sek ?? f?.sek ?? 60 }
            : { tip: 'seriya', n: start.n ?? f?.n ?? 20 };
        const b = new Map<number, Primer>();
        for (const it of start.items) {
          const p = primerIzServera(it);
          if (p !== null) b.set(it.pos, p);
        }
        setBufer(b);
        setZapusk({ start, chasy: sozdatChasy(), limit, rezhim });
      })
      .catch((e: unknown) => {
        if (!otmena) setOshibka(e instanceof UstnyyError ? e.code : 'seti');
      });
    return () => {
      otmena = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [format]);

  useEffect(() => {
    if (vspyshka === null) return;
    const id = window.setTimeout(() => setVspyshka(null), 450);
    return () => window.clearTimeout(id);
  }, [vspyshka]);

  const primer = bufer.get(pos) ?? null;

  /* Новый пример — отметка времени показа и фокус. */
  useEffect(() => {
    if (zapusk === null || primer === null) return;
    pokazanV.current = zapusk.chasy.proshlo();
    input.current?.focus({ preventScroll: true });
  }, [zapusk, primer]);

  const zavershit = useCallback(
    (zaderzhka = 0) => {
      if (zapusk === null || konchilos.current) return;
      konchilos.current = true;
      setKonec(true);
      const ms = zapusk.limit !== null ? zapusk.limit : zapusk.chasy.proshlo();
      const finish = async () => {
        setOtpravka(true);
        await cepochka.current;
        let final: Final | null = null;
        try {
          final = await api.finish(zapusk.start.session);
        } catch {
          final = null;
        }
        const s: Sostoyanie = {
          rezhim: zapusk.rezhim,
          hody: hodyRef.current,
          tekushiy: null,
          pokazanV: 0,
          konec: true,
          vozvrat: [],
        };
        onKonec(s, final !== null && zapusk.rezhim.tip === 'seriya' ? final.net_ms : ms, final);
      };
      if (zaderzhka > 0) timer.current = window.setTimeout(() => void finish(), zaderzhka);
      else void finish();
    },
    [zapusk, onKonec],
  );

  const prinyatOtvet = useCallback((sp: ServerPrimer | null) => {
    if (sp === null) return;
    const p = primerIzServera(sp);
    if (p === null) return;
    setBufer((b) => new Map(b).set(sp.pos, p));
  }, []);

  const otvet = useCallback(
    (text: string) => {
      if (zapusk === null || primer === null || neverno !== null || konchilos.current) return;
      const n = normalizeAnswer(text);
      if (!n.ok) {
        setFormatErr(true);
        return;
      }
      setFormatErr(false);
      const t = zapusk.chasy.proshlo();
      const hod: Hod = {
        primer,
        vvod: n.value,
        verno: n.value === primer.otvet,
        ms: Math.max(0, t - pokazanV.current),
      };
      const i = hodyRef.current.length;
      hodyRef.current = [...hodyRef.current, hod];
      setHody(hodyRef.current);
      const myPos = pos;
      /* На сервер — по очереди; вердикт сервера главнее. */
      cepochka.current = cepochka.current.then(async () => {
        try {
          const r = await api.otvet(zapusk.start.session, myPos, n.value);
          if (r.kind === 'answer') {
            prinyatOtvet(r.next);
            if (r.verno !== hod.verno) {
              hodyRef.current = hodyRef.current.map((h, j) =>
                j === i ? { ...h, verno: r.verno } : h,
              );
              setHody(hodyRef.current);
            }
          }
        } catch {
          /* Сеть: ответ не засчитан сервером — итог покажет сервер. */
        }
      });
      setVspyshka(hod.verno ? 'verno' : 'neverno');
      beep(hod.verno);
      const msg = hod.verno ? T.verno : T.neverno(displayAnswer(primer.otvet));
      setLive((prev) => (prev === msg ? `${msg}​` : msg));
      setVvod('');
      const vsegoSeriya = zapusk.rezhim.tip === 'seriya' ? zapusk.rezhim.n : null;
      const posledniy = vsegoSeriya !== null && hodyRef.current.length >= vsegoSeriya;
      if (hod.verno) {
        if (posledniy) zavershit();
        else setPos(myPos + 1);
        return;
      }
      setNeverno(hod);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setNeverno(null);
        if (posledniy) zavershit();
        else setPos(myPos + 1);
      }, PAUZA_OSHIBKI_MS);
    },
    [zapusk, primer, neverno, pos, zavershit, beep, prinyatOtvet],
  );

  const onVyshlo = useCallback(() => zavershit(VSPYSHKA_MS), [zavershit]);
  const voprosH = useMemo(() => (primer === null ? '' : voprosHtml(primer)), [primer]);

  function onChange(v: string) {
    setVvod(v);
    setFormatErr(false);
    const minus = /^[-−–]/.test(v.trim());
    if (
      avto &&
      primer !== null &&
      cifr(v) >= cifr(primer.otvet) &&
      minus === primer.otvet.startsWith('-')
    )
      otvet(v);
  }
  function onKey(k: KeypadKey) {
    onChange(applyKey(vvod, k));
  }

  if (oshibka !== null) {
    return (
      <div className="us-igra">
        <p className="us-igra__pusto">{R.oshibki[oshibka] ?? R.oshibki.seti}</p>
        <button type="button" className="btn btn--secondary" onClick={onPraktika}>
          {R.praktika}
        </button>
      </div>
    );
  }
  if (zapusk === null) {
    return (
      <div className="us-igra" aria-busy="true">
        <p className="us-igra__nomer">{R.zagruzka}</p>
      </div>
    );
  }

  const vsego = zapusk.rezhim.tip === 'seriya' ? zapusk.rezhim.n : null;
  const zakryto = neverno !== null || konec || otpravka;

  return (
    <div className={clsx('us-igra', 'us-igra--reyting', vspyshka !== null && `is-${vspyshka}`)}>
      <div className="us-igra__verh">
        <p className="us-igra__nomer">
          {T.primer(Math.min(hody.length + 1, vsego ?? Infinity), vsego)}
        </p>
        <TaymerLive
          chasy={zapusk.chasy}
          limitMs={zapusk.limit}
          naPauze={false}
          onVyshlo={onVyshlo}
        />
        <button
          type="button"
          className="btn btn--ghost btn--sm us-igra__stop"
          onClick={() => zavershit()}
          disabled={otpravka}
        >
          {T.zakonchit}
        </button>
      </div>
      <p className="us-igra__reyting">{R.pravila}</p>

      {otpravka ? (
        <p className="us-igra__nomer" aria-busy="true">
          {R.otpravka}
        </p>
      ) : (
        <div className="us-igra__karta" key={hody.length}>
          {primer === null ? (
            <p className="us-igra__nomer" aria-busy="true">
              {R.zhdem}
            </p>
          ) : (
            <>
              <p className="us-igra__vopros" data-expr={primer.expr}>
                <span dangerouslySetInnerHTML={{ __html: voprosH }} />
                {primer.v !== 'obr' && primer.v !== 'kv' && (
                  <span className="us-igra__ravno"> =</span>
                )}
              </p>
              <form
                className="us-igra__forma"
                onSubmit={(e) => {
                  e.preventDefault();
                  otvet(vvod);
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
                    value={neverno !== null ? displayAnswer(neverno.vvod) : vvod}
                    readOnly={zakryto}
                    aria-invalid={formatErr}
                    aria-describedby={formatErr ? 'us-format' : undefined}
                    onChange={(e) => onChange(e.target.value)}
                  />
                  {primer.ed === '%' && <span className="us-igra__ed">%</span>}
                </span>
                {!coarse && (
                  <button type="submit" className="btn btn--primary us-igra__ok" disabled={zakryto}>
                    {T.proverit}
                  </button>
                )}
              </form>
              {formatErr && (
                <p id="us-format" className="us-igra__format">
                  {T.formatOshibka}
                </p>
              )}
              {neverno !== null && (
                <div className="us-igra__oshibka">
                  <p className="us-igra__verniy">
                    {T.neverno(displayAnswer(neverno.primer.otvet))}
                    {neverno.primer.ed === '%' ? ' %' : ''}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {coarse && !otpravka && (
        <div className="us-igra__klaviatura">
          <AnswerKeypad
            label={T.klaviatura}
            names={T.klavishi}
            onKey={onKey}
            disabled={zakryto || primer === null}
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
