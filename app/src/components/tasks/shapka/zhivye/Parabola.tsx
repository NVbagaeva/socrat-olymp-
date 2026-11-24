'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import {
  Formula,
  klamp,
  naEkran,
  PlitaSteklo,
  Ruchka,
  sEkrana,
  ZhivoyKoren,
  type Tochka,
} from './obshchee';
import { PLITA, tex } from './grafik';
import './grafiki.css';

/** Математические координаты на плите: x ∈ [−4; 4], y ∈ [−1; 5]. */
const XMIN = -4;
const XMAX = 4;
const YMIN = -1;
const YMAX = 5;
const A = 0.3;
const e = (x: number, y: number) => naEkran(PLITA, x - XMIN, y - YMIN);
const izEkrana = (p: Tochka): Tochka => {
  const [x, y] = sEkrana(PLITA, p);
  return [klamp(x + XMIN, XMIN + 0.2, XMAX - 0.2), klamp(y + YMIN, YMIN + 0.2, YMAX - 0.2)];
};

/** Отрезок прямой y = kx + m внутри плиты. */
function vPlite(k: number, m: number): [Tochka, Tochka] | null {
  let t0 = XMIN;
  let t1 = XMAX;
  if (Math.abs(k) > 1e-9) {
    const a = (YMIN - m) / k;
    const b = (YMAX - m) / k;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  } else if (m < YMIN || m > YMAX) {
    return null;
  }
  if (t1 <= t0) return null;
  return [
    [t0, k * t0 + m],
    [t1, k * t1 + m],
  ];
}

let PARABOLA = '';
for (let i = 0; i <= 80; i += 1) {
  const x = XMIN + ((XMAX - XMIN) * i) / 80;
  const y = A * x * x;
  if (y > YMAX) continue;
  const [sx, sy] = e(x, y);
  PARABOLA += `${PARABOLA === '' ? 'M' : 'L'}${sx.toFixed(1)} ${sy.toFixed(1)}`;
}

/**
 * №11 «Графики функций»: парабола на стеклянной плите и прямая. Прямую
 * тянут за две точки — меняются наклон и сдвиг; точки пересечения с
 * параболой бегут за ней, их координаты пересчитываются.
 */
export default function Parabola({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Tochka>([-2.5, 0.6]);
  const [Q, setQ] = useState<Tochka>([2.5, 2.6]);
  const [vybrana, setVybrana] = useState<0 | 1>(0);

  const dx = Q[0] - P[0];
  const k = Math.abs(dx) < 0.05 ? (Q[1] - P[1]) / 0.05 : (Q[1] - P[1]) / dx;
  const m = P[1] - k * P[0];
  /* A·x² − k·x − m = 0. */
  const D = k * k + 4 * A * m;
  const korni =
    D < 0
      ? []
      : D < 1e-6
        ? [k / (2 * A)]
        : [(k - Math.sqrt(D)) / (2 * A), (k + Math.sqrt(D)) / (2 * A)];
  const peresecheniya = korni.map((x): Tochka => [x, A * x * x]);
  const otrezok = vPlite(k, m);

  const sdvig = (set: (f: (p: Tochka) => Tochka) => void) => (d: Tochka) =>
    set((p) => [
      klamp(p[0] + d[0] * 0.1, XMIN + 0.2, XMAX - 0.2),
      klamp(p[1] - d[1] * 0.1, YMIN + 0.2, YMAX - 0.2),
    ]);

  const imena = ['A', 'B'];
  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => (vybrana === 0 ? sdvig(setP)(d) : sdvig(setQ)(d))}
      naEnter={() => setVybrana((v) => (v === 0 ? 1 : 0))}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <PlitaSteklo pl={PLITA} x0={0} x1={8} y0={0} y1={6} tolshchina={9} setka={1} />
        {/* Оси. */}
        <path
          className="zhv__ln zhv__ln--tonko"
          d={`M${e(XMIN, 0).join(' ')}L${e(XMAX, 0).join(' ')}M${e(0, YMIN).join(' ')}L${e(0, YMAX).join(' ')}`}
          opacity={0.5}
        />
        <path className="zhg__svet" d={PARABOLA} />
        <path className="zhv__ln zhv__ln--or" d={PARABOLA} />
        {otrezok === null ? null : (
          <path
            className="zhv__ln"
            d={`M${e(...otrezok[0]).join(' ')}L${e(...otrezok[1]).join(' ')}`}
          />
        )}
        {peresecheniya.map((p, i) => {
          const [x, y] = e(p[0], p[1]);
          return (
            <g key={i}>
              <circle className="zhv__tochka zhv__tochka--or" cx={x} cy={y} r={5} />
              <text className="zhv__v" x={x - 4} y={y - 9}>
                {imena[i]}
              </text>
            </g>
          );
        })}
        <Ruchka
          svg={svg}
          x={e(...P)[0]}
          y={e(...P)[1]}
          tyanut={(p) => setP(izEkrana(p))}
          strelka={sdvig(setP)}
          label="Первая точка прямой"
          r={5}
        />
        <Ruchka
          svg={svg}
          x={e(...Q)[0]}
          y={e(...Q)[1]}
          tyanut={(p) => setQ(izEkrana(p))}
          strelka={sdvig(setQ)}
          label="Вторая точка прямой"
          r={5}
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`y=0{,}3x^2,\\quad y=${tex(k)}x${m < 0 ? '-' : '+'}${tex(Math.abs(m))}`} />
      </span>
      <span className="zhv__plashka">
        {peresecheniya.length === 0 ? (
          'Нет точек пересечения'
        ) : (
          <Formula
            tex={peresecheniya
              .map((p, i) => `${imena[i]}(${tex(p[0])};\\,${tex(p[1])})`)
              .join(',\\ ')}
          />
        )}
      </span>
    </ZhivoyKoren>
  );
}
