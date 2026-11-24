'use client';

import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { MYACH10 } from '@/content/zhivye10';
import { motionLevel, type MotionLevel } from '@/lib/motion';
import { typeset } from '@/lib/tex';
import {
  H_MAX,
  H_SHKALY,
  OTMETKA_DEFAULT,
  OTMETKI,
  SEK_SNIMOK,
  T_KON,
  T_VERSH,
  deleniyaT,
  h,
  korni,
  prizhat,
  razmetka,
  razvesti,
  ru,
  ruTex,
  shagVremeni,
  shirinaPriblizitelno,
  sleduyushayaOstanovka,
  tPodpis,
  xT,
  yH,
  type Razmetka,
} from '@/lib/zadanie10/myach';
import './myach.css';

/**
 * «Мяч выше отметки» — сцена целиком: секундомер-таймлайн, слева
 * стойка с линейкой, бросающим и мячом, справа график h(t) в том же
 * масштабе высоты (мяч и точка графика всегда на одной горизонтали),
 * таблица моментов и решение неравенства в KaTeX.
 *
 * Модельное время t (секунды полёта) — единственный источник правды:
 * положение мяча, график, подписи, таблица и бегунок считаются из него.
 * Ход времени — requestAnimationFrame, замедленная съёмка с разгоном и
 * торможением к паузам-«снимкам» на t₁ и t₂ (lib/zadanie10/myach.ts).
 * Сцена рисуется в пикселях контейнера, подписи — от 13 px. Грузится
 * лениво (MyachLazy) вместе со стилями и KaTeX.
 */

const T = MYACH10;
const FONT_PX = 13;

interface Dvizhok {
  t: number;
  start: number;
  igraet: boolean;
  /** Сколько снимков (t₁, t₂) уже показано за этот бросок. */
  pokazany: number;
  derzhatDo: number;
  /** Номер падения: перезапускает «приземление». */
  upal: number;
  zapuskalsya: boolean;
}

interface Kadr {
  t: number;
  igraet: boolean;
  snimokIdet: boolean;
  upal: number;
  zapuskalsya: boolean;
}

function novyyDvizhok(): Dvizhok {
  return { t: 0, start: 0, igraet: false, pokazany: 0, derzhatDo: 0, upal: 0, zapuskalsya: false };
}

function snyat(d: Dvizhok): Kadr {
  return {
    t: d.t,
    igraet: d.igraet,
    snimokIdet: d.derzhatDo > 0,
    upal: d.upal,
    zapuskalsya: d.zapuskalsya,
  };
}

/* ── Ширина текста ── */
let holst: CanvasRenderingContext2D | null | undefined;
const kesh = new Map<string, number>();
function shirina(text: string): number {
  const est = kesh.get(text);
  if (est !== undefined) return est;
  if (holst === undefined) {
    holst =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (holst !== null) {
      holst.font = `600 ${FONT_PX}px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
    }
  }
  const w = holst === null ? shirinaPriblizitelno(text, FONT_PX) : holst.measureText(text).width;
  kesh.set(text, w);
  return w;
}

function Podpis({ x, y, text, klass }: { x: number; y: number; text: string; klass: string }) {
  const w = shirina(text);
  return (
    <g className={clsx('z10-my__podpis', klass)} transform={`translate(${x.toFixed(2)} ${y})`}>
      <rect x={-w / 2 - 7} y="-11" width={w + 14} height="22" rx="11" />
      <text textAnchor="middle" y="0.5" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

/* ── Бросающий ── */

/**
 * Плоская фигурка в метрах сцены (рост 1,75 м), лицом вправо. `ruka` —
 * доля взмаха: 0 — держит мяч перед собой на высоте 1,2 м, 1 — рука
 * поднята после броска.
 */
function Chelovek({ r, ruka }: { r: Razmetka; ruka: number }) {
  const m = r.pxM;
  const P = (x: number, y: number) => `${(x * m).toFixed(2)} ${(-y * m).toFixed(2)}`;
  const plecho = { x: 0.02, y: 1.42 };
  /* Кисть по дуге: «держит» (0,42; 1,2) → «вверх» (0,18; 1,9) → «опущена» (0,06; 0,98).
     ruka ∈ [0, 1] — взмах, ruka ∈ (1, 2] — рука опускается после броска. */
  const ugolK = (x: number, y: number) => Math.atan2(y - plecho.y, x - plecho.x);
  const a0 = ugolK(0.42, 1.2);
  const a1 = ugolK(0.18, 1.9);
  const a2 = ugolK(0.06, 0.98) + 2 * Math.PI * (ugolK(0.06, 0.98) < a1 ? 0 : -1);
  const a = ruka <= 1 ? a0 + (a1 - a0) * ruka : a1 + (a2 - a1) * (ruka - 1);
  const L = 0.45;
  const kist = { x: plecho.x + L * Math.cos(a), y: plecho.y + L * Math.sin(a) };
  const lokot = {
    x: plecho.x + 0.22 * Math.cos(a) + 0.03,
    y: plecho.y + 0.22 * Math.sin(a) - 0.04,
  };
  return (
    <g
      className="z10-my__chel"
      transform={`translate(${r.xChelovek.toFixed(2)} ${r.yZemlya})`}
      aria-hidden="true"
    >
      <ellipse className="z10-my__chel-ten" cx="0" cy="2" rx={0.32 * m} ry="3.5" />
      {/* Дальние рука и нога. */}
      <path
        className="z10-my__chel-ruka is-dal"
        d={`M${P(-0.02, 1.4)} L${P(-0.08, 1.12)} L${P(-0.04, 0.92)}`}
      />
      <path
        className="z10-my__chel-noga is-dal"
        d={`M${P(-0.02, 0.92)} L${P(-0.1, 0.48)} L${P(-0.12, 0.04)}`}
      />
      <path
        className="z10-my__chel-botinok"
        d={`M${P(-0.18, 0.06)} h${0.2 * m} a3 3 0 0 1 0 6 h${-0.2 * m} z`}
      />
      {/* Куртка. */}
      <path
        className="z10-my__chel-kurtka"
        d={`M${P(-0.13, 1.47)} Q${P(0.02, 1.53)} ${P(0.15, 1.47)} L${P(0.13, 0.9)} Q${P(0, 0.86)} ${P(-0.14, 0.9)} Z`}
      />
      <path
        className="z10-my__chel-noga"
        d={`M${P(0.04, 0.92)} L${P(0.1, 0.48)} L${P(0.12, 0.04)}`}
      />
      <path
        className="z10-my__chel-botinok"
        d={`M${P(0.06, 0.06)} h${0.2 * m} a3 3 0 0 1 0 6 h${-0.2 * m} z`}
      />
      {/* Голова. */}
      <circle className="z10-my__chel-kozha" cx={0.03 * m} cy={-1.62 * m} r={0.12 * m} />
      <path
        className="z10-my__chel-volosy"
        d={`M${P(-0.09, 1.6)} a${0.12 * m} ${0.12 * m} 0 0 1 ${0.22 * m} ${-0.07 * m} q${-0.08 * m} ${0.01 * m} ${-0.13 * m} ${0.05 * m} z`}
      />
      {/* Ближняя рука — бросающая. */}
      <path
        className="z10-my__chel-ruka"
        d={`M${P(plecho.x, plecho.y)} L${P(lokot.x, lokot.y)} L${P(kist.x, kist.y)}`}
      />
      <circle
        className="z10-my__chel-kozha"
        cx={kist.x * m}
        cy={-kist.y * m}
        r={Math.max(2.2, 0.05 * m)}
      />
    </g>
  );
}

/* ── Мяч ── */
function Myach({
  id,
  x,
  y,
  rr,
  ugol,
  vyshe,
  prizemlenie,
}: {
  id: string;
  x: number;
  y: number;
  rr: number;
  ugol: number;
  vyshe: boolean;
  prizemlenie: number;
}) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} aria-hidden="true">
      <g
        className={clsx('z10-my__myach', vyshe && 'is-vyshe')}
        key={`m${prizemlenie}`}
        data-upal={prizemlenie > 0 ? '' : undefined}
      >
        <circle className="z10-my__myach-svet" r={rr * 2.2} fill={`url(#${id}-svet)`} />
        <circle r={rr} fill={`url(#${id}-myach)`} className="z10-my__myach-telo" />
        <circle r={rr} fill={`url(#${id}-myach-vyshe)`} className="z10-my__myach-zhar" />
        <g transform={`rotate(${ugol.toFixed(1)})`} className="z10-my__myach-polosy">
          <path d={`M${-rr} 0 Q0 ${-rr * 0.55} ${rr} 0`} />
          <path d={`M0 ${-rr} Q${rr * 0.55} 0 0 ${rr}`} />
        </g>
        <ellipse
          className="z10-my__myach-blik"
          cx={-rr * 0.35}
          cy={-rr * 0.4}
          rx={rr * 0.38}
          ry={rr * 0.24}
          transform="rotate(-30)"
        />
      </g>
    </g>
  );
}

/* ── Сцена ── */

export default function Scena() {
  const id = useId().replace(/:/g, '');
  const [H, setH] = useState<number>(OTMETKA_DEFAULT);
  const [skorost, setSkorost] = useState<1 | 2>(1);
  const [W, setW] = useState(0);
  const [dvizhenie, setDvizhenie] = useState<MotionLevel>('full');
  const [d, setKadr] = useState<Kadr>(() => snyat(novyyDvizhok()));

  const dv = useRef<Dvizhok>(novyyDvizhok());
  const raf = useRef<number | null>(null);
  const obertka = useRef<HTMLDivElement>(null);
  const tek = useRef({ H, skorost });
  useLayoutEffect(() => {
    tek.current = { H, skorost };
  });
  const perisovat = useCallback(() => setKadr(snyat(dv.current)), []);

  useLayoutEffect(() => {
    const el = obertka.current;
    if (el === null) return undefined;
    setW(Math.round(el.clientWidth));
    const ro = new ResizeObserver(([e]) => {
      if (e !== undefined) setW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const obnovit = () => setDvizhenie(mq.matches ? 'reduce' : motionLevel());
    obnovit();
    mq.addEventListener('change', obnovit);
    return () => {
      mq.removeEventListener('change', obnovit);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const cikl = useCallback(() => {
    if (raf.current !== null) return;
    let prev = performance.now();
    const kadr = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const e = dv.current;
      const { H: Hc, skorost: sk } = tek.current;
      if (e.igraet) {
        if (e.derzhatDo > 0) {
          if (now >= e.derzhatDo) {
            e.derzhatDo = 0;
            e.start = e.t;
          }
        } else {
          const stop = sleduyushayaOstanovka(Hc, e.t, e.pokazany);
          e.t = shagVremeni(dt, sk, e.t, e.start, stop);
          if (e.t >= stop - 1e-9) {
            e.t = stop;
            if (stop >= T_KON) {
              e.igraet = false;
              e.upal += 1;
            } else {
              e.pokazany += 1;
              e.derzhatDo = now + (SEK_SNIMOK * 1000) / sk;
            }
          }
        }
      }
      setKadr(snyat(e));
      raf.current = e.igraet ? requestAnimationFrame(kadr) : null;
    };
    raf.current = requestAnimationFrame(kadr);
  }, []);

  const pusk = useCallback(() => {
    const e = dv.current;
    if (e.igraet) {
      e.igraet = false;
      e.derzhatDo = 0;
      perisovat();
      return;
    }
    if (e.t >= T_KON - 1e-9) {
      e.t = 0;
      e.pokazany = 0;
    }
    e.start = e.t;
    e.igraet = true;
    e.zapuskalsya = true;
    cikl();
    perisovat();
  }, [cikl, perisovat]);

  const sbros = useCallback(() => {
    Object.assign(dv.current, novyyDvizhok(), { upal: dv.current.upal });
    perisovat();
  }, [perisovat]);

  const peremotat = useCallback(
    (novoe: number) => {
      const e = dv.current;
      const tt = Math.min(Math.max(novoe, 0), T_KON);
      const { t1, t2 } = korni(tek.current.H);
      e.t = tt;
      e.igraet = false;
      e.derzhatDo = 0;
      e.pokazany = tt >= t2 ? 2 : tt >= t1 ? 1 : 0;
      if (tt > 0) e.zapuskalsya = true;
      perisovat();
    },
    [perisovat],
  );

  const pomenyatH = (novoe: number) => {
    setH(novoe);
    Object.assign(dv.current, novyyDvizhok(), { upal: dv.current.upal });
    perisovat();
  };

  const klavishi = (e: KeyboardEvent<HTMLDivElement>) => {
    const cel = e.target as HTMLElement;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (cel.tagName === 'BUTTON') return;
      e.preventDefault();
      pusk();
      return;
    }
    const shag = e.shiftKey ? 0.25 : 0.05;
    const tt = dv.current.t;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      peremotat(Math.round((tt + shag) * 100) / 100);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      peremotat(Math.round((tt - shag) * 100) / 100);
    } else if (e.key === 'Home') {
      e.preventDefault();
      peremotat(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      peremotat(T_KON);
    }
  };

  /* ── Числа ── */
  const t = d.t;
  const { t1, t2, d: polu } = korni(H);
  const dtOtv = t2 - t1;
  const upal = t >= T_KON - 1e-9;
  const tD = tPodpis(t);
  const hNow = Math.max(0, h(t));

  /* ── KaTeX: только при смене чисел ── */
  const reshenie = useMemo(() => {
    const c = H - 1.2;
    const q = c / 5;
    return T.shagi(
      ruTex(H, 1),
      ruTex(c, 2),
      ruTex(q, 2),
      ruTex(1 - q, 2),
      ruTex(polu, 2),
      ruTex(t1, 2),
      ruTex(t2, 2),
      ruTex(dtOtv, 2),
    ).map((s) => typeset(s));
  }, [H, polu, t1, t2, dtOtv]);
  const shapka = useMemo(
    () => ({
      t: typeset(T.tablica.t),
      h: typeset(T.tablica.h),
      stroki: T.tablica.stroki.map((s) => typeset(s)),
      otmetka: typeset(T.otmetka),
    }),
    [],
  );
  const puzyr = useMemo(() => typeset(T.vremyaTex(ruTex(tD, 2))), [tD]);
  const itog = useMemo(() => typeset(T.tablica.itog(ruTex(dtOtv, 2))), [dtOtv]);

  let statusTex: string = T.status.start;
  const okolo = (a: number) => Math.abs(t - a) < 1e-6;
  if (upal) statusTex = T.status.upal(ruTex(dtOtv, 2));
  else if ((d.snimokIdet && okolo(t2)) || (!d.igraet && okolo(t2)))
    statusTex = T.status.t2(ruTex(t2, 2), ruTex(dtOtv, 2));
  else if ((d.snimokIdet && okolo(t1)) || (!d.igraet && okolo(t1)))
    statusTex = T.status.t1(ruTex(H, 1), ruTex(t1, 2));
  else if (t > t2) statusTex = T.status.vniz;
  else if (t > T_VERSH - 0.05 && t > t1) statusTex = T.status.vershina;
  else if (t > t1) statusTex = T.status.vyshe;
  else if (t > 0 || d.igraet) statusTex = T.status.vverh;
  const status = useMemo(() => typeset(statusTex), [statusTex]);

  const knopka = d.igraet ? T.pauza : upal ? T.eshche : t > 0 ? T.prodolzhit : T.zapustit;
  const dolya = t / T_KON;

  /* Моменты полёта для таблицы: момент, t, h. */
  const momenty: [number, string, string][] = [
    [0, '0', ru(1.2, 1)],
    [t1, ru(t1), ru(H, 1)],
    [T_VERSH, '1', ru(H_MAX, 1)],
    [t2, ru(t2), ru(H, 1)],
    [T_KON, '≈ 2,11', '0'],
  ];

  return (
    <div className="z10-my__osnova" onKeyDown={klavishi}>
      {/* Секундомер-таймлайн. */}
      <div className="z10-my__chasy">
        <svg className="z10-my__sekundomer" viewBox="-18 -21 36 39" aria-hidden="true">
          <rect
            x="-3"
            y="-21"
            width="6"
            height="4"
            rx="1.5"
            className="z10-my__sekundomer-knopka"
          />
          <circle r="16" className="z10-my__sekundomer-krug" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} y1="-13" y2={i % 3 === 0 ? -10 : -11.5} transform={`rotate(${i * 30})`} />
          ))}
          <line
            className="z10-my__sekundomer-strelka"
            y1="2"
            y2="-12"
            transform={`rotate(${(t * 360).toFixed(2)})`}
          />
          <circle r="1.6" className="z10-my__sekundomer-os" />
        </svg>
        <div className="z10-my__lenta" style={{ '--p': dolya } as CSSProperties}>
          <output className="z10-my__puzyr" htmlFor={`${id}-t`} aria-hidden="true">
            <span dangerouslySetInnerHTML={{ __html: puzyr }} />
          </output>
          <input
            id={`${id}-t`}
            className="z10-my__polzunok"
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(dolya * 1000)}
            aria-label={T.vremya}
            aria-valuetext={T.vremyaText(ru(tD))}
            onChange={(e) => peremotat((Number(e.currentTarget.value) / 1000) * T_KON)}
          />
          <div className="z10-my__metki" aria-hidden="true">
            {[0, 1, 2].map((s) => (
              <span
                key={s}
                style={{ '--k': s / T_KON } as CSSProperties}
                className={clsx(t >= s - 1e-9 && 'is-proydena')}
              >
                {T.vremyaText(String(s))}
              </span>
            ))}
            {[t1, t2].map((k, i) => (
              <i
                key={i}
                className={clsx('z10-my__metka-korna', t >= k - 1e-9 && 'is-proydena')}
                style={{ '--k': k / T_KON } as CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        ref={obertka}
        className={clsx('z10-my__scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.klaviatura}`}
      >
        {W > 0 ? <ScenaSvg id={id} W={W} H={H} t={t} d={d} dvizhenie={dvizhenie} /> : null}
      </div>

      <p
        className="z10-my__status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: status }}
      />

      <div className="z10-my__upr">
        <button
          type="button"
          className="stk-btn stk-btn--primary z10-my__pusk"
          onClick={pusk}
          aria-pressed={d.igraet}
        >
          <span
            className={clsx('z10-my__ikonka', d.igraet ? 'is-pauza' : 'is-pusk')}
            aria-hidden="true"
          />
          {knopka}
        </button>
        <button
          type="button"
          className="stk-btn stk-btn--tihaya"
          onClick={sbros}
          disabled={t === 0 && !d.igraet}
        >
          {T.snachala}
        </button>
        <div className="z10-my__seg" role="group" aria-label={T.skorostPokaza}>
          {([1, 2] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={clsx(skorost === k && 'is-on')}
              aria-pressed={skorost === k}
              onClick={() => setSkorost(k)}
            >
              ×{k}
            </button>
          ))}
        </div>
        <p className="z10-my__podskazka">{T.klaviatura}</p>
      </div>

      <div className="z10-my__otmetka">
        <span
          className="z10-my__otmetka-zag"
          id={`${id}-H`}
          dangerouslySetInnerHTML={{ __html: shapka.otmetka }}
        />
        <div className="z10-my__seg z10-my__seg--H" role="group" aria-labelledby={`${id}-H`}>
          {OTMETKI.map((k) => (
            <button
              key={k}
              type="button"
              className={clsx(H === k && 'is-on')}
              aria-pressed={H === k}
              onClick={() => pomenyatH(k)}
            >
              {T.otmetkaKnopka(ru(k, 1))}
            </button>
          ))}
        </div>
        <p className="z10-my__otmetka-lead">{T.otmetkaLead}</p>
      </div>

      <div className="z10-my__niz">
        <table className="z10-my__tablica">
          <caption>{T.tablica.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{T.tablica.moment}</th>
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.t }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.h }} />
            </tr>
          </thead>
          <tbody>
            <tr className="z10-my__seychas">
              <th scope="row">{T.tablica.seychas}</th>
              <td>{ru(tD)}</td>
              <td>{ru(hNow, 2)}</td>
            </tr>
            {momenty.map(([tm, ts, hs], i) => {
              const est = i === 0 || t >= tm - 1e-9;
              const koren = i === 1 || i === 3;
              return (
                <tr key={i} className={clsx(est && 'is-est', koren && 'is-koren')}>
                  <th scope="row" dangerouslySetInnerHTML={{ __html: shapka.stroki[i] ?? '' }} />
                  <td>{est ? ts : '—'}</td>
                  <td>{est ? hs : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={clsx(t >= t2 - 1e-9 && 'is-est')}>
              <td
                colSpan={3}
                dangerouslySetInnerHTML={{ __html: t >= t2 - 1e-9 ? itog : '&nbsp;' }}
              />
            </tr>
          </tfoot>
        </table>

        <div className={clsx('z10-my__reshenie', upal && 'is-vidno')} aria-hidden={!upal}>
          <p className="stk-nad">{T.reshenie}</p>
          <ol>
            {reshenie.map((html, i) => (
              <li
                key={`${H}-${i}`}
                style={{ '--i': i } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ── SVG сцены ── */

function ScenaSvg({
  id,
  W,
  H,
  t,
  d,
  dvizhenie,
}: {
  id: string;
  W: number;
  H: number;
  t: number;
  d: Kadr;
  dvizhenie: MotionLevel;
}) {
  const r = razmetka(W);
  const { t1, t2 } = korni(H);
  const hNow = Math.max(0, h(t));
  const vyshe = hNow >= H - 1e-9 && t > 0;
  const tiho = dvizhenie === 'reduce';

  /* Мяч: в руке до броска, у земли — касается её. */
  const yMyach = Math.min(yH(r, hNow), r.yZemlya - r.rMyach);
  const ugol = tiho ? 0 : t * 520;
  /* Взмах руки: за 0,12 с вверх, к 0,9 с — опускается. */
  const ruka = tiho
    ? t > 0
      ? 2
      : 0
    : t <= 0
      ? 0
      : t < 0.12
        ? t / 0.12
        : t < 0.45
          ? 1
          : 1 + Math.min(1, (t - 0.45) / 0.45);

  /* График. */
  const N = 120;
  const tochki = (a: number, b: number) => {
    const out: string[] = [];
    if (b <= a) return '';
    for (let i = 0; i <= N; i += 1) {
      const tt = a + ((b - a) * i) / N;
      out.push(`${xT(r, tt).toFixed(1)},${yH(r, Math.max(0, h(tt))).toFixed(1)}`);
    }
    return out.join(' ');
  };
  const vsya = tochki(0, T_KON);
  const proydeno = tochki(0, t);
  const duga = t > t1 ? tochki(t1, Math.min(t, t2)) : '';
  const px = xT(r, t);
  const py = yH(r, hNow);
  const yOtm = yH(r, H);

  /* Подписи корней и промежутка — в своих рядах, разведены. */
  const l1 = T.podpisT1(ru(t1));
  const l2 = T.podpisT2(ru(t2));
  const [c1, c2] = razvesti(
    { c: xT(r, t1), w: shirina(l1) + 14 },
    { c: xT(r, t2), w: shirina(l2) + 14 },
    r.xRazdel,
    W - r.pole,
    6,
  );
  const vyshePor = Math.max(0, Math.min(t, t2) - t1);
  const gotovo = t >= t2 - 1e-9;
  const lp = T.podpisPromezhutok(ru(vyshePor), gotovo);
  const cp = prizhat(
    (xT(r, t1) + xT(r, Math.min(Math.max(t, t1), t2))) / 2,
    shirina(lp) + 14,
    r.xRazdel,
    W - r.pole,
  );

  const legenda = T.podpisH(ru(H, 1));
  const lw = shirina(legenda);

  const deleniya = deleniyaT(r);
  const vysoty = Array.from({ length: H_SHKALY + 1 }, (_, i) => i);
  const tenR = r.rMyach * 1.4 * (1 - Math.min(hNow, 8) / 10);

  return (
    <svg
      className="z10-my__svg"
      width={W}
      height={r.H}
      viewBox={`0 0 ${W} ${r.H}`}
      role="img"
      aria-label={T.alt}
    >
      <defs>
        <radialGradient id={`${id}-myach`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#eaf2ff" />
          <stop offset="0.45" stopColor="#5b8fe8" />
          <stop offset="1" stopColor="#1a4fb0" />
        </radialGradient>
        <radialGradient id={`${id}-myach-vyshe`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff4dc" />
          <stop offset="0.45" stopColor="#f4a24a" />
          <stop offset="1" stopColor="#c2502e" />
        </radialGradient>
        <radialGradient id={`${id}-svet`}>
          <stop offset="0" stopColor="#ffc35a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffc35a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-lineyka`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#dbe6fa" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}-pol`}>
          <stop offset="0" stopColor="#1f5fd0" stopOpacity="0.2" />
          <stop offset="1" stopColor="#1f5fd0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-zona`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f08a24" stopOpacity="0.14" />
          <stop offset="1" stopColor="#f08a24" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* ── Стойка ── */}
      <rect
        className="z10-my__stoyka"
        x={r.pole / 2}
        y="6"
        width={r.xRazdel - r.pole / 2}
        height={r.yZemlya + 26 - 6}
        rx="16"
      />
      <ellipse
        cx={(r.xLineyka + r.xRazdel) / 2}
        cy={r.yZemlya + 6}
        rx={(r.xRazdel - r.xLineyka) / 2 + 6}
        ry="12"
        fill={`url(#${id}-pol)`}
      />
      <rect
        className="z10-my__zemlya"
        x={r.pole}
        y={r.yZemlya}
        width={r.xRazdel - r.pole - 6}
        height="8"
        rx="4"
      />
      <rect
        className="z10-my__lineyka"
        x={r.xLineyka - 4}
        y={yH(r, H_SHKALY) - 4}
        width="8"
        height={r.yZemlya - yH(r, H_SHKALY) + 4}
        rx="4"
        fill={`url(#${id}-lineyka)`}
      />
      {vysoty.map((k) => (
        <g key={k}>
          <line
            className="z10-my__shtrih is-krupnyy"
            x1={r.xLineyka + 4}
            x2={r.xLineyka + 10}
            y1={yH(r, k)}
            y2={yH(r, k)}
          />
          {k < H_SHKALY ? (
            <line
              className="z10-my__shtrih"
              x1={r.xLineyka + 4}
              x2={r.xLineyka + 7}
              y1={yH(r, k + 0.5)}
              y2={yH(r, k + 0.5)}
            />
          ) : null}
          <text
            className="z10-my__chislo"
            x={r.xLineyka - 8}
            y={yH(r, k)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {k}
          </text>
        </g>
      ))}

      {/* ── График ── */}
      <rect
        className="z10-my__zona"
        x={xT(r, t1)}
        y={yH(r, H_SHKALY)}
        width={xT(r, t2) - xT(r, t1)}
        height={r.yZemlya - yH(r, H_SHKALY)}
        fill={`url(#${id}-zona)`}
      />
      {vysoty.map((k) => (
        <line key={k} className="z10-my__setka" x1={r.gx0} x2={r.gx1} y1={yH(r, k)} y2={yH(r, k)} />
      ))}
      {deleniya.map((s) => (
        <g key={s}>
          <line
            className="z10-my__setka"
            x1={xT(r, s)}
            x2={xT(r, s)}
            y1={r.yZemlya}
            y2={yH(r, H_SHKALY)}
          />
          <text
            className="z10-my__chislo"
            x={xT(r, s)}
            y={r.yDeleniya}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {ru(s, 1)}
          </text>
        </g>
      ))}
      {vysoty.map((k) => (
        <text
          key={k}
          className="z10-my__chislo"
          x={r.gx0 - 7}
          y={yH(r, k)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {k}
        </text>
      ))}
      <path className="z10-my__os" d={`M${r.gx0} ${r.yZemlya} H${r.gx1 + 6} m-6 -4 l6 4 l-6 4`} />
      <path
        className="z10-my__os"
        d={`M${r.gx0} ${r.yZemlya} V${yH(r, H_SHKALY) - 8} m-4 6 l4 -6 l4 6`}
      />
      <text className="z10-my__os-podpis" x={r.gx1 + 2} y={r.yZemlya - 12} textAnchor="end">
        <tspan className="z10-os-bukva">t</tspan>, с
      </text>
      <text className="z10-my__os-podpis" x={r.gx0 + 8} y={yH(r, H_SHKALY) - 2}>
        <tspan className="z10-os-bukva">h</tspan>, м
      </text>

      {/* Отметка H — через обе части, легенда в правом верхнем углу графика. */}
      <line className="z10-my__otmetka-liniya" x1={r.xLineyka} x2={r.gx1} y1={yOtm} y2={yOtm} />
      <g
        className="z10-my__legenda"
        transform={`translate(${(r.gx1 - lw - 34).toFixed(1)} ${yH(r, H_SHKALY) + 2})`}
      >
        <rect x="-6" y="-11" width={lw + 40} height="22" rx="11" />
        <line x1="0" x2="18" y1="0" y2="0" />
        <text x="24" y="0.5" dominantBaseline="middle">
          {legenda}
        </text>
      </g>

      <polyline className="z10-my__parabola-ten" points={vsya} />
      {proydeno ? <polyline className="z10-my__parabola" points={proydeno} /> : null}
      {duga ? <polyline className="z10-my__duga" points={duga} /> : null}

      {/* Вершина. */}
      {t >= T_VERSH - 1e-9 && !r.uzkaya ? (
        <g className="z10-my__vershina">
          <circle cx={xT(r, T_VERSH)} cy={yH(r, H_MAX)} r="3.5" />
          <text x={xT(r, T_VERSH) - 8} y={yH(r, H_MAX) - 10} textAnchor="end">
            {T.podpisVersh(ru(H_MAX, 1))}
          </text>
        </g>
      ) : null}

      {/* Корни: опускаются на ось, когда мяч их прошёл. */}
      {[
        [t1, c1, l1],
        [t2, c2, l2],
      ].map(([k, c, l]) =>
        t >= (k as number) - 1e-9 ? (
          <g key={l as string} className="z10-my__koren">
            <line x1={xT(r, k as number)} x2={xT(r, k as number)} y1={yOtm} y2={r.yZemlya + 26} />
            <circle cx={xT(r, k as number)} cy={yOtm} r="5" />
            <Podpis x={c as number} y={r.yKorni} text={l as string} klass="is-koren" />
          </g>
        ) : null,
      )}

      {/* Промежуток на оси t: растёт, пока мяч выше. */}
      {t > t1 ? (
        <g className={clsx('z10-my__promezhutok', gotovo && 'is-gotovo')}>
          <line x1={xT(r, t1)} x2={xT(r, Math.min(t, t2))} y1={r.yZemlya} y2={r.yZemlya} />
          <Podpis x={cp} y={r.yPromezhutok} text={lp} klass="is-promezhutok" />
        </g>
      ) : null}

      {/* Связь мяча и точки графика: одна высота. */}
      {t > 0 && !upalLi(t) ? (
        <line className="z10-my__svyaz" x1={r.xMyach + r.rMyach + 4} x2={px - 6} y1={py} y2={py} />
      ) : null}
      {t > 0 ? (
        <circle className={clsx('z10-my__tochka', vyshe && 'is-vyshe')} cx={px} cy={py} r="6" />
      ) : null}

      {/* ── Бросающий и мяч ── */}
      <Chelovek r={r} ruka={ruka} />
      <ellipse
        className="z10-my__myach-ten"
        cx={r.xMyach}
        cy={r.yZemlya + 3}
        rx={Math.max(2, tenR)}
        ry={Math.max(1, tenR * 0.3)}
        opacity={0.15 + 0.35 * (1 - Math.min(hNow, 7) / 7)}
      />
      {d.upal > 0 && upalLi(t) && !tiho ? (
        <ellipse
          key={`v${d.upal}`}
          className="z10-my__volna"
          cx={r.xMyach}
          cy={r.yZemlya + 3}
          rx={r.rMyach * 2.4}
          ry={r.rMyach * 0.7}
        />
      ) : null}
      <Myach
        id={id}
        x={r.xMyach}
        y={yMyach}
        rr={r.rMyach}
        ugol={ugol}
        vyshe={vyshe}
        prizemlenie={upalLi(t) && !tiho ? d.upal : 0}
      />
    </svg>
  );
}

function upalLi(t: number): boolean {
  return t >= T_KON - 1e-9;
}
