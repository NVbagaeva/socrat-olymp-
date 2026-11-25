'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, Ruchka, ZhivoyKoren, type Tochka } from './obshchee';

const C0: Tochka = [130, 126];
const R = 90;
const RAD = Math.PI / 180;
/** Привязка к π/6 и π/4: ближе стольких градусов — точно на них. */
const PRITYAZHENIE = 4;
const UZLY = Array.from(
  new Set([
    ...Array.from({ length: 12 }, (_, i) => i * 30),
    ...Array.from({ length: 8 }, (_, i) => i * 45),
  ]),
);

const SORT = [...UZLY].sort((a, b) => a - b);
const norm = (d: number) => ((d % 360) + 360) % 360;
const na = (deg: number): Tochka => [
  C0[0] + R * Math.cos(deg * RAD),
  C0[1] - R * Math.sin(deg * RAD),
];

function nod(a: number, b: number): number {
  return b === 0 ? a : nod(b, a % b);
}

/** Угол в градусах — дробью от π в TeX: 150 → \frac{5\pi}{6}. */
function piTex(deg: number): string {
  if (deg === 0) return '0';
  const n0 = Math.round(Math.abs(deg));
  const g = nod(n0, 180);
  const chisl = n0 / g;
  const znam = 180 / g;
  const minus = deg < 0 ? '-' : '';
  const verh = `${chisl === 1 ? '' : chisl}\\pi`;
  return `${minus}${znam === 1 ? verh : `\\frac{${verh}}{${znam}}`}`;
}

function radTex(deg: number): string {
  return (Math.round(deg * RAD * 100) / 100).toString().replace('.', '{,}');
}

type Vid = 'cos' | 'sin';

/**
 * №13 «Уравнение»: единичная окружность. Точку ведут по окружности —
 * угол показывается в радианах и прилипает к π/6 и π/4. Подсвечивается
 * серия решений: для косинуса — точки ±x, для синуса — x и π − x.
 * Enter или нажатие на точку переключает косинус и синус.
 */
export default function Krug({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [ugol, setUgol] = useState(60);
  const [vid, setVid] = useState<Vid>('cos');

  const postavit = (u: number) => {
    const v = norm(u);
    const uzel = UZLY.find((z) => Math.abs(norm(v - z + 180) - 180) <= PRITYAZHENIE);
    setUgol(uzel ?? v);
  };
  const tochno = UZLY.includes(ugol);
  const para = vid === 'cos' ? norm(-ugol) : norm(180 - ugol);
  const P = na(ugol);
  const Q = na(para);
  const odna = Math.abs(norm(para - ugol + 180) - 180) < 0.5;

  /* Подпись угла: в (−π; π] — так серии пишут в учебниках. */
  const pokaz = ugol > 180 ? ugol - 360 : ugol;
  const xTex = tochno ? piTex(pokaz) : `${pokaz < 0 ? '-' : ''}${radTex(Math.abs(pokaz))}`;
  const ravno = tochno ? '=' : '\\approx';
  const funk = vid === 'cos' ? '\\cos' : '\\sin';
  const znach = vid === 'cos' ? Math.cos(ugol * RAD) : Math.sin(ugol * RAD);
  const znachTex = (Math.round(znach * 100) / 100).toString().replace('.', '{,}');

  let seriya: string;
  if (!tochno) seriya = `${funk} x ${ravno} ${znachTex}`;
  else if (odna) seriya = `x=${piTex(pokaz)}+2\\pi k`;
  else if (vid === 'cos') seriya = `x=\\pm ${piTex(Math.abs(pokaz))}+2\\pi k`;
  else {
    const p2 = para > 180 ? para - 360 : para;
    seriya = `x=${piTex(pokaz)}+2\\pi k,\\ x=${piTex(p2)}+2\\pi k`;
  }

  /* Дуга угла от 0 до x. */
  const r0 = 22;
  const dugaKon: Tochka = [C0[0] + r0 * Math.cos(ugol * RAD), C0[1] - r0 * Math.sin(ugol * RAD)];
  const duga = `M${C0[0] + r0} ${C0[1]}A${r0} ${r0} 0 ${ugol > 180 ? 1 : 0} 0 ${dugaKon[0]} ${dugaKon[1]}`;
  /* Проекция на ось и хорда серии. */
  const proekciya: Tochka = vid === 'cos' ? [P[0], C0[1]] : [C0[0], P[1]];

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        /* Стрелки — от узла к узлу (π/6 и π/4). */
        const k = Math.sign(d[0] !== 0 ? -d[0] : d[1]);
        const n = SORT.length;
        const cur = SORT.indexOf(ugol);
        if (cur >= 0) setUgol(SORT[(cur + k + n) % n]!);
        else if (k > 0) setUgol(SORT.find((z) => z > ugol) ?? SORT[0]!);
        else setUgol([...SORT].reverse().find((z) => z < ugol) ?? SORT[n - 1]!);
      }}
      naEnter={() => setVid((v) => (v === 'cos' ? 'sin' : 'cos'))}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <circle
          cx={C0[0]}
          cy={C0[1]}
          r={R}
          fill="color-mix(in srgb, var(--chertezh-blik) 35%, transparent)"
          className="zhv__ln"
        />
        <path
          className="zhv__ln zhv__ln--tonko"
          d={`M${C0[0] - R - 14} ${C0[1]}H${C0[0] + R + 14}M${C0[0]} ${C0[1] + R + 14}V${C0[1] - R - 14}`}
        />
        {UZLY.map((z) => {
          const [x, y] = na(z);
          return <circle key={z} cx={x} cy={y} r={1.8} fill="var(--blue-600)" opacity={0.45} />;
        })}
        <text className="zhv__t" x={C0[0] + R + 4} y={C0[1] + 15}>
          {vid === 'cos' ? 'cos' : ''}
        </text>
        <text className="zhv__t" x={C0[0] + 6} y={C0[1] - R - 4}>
          {vid === 'sin' ? 'sin' : ''}
        </text>
        <path className="zhv__ln zhv__ln--or zhv__ln--tonko" d={duga} />
        <path className="zhv__ln zhv__ln--tonko" d={`M${C0[0]} ${C0[1]}L${P[0]} ${P[1]}`} />
        <path
          className="zhv__ln zhv__ln--tonko zhv__ln--or zhv__ln--pk"
          d={`M${P[0]} ${P[1]}L${Q[0]} ${Q[1]}`}
        />
        <circle className="zhv__tochka--or" cx={proekciya[0]} cy={proekciya[1]} r={3.5} />
        {odna ? null : (
          <g>
            <circle
              cx={Q[0]}
              cy={Q[1]}
              r={9}
              fill="color-mix(in srgb, var(--chertezh-akcent) 30%, transparent)"
            />
            <circle cx={Q[0]} cy={Q[1]} r={5} fill="var(--chertezh-akcent)" />
          </g>
        )}
        <circle
          cx={P[0]}
          cy={P[1]}
          r={11}
          fill="color-mix(in srgb, var(--chertezh-akcent) 30%, transparent)"
        />
        <Ruchka
          svg={svg}
          x={P[0]}
          y={P[1]}
          tyanut={(p) => postavit(Math.atan2(C0[1] - p[1], p[0] - C0[0]) / RAD)}
          strelka={(d) => postavit(ugol + (d[0] !== 0 ? -d[0] : d[1]) * 5)}
          nazhat={() => setVid((v) => (v === 'cos' ? 'sin' : 'cos'))}
          label="Точка на единичной окружности"
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`x ${ravno} ${xTex}`} />
      </span>
      <span className="zhv__plashka">
        <Formula tex={seriya} />
      </span>
    </ZhivoyKoren>
  );
}
