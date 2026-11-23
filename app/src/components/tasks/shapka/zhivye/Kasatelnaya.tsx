'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, klamp, naEkran, PlitaSteklo, Ruchka, sEkrana, ZhivoyKoren } from './obshchee';
import { PLITA, putFunkcii, stena, tex, zalivkaPod } from './grafik';
import './grafiki.css';

const ST = stena(2.2, 20);
const X0 = 0.2;
const X1 = 7.8;
const f = (x: number) => 1.7 + 1.1 * Math.sin(0.95 * (x - 1.2)) + 0.12 * x;
const df = (x: number) => 1.045 * Math.cos(0.95 * (x - 1.2)) + 0.12;
/** Производная меньше этого по модулю — считаем нулём (точка экстремума). */
const NOL = 0.07;

/** Участки возрастания и убывания: куски графика между нулями производной. */
function uchastki(): { d: string; rastyot: boolean }[] {
  const out: { d: string; rastyot: boolean }[] = [];
  const n = 160;
  let start = X0;
  let znak = df(X0) > 0;
  for (let i = 1; i <= n; i += 1) {
    const x = X0 + ((X1 - X0) * i) / n;
    const z = df(x) > 0;
    if (z !== znak || i === n) {
      out.push({ d: putFunkcii(ST, f, start, x, 40), rastyot: znak });
      start = x;
      znak = z;
    }
  }
  return out;
}
const UCHASTKI = uchastki();

/**
 * №8 «Производная»: график на стеклянной плите. Точку ведут по кривой —
 * касательная поворачивается, рядом знак производной (+, −, 0), участки
 * возрастания и убывания раскрашены по-разному.
 */
export default function Kasatelnaya({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(2.6);
  const y = f(x);
  const k = df(x);
  const znak = Math.abs(k) < NOL ? '0' : k > 0 ? '+' : '−';
  const [px, py] = naEkran(ST, x, y);
  const [bx, by] = naEkran(ST, x, 0);
  const L = 1.5 / Math.sqrt(1 + k * k);
  const [t1x, t1y] = naEkran(ST, x - L, y - k * L);
  const [t2x, t2y] = naEkran(ST, x + L, y + k * L);
  const sdvinut = (dx: number) => setX((v) => klamp(v + dx, X0, X1));

  return (
    <ZhivoyKoren label={label} avtofokus={avtofokus} naStrelku={(d) => sdvinut(d[0] * 0.1)}>
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <PlitaSteklo pl={PLITA} x0={0} x1={8} y0={0} y1={6} tolshchina={9} setka={1} />
        <path className="zhg__zalivka" d={zalivkaPod(ST, f, X0, X1)} />
        {UCHASTKI.map((u, i) => (
          <path key={i} className={`zhv__ln ${u.rastyot ? 'zhg__rost' : 'zhg__spad'}`} d={u.d} />
        ))}
        <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${px} ${py}L${bx} ${by}`} />
        <path className="zhg__svet" d={`M${t1x} ${t1y}L${t2x} ${t2y}`} />
        <path className="zhv__ln zhv__ln--or" d={`M${t1x} ${t1y}L${t2x} ${t2y}`} />
        <text className="zhv__v" x={bx - 4} y={by + 16}>
          x₀
        </text>
        <g
          className={`zhg__znak zhg__znak--${znak === '+' ? 'plus' : znak === '0' ? 'nol' : 'minus'}`}
        >
          <circle cx={px + 30} cy={py + 30} r={12} />
          <text x={px + 30} y={py + 34.5} textAnchor="middle">
            {znak}
          </text>
        </g>
        <Ruchka
          svg={svg}
          x={px}
          y={py}
          tyanut={(p) => setX(klamp(sEkrana(ST, p)[0], X0, X1))}
          strelka={(d) => sdvinut(d[0] * 0.1)}
          label="Точка касания на графике"
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula
          tex={`f'(x_0)\\approx ${tex(k, 2)}${znak === '0' ? '' : znak === '+' ? '>0' : '<0'}`}
        />
        <span
          className={
            znak === '+'
              ? 'zhg__tag zhg__tag--rost'
              : znak === '−'
                ? 'zhg__tag zhg__tag--spad'
                : 'zhg__tag'
          }
        >
          {znak === '+' ? 'возрастает' : znak === '−' ? 'убывает' : 'экстремум'}
        </span>
      </span>
    </ZhivoyKoren>
  );
}
