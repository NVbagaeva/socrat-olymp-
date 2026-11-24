'use client';

import { chisloText } from '@/lib/ustnyySchet/chislo';

const W = 260;
const H = 52;
const OS_Y = 22;
const POLE = 14;

/**
 * Верный ответ в уравнении: корни «прилетают» стеклянными точками на
 * маленькую числовую прямую (400 мс). При уменьшенном движении точки
 * просто стоят на местах. Только украшение: «Верно» объявляет экран
 * тренировки.
 */
export function KorniPolet({ korni }: { korni: readonly string[] }) {
  const [a = '0', b = a] = korni;
  const x1 = Number(a);
  const x2 = Number(b);
  const lo = Math.floor(Math.min(0, x1)) - 1;
  const hi = Math.ceil(Math.max(0, x2)) + 1;
  const X = (x: number) => POLE + ((x - lo) / (hi - lo)) * (W - 2 * POLE);
  const shag = hi - lo > 24 ? 5 : hi - lo > 12 ? 2 : 1;
  const metki: number[] = [];
  for (let t = Math.ceil(lo / shag) * shag; t <= hi; t += shag) metki.push(t);
  const odin = a === b;
  return (
    <svg
      className="us-polet"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      focusable="false"
    >
      <line className="us-polet__os" x1={POLE / 2} y1={OS_Y} x2={W - POLE / 2} y2={OS_Y} />
      {metki.map((t) => (
        <line
          key={t}
          className={t === 0 ? 'us-polet__nol' : 'us-polet__metka'}
          x1={X(t)}
          x2={X(t)}
          y1={OS_Y - (t === 0 ? 6 : 3)}
          y2={OS_Y + (t === 0 ? 6 : 3)}
        />
      ))}
      <g
        className="us-polet__tochka us-polet__tochka--1"
        style={{ transformOrigin: `${X(x1)}px ${OS_Y}px` }}
      >
        <circle cx={X(x1)} cy={OS_Y} r={7} />
        <text x={X(x1)} y={OS_Y + 22} textAnchor="middle">
          {chisloText(a)}
        </text>
      </g>
      {!odin && (
        <g
          className="us-polet__tochka us-polet__tochka--2"
          style={{ transformOrigin: `${X(x2)}px ${OS_Y}px` }}
        >
          <circle cx={X(x2)} cy={OS_Y} r={7} />
          <text x={X(x2)} y={OS_Y + 22} textAnchor="middle">
            {chisloText(b)}
          </text>
        </g>
      )}
    </svg>
  );
}
