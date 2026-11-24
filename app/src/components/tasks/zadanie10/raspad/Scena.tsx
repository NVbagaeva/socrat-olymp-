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
import { RASPAD10 } from '@/content/zhivye10';
import { motionLevel, type MotionLevel } from '@/lib/motion';
import { typeset } from '@/lib/tex';
import {
  CELI,
  CEL_DEFAULT,
  M0,
  PERIOD,
  PERIODOV,
  SEK_SNIMOK,
  T_MAX,
  m,
  mestoYadra,
  otvet,
  prizhat,
  raz,
  razmetka,
  ru,
  ruTex,
  shagVremeni,
  shirinaPriblizitelno,
  sleduyushayaOstanovka,
  tPodpis,
  xT,
  yM,
  yadra,
  zhivyh,
  type Razmetka,
  type Yadro,
} from '@/lib/zadanie10/raspad';
import './raspad.css';

/**
 * «Распад изотопа» — сцена целиком: секундомер-таймлайн, слева
 * стеклянная пробирка с 64 ядрами и столбик массы, справа график m(t)
 * в том же масштабе (верх столбика и точка графика на одной
 * горизонтали), таблица по периодам и решение уравнения в KaTeX.
 *
 * Модельное время t (минуты) — единственный источник правды: какие ядра
 * живы, масса, график, подписи и таблица считаются из него. Ход времени —
 * requestAnimationFrame с разгоном и торможением к паузам-«снимкам» на
 * каждом периоде полураспада (lib/zadanie10/raspad.ts). Сцена рисуется
 * в пикселях контейнера, подписи — от 13 px. Грузится лениво.
 */

const T = RASPAD10;
const FONT_PX = 13;
/** Вспышка распада длится столько минут модельного времени. */
const VSPYSHKA_MIN = 0.7;

interface Dvizhok {
  t: number;
  start: number;
  igraet: boolean;
  derzhatDo: number;
  zapuskalsya: boolean;
}

interface Kadr {
  t: number;
  igraet: boolean;
  snimokIdet: boolean;
  zapuskalsya: boolean;
}

function novyyDvizhok(): Dvizhok {
  return { t: 0, start: 0, igraet: false, derzhatDo: 0, zapuskalsya: false };
}

function snyat(d: Dvizhok): Kadr {
  return { t: d.t, igraet: d.igraet, snimokIdet: d.derzhatDo > 0, zapuskalsya: d.zapuskalsya };
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
    <g className={clsx('z10-rs__podpis', klass)} transform={`translate(${x.toFixed(2)} ${y})`}>
      <rect x={-w / 2 - 7} y="-11" width={w + 14} height="22" rx="11" />
      <text textAnchor="middle" y="0.5" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

const YADRA = yadra();

export default function Scena() {
  const id = useId().replace(/:/g, '');
  const [cel, setCel] = useState<number>(CEL_DEFAULT);
  const [skorost, setSkorost] = useState<1 | 2>(1);
  const [W, setW] = useState(0);
  const [dvizhenie, setDvizhenie] = useState<MotionLevel>('full');
  const [d, setKadr] = useState<Kadr>(() => snyat(novyyDvizhok()));

  const dv = useRef<Dvizhok>(novyyDvizhok());
  const raf = useRef<number | null>(null);
  const obertka = useRef<HTMLDivElement>(null);
  const tek = useRef({ skorost });
  useLayoutEffect(() => {
    tek.current = { skorost };
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
      const sk = tek.current.skorost;
      if (e.igraet) {
        if (e.derzhatDo > 0) {
          if (now >= e.derzhatDo) {
            e.derzhatDo = 0;
            e.start = e.t;
          }
        } else {
          const stop = sleduyushayaOstanovka(e.t);
          e.t = shagVremeni(dt, sk, e.t, e.start, stop);
          if (e.t >= stop - 1e-9) {
            e.t = stop;
            if (stop >= T_MAX) e.igraet = false;
            else e.derzhatDo = now + (SEK_SNIMOK * 1000) / sk;
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
    if (e.t >= T_MAX - 1e-9) e.t = 0;
    e.start = e.t;
    e.igraet = true;
    e.zapuskalsya = true;
    cikl();
    perisovat();
  }, [cikl, perisovat]);

  const sbros = useCallback(() => {
    Object.assign(dv.current, novyyDvizhok());
    perisovat();
  }, [perisovat]);

  const peremotat = useCallback(
    (novoe: number) => {
      const e = dv.current;
      e.t = Math.min(Math.max(novoe, 0), T_MAX);
      e.igraet = false;
      e.derzhatDo = 0;
      if (e.t > 0) e.zapuskalsya = true;
      perisovat();
    },
    [perisovat],
  );

  const klavishi = (e: KeyboardEvent<HTMLDivElement>) => {
    const cel0 = e.target as HTMLElement;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (cel0.tagName === 'BUTTON') return;
      e.preventDefault();
      pusk();
      return;
    }
    const shag = e.shiftKey ? PERIOD : 1;
    const tt = dv.current.t;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      peremotat(Math.round(tt + shag));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      peremotat(Math.round(tt - shag));
    } else if (e.key === 'Home') {
      e.preventDefault();
      peremotat(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      peremotat(T_MAX);
    }
  };

  /* ── Числа ── */
  const t = d.t;
  const tD = tPodpis(t);
  const mNow = m(t);
  const otv = otvet(cel);
  const dostignuto = t >= otv.t - 1e-9;
  const konec = t >= T_MAX - 1e-9;

  /* ── KaTeX: только при смене чисел ── */
  const reshenie = useMemo(
    () => T.shagi(ruTex(cel, 1), otv.raz, otv.k, otv.t).map((s) => typeset(s)),
    [cel, otv.raz, otv.k, otv.t],
  );
  const shapka = useMemo(
    () => ({ t: typeset(T.tablica.t), m: typeset(T.tablica.m), cel: typeset(T.cel) }),
    [],
  );
  const puzyr = useMemo(() => typeset(T.vremyaTex(ruTex(tD, 1))), [tD]);

  /* Строка состояния. */
  const kTochno = Math.round(t / PERIOD);
  const naPeriode = t > 0 && Math.abs(t - kTochno * PERIOD) < 1e-6 && (d.snimokIdet || !d.igraet);
  let statusTex: string = T.status.start;
  if (konec) statusTex = T.status.konec;
  else if (naPeriode)
    statusTex =
      T.status.period(kTochno, kTochno * PERIOD, ruTex(m(kTochno * PERIOD), 2), raz(kTochno)) +
      (kTochno === otv.k ? T.status.otvet(otv.t, ruTex(cel, 1)) : '');
  else if (t > PERIOD) statusTex = T.status.dalshe;
  else if (t > 0 || d.igraet) statusTex = T.status.idet;
  const status = useMemo(() => typeset(statusTex), [statusTex]);

  const knopka = d.igraet ? T.pauza : konec ? T.eshche : t > 0 ? T.prodolzhit : T.zapustit;
  const dolya = t / T_MAX;

  return (
    <div className="z10-rs__osnova" onKeyDown={klavishi}>
      {/* Секундомер-таймлайн. */}
      <div className="z10-rs__chasy">
        <svg className="z10-rs__sekundomer" viewBox="-18 -21 36 39" aria-hidden="true">
          <rect
            x="-3"
            y="-21"
            width="6"
            height="4"
            rx="1.5"
            className="z10-rs__sekundomer-knopka"
          />
          <circle r="16" className="z10-rs__sekundomer-krug" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} y1="-13" y2={i % 3 === 0 ? -10 : -11.5} transform={`rotate(${i * 30})`} />
          ))}
          <line
            className="z10-rs__sekundomer-strelka"
            y1="2"
            y2="-12"
            transform={`rotate(${((t / PERIOD) * 360).toFixed(2)})`}
          />
          <circle r="1.6" className="z10-rs__sekundomer-os" />
        </svg>
        <div className="z10-rs__lenta" style={{ '--p': dolya } as CSSProperties}>
          <output className="z10-rs__puzyr" htmlFor={`${id}-t`} aria-hidden="true">
            <span dangerouslySetInnerHTML={{ __html: puzyr }} />
          </output>
          <input
            id={`${id}-t`}
            className="z10-rs__polzunok"
            type="range"
            min={0}
            max={T_MAX * 10}
            step={1}
            value={Math.round(t * 10)}
            aria-label={T.vremya}
            aria-valuetext={T.vremyaText(ru(tD, 1))}
            onChange={(e) => peremotat(Number(e.currentTarget.value) / 10)}
          />
          <div className="z10-rs__metki" aria-hidden="true">
            {Array.from({ length: PERIODOV + 1 }, (_, k) => (
              <span
                key={k}
                style={{ '--k': k / PERIODOV } as CSSProperties}
                className={clsx(t >= k * PERIOD - 1e-9 && 'is-proydena', k === otv.k && 'is-otvet')}
              >
                {k * PERIOD}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={obertka}
        className={clsx('z10-rs__scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.klaviatura}`}
      >
        {W > 0 ? <ScenaSvg id={id} W={W} cel={cel} t={t} dvizhenie={dvizhenie} /> : null}
      </div>

      <p
        className="z10-rs__status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: status }}
      />

      <div className="z10-rs__upr">
        <button
          type="button"
          className="stk-btn stk-btn--primary z10-rs__pusk"
          onClick={pusk}
          aria-pressed={d.igraet}
        >
          <span
            className={clsx('z10-rs__ikonka', d.igraet ? 'is-pauza' : 'is-pusk')}
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
        <div className="z10-rs__seg" role="group" aria-label={T.skorostPokaza}>
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
        <p className="z10-rs__podskazka">{T.klaviatura}</p>
      </div>

      <div className="z10-rs__cel">
        <span
          className="z10-rs__cel-zag"
          id={`${id}-cel`}
          dangerouslySetInnerHTML={{ __html: shapka.cel }}
        />
        <div className="z10-rs__seg z10-rs__seg--cel" role="group" aria-labelledby={`${id}-cel`}>
          {CELI.map((k) => (
            <button
              key={k}
              type="button"
              className={clsx(cel === k && 'is-on')}
              aria-pressed={cel === k}
              onClick={() => setCel(k)}
            >
              {T.celKnopka(ru(k, 1))}
            </button>
          ))}
        </div>
        <p className="z10-rs__cel-lead">{T.celLead}</p>
      </div>

      <div className="z10-rs__niz">
        <table className="z10-rs__tablica">
          <caption>{T.tablica.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{T.tablica.k}</th>
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.t }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.m }} />
              <th scope="col">{T.tablica.raz}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="z10-rs__seychas">
              <th scope="row">{T.tablica.seychas}</th>
              <td>{ru(tD, 1)}</td>
              <td>{ru(mNow, 2)}</td>
              <td>{ru(M0 / mNow, 2)}</td>
            </tr>
            {Array.from({ length: PERIODOV + 1 }, (_, k) => {
              const est = k === 0 || t >= k * PERIOD - 1e-9;
              return (
                <tr key={k} className={clsx(est && 'is-est', k === otv.k && 'is-otvet')}>
                  <th scope="row">{k}</th>
                  <td>{est ? k * PERIOD : '—'}</td>
                  <td>{est ? ru(M0 / 2 ** k, 2) : '—'}</td>
                  <td>{est ? 2 ** k : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          className={clsx('z10-rs__reshenie', dostignuto && 'is-vidno')}
          aria-hidden={!dostignuto}
        >
          <p className="stk-nad">{T.reshenie}</p>
          <ol>
            {reshenie.map((html, i) => (
              <li
                key={`${cel}-${i}`}
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

function Yadra({ r, t, dvizhenie }: { r: Razmetka; t: number; dvizhenie: MotionLevel }) {
  const tiho = dvizhenie === 'reduce';
  return (
    <g className="z10-rs__yadra">
      {YADRA.map((y: Yadro, i) => {
        const p = mestoYadra(r, y);
        const zhivo = y.zhizn > t + 1e-9;
        const drozh = tiho || !zhivo ? 0 : 0.8;
        const x = p.x + drozh * Math.sin(t * 2.3 + y.faza);
        const yy = p.y + drozh * Math.cos(t * 1.9 + y.faza * 1.3);
        const posle = t - y.zhizn;
        const vspyshka = !tiho && posle >= 0 && posle < VSPYSHKA_MIN ? posle / VSPYSHKA_MIN : null;
        return (
          <g key={i}>
            {vspyshka !== null ? (
              <circle
                className="z10-rs__vspyshka"
                cx={x}
                cy={yy}
                r={p.rad * (1 + 2.6 * vspyshka)}
                opacity={1 - vspyshka}
              />
            ) : null}
            <circle
              className={clsx('z10-rs__yadro', zhivo ? 'is-zhivo' : 'is-raspalos')}
              cx={x.toFixed(2)}
              cy={yy.toFixed(2)}
              r={zhivo ? p.rad : p.rad * 0.62}
            />
          </g>
        );
      })}
    </g>
  );
}

function ScenaSvg({
  id,
  W,
  cel,
  t,
  dvizhenie,
}: {
  id: string;
  W: number;
  cel: number;
  t: number;
  dvizhenie: MotionLevel;
}) {
  const r = razmetka(W);
  const mNow = m(t);
  const otv = otvet(cel);
  const dostignuto = t >= otv.t - 1e-9;

  /* Кривая: тень целиком, пройденная часть — сплошная. */
  const N = 140;
  const tochki = (a: number, b: number) => {
    if (b <= a) return '';
    const out: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const tt = a + ((b - a) * i) / N;
      out.push(`${xT(r, tt).toFixed(1)},${yM(r, m(tt)).toFixed(1)}`);
    }
    return out.join(' ');
  };
  const vsya = tochki(0, T_MAX);
  const proydeno = tochki(0, t);
  const px = xT(r, t);
  const py = yM(r, mNow);

  /* Пройденные периоды: «лесенка» половин. */
  const kProydeno = Math.floor(t / PERIOD + 1e-9);
  const urovni = [16, 8, 4, 2, 1, 0.5];
  const yCel = yM(r, cel);
  const legenda = T.podpisCel(ru(cel, 1));
  const lw = shirina(legenda);
  const lo = T.podpisOtvet(String(otv.t));
  const lox = prizhat(xT(r, otv.t), shirina(lo) + 14, r.xRazdel, W - r.pole);
  const zhivyhSeychas = zhivyh(YADRA, t);

  return (
    <svg
      className="z10-rs__svg"
      width={W}
      height={r.H}
      viewBox={`0 0 ${W} ${r.H}`}
      role="img"
      aria-label={T.alt}
    >
      <defs>
        <radialGradient id={`${id}-yadro`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#eaf2ff" />
          <stop offset="0.5" stopColor="#5b8fe8" />
          <stop offset="1" stopColor="#1a4fb0" />
        </radialGradient>
        <linearGradient id={`${id}-steklo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#e6eefc" stopOpacity="0.45" />
          <stop offset="1" stopColor="#c9d8f4" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${id}-stolbik`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8fe8" />
          <stop offset="1" stopColor="#1a4fb0" />
        </linearGradient>
        <radialGradient id={`${id}-pol`}>
          <stop offset="0" stopColor="#1f5fd0" stopOpacity="0.2" />
          <stop offset="1" stopColor="#1f5fd0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Панель: пробирка и столбик массы ── */}
      <rect
        className="z10-rs__panel"
        x={r.pole / 2}
        y="6"
        width={r.xRazdel - r.pole / 2}
        height={r.yNol + 30 - 6}
        rx="16"
      />
      <ellipse
        cx={r.px0 + r.pw / 2}
        cy={r.yNol + 6}
        rx={r.pw / 2 + 10}
        ry="10"
        fill={`url(#${id}-pol)`}
      />
      <g className={clsx('z10-rs__probirka', zhivyhSeychas === 0 && 'is-pusto')}>
        <rect
          className="z10-rs__probirka-telo"
          x={r.px0}
          y={r.py0}
          width={r.pw}
          height={r.py1 - r.py0}
          rx="14"
          fill={`url(#${id}-steklo)`}
        />
        <Yadra r={r} t={t} dvizhenie={dvizhenie} />
        <rect
          className="z10-rs__probirka-blik"
          x={r.px0 + 5}
          y={r.py0 + 12}
          width="3"
          height={(r.py1 - r.py0) * 0.6}
          rx="1.5"
        />
        <rect
          className="z10-rs__probirka-kryshka"
          x={r.px0 - 3}
          y={r.py0 - 8}
          width={r.pw + 6}
          height="12"
          rx="5"
        />
      </g>
      <text
        className="z10-rs__yadro-podpis"
        x={r.px0 + r.pw / 2}
        y={r.py0 - 18}
        textAnchor="middle"
      >
        {`${zhivyhSeychas} / 64`}
      </text>

      {/* Столбик массы — в масштабе графика. */}
      <rect
        className="z10-rs__stolbik-fon"
        x={r.xStolbik - 6}
        y={yM(r, M0) - 4}
        width="12"
        height={M0 * r.pxMg + 4}
        rx="6"
      />
      <rect
        className="z10-rs__stolbik"
        x={r.xStolbik - 4}
        y={py}
        width="8"
        height={Math.max(0, r.yNol - py)}
        rx="4"
        fill={`url(#${id}-stolbik)`}
      />

      {/* ── График ── */}
      {urovni.slice(0, 5).map((u) => (
        <line key={u} className="z10-rs__setka" x1={r.gx0} x2={r.gx1} y1={yM(r, u)} y2={yM(r, u)} />
      ))}
      {Array.from({ length: PERIODOV + 1 }, (_, k) => (
        <g key={k}>
          <line
            className="z10-rs__setka"
            x1={xT(r, k * PERIOD)}
            x2={xT(r, k * PERIOD)}
            y1={r.yNol}
            y2={yM(r, M0)}
          />
          <text
            className="z10-rs__chislo"
            x={xT(r, k * PERIOD)}
            y={r.yDeleniya}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {k * PERIOD}
          </text>
        </g>
      ))}
      {urovni.slice(0, 5).map((u) => (
        <text
          key={u}
          className="z10-rs__chislo"
          x={r.gx0 - 7}
          y={yM(r, u)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {u}
        </text>
      ))}
      <path className="z10-rs__os" d={`M${r.gx0} ${r.yNol} H${r.gx1 + 8} m-6 -4 l6 4 l-6 4`} />
      <path className="z10-rs__os" d={`M${r.gx0} ${r.yNol} V${yM(r, M0) - 12} m-4 6 l4 -6 l4 6`} />
      {r.uzkaya ? (
        <text className="z10-rs__os-podpis" x={r.gx1 + 8} y={r.yNol - 10} textAnchor="end">
          t
        </text>
      ) : (
        <text className="z10-rs__os-podpis" x={r.gx1 + 14} y={r.yNol} dominantBaseline="middle">
          <tspan className="z10-os-bukva">t</tspan>, мин
        </text>
      )}
      <text className="z10-rs__os-podpis" x={r.gx0 + 8} y={yM(r, M0) - 8}>
        <tspan className="z10-os-bukva">m</tspan>, мг
      </text>

      {/* Целевая масса и легенда в правом верхнем углу. */}
      <line className="z10-rs__cel-liniya" x1={r.xStolbik} x2={r.gx1} y1={yCel} y2={yCel} />
      <g
        className="z10-rs__legenda"
        transform={`translate(${(r.gx1 - lw - 34).toFixed(1)} ${yM(r, M0) + 2})`}
      >
        <rect x="-6" y="-11" width={lw + 40} height="22" rx="11" />
        <line x1="0" x2="18" y1="0" y2="0" />
        <text x="24" y="0.5" dominantBaseline="middle">
          {legenda}
        </text>
      </g>

      <polyline className="z10-rs__krivaya-ten" points={vsya} />

      {/* Лесенка половин: от каждой пройденной точки — к осям. */}
      {Array.from({ length: kProydeno + 1 }, (_, k) => {
        const x = xT(r, k * PERIOD);
        const y = yM(r, M0 / 2 ** k);
        const etoOtvet = k === otv.k;
        return (
          <g key={k} className={clsx('z10-rs__stupen', etoOtvet && 'is-otvet')}>
            <path d={`M${r.gx0} ${y} H${x} V${r.yNol}`} />
            <circle cx={x} cy={y} r={etoOtvet ? 5.5 : 4} />
            {k > 0 && !r.uzkaya ? (
              <text x={x + 8} y={y - 8} className="z10-rs__dva">
                {T.podpisDva}
              </text>
            ) : null}
          </g>
        );
      })}

      {proydeno ? <polyline className="z10-rs__krivaya" points={proydeno} /> : null}

      {/* Ответ: момент, когда масса стала целевой. */}
      {dostignuto ? (
        <g className="z10-rs__otvet">
          <line x1={xT(r, otv.t)} x2={xT(r, otv.t)} y1={yCel} y2={r.yNol + 28} />
          <Podpis x={lox} y={r.yOtvet} text={lo} klass="is-otvet" />
        </g>
      ) : null}

      {/* Связь столбика и точки графика. */}
      {t > 0 ? (
        <line className="z10-rs__svyaz" x1={r.xStolbik + 8} x2={px - 6} y1={py} y2={py} />
      ) : null}
      <circle className="z10-rs__tochka" cx={px} cy={py} r="6" />
    </svg>
  );
}
