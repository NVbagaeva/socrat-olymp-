'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChertezhSkhemy } from '@/components/skhemy/ChertezhSkhemy';
import { Tex } from '@/components/ui/Tex';
import { CHERTEZH_18 } from '@/content/zadanie18';
import type { Sostoyanie } from '@/lib/skhemy/ekran';
import { VID_ISHODNYY, type T2, type Tochki, type Vid } from '@/lib/skhemy/tipy';
import { trebuetsyaSkhema18 } from '@/lib/zadanie18/skhemy';

/** Пауза между шагами сборки, мс. */
const PAUZA_SHAGA = 1100;
/** Переход к новому виду и положению, мс. */
const DUR_PEREHODA = 520;

function umenshitDvizhenie(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Поворот к цели кратчайшим путём. */
function blizhayshiyUgol(ot: number, k: number): number {
  let d = ((((k - ot) % 360) + 540) % 360) - 180;
  if (d === -180) d = 180;
  return ot + d;
}

const norm360 = (u: number) => ((Math.round(u) % 360) + 360) % 360;

function smeshat(a: Tochki, b: Tochki, x: number): Tochki {
  const out: Record<string, T2> = {};
  for (const k of Object.keys(b)) {
    const p = a[k] ?? b[k]!;
    const q = b[k]!;
    out[k] = [p[0] + (q[0] - p[0]) * x, p[1] + (q[1] - p[1]) * x];
  }
  return out;
}

export interface ZhivoyChertezh18Props {
  id: string;
  nazvanie: string;
  /** Горящие группы: наведённое следствие или шаг доказательства. */
  lit: readonly string[];
}

/**
 * Живой чертёж схемы с панелью: поворот ползунком, отражение,
 * случайное положение, пошаговая сборка, сброс. Под чертежом —
 * пересчитанные величины и пояснение к особому положению (тупой угол,
 * вырождение).
 */
export function ZhivoyChertezh18({ id, nazvanie, lit }: ZhivoyChertezh18Props) {
  const skhema = trebuetsyaSkhema18(id);

  const [t, setT] = useState<Tochki>(skhema.nachalo);
  const [vid, setVid] = useState<Vid>(VID_ISHODNYY);
  const [shag, setShag] = useState<number | null>(null);
  const [sobiraem, setSobiraem] = useState(false);
  const anim = useRef(0);
  const sostoyanie = useRef({ t, vid });
  useEffect(() => {
    sostoyanie.current = { t, vid };
  }, [t, vid]);

  const sost: Sostoyanie = useMemo(() => ({ lit: new Set(lit), shag, podpisi: true }), [lit, shag]);
  const kadr = useMemo(() => skhema.postroit(t), [skhema, t]);

  function ostanovitAnimaciyu(): void {
    cancelAnimationFrame(anim.current);
    anim.current = 0;
  }

  /** Плавный переход к виду и (необязательно) положению точек. */
  function perejti(k: Vid, kT?: Tochki): void {
    ostanovitAnimaciyu();
    const { t: otT, vid: otV } = sostoyanie.current;
    const celUgol = blizhayshiyUgol(otV.ugol, k.ugol);
    if (umenshitDvizhenie()) {
      setVid({ ugol: norm360(celUgol), otrazhenie: k.otrazhenie });
      if (kT !== undefined) setT(kT);
      return;
    }
    const start = performance.now();
    const shagAnim = (sejchas: number) => {
      const x = Math.min(1, (sejchas - start) / DUR_PEREHODA);
      const e = x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
      setVid({
        ugol: otV.ugol + (celUgol - otV.ugol) * e,
        otrazhenie: otV.otrazhenie + (k.otrazhenie - otV.otrazhenie) * e,
      });
      if (kT !== undefined) setT(smeshat(otT, kT, e));
      if (x < 1) {
        anim.current = requestAnimationFrame(shagAnim);
      } else {
        anim.current = 0;
        setVid({ ugol: norm360(celUgol), otrazhenie: k.otrazhenie });
        if (kT !== undefined) setT(kT);
      }
    };
    anim.current = requestAnimationFrame(shagAnim);
  }

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /* Пошаговая сборка: шаги идут сами, в конце чертёж — целиком. */
  useEffect(() => {
    if (!sobiraem) return undefined;
    const vsego = skhema.shagi.length;
    const id = window.setTimeout(
      () => {
        if (shag === null) {
          setShag(0);
        } else if (shag + 1 < vsego) {
          setShag(shag + 1);
        } else {
          setSobiraem(false);
        }
      },
      shag === null ? 0 : PAUZA_SHAGA,
    );
    return () => window.clearTimeout(id);
  }, [sobiraem, shag, skhema.shagi.length]);

  function sobrat(): void {
    if (sobiraem) {
      setSobiraem(false);
      setShag(null);
      return;
    }
    setShag(null);
    setSobiraem(true);
  }

  function sluchayno(): void {
    const kT = skhema.sluchaynaya(Math.random);
    perejti({ ugol: Math.random() * 360, otrazhenie: Math.random() < 0.5 ? -1 : 1 }, kT);
  }

  function sbrosit(): void {
    setSobiraem(false);
    setShag(null);
    perejti(VID_ISHODNYY, skhema.nachalo);
  }

  const podpisShaga =
    shag === null ? null : `${shag + 1}/${skhema.shagi.length} · ${skhema.shagi[shag] ?? ''}`;

  return (
    <figure className="z18-ch">
      <div className="z18-ch__pole">
        <ChertezhSkhemy
          skhema={skhema}
          t={t}
          vid={vid}
          sost={sost}
          onTochki={(novye) => {
            ostanovitAnimaciyu();
            setT(novye);
          }}
          dolyaVysoty={0.66}
          opisanie={CHERTEZH_18.podpisChertezha(nazvanie)}
          podpisRuchki={CHERTEZH_18.ruchka}
        />
        {podpisShaga === null ? null : (
          <p className="z18-ch__shag" aria-live="polite">
            <Tex text={podpisShaga} />
          </p>
        )}
      </div>

      <div className="z18-ch__panel">
        <label className="z18-ch__povorot">
          <span className="z18-ch__povorot-metka">{CHERTEZH_18.povorot}</span>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={norm360(vid.ugol)}
            onChange={(e) => {
              ostanovitAnimaciyu();
              setVid({ ugol: Number(e.target.value), otrazhenie: vid.otrazhenie });
            }}
          />
          <span className="z18-ch__povorot-chislo">{norm360(vid.ugol)}°</span>
        </label>
        <div className="z18-ch__knopki">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => perejti({ ugol: vid.ugol, otrazhenie: vid.otrazhenie > 0 ? -1 : 1 })}
          >
            <IkonkaOtrazit />
            {CHERTEZH_18.otrazit}
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={sluchayno}>
            <IkonkaKubik />
            {CHERTEZH_18.sluchayno}
          </button>
          <button
            type="button"
            className={clsx('btn btn--sm', sobiraem ? 'btn--primary' : 'btn--secondary')}
            aria-pressed={sobiraem}
            onClick={sobrat}
          >
            <IkonkaSborka />
            {sobiraem ? CHERTEZH_18.stop : CHERTEZH_18.sobrat}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={sbrosit}>
            <IkonkaSbros />
            {CHERTEZH_18.sbrosit}
          </button>
        </div>
      </div>

      <figcaption className="z18-ch__podpis">
        <ul className="z18-ch__znacheniya" aria-live="off">
          {kadr.znacheniya.map((z, i) => (
            <li key={i}>
              <Tex text={z} />
            </li>
          ))}
        </ul>
        {kadr.zametka === null ? (
          <p className="z18-ch__tyani">{CHERTEZH_18.podskazkaTyani}</p>
        ) : (
          <p className="z18-ch__zametka" role="status">
            <Tex text={kadr.zametka} />
          </p>
        )}
      </figcaption>
    </figure>
  );
}

/* Значки кнопок: поле 24×24, обводка currentColor — как NavIcons. */
function Znachok({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="z18-ch__ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function IkonkaOtrazit() {
  return (
    <Znachok>
      <path d="M12 3.5v17" strokeDasharray="2 2.5" />
      <path d="M9 7 4 17h5zM15 7l5 10h-5z" />
    </Znachok>
  );
}

function IkonkaKubik() {
  return (
    <Znachok>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
    </Znachok>
  );
}

function IkonkaSborka() {
  return (
    <Znachok>
      <path d="M5 19 12 5l7 14z" />
      <path d="M12 5v14" strokeDasharray="2 2.5" />
    </Znachok>
  );
}

function IkonkaSbros() {
  return (
    <Znachok>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </Znachok>
  );
}
