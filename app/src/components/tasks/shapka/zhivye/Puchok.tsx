'use client';

import { useId, useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import {
  Begunki,
  Begunok,
  chislo,
  Formula,
  klamp,
  naEkran,
  PlitaSteklo,
  putPlity,
  Ruchka,
  sEkrana,
  ZhivoyKoren,
  type Plita,
  type Tochka,
} from './obshchee';
import './zhivye-geom.css';

const PL: Plita = { o: [126, 146], ex: [18, 4], ey: [3, -16] };
const X0 = -5.5;
const X1 = 5.5;
const Y0 = -2.5;
const Y1 = 4.5;
/** Закреплённая точка пучка. */
const XP = -4;
const A_MIN = -1;
const A_MAX = 3;

const f = (x: number) => Math.abs(x * x - 4);

/** Корни a(x + 4) = |x² − 4| на плите: смена знака и касание. */
function peresecheniya(a: number): number[] {
  const h = (x: number) => a * (x - XP) - f(x);
  const out: number[] = [];
  const shag = 0.002;
  let pred = h(X0);
  for (let x = X0 + shag; x <= X1; x += shag) {
    const v = h(x);
    if (pred === 0 || pred * v < 0) {
      const r = Math.abs(pred) < Math.abs(v) ? x - shag : x;
      if (a * (r - XP) <= Y1 && out.every((q) => Math.abs(q - r) > 0.02)) out.push(r);
    }
    pred = v;
  }
  return out;
}

const GRAFIK: Tochka[] = Array.from({ length: 221 }, (_, i) => {
  const x = X0 + (i * (X1 - X0)) / 220;
  return [x, f(x)];
});

const PUCHOK = [-0.6, 0.2, 0.55, 1, 1.6, 2.4];

/**
 * №18 «Параметр»: график y = |x² − 4| и прямая y = a(x + 4), которая
 * поворачивается вокруг закреплённой точки (−4; 0). Бегунок или ручка
 * на прямой меняют a; отмечаются точки пересечения и их число —
 * число решений уравнения.
 */
export default function Puchok({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, '');
  const [a, setA] = useState(0.55);
  const postavit = (v: number) => setA(Math.round(klamp(v, A_MIN, A_MAX) * 100) / 100);

  const korni = peresecheniya(a);
  const P = naEkran(PL, XP, 0);
  /* Ручка на прямой — у правого края плиты или верхнего. */
  const xr = klamp(a > 0 ? Math.min(X1 - 0.5, (Y1 - 0.4) / a + XP) : X1 - 0.5, XP + 1, X1 - 0.5);
  const R = naEkran(PL, xr, a * (xr - XP));
  const ugly: Tochka[] = [
    [X0, Y0],
    [X1, Y0],
    [X1, Y1],
    [X0, Y1],
  ];
  const pryamaya = (k: number) =>
    putPlity(PL, [
      [XP, 0],
      [X1 + 3, k * (X1 + 3 - XP)],
    ]);

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => postavit(a + (d[0] !== 0 ? d[0] : -d[1]) * 0.05)}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-pl`}>
            <path d={putPlity(PL, ugly) + 'Z'} />
          </clipPath>
        </defs>
        <PlitaSteklo pl={PL} x0={X0} x1={X1} y0={Y0} y1={Y1} tolshchina={9} setka={1} />
        <g clipPath={`url(#${id}-pl)`}>
          <path
            className="zhv__ln zhv__ln--tonko"
            d={putPlity(PL, [
              [X0, 0],
              [X1, 0],
            ])}
            opacity={0.6}
          />
          <path
            className="zhv__ln zhv__ln--tonko"
            d={putPlity(PL, [
              [0, Y0],
              [0, Y1],
            ])}
            opacity={0.6}
          />
          {PUCHOK.map((k) => (
            <path
              key={k}
              className="zhv__ln zhv__ln--tonko zhv__ln--or"
              d={pryamaya(k)}
              opacity={0.22}
            />
          ))}
          <path className="zhv__ln" d={putPlity(PL, GRAFIK)} strokeWidth={3} />
          <path className="zhv__ln zhv__ln--or" d={pryamaya(a)} strokeWidth={3} />
        </g>
        {korni.map((x) => {
          const [sx, sy] = naEkran(PL, x, f(x));
          return (
            <g key={x.toFixed(3)}>
              <circle cx={sx} cy={sy} r={8} fill="rgb(255 170 90 / 0.35)" />
              <circle className="zhv__tochka--or" cx={sx} cy={sy} r={4} />
            </g>
          );
        })}
        <circle className="zhv__tochka" cx={P[0]} cy={P[1]} r={4.5} />
        <text className="zhv__t" x={P[0] - 6} y={P[1] + 18}>
          −4
        </text>
        <Ruchka
          svg={svg}
          x={R[0]}
          y={R[1]}
          tyanut={(p) => {
            const [x, y] = sEkrana(PL, p);
            if (x - XP > 0.6) postavit(y / (x - XP));
          }}
          strelka={(d) => postavit(a + (d[0] !== 0 ? d[0] : -d[1]) * 0.05)}
          label="Прямая пучка: наклон a"
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`a(x+4)=|x^2-4|`} />
        <b>решений: {korni.length}</b>
      </span>
      <Begunki>
        <Begunok
          podpis={<Formula tex="a" />}
          min={A_MIN}
          max={A_MAX}
          shag={0.01}
          znachenie={a}
          pokaz={chislo(a, 2)}
          menyat={postavit}
        />
      </Begunki>
    </ZhivoyKoren>
  );
}
