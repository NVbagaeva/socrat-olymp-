'use client';

import { clsx } from 'clsx';
import { useId, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { typeset } from '@/lib/tex';
import { shirinaPriblizitelno } from '@/lib/zhivye/hod';
import type { Hod } from './hooks';

/**
 * Общие части живых сцен (стили — zhivye.css, префикс zv-):
 *
 *   Taymlayn   — секундомер, бегунок модельного времени с пузырём
 *                (KaTeX), подписи отметок и тёплые точки «снимков»;
 *   Upravlenie — пуск/пауза/продолжить/ещё раз, «Сначала», ×1/×2;
 *   Podpis     — подпись-таблетка внутри SVG (ширина — по canvas);
 *   klavishi   — пробел, стрелки, Home/End для сцены.
 */

export interface TekstyUpravleniya {
  zapustit: string;
  prodolzhit: string;
  pauza: string;
  snachala: string;
  eshche: string;
  skorostPokaza: string;
  klaviatura: string;
}

/* ── Набор KaTeX с кешем по строке: пузырь и строка состояния меняются
   часто, а различных строк — немного. ── */
const texKesh = new Map<string, string>();
export function tex(text: string): string {
  let html = texKesh.get(text);
  if (html === undefined) {
    html = typeset(text);
    if (texKesh.size > 400) texKesh.clear();
    texKesh.set(text, html);
  }
  return html;
}

/* ── Ширина текста 13 px ── */
let holst: CanvasRenderingContext2D | null | undefined;
const kesh = new Map<string, number>();
export function shirina(text: string): number {
  const est = kesh.get(text);
  if (est !== undefined) return est;
  if (holst === undefined) {
    holst =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (holst !== null) {
      holst.font = `600 13px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
    }
  }
  const w = holst === null ? shirinaPriblizitelno(text) : holst.measureText(text).width;
  kesh.set(text, w);
  return w;
}

export function Podpis({
  x,
  y,
  text,
  klass,
  opacity,
}: {
  x: number;
  y: number;
  text: string;
  klass?: string;
  opacity?: number;
}) {
  const w = shirina(text);
  return (
    <g
      className={clsx('zv-podpis', klass)}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      {...(opacity === undefined ? {} : { opacity })}
    >
      <rect x={-w / 2 - 7} y="-11" width={w + 14} height="22" rx="11" />
      <text textAnchor="middle" y="0.5" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

export interface Metka {
  /** Положение на шкале, доля 0…1. */
  dolya: number;
  text: string;
  proydena: boolean;
  akcent?: boolean;
}

export function Taymlayn({
  dolya,
  strelka,
  puzyrHtml,
  ariaLabel,
  ariaValueText,
  metki,
  tochki = [],
  onDolya,
}: {
  /** Положение бегунка, доля 0…1. */
  dolya: number;
  /** Угол стрелки секундомера, градусы. */
  strelka: number;
  puzyrHtml: string;
  ariaLabel: string;
  ariaValueText: string;
  metki: readonly Metka[];
  /** Тёплые точки снимков на дорожке: доли и пройдены ли. */
  tochki?: readonly { dolya: number; proydena: boolean }[];
  onDolya: (d: number) => void;
}) {
  const id = useId();
  return (
    <div className="zv-chasy">
      <svg className="zv-sekundomer" viewBox="-18 -21 36 39" aria-hidden="true">
        <rect x="-3" y="-21" width="6" height="4" rx="1.5" className="zv-sekundomer-knopka" />
        <circle r="16" className="zv-sekundomer-krug" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} y1="-13" y2={i % 3 === 0 ? -10 : -11.5} transform={`rotate(${i * 30})`} />
        ))}
        <line
          className="zv-sekundomer-strelka"
          y1="2"
          y2="-12"
          transform={`rotate(${strelka.toFixed(2)})`}
        />
        <circle r="1.6" className="zv-sekundomer-os" />
      </svg>
      <div className="zv-lenta" style={{ '--p': dolya } as CSSProperties}>
        <output className="zv-puzyr" htmlFor={id} aria-hidden="true">
          <span dangerouslySetInnerHTML={{ __html: puzyrHtml }} />
        </output>
        <input
          id={id}
          className="zv-polzunok"
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(dolya * 1000)}
          aria-label={ariaLabel}
          aria-valuetext={ariaValueText}
          onChange={(e) => onDolya(Number(e.currentTarget.value) / 1000)}
        />
        <div className="zv-metki" aria-hidden="true">
          {metki.map((m, i) => (
            <span
              key={i}
              style={{ '--k': m.dolya } as CSSProperties}
              className={clsx(m.proydena && 'is-proydena', m.akcent && 'is-akcent')}
            >
              {m.text}
            </span>
          ))}
          {tochki.map((k, i) => (
            <i
              key={i}
              className={clsx('zv-tochka-snimka', k.proydena && 'is-proydena')}
              style={{ '--k': k.dolya } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Upravlenie({
  hod,
  T,
  konec,
  children,
}: {
  hod: Hod;
  T: TekstyUpravleniya;
  /** Показ дошёл до конца шкалы. */
  konec: boolean;
  /** Дополнительные кнопки в ряду (необязательно). */
  children?: ReactNode;
}) {
  const { kadr } = hod;
  const knopka = kadr.igraet ? T.pauza : konec ? T.eshche : kadr.t > 0 ? T.prodolzhit : T.zapustit;
  return (
    <div className="zv-upr">
      <button
        type="button"
        className="stk-btn stk-btn--primary zv-pusk"
        onClick={hod.pusk}
        aria-pressed={kadr.igraet}
      >
        <span
          className={clsx('zv-ikonka', kadr.igraet ? 'is-pauza' : 'is-pusk')}
          aria-hidden="true"
        />
        {knopka}
      </button>
      <button
        type="button"
        className="stk-btn stk-btn--tihaya"
        onClick={hod.sbros}
        disabled={kadr.t === 0 && !kadr.igraet}
      >
        {T.snachala}
      </button>
      <div className="zv-seg" role="group" aria-label={T.skorostPokaza}>
        {([1, 2] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={clsx(hod.skorost === k && 'is-on')}
            aria-pressed={hod.skorost === k}
            onClick={() => hod.setSkorost(k)}
          >
            ×{k}
          </button>
        ))}
      </div>
      {children}
      <p className="zv-podskazka">{T.klaviatura}</p>
    </div>
  );
}

/**
 * Клавиатура сцены: пробел — пуск/пауза (кроме кнопок), стрелки —
 * перемотка на `shag` (с Shift — на `shagShift`), Home/End — к краям.
 * `okruglit` приводит новое время к удобной сетке.
 */
export function klavishi(
  hod: Hod,
  opcii: { shag: number; shagShift: number; tMax: number; okruglit?: (t: number) => number },
) {
  const okr = opcii.okruglit ?? ((t: number) => t);
  return (e: KeyboardEvent<HTMLElement>) => {
    const cel = e.target as HTMLElement;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (cel.tagName === 'BUTTON') return;
      e.preventDefault();
      hod.pusk();
      return;
    }
    const shag = e.shiftKey ? opcii.shagShift : opcii.shag;
    const t = hod.kadr.t;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      hod.peremotat(okr(t + shag));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      hod.peremotat(okr(t - shag));
    } else if (e.key === 'Home') {
      e.preventDefault();
      hod.peremotat(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      hod.peremotat(opcii.tMax);
    }
  };
}
