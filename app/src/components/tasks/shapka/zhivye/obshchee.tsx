'use client';

/**
 * Общие детали живых чертежей шапки: корень с фокусом и клавиатурой,
 * перетаскиваемая ручка, перевод указателя в координаты SVG, формула
 * KaTeX и бегунок. Чертежи разделов собираются из них, чтобы вести себя
 * одинаково: Tab к фигуре, стрелки двигают, Enter нажимает, пальцем
 * перехватывается только жест по самой ручке.
 */

import { clsx } from 'clsx';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';

export type Tochka = readonly [number, number];

/** Указатель → координаты SVG (viewBox). */
export function vSvg(svg: SVGSVGElement | null, x: number, y: number): Tochka {
  if (svg === null) return [0, 0];
  const m = svg.getScreenCTM();
  if (m === null) return [0, 0];
  const p = new DOMPoint(x, y).matrixTransform(m.inverse());
  return [p.x, p.y];
}

export const klamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const okrugl = (v: number, k = 10) => Math.round(v * k) / k;
/** Число по-русски: десятичная запятая, минус — настоящий. */
export const chislo = (v: number, znakov = 1): string =>
  (Math.round(v * 10 ** znakov) / 10 ** znakov).toString().replace('.', ',').replace('-', '−');

/** Шаг стрелок: обычный и с Shift. */
export function shagKlavishi(e: KeyboardEvent): Tochka | null {
  const k = e.shiftKey ? 3 : 1;
  switch (e.key) {
    case 'ArrowLeft':
      return [-k, 0];
    case 'ArrowRight':
      return [k, 0];
    case 'ArrowUp':
      return [0, -k];
    case 'ArrowDown':
      return [0, k];
    default:
      return null;
  }
}

export interface ZhivoyKorenProps {
  label: string;
  avtofokus: boolean;
  /** Стрелки: шаг [dx, dy] в «щелчках». Вернуть true — нажатие съедено. */
  naStrelku?: (d: Tochka, e: KeyboardEvent) => boolean | void;
  /** Enter или пробел по фигуре. */
  naEnter?: () => void;
  className?: string;
  children: ReactNode;
  /** Узел для чужих обработчиков (3D-вращение). */
  koren?: RefObject<HTMLDivElement | null>;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

/** Корень живого чертежа: фокус, подпись, клавиатура. */
export function ZhivoyKoren({
  label,
  avtofokus,
  naStrelku,
  naEnter,
  className,
  children,
  koren,
  ...pointer
}: ZhivoyKorenProps) {
  const svoy = useRef<HTMLDivElement>(null);
  const ref = koren ?? svoy;
  useEffect(() => {
    if (avtofokus) ref.current?.focus({ preventScroll: true });
  }, [avtofokus, ref]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const d = shagKlavishi(e);
    if (d !== null && naStrelku !== undefined) {
      if (naStrelku(d, e) !== false) e.preventDefault();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && naEnter !== undefined) {
      e.preventDefault();
      naEnter();
    }
  };
  return (
    <div
      ref={ref}
      className={clsx('zhv', className)}
      role="group"
      aria-label={label}
      aria-roledescription="живой чертёж"
      tabIndex={0}
      onKeyDown={onKeyDown}
      {...pointer}
    >
      {children}
    </div>
  );
}

export interface RuchkaProps {
  svg: RefObject<SVGSVGElement | null>;
  x: number;
  y: number;
  /** Новое положение указателя в координатах SVG. */
  tyanut: (p: Tochka) => void;
  /** Стрелки по самой ручке. */
  strelka?: (d: Tochka) => void;
  /** Нажатие без перетаскивания (Enter по ручке тоже). */
  nazhat?: () => void;
  label: string;
  r?: number;
  className?: string;
}

/**
 * Ручка чертежа: видимая точка и круг побольше для пальца. Палец по
 * ручке — её жест (touch-action: none только на ней), мимо ручки —
 * прокрутка страницы. С клавиатуры: Tab к ручке, стрелки двигают.
 */
export function Ruchka({
  svg,
  x,
  y,
  tyanut,
  strelka,
  nazhat,
  label,
  r = 6,
  className,
}: RuchkaProps) {
  const [aktiv, setAktiv] = useState(false);
  const sdvig = useRef(0);
  const start = useRef<Tochka>([0, 0]);
  const down = (e: PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setAktiv(true);
    sdvig.current = 0;
    start.current = [e.clientX, e.clientY];
  };
  const move = (e: PointerEvent<SVGGElement>) => {
    if (!aktiv) return;
    sdvig.current = Math.hypot(e.clientX - start.current[0], e.clientY - start.current[1]);
    tyanut(vSvg(svg.current, e.clientX, e.clientY));
  };
  const up = () => {
    setAktiv(false);
    if (sdvig.current < 4) nazhat?.();
  };
  const key = (e: KeyboardEvent<SVGGElement>) => {
    const d = shagKlavishi(e);
    if (d !== null && strelka !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      strelka(d);
    } else if ((e.key === 'Enter' || e.key === ' ') && nazhat !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      nazhat();
    }
  };
  return (
    <g
      className={clsx('zhv__ruchka', aktiv && 'is-aktiv', className)}
      role="slider"
      aria-label={label}
      aria-valuetext={`${Math.round(x)}, ${Math.round(y)}`}
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <circle className="zhv__ruchka-hit" cx={x} cy={y} r={r + 12} />
      <circle className="zhv__ruchka-tochka" cx={x} cy={y} r={r} />
    </g>
  );
}

/** Формула KaTeX — строкой, без React-обёрток KaTeX. */
export function Formula({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, output: 'html' }),
    [tex],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export interface BegunokProps {
  podpis: ReactNode;
  min: number;
  max: number;
  shag: number;
  znachenie: number;
  pokaz: string;
  menyat: (v: number) => void;
}

/** Ряд бегунков и кнопок под чертежом: жесты в нём — не жесты чертежа. */
export function Begunki({ children }: { children: ReactNode }) {
  return (
    <div
      className="zhv__begunki"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

/** Бегунок под чертежом: подпись, ползунок, значение. */
export function Begunok({ podpis, min, max, shag, znachenie, pokaz, menyat }: BegunokProps) {
  return (
    <label className="zhv__begunok">
      <span>{podpis}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={shag}
        value={znachenie}
        aria-valuetext={pokaz}
        onChange={(e) => menyat(Number(e.target.value))}
      />
      <b>{pokaz}</b>
    </label>
  );
}

/**
 * Перекос плитки: чертёж рисуется в своих координатах (x вправо, y
 * вверх), на экран он ложится наклонной стеклянной плитой — как на
 * картинке. Аффинное преобразование и обратное к нему: ручки тянутся
 * в координатах плиты.
 */
export interface Plita {
  /** Начало координат на экране. */
  o: Tochka;
  /** Куда идёт единица по x и по y. */
  ex: Tochka;
  ey: Tochka;
}

export function naEkran(pl: Plita, x: number, y: number): Tochka {
  return [pl.o[0] + pl.ex[0] * x + pl.ey[0] * y, pl.o[1] + pl.ex[1] * x + pl.ey[1] * y];
}

export function sEkrana(pl: Plita, p: Tochka): Tochka {
  const dx = p[0] - pl.o[0];
  const dy = p[1] - pl.o[1];
  const det = pl.ex[0] * pl.ey[1] - pl.ex[1] * pl.ey[0];
  return [(dx * pl.ey[1] - dy * pl.ey[0]) / det, (pl.ex[0] * dy - pl.ex[1] * dx) / det];
}

export function putPlity(pl: Plita, tochki: readonly Tochka[]): string {
  return tochki
    .map(([x, y], i) => {
      const [a, b] = naEkran(pl, x, y);
      return `${i === 0 ? 'M' : 'L'}${a.toFixed(1)} ${b.toFixed(1)}`;
    })
    .join('');
}

/** Стеклянная плита: верх и толщина. Углы — в координатах плиты. */
export function PlitaSteklo({
  pl,
  x0,
  x1,
  y0,
  y1,
  tolshchina = 10,
  setka,
}: {
  pl: Plita;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  tolshchina?: number;
  setka?: number;
}) {
  const ugly: Tochka[] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  const verh = putPlity(pl, ugly) + 'Z';
  const niz = ugly.map(([x, y]) => naEkran(pl, x, y));
  const bok = `M${niz[0]![0]} ${niz[0]![1]}L${niz[1]![0]} ${niz[1]![1]}L${niz[1]![0]} ${niz[1]![1] + tolshchina}L${niz[0]![0]} ${niz[0]![1] + tolshchina}Z`;
  const bok2 = `M${niz[1]![0]} ${niz[1]![1]}L${niz[2]![0]} ${niz[2]![1]}L${niz[2]![0]} ${niz[2]![1] + tolshchina}L${niz[1]![0]} ${niz[1]![1] + tolshchina}Z`;
  const linii: string[] = [];
  if (setka !== undefined) {
    for (let x = Math.ceil(x0 / setka) * setka; x <= x1 + 1e-9; x += setka) {
      linii.push(
        putPlity(pl, [
          [x, y0],
          [x, y1],
        ]),
      );
    }
    for (let y = Math.ceil(y0 / setka) * setka; y <= y1 + 1e-9; y += setka) {
      linii.push(
        putPlity(pl, [
          [x0, y],
          [x1, y],
        ]),
      );
    }
  }
  return (
    <g className="zhv__plita-g" aria-hidden="true">
      <path d={bok} fill="color-mix(in srgb, var(--chertezh-setka) 35%, transparent)" />
      <path d={bok2} fill="color-mix(in srgb, var(--chertezh-setka) 42%, transparent)" />
      <path className="zhv__plita" d={verh} />
      {linii.map((d, i) => (
        <path key={i} className="zhv__setka" d={d} />
      ))}
    </g>
  );
}

/** Стеклянный градиент — общий для заливок чертежей. */
export function SteklyannyeGradienty({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-st`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--chertezh-fon)" stopOpacity="0.85" />
        <stop offset="1" stopColor="var(--chertezh-zalivka-siniy)" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id={`${id}-or`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--chertezh-akcent-svet)" />
        <stop offset="1" stopColor="var(--chertezh-akcent)" />
      </linearGradient>
      <filter id={`${id}-svet`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}
