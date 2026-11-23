'use client';

import { useId, useState } from 'react';
import { Tex } from '@/components/ui/Tex';

/**
 * Живые графики теории №10 (мяч выше отметки — отдельная сцена,
 * myach/Myach10.tsx).
 *
 *   ZhivoyRaspad — масса изотопа $m(t)=16\cdot2^{-\frac{t}{7}}$ (№109),
 *                  ползунок — время; видно, сколько раз масса
 *                  уменьшилась вдвое.
 *
 * Рисунок — простой SVG с цветами движка графиков (переменные
 * --color-primary, --graph-accent, --graph-axis). На печати ползунок
 * скрыт, остаётся один кадр.
 */

const W = 520;
const H = 300;
const P = { l: 46, r: 18, t: 18, b: 40 };

function chislo(x: number, znakov = 2): string {
  const r = Math.round(x * 10 ** znakov) / 10 ** znakov;
  return String(r).replace('.', ',').replace('-', '−');
}

interface Osi {
  tMax: number;
  yMax: number;
  podpisY: string;
  shagT: number;
  shagY: number;
}

function Setka({ o }: { o: Osi }) {
  const X = (t: number) => P.l + (t / o.tMax) * (W - P.l - P.r);
  const Y = (y: number) => H - P.b - (y / o.yMax) * (H - P.t - P.b);
  const xs: number[] = [];
  for (let t = 0; t <= o.tMax + 1e-9; t += o.shagT) {
    xs.push(t);
  }
  const ys: number[] = [];
  for (let y = 0; y <= o.yMax + 1e-9; y += o.shagY) {
    ys.push(y);
  }
  return (
    <g>
      {xs.map((t) => (
        <g key={`x${t}`}>
          <line
            x1={X(t)}
            y1={Y(0)}
            x2={X(t)}
            y2={Y(o.yMax)}
            stroke="var(--graph-grid, #C3D3E6)"
            strokeWidth="1"
          />
          <text
            x={X(t)}
            y={Y(0) + 16}
            textAnchor="middle"
            fontSize="12"
            fill="var(--graph-axis, #101728)"
          >
            {chislo(t)}
          </text>
        </g>
      ))}
      {ys.map((y) => (
        <g key={`y${y}`}>
          <line
            x1={X(0)}
            y1={Y(y)}
            x2={X(o.tMax)}
            y2={Y(y)}
            stroke="var(--graph-grid, #C3D3E6)"
            strokeWidth="1"
          />
          <text
            x={X(0) - 8}
            y={Y(y) + 4}
            textAnchor="end"
            fontSize="12"
            fill="var(--graph-axis, #101728)"
          >
            {chislo(y)}
          </text>
        </g>
      ))}
      <line
        x1={X(0)}
        y1={Y(0)}
        x2={X(o.tMax) + 8}
        y2={Y(0)}
        stroke="var(--graph-axis, #101728)"
        strokeWidth="2"
      />
      <line
        x1={X(0)}
        y1={Y(0)}
        x2={X(0)}
        y2={Y(o.yMax) - 6}
        stroke="var(--graph-axis, #101728)"
        strokeWidth="2"
      />
      <text
        x={X(o.tMax) + 4}
        y={Y(0) - 8}
        fontSize="15"
        fontStyle="italic"
        fill="var(--graph-axis, #101728)"
      >
        t
      </text>
      <text
        x={X(0) + 8}
        y={Y(o.yMax) + 4}
        fontSize="15"
        fontStyle="italic"
        fill="var(--graph-axis, #101728)"
      >
        {o.podpisY}
      </text>
    </g>
  );
}

export function ZhivoyRaspad() {
  const id = useId();
  const m0 = 16;
  const T = 7;
  const [t, setT] = useState(28);
  const o: Osi = { tMax: 35, yMax: 16, podpisY: 'm', shagT: 7, shagY: 4 };
  const X = (x: number) => P.l + (x / o.tMax) * (W - P.l - P.r);
  const Y = (y: number) => H - P.b - (y / o.yMax) * (H - P.t - P.b);
  const m = (x: number) => m0 * 2 ** (-x / T);
  const kriv: string[] = [];
  for (let i = 0; i <= 100; i += 1) {
    const x = (o.tMax * i) / 100;
    kriv.push(`${X(x).toFixed(1)},${Y(m(x)).toFixed(1)}`);
  }
  const k = t / T;
  const celoe = Number.isInteger(k);
  return (
    <figure className="z10-zhivoy">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="График массы изотопа: каждые 7 минут масса уменьшается вдвое"
      >
        <Setka o={o} />
        <polyline
          points={kriv.join(' ')}
          fill="none"
          stroke="var(--color-primary, #1F5FD0)"
          strokeWidth="3"
        />
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <circle
            key={n}
            cx={X(n * T)}
            cy={Y(m(n * T))}
            r="4"
            fill="var(--color-primary, #1F5FD0)"
          />
        ))}
        <line
          x1={X(t)}
          y1={Y(0)}
          x2={X(t)}
          y2={Y(m(t))}
          stroke="var(--graph-accent, #E07A2F)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <circle
          cx={X(t)}
          cy={Y(m(t))}
          r="6"
          fill="var(--graph-accent, #E07A2F)"
          stroke="var(--color-surface, #fff)"
          strokeWidth="2"
        />
      </svg>
      <label className="z10-zhivoy__polzunok" htmlFor={id}>
        <span>
          Время <Tex text="$t$" />, мин
        </span>
        <input
          id={id}
          type="range"
          min={0}
          max={35}
          step={1}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
        />
      </label>
      <figcaption>
        <Tex
          text={
            celoe
              ? `$t=${t}$ мин $=${k}\\cdot7$ мин — масса уменьшилась вдвое $${k}$ раз: $m=\\dfrac{16}{2^{${k}}}=${chislo(m(t)).replace(',', '{,}')}$ мг.`
              : `$t=${t}$ мин — это $\\dfrac{${t}}{7}$ периода, масса $m\\approx${chislo(m(t)).replace(',', '{,}')}$ мг. Целое число периодов — в точках графика.`
          }
        />
      </figcaption>
    </figure>
  );
}
