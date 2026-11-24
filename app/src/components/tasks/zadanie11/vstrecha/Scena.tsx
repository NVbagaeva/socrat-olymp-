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
  type KeyboardEvent,
} from 'react';
import { VSTRECHA11 } from '@/content/tekstovye11';
import { assetUrl } from '@/lib/assetUrl';
import { motionLevel, type MotionLevel } from '@/lib/motion';
import { typeset } from '@/lib/tex';
import {
  SEK_SNIMOK,
  VSTRECHA_DEFAULT,
  VSTRECHA_DIAPAZON,
  kmVPx,
  otmetki,
  polozhenie,
  prizhat,
  rasstoyanie,
  razmetka,
  razvesti,
  ru,
  sblizhenie,
  shagVremeni,
  shirinaPriblizitelno,
  sleduyushayaOstanovka,
  tPodpis,
  type Razmetka,
  type VstrechaChisla,
} from '@/lib/zadanie11/vstrecha';
import { Putnik } from './Putnik';
import './vstrecha.css';

/**
 * «Встречное движение» — сцена целиком: часы-таймлайн, дорога с
 * отметками, путники с походкой, таблица S, v, t и решение в KaTeX.
 *
 * Модельное время t (часы) — единственный источник правды: положения,
 * подписи, таблица и бегунок считаются из него на каждом кадре. Ход
 * времени — requestAnimationFrame с разгоном и торможением
 * (lib/zadanie11/vstrecha.ts → shagVremeni), поэтому подписи «4t = …»
 * всегда сходятся с тем, где стоит фигурка. Бегунок и стрелки ставят t
 * напрямую — перемотка в обе стороны.
 *
 * Сцена рисуется в пикселях контейнера (viewBox = ширина), а не
 * масштабируется: подписи на телефоне остаются 13 px. Грузится лениво
 * (Vstrecha11Lazy), вместе с KaTeX и своими стилями.
 */

const T = VSTRECHA11;
const SIN = '#1f5fd0';
const TERRA = '#c4553a';
/** Шаг фигурки, px пути на полшага. */
const POLSHAGA = 17;
/** Конфетти: длительность, с, и число стеклянных частиц. */
const KONFETTI_SEK = 1.7;
const KONFETTI_N = 22;
const FONT_PX = 13;

interface Chastica {
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vrot: number;
  ton: string;
}

interface Dvizhok {
  t: number;
  /** Откуда пошёл разгон. */
  start: number;
  igraet: boolean;
  snimokPokazan: boolean;
  /** До какого момента (performance.now) держится снимок; 0 — не держится. */
  derzhatDo: number;
  /** Пройденный путь в px — фаза шага. */
  shag1: number;
  shag2: number;
  konfetti: { t0: number; chasticy: Chastica[] } | null;
  /** Номер встречи: перезапускает вспышку. */
  vstrecha: number;
  zapuskalsya: boolean;
}

/* ── Ширина текста ─────────────────────────────────────────────── */

let holst: CanvasRenderingContext2D | null | undefined;
const kesh = new Map<string, number>();
function shirina(text: string, px = FONT_PX): number {
  const key = `${px}|${text}`;
  const est = kesh.get(key);
  if (est !== undefined) return est;
  if (holst === undefined) {
    holst =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (holst !== null) {
      const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
      holst.font = `600 ${px}px ${family}`;
    }
  }
  let w = shirinaPriblizitelno(text, px);
  if (holst !== null) {
    w = holst.measureText(text).width * (px / FONT_PX);
  }
  kesh.set(key, w);
  return w;
}

/* ── Части сцены ───────────────────────────────────────────────── */

function Plashka({
  x,
  y,
  text,
  w,
  napravo,
}: {
  x: number;
  y: number;
  text: string;
  w: number;
  napravo: boolean;
}) {
  const pw = w + 32;
  return (
    <g className="z11-vst__plashka" transform={`translate(${(x - pw / 2).toFixed(2)} ${y - 13})`}>
      <rect width={pw} height="26" rx="13" />
      <text x={napravo ? 11 : 21} y="13.5" dominantBaseline="middle">
        {text}
      </text>
      <path
        className="z11-vst__strelka"
        d={
          napravo
            ? `M${pw - 17} 13 h8 m-3.5 -3.5 l3.5 3.5 l-3.5 3.5`
            : 'M17 13 h-8 m3.5 -3.5 l-3.5 3.5 l3.5 3.5'
        }
      />
    </g>
  );
}

function Podpis({
  x,
  y,
  text,
  w,
  klass,
  opacity = 1,
}: {
  x: number;
  y: number;
  text: string;
  w: number;
  klass: string;
  opacity?: number;
}) {
  return (
    <g
      className={clsx('z11-vst__podpis', klass)}
      transform={`translate(${x.toFixed(2)} ${y})`}
      opacity={opacity}
    >
      <rect x={-w / 2 - 7} y="-11" width={w + 14} height="22" rx="11" />
      <text textAnchor="middle" y="0.5" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

/** Размерная линия: от a до b с засечками на концах. */
function Razmer({ a, b, y, klass }: { a: number; b: number; y: number; klass: string }) {
  if (Math.abs(b - a) < 1) return null;
  return (
    <path
      className={clsx('z11-vst__razmer', klass)}
      d={`M${a.toFixed(2)} ${y - 4} v8 M${a.toFixed(2)} ${y} H${b.toFixed(2)} M${b.toFixed(2)} ${y - 4} v8`}
    />
  );
}

function Doroga({ r, S, id }: { r: Razmetka; S: number; id: string }) {
  const { shtrihi, podpisi } = otmetki(r, S);
  const y = r.yDoroga;
  return (
    <g className="z11-vst__doroga">
      <ellipse
        className="z11-vst__pol"
        cx={r.W / 2}
        cy={y + 14}
        rx={(r.xS - r.x0) / 2 + r.gorod * 0.6}
        ry="16"
        fill={`url(#${id}-pol)`}
      />
      <rect
        x={r.x0 - 10}
        y={y - 8}
        width={r.xS - r.x0 + 20}
        height="16"
        rx="8"
        fill={`url(#${id}-lenta)`}
        className="z11-vst__lenta"
      />
      <rect
        x={r.x0 - 6}
        y={y - 6}
        width={r.xS - r.x0 + 12}
        height="3"
        rx="1.5"
        className="z11-vst__lenta-blik"
      />
      {shtrihi.map((k) => {
        const x = kmVPx(r, S, k);
        const krupnyy = podpisi.includes(k);
        return (
          <line
            key={k}
            className={clsx('z11-vst__shtrih', krupnyy && 'is-krupnyy')}
            x1={x}
            x2={x}
            y1={y + 1}
            y2={y + (krupnyy ? 8 : 5)}
          />
        );
      })}
      {podpisi.map((k) => (
        <text
          key={k}
          className="z11-vst__km"
          x={kmVPx(r, S, k)}
          y={r.yOtmetki}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {k}
        </text>
      ))}
    </g>
  );
}

function Gorod({ r, storona }: { r: Razmetka; storona: 'a' | 'b' }) {
  const w = r.gorod;
  const h = storona === 'a' ? w * (828 / 788) : w * (913 / 915);
  const cx = storona === 'a' ? r.x0 - w * 0.16 : r.xS + w * 0.16;
  const fail = `/images/zadanie-11/gorod-${storona}-${r.uzkaya ? 160 : 320}.webp`;
  const bukva = storona === 'a' ? T.gorodA : T.gorodB;
  const xb = storona === 'a' ? r.x0 - 27 : r.xS + 27;
  return (
    <g className={clsx('z11-vst__gorod', `z11-vst__gorod--${storona}`)}>
      <image
        href={assetUrl(fail)}
        x={cx - w / 2}
        y={r.yDoroga + 10 - h}
        width={w}
        height={h}
        preserveAspectRatio="xMidYMax meet"
        aria-label={T.gorodAlt(bukva)}
      />
      <g transform={`translate(${xb} ${r.yOtmetki})`}>
        <rect x="-13" y="-12" width="26" height="24" rx="8" />
        <text textAnchor="middle" y="0.5" dominantBaseline="middle">
          {bukva}
        </text>
      </g>
    </g>
  );
}

/* ── Сцена ─────────────────────────────────────────────────────── */

/** Кадр для отрисовки: копия движка, без ссылок на изменяемый объект. */
interface Kadr {
  t: number;
  igraet: boolean;
  snimokIdet: boolean;
  shag1: number;
  shag2: number;
  konfetti: Chastica[] | null;
  /** Секунд с начала конфетти. */
  tau: number;
  vstrecha: number;
  zapuskalsya: boolean;
}

function snyat(d: Dvizhok, now: number): Kadr {
  return {
    t: d.t,
    igraet: d.igraet,
    snimokIdet: d.derzhatDo > 0,
    shag1: d.shag1,
    shag2: d.shag2,
    konfetti: d.konfetti === null ? null : d.konfetti.chasticy,
    tau: d.konfetti === null ? 0 : (now - d.konfetti.t0) / 1000,
    vstrecha: d.vstrecha,
    zapuskalsya: d.zapuskalsya,
  };
}

function novyyDvizhok(): Dvizhok {
  return {
    t: 0,
    start: 0,
    igraet: false,
    snimokPokazan: false,
    derzhatDo: 0,
    shag1: 0,
    shag2: 0,
    konfetti: null,
    vstrecha: 0,
    zapuskalsya: false,
  };
}

function chasticy(): Chastica[] {
  const out: Chastica[] = [];
  for (let i = 0; i < KONFETTI_N; i += 1) {
    const ugol =
      (-155 + (130 * i) / (KONFETTI_N - 1) + (Math.random() - 0.5) * 14) * (Math.PI / 180);
    const v = 130 + Math.random() * 150;
    out.push({
      vx: Math.cos(ugol) * v,
      vy: Math.sin(ugol) * v,
      w: 4 + Math.random() * 4,
      h: 6 + Math.random() * 5,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 540,
      ton: i % 3 === 0 ? 'sin' : i % 3 === 1 ? 'terra' : 'bel',
    });
  }
  return out;
}

export default function Scena() {
  const id = useId().replace(/:/g, '');
  const [chisla, setChisla] = useState<VstrechaChisla>(VSTRECHA_DEFAULT);
  const [skorost, setSkorost] = useState<1 | 2>(1);
  const [W, setW] = useState(0);
  const [dvizhenie, setDvizhenie] = useState<MotionLevel>('full');
  const [d, setKadr] = useState<Kadr>(() => snyat(novyyDvizhok(), 0));

  const dv = useRef<Dvizhok>(novyyDvizhok());
  const raf = useRef<number | null>(null);
  const obertka = useRef<HTMLDivElement>(null);
  /* Цикл читает свежие значения через ref: замыкание кадра не устаревает. */
  const tek = useRef({ chisla, skorost, dvizhenie, W });
  useLayoutEffect(() => {
    tek.current = { chisla, skorost, dvizhenie, W };
  });
  const perisovat = useCallback(() => setKadr(snyat(dv.current, performance.now())), []);

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

  /* ── Цикл кадров ── */
  const cikl = useCallback(() => {
    if (raf.current !== null) return;
    let prev = performance.now();
    const kadr = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const d = dv.current;
      const { chisla: c, skorost: sk, dvizhenie: lvl, W: w } = tek.current;
      let aktivno = false;

      if (d.igraet) {
        aktivno = true;
        if (d.derzhatDo > 0) {
          if (now >= d.derzhatDo) {
            d.derzhatDo = 0;
            d.start = d.t;
          }
        } else {
          const stop = sleduyushayaOstanovka(c, d.t, d.snimokPokazan);
          const bylo = d.t;
          d.t = shagVremeni(dt, sk, d.t, d.start, stop);
          /* Фаза шага — от пройденных пикселей: ноги не скользят. */
          const r = razmetka(w);
          const pxKm = (r.xS - r.x0) / rasstoyanie(c);
          d.shag1 += (d.t - bylo) * c.v1 * pxKm;
          d.shag2 += (d.t - bylo) * c.v2 * pxKm;
          if (d.t >= stop - 1e-9) {
            d.t = stop;
            if (stop >= c.T) {
              d.igraet = false;
              d.vstrecha += 1;
              if (lvl === 'full') d.konfetti = { t0: now, chasticy: chasticy() };
            } else {
              d.snimokPokazan = true;
              d.derzhatDo = now + (SEK_SNIMOK * 1000) / sk;
            }
          }
        }
      }
      if (d.konfetti !== null) {
        if ((now - d.konfetti.t0) / 1000 > KONFETTI_SEK) d.konfetti = null;
        else aktivno = true;
      }
      setKadr(snyat(d, now));
      raf.current = aktivno ? requestAnimationFrame(kadr) : null;
    };
    raf.current = requestAnimationFrame(kadr);
  }, []);

  const S = rasstoyanie(chisla);
  const t = d.t;
  const vstretilis = t >= chisla.T - 1e-9;
  const snimokIdet = d.snimokIdet;

  /* ── Команды ── */
  const pusk = useCallback(() => {
    const e = dv.current;
    if (e.igraet) {
      e.igraet = false;
      e.derzhatDo = 0;
      perisovat();
      return;
    }
    if (e.t >= tek.current.chisla.T - 1e-9) {
      e.t = 0;
      e.snimokPokazan = false;
      e.shag1 = 0;
      e.shag2 = 0;
    }
    e.start = e.t;
    e.igraet = true;
    e.zapuskalsya = true;
    cikl();
    perisovat();
  }, [cikl, perisovat]);

  const sbros = useCallback(() => {
    const e = dv.current;
    Object.assign(e, novyyDvizhok(), { vstrecha: e.vstrecha });
    perisovat();
  }, [perisovat]);

  const peremotat = useCallback(
    (novoe: number) => {
      const e = dv.current;
      const { chisla: c, W: w } = tek.current;
      const tt = Math.min(Math.max(novoe, 0), c.T);
      const r = razmetka(w);
      const pxKm = (r.xS - r.x0) / rasstoyanie(c);
      e.shag1 += (tt - e.t) * c.v1 * pxKm;
      e.shag2 += (tt - e.t) * c.v2 * pxKm;
      e.t = tt;
      e.igraet = false;
      e.derzhatDo = 0;
      e.konfetti = null;
      e.snimokPokazan = tt >= 1;
      if (tt > 0) e.zapuskalsya = true;
      perisovat();
    },
    [perisovat],
  );

  const pomenyat = (novye: Partial<VstrechaChisla>) => {
    setChisla((c) => ({ ...c, ...novye }));
    Object.assign(dv.current, novyyDvizhok(), { vstrecha: dv.current.vstrecha });
    perisovat();
  };

  const klavishi = (e: KeyboardEvent<HTMLDivElement>) => {
    const cel = e.target as HTMLElement;
    const parametr = cel.dataset.parametr !== undefined;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (cel.tagName === 'BUTTON' || cel.tagName === 'SUMMARY') return;
      e.preventDefault();
      pusk();
      return;
    }
    if (parametr) return;
    const shag = e.shiftKey ? 0.5 : 0.1;
    const tt = dv.current.t;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      peremotat(Math.round((tt + shag) * 10) / 10);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      peremotat(Math.round((tt - shag) * 10) / 10);
    } else if (e.key === 'Home') {
      e.preventDefault();
      peremotat(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      peremotat(tek.current.chisla.T);
    }
  };

  /* Шапка таблицы: S, v, t — формулы в KaTeX, как везде на сайте. */
  const shapka = useMemo(
    () => ({
      caption: typeset(T.tablica.caption),
      S: typeset(T.tablica.S),
      v: typeset(T.tablica.v),
      t: typeset(T.tablica.t),
    }),
    [],
  );

  /* ── Решение в KaTeX: пересчитывается только при смене чисел ── */
  const reshenie = useMemo(
    () => T.shagi(S, chisla.v1, chisla.v2, chisla.T).map((s) => typeset(s)),
    [S, chisla],
  );

  /* ── Подписи ── */
  const tD = tPodpis(t);
  /* Время в пузыре бегунка — KaTeX, набирается только при смене десятых. */
  const puzyr = useMemo(() => typeset(T.vremyaZnachenie(ru(tD))), [tD]);
  const s1 = chisla.v1 * tD;
  const s2 = chisla.v2 * tD;
  const vv = sblizhenie(chisla);
  const ost = Math.max(0, S - vv * tD);

  let status: string = T.status.start;
  if (vstretilis) status = T.status.vstrecha(chisla.T, chisla.v1 * chisla.T, chisla.v2 * chisla.T);
  else if (snimokIdet || (chisla.T > 1 && Math.abs(t - 1) < 1e-6)) status = T.status.snimok(vv);
  else if (t > 1) status = T.status.blizhe(vv);
  else if (t > 0 || d.igraet) status = T.status.idut(chisla.v1, chisla.v2);

  const knopka = d.igraet ? T.pauza : vstretilis ? T.eshche : t > 0 ? T.prodolzhit : T.zapustit;
  const dolya = chisla.T > 0 ? t / chisla.T : 0;
  const pokazanaV = d.zapuskalsya || t > 0;

  return (
    <div className="z11-vst__osnova" onKeyDown={klavishi}>
      <div className="z11-vst__kadr">
        {/* Часы-таймлайн. */}
        <div className="z11-vst__chasy">
          <svg className="z11-vst__ciferblat" viewBox="-18 -18 36 36" aria-hidden="true">
            <circle r="16" className="z11-vst__ciferblat-krug" />
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                y1="-13"
                y2={i % 3 === 0 ? -10 : -11.5}
                transform={`rotate(${i * 30})`}
              />
            ))}
            <line
              className="z11-vst__strelka-chas"
              y1="1.5"
              y2="-7"
              transform={`rotate(${(t * 30).toFixed(2)})`}
            />
            <line
              className="z11-vst__strelka-min"
              y1="2"
              y2="-11.5"
              transform={`rotate(${(t * 360).toFixed(2)})`}
            />
            <circle r="1.6" className="z11-vst__ciferblat-os" />
          </svg>
          <div className="z11-vst__lenta-vremeni" style={{ '--p': dolya } as React.CSSProperties}>
            <output className="z11-vst__puzyr" htmlFor={`${id}-t`} aria-hidden="true">
              <span dangerouslySetInnerHTML={{ __html: puzyr }} />
            </output>
            <input
              id={`${id}-t`}
              className="z11-vst__polzunok-t"
              type="range"
              min={0}
              max={chisla.T * 100}
              step={1}
              value={Math.round(t * 100)}
              aria-label={T.vremya}
              aria-valuetext={`${ru(tD)} ч`}
              onChange={(e) => peremotat(Number(e.currentTarget.value) / 100)}
            />
            <div className="z11-vst__metki" aria-hidden="true">
              {Array.from({ length: chisla.T + 1 }, (_, k) => (
                <span
                  key={k}
                  style={{ '--k': k / chisla.T } as React.CSSProperties}
                  className={clsx(t >= k - 1e-9 && 'is-proydena')}
                >
                  {T.chasov(k)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Сцена. */}
        <div
          ref={obertka}
          className={clsx('z11-vst__scena', vstretilis && 'is-vstretilis', `is-${dvizhenie}`)}
          tabIndex={0}
          role="group"
          aria-label={`${T.zag}. ${T.klaviatura}`}
        >
          {W > 0 ? (
            <ScenaSvg
              id={id}
              W={W}
              chisla={chisla}
              t={t}
              d={d}
              dvizhenie={dvizhenie}
              tD={tD}
              s1={s1}
              s2={s2}
              ost={ost}
              vv={vv}
              vstretilis={vstretilis}
            />
          ) : null}
        </div>

        <p className="z11-vst__status" aria-live="polite">
          {status}
        </p>

        {/* Управление. */}
        <div className="z11-vst__upr">
          <button
            type="button"
            className={clsx('stk-btn', 'stk-btn--primary', 'z11-vst__pusk')}
            onClick={pusk}
            aria-pressed={d.igraet}
          >
            <span
              className={clsx('z11-vst__ikonka', d.igraet ? 'is-pauza' : 'is-pusk')}
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
          <div className="z11-vst__skorost" role="group" aria-label={T.skorostPokaza}>
            {([1, 2] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={clsx('z11-vst__x', skorost === k && 'is-on')}
                aria-pressed={skorost === k}
                onClick={() => setSkorost(k)}
              >
                ×{k}
              </button>
            ))}
          </div>
          <p className="z11-vst__podskazka">{T.klaviatura}</p>
        </div>

        {/* Свои числа. */}
        <fieldset className="z11-vst__chisla">
          <legend>{T.chisla}</legend>
          <Polzunok
            id={`${id}-S`}
            label={T.polzunokS}
            value={chisla.T}
            min={VSTRECHA_DIAPAZON.T.min}
            max={VSTRECHA_DIAPAZON.T.max}
            pokaz={T.km(String(S))}
            onChange={(v) => pomenyat({ T: v })}
          />
          <Polzunok
            id={`${id}-v1`}
            label={T.polzunokV1}
            value={chisla.v1}
            min={VSTRECHA_DIAPAZON.v.min}
            max={VSTRECHA_DIAPAZON.v.max}
            pokaz={T.kmCh(String(chisla.v1))}
            ton="sin"
            onChange={(v) => pomenyat({ v1: v })}
          />
          <Polzunok
            id={`${id}-v2`}
            label={T.polzunokV2}
            value={chisla.v2}
            min={VSTRECHA_DIAPAZON.v.min}
            max={VSTRECHA_DIAPAZON.v.max}
            pokaz={T.kmCh(String(chisla.v2))}
            ton="terra"
            onChange={(v) => pomenyat({ v2: v })}
          />
          <p className="z11-vst__chisla-lead">{T.chislaLead}</p>
        </fieldset>
      </div>

      {/* Таблица по методике и решение. */}
      <div className="z11-vst__panel">
        <table className="z11-vst__tablica">
          <caption dangerouslySetInnerHTML={{ __html: shapka.caption }} />
          <thead>
            <tr>
              <td />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.S }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.v }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.t }} />
            </tr>
          </thead>
          <tbody>
            {(
              [
                [chisla.v1, s1, 'sin'],
                [chisla.v2, s2, 'terra'],
              ] as const
            ).map(([v, s, ton], i) => (
              <tr key={ton} className={`is-${ton}`}>
                <th scope="row">
                  <span className="z11-vst__tochka" aria-hidden="true" />
                  {T.tablica.stroka[i]}
                </th>
                <td className={clsx('z11-vst__S', vstretilis && 'is-itog')}>
                  {pokazanaV ? (
                    <>
                      <b>{ru(s)}</b>
                      <span className="z11-vst__formula">
                        {v} · {ru(tD)}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={clsx('z11-vst__v', pokazanaV && 'is-vidno')}>
                  {pokazanaV ? v : '—'}
                </td>
                {i === 0 ? (
                  <td rowSpan={2} className="z11-vst__t">
                    <b>{ru(tD)}</b>
                    <small>{T.tablica.tObshchee}</small>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>

        <div
          className={clsx('z11-vst__reshenie', vstretilis && 'is-vidno')}
          aria-hidden={!vstretilis}
        >
          <p className="stk-nad">{T.reshenie}</p>
          <ol>
            {reshenie.map((html, i) => (
              <li
                key={`${S}-${chisla.v1}-${chisla.v2}-${i}`}
                style={{ '--i': i } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}
          </ol>
          <p className="z11-vst__otvet">
            {T.otvet(chisla.T, chisla.v1 * chisla.T, chisla.v2 * chisla.T)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Polzunok({
  id,
  label,
  value,
  min,
  max,
  pokaz,
  ton,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  pokaz: string;
  ton?: 'sin' | 'terra';
  onChange: (v: number) => void;
}) {
  return (
    <div className={clsx('z11-vst__param', ton !== undefined && `is-${ton}`)}>
      <label htmlFor={id}>
        {label}
        <output htmlFor={id}>{pokaz}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        data-parametr=""
        aria-valuetext={pokaz}
        style={{ '--p': (value - min) / (max - min) } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
    </div>
  );
}

/* ── SVG сцены ─────────────────────────────────────────────────── */

function ScenaSvg({
  id,
  W,
  chisla,
  t,
  d,
  dvizhenie,
  tD,
  s1,
  s2,
  ost,
  vv,
  vstretilis,
}: {
  id: string;
  W: number;
  chisla: VstrechaChisla;
  t: number;
  d: Kadr;
  dvizhenie: MotionLevel;
  tD: number;
  s1: number;
  s2: number;
  ost: number;
  vv: number;
  vstretilis: boolean;
}) {
  const r = razmetka(W);
  const S = rasstoyanie(chisla);
  const { x1, x2 } = polozhenie(chisla, t);
  const px1 = kmVPx(r, S, x1);
  const px2 = kmVPx(r, S, x2);
  const m = r.masshtab;
  /* Фигурка стоит позади своей точки: на встрече между ними — флажок. */
  const otstup = 14 * m;
  const f1 = px1 - otstup;
  const f2 = px2 + otstup;

  /* Размах походки: стоят на старте и на встрече, при «Уменьшить движение» — всегда. */
  const amp =
    dvizhenie === 'reduce' || d.snimokIdet
      ? 0
      : Math.min(
          1,
          t / 0.06,
          Math.max(0, chisla.T - t) / 0.06,
          /* У отметки 1 ч путники замедляются к снимку — шаг затихает. */
          chisla.T > 1 && d.igraet ? Math.abs(t - 1) / 0.05 : 1,
        );
  const phi1 = (d.shag1 / POLSHAGA) * Math.PI;
  const phi2 = (d.shag2 / POLSHAGA) * Math.PI;

  /* Плашки скорости над головами — разведены, не налезают. */
  const p1 = T.kmCh(String(chisla.v1));
  const p2 = T.kmCh(String(chisla.v2));
  const pw1 = shirina(p1) + 32;
  const pw2 = shirina(p2) + 32;
  const [cp1, cp2] = razvesti({ c: f1, w: pw1 }, { c: f2, w: pw2 }, r.pole, W - r.pole, 8);

  /* Пройденный путь — под дорогой, у каждого свой отрезок. */
  const l1 = T.proydeno(chisla.v1, ru(tD), ru(s1), vstretilis);
  const l2 = T.proydeno(chisla.v2, ru(tD), ru(s2), vstretilis);
  const lw1 = shirina(l1);
  const lw2 = shirina(l2);
  const [cl1, cl2] = razvesti(
    { c: (r.x0 + px1) / 2, w: lw1 + 14 },
    { c: (px2 + r.xS) / 2, w: lw2 + 14 },
    r.pole,
    W - r.pole,
    8,
  );

  /* Остаток между путниками. */
  const lo = T.ostalos(S, vv, ru(ost));
  const low = shirina(lo);
  const clo = prizhat((px1 + px2) / 2, low + 14, r.pole, W - r.pole);
  const ostVidno = vstretilis ? 0 : Math.min(1, (px2 - px1) / 24);

  /* Снимок на 1 ч: силуэты остаются на месте. */
  const prizraki = chisla.T > 1 && t >= 1 - 1e-9;
  const ch1 = prizraki ? polozhenie(chisla, 1) : null;

  const xm = kmVPx(r, S, chisla.v1 * chisla.T);
  const k = d.konfetti;
  const tau = d.tau;

  return (
    <svg
      className="z11-vst__svg"
      width={W}
      height={r.H}
      viewBox={`0 0 ${W} ${r.H}`}
      role="img"
      aria-label={T.alt}
    >
      <defs>
        <linearGradient id={`${id}-lenta`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#e6eefc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c9d8f4" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}-pol`}>
          <stop offset="0" stopColor="#1f5fd0" stopOpacity="0.16" />
          <stop offset="1" stopColor="#1f5fd0" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-sled1`}
          gradientUnits="userSpaceOnUse"
          x1={r.x0}
          x2={Math.max(px1, r.x0 + 1)}
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor={SIN} stopOpacity="0.15" />
          <stop offset="1" stopColor={SIN} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient
          id={`${id}-sled2`}
          gradientUnits="userSpaceOnUse"
          x1={r.xS}
          x2={Math.min(px2, r.xS - 1)}
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor={TERRA} stopOpacity="0.15" />
          <stop offset="1" stopColor={TERRA} stopOpacity="0.95" />
        </linearGradient>
        <filter id={`${id}-svet`} x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <radialGradient id={`${id}-vspyshka`}>
          <stop offset="0" stopColor="#fff4d6" stopOpacity="1" />
          <stop offset="0.4" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-flag`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc35a" />
          <stop offset="1" stopColor="#f08a24" />
        </linearGradient>
      </defs>

      <Gorod r={r} storona="a" />
      <Gorod r={r} storona="b" />
      <Doroga r={r} S={S} id={id} />

      {/* Светящийся след пройденного пути. */}
      {px1 - r.x0 > 0.5 ? (
        <g className="z11-vst__sled">
          <line
            x1={r.x0}
            x2={px1}
            y1={r.yDoroga}
            y2={r.yDoroga}
            stroke={`url(#${id}-sled1)`}
            filter={`url(#${id}-svet)`}
            strokeWidth="6"
          />
          <line
            x1={r.x0}
            x2={px1}
            y1={r.yDoroga}
            y2={r.yDoroga}
            stroke={`url(#${id}-sled1)`}
            strokeWidth="3"
          />
        </g>
      ) : null}
      {r.xS - px2 > 0.5 ? (
        <g className="z11-vst__sled">
          <line
            x1={r.xS}
            x2={px2}
            y1={r.yDoroga}
            y2={r.yDoroga}
            stroke={`url(#${id}-sled2)`}
            filter={`url(#${id}-svet)`}
            strokeWidth="6"
          />
          <line
            x1={r.xS}
            x2={px2}
            y1={r.yDoroga}
            y2={r.yDoroga}
            stroke={`url(#${id}-sled2)`}
            strokeWidth="3"
          />
        </g>
      ) : null}

      {/* Размерные линии и подписи пути. */}
      <Razmer a={r.x0} b={px1} y={r.yProydeno - 16} klass="is-sin" />
      <Razmer a={px2} b={r.xS} y={r.yProydeno - 16} klass="is-terra" />
      <Podpis x={cl1} y={r.yProydeno} text={l1} w={lw1} klass="is-sin" />
      <Podpis x={cl2} y={r.yProydeno} text={l2} w={lw2} klass="is-terra" />
      {ostVidno > 0 ? (
        <g opacity={ostVidno}>
          <Razmer a={px1} b={px2} y={r.yOstalos - 16} klass="is-ost" />
          <Podpis x={clo} y={r.yOstalos} text={lo} w={low} klass="is-ost" />
        </g>
      ) : null}

      {/* Силуэты-«снимок» на 1 ч. */}
      {ch1 !== null ? (
        <g className="z11-vst__snimok">
          <Putnik
            ton="sin"
            x={kmVPx(r, S, ch1.x1) - otstup}
            y={r.yDoroga}
            masshtab={m}
            phi={0}
            amp={0}
            prizrak
          />
          <Putnik
            ton="terra"
            x={kmVPx(r, S, ch1.x2) + otstup}
            y={r.yDoroga}
            masshtab={m}
            phi={0}
            amp={0}
            prizrak
          />
        </g>
      ) : null}

      {/* Встреча: вспышка и флажок. */}
      {vstretilis ? (
        <g className="z11-vst__vstrecha" key={`v${d.vstrecha}`}>
          {d.vstrecha > 0 ? (
            <circle
              className="z11-vst__vspyshka"
              cx={xm}
              cy={r.yDoroga - 46 * m}
              r={86 * m}
              fill={`url(#${id}-vspyshka)`}
            />
          ) : null}
          <g transform={`translate(${xm} ${r.yDoroga})`}>
            <g className="z11-vst__flag">
              <line y1="-2" y2={-122 * m} />
              <path
                d={`M1 ${-122 * m} l${22 * m} ${6 * m} l${-22 * m} ${6 * m} z`}
                fill={`url(#${id}-flag)`}
              />
              <circle r="3.5" cy="-1" />
            </g>
          </g>
        </g>
      ) : null}

      <Putnik ton="sin" x={f1} y={r.yDoroga} masshtab={m} phi={phi1} amp={amp} />
      <Putnik ton="terra" x={f2} y={r.yDoroga} masshtab={m} phi={phi2} amp={amp} />

      {/* Плашки скорости. */}
      <g className={clsx('z11-vst__plashki', vstretilis && 'is-skryty')}>
        <g className="is-sin">
          <Plashka x={cp1} y={r.yPlashka} text={p1} w={pw1 - 32} napravo />
        </g>
        <g className="is-terra">
          <Plashka x={cp2} y={r.yPlashka} text={p2} w={pw2 - 32} napravo={false} />
        </g>
      </g>

      {/* Конфетти из стеклянных частиц — один раз. */}
      {k !== null ? (
        <g className="z11-vst__konfetti" opacity={Math.max(0, 1 - (tau / KONFETTI_SEK) ** 2)}>
          {k.map((c, i) => {
            const x = xm + c.vx * tau;
            const y = r.yDoroga - 70 * m + c.vy * tau + 0.5 * 520 * tau * tau;
            return (
              <rect
                key={i}
                className={`is-${c.ton}`}
                x={-c.w / 2}
                y={-c.h / 2}
                width={c.w}
                height={c.h}
                rx="1.6"
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(c.rot + c.vrot * tau).toFixed(1)})`}
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}
