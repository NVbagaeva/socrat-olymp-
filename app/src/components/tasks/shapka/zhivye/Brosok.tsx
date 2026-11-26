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
  type Plita,
  chislo as chisloRu,
} from './obshchee';
import { stena, tex } from './grafik';
import './grafiki.css';

/* Плита широкая и плоская, как на картинке: над ней — высокая дуга полёта. */
const PL: Plita = { o: [20, 194], ex: [21, 3], ey: [9, -6] };
const ST = stena(3, 40, PL);
/** Точка броска на стенке. */
const X_START = 0.5;
/** «Ускорение свободного падения» в единицах чертежа. */
const G = 5.4;
const V_MIN = 3;
const V_MAX = 6.2;
const A_MIN = 15;
const A_MAX = 80;
/** Длина стрелки прицела на единицу скорости. */
const PRICEL = 0.32;
const RAD = Math.PI / 180;

/**
 * №9 «Физический смысл»: брошенный мяч над стеклянной плитой. Ручка на
 * конце стрелки прицела задаёт угол и силу броска; парабола-траектория
 * перестраивается, отмечены наибольшая высота H и дальность L.
 */
export default function Brosok({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [ugol, setUgol] = useState(55);
  const [v, setV] = useState(5.9);

  const a = ugol * RAD;
  const vx = v * Math.cos(a);
  const vy = v * Math.sin(a);
  const T = (2 * vy) / G;
  const L = vx * T;
  const H = (vy * vy) / (2 * G);
  const tochka = (t: number): [number, number] => [X_START + vx * t, vy * t - (G * t * t) / 2];
  const e = (p: [number, number]) => naEkran(ST, p[0], p[1]);

  let put = '';
  for (let i = 0; i <= 48; i += 1) {
    const [x, y] = e(tochka((T * i) / 48));
    put += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const sledy = [1, 2, 4, 5].map((i) => e(tochka((T * i) / 6)));
  const vershina = e(tochka(T / 2));
  const podVershinoy = e([X_START + L / 2, 0]);
  const start = e([X_START, 0]);
  const finish = e([X_START + L, 0]);
  const pricel = e([X_START + vx * PRICEL, vy * PRICEL]);

  const zadat = (p: readonly [number, number]) => {
    const [wx, wy] = sEkrana(ST, p);
    const dx = wx - X_START;
    const dy = wy;
    setUgol(Math.round(klamp(Math.atan2(dy, dx) / RAD, A_MIN, A_MAX)));
    setV(klamp(Math.hypot(dx, dy) / PRICEL, V_MIN, V_MAX));
  };
  const strelka = (d: readonly [number, number]) => {
    if (d[0] !== 0) setUgol((u) => klamp(u - d[0] * 2, A_MIN, A_MAX));
    if (d[1] !== 0) setV((s) => klamp(s - d[1] * 0.1, V_MIN, V_MAX));
  };

  return (
    <ZhivoyKoren label={label} avtofokus={avtofokus} naStrelku={(d) => strelka(d)}>
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <radialGradient id="zhg-myach" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="var(--chertezh-fon)" />
            <stop offset="0.6" stopColor="var(--chertezh-zalivka-siniy)" />
            <stop offset="1" stopColor="var(--chertezh-setka)" />
          </radialGradient>
        </defs>
        <PlitaSteklo pl={PL} x0={0} x1={8} y0={0} y1={6} tolshchina={9} setka={1} />
        <path className="zhg__traektoriya" d={put} />
        {/* Наибольшая высота. */}
        <path
          className="zhv__ln zhv__ln--tonko zhv__ln--pk"
          d={`M${vershina[0]} ${vershina[1]}L${podVershinoy[0]} ${podVershinoy[1]}`}
        />
        <text className="zhv__t" x={podVershinoy[0] + 5} y={(vershina[1] + podVershinoy[1]) / 2}>
          {`H ≈ ${chisloRu(H)}`}
        </text>
        {/* Дальность. */}
        <path
          className="zhv__ln zhv__ln--or"
          d={`M${start[0]} ${start[1]}L${finish[0]} ${finish[1]}`}
        />
        <circle className="zhv__tochka zhv__tochka--or" cx={finish[0]} cy={finish[1]} r={4} />
        <text
          className="zhv__t"
          x={(start[0] + finish[0]) / 2 + 4}
          y={(start[1] + finish[1]) / 2 + 15}
        >
          {`L ≈ ${chisloRu(L)}`}
        </text>
        {sledy.map(([x, y], i) => (
          <circle key={i} className="zhg__sled" cx={x} cy={y} r={5} />
        ))}
        <circle className="zhg__myach" cx={vershina[0]} cy={vershina[1]} r={8.5} />
        {/* Прицел: угол и сила броска. */}
        <path className="zhv__ln" d={`M${start[0]} ${start[1]}L${pricel[0]} ${pricel[1]}`} />
        <circle className="zhv__tochka" cx={start[0]} cy={start[1]} r={3.5} />
        <text className="zhv__t" x={start[0] + 12} y={start[1] - 3}>
          α
        </text>
        <Ruchka
          svg={svg}
          x={pricel[0]}
          y={pricel[1]}
          tyanut={zadat}
          strelka={strelka}
          label="Угол и сила броска"
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`\\alpha=${ugol}^\\circ,\\ v_0=${tex(v)}`} />
      </span>
    </ZhivoyKoren>
  );
}
