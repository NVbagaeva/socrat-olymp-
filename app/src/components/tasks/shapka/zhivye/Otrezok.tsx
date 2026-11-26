'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import {
  Begunki,
  Begunok,
  chislo,
  Formula,
  klamp,
  naEkran,
  PlitaSteklo,
  Ruchka,
  sEkrana,
  ZhivoyKoren,
  type Plita,
} from './obshchee';
import { putFunkcii, stena, tex, zalivkaPod } from './grafik';
import './grafiki.css';

/* Плита чуть выше обычной: снизу — два бегунка. */
const PL: Plita = { o: [15, 138], ex: [19, 9], ey: [13, -14] };
const ST = stena(3, 19, PL);
const X0 = 0.2;
const X1 = 7.8;
const MIN_DLINA = 0.4;
const f = (x: number) => 1.7 + 0.9 * Math.sin(1.25 * x - 0.3) + 0.55 * Math.sin(0.5 * x + 0.8);

/** Наибольшее и наименьшее значения на [a; b] — перебором с мелким шагом. */
function ekstremumy(a: number, b: number) {
  let max: [number, number] = [a, f(a)];
  let min: [number, number] = [a, f(a)];
  const n = 240;
  for (let i = 1; i <= n; i += 1) {
    const x = a + ((b - a) * i) / n;
    const y = f(x);
    if (y > max[1]) max = [x, y];
    if (y < min[1]) min = [x, y];
  }
  return { max, min };
}

/**
 * №12 «Наибольшее и наименьшее значение»: график стенкой на стеклянной
 * плите. Бегунками (или ручками на основании) задаётся отрезок [a; b];
 * на нём флажком отмечено наибольшее значение, бусиной — наименьшее.
 */
export default function Otrezok({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(2.2);
  const [b, setB] = useState(6.6);
  const [vybran, setVybran] = useState<0 | 1>(0);
  const zadatA = (v: number) => setA(klamp(v, X0, b - MIN_DLINA));
  const zadatB = (v: number) => setB(klamp(v, a + MIN_DLINA, X1));
  const { max, min } = ekstremumy(a, b);
  const e = (x: number, y: number) => naEkran(ST, x, y);

  const [mx, my] = e(...max);
  const [nx, ny] = e(...min);
  const [ax, ay] = e(a, 0);
  const [bx, by] = e(b, 0);
  const [afx, afy] = e(a, f(a));
  const [bfx, bfy] = e(b, f(b));

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => (vybran === 0 ? zadatA(a + d[0] * 0.1) : zadatB(b + d[0] * 0.1))}
      naEnter={() => setVybran((v) => (v === 0 ? 1 : 0))}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <radialGradient id="zhg-busina" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="var(--chertezh-fon)" />
            <stop offset="0.55" stopColor="var(--chertezh-setka)" />
            <stop offset="1" stopColor="var(--chertezh-siniy)" />
          </radialGradient>
        </defs>
        <PlitaSteklo pl={PL} x0={0} x1={8} y0={0} y1={6} tolshchina={9} setka={1} />
        <path className="zhg__zalivka zhg__tusk" d={zalivkaPod(ST, f, X0, X1)} />
        <path className="zhg__zalivka" d={zalivkaPod(ST, f, a, b, 60)} />
        <path className="zhv__ln zhg__tusk" d={putFunkcii(ST, f, X0, X1)} />
        <path className="zhv__ln" d={putFunkcii(ST, f, a, b, 60)} />
        <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${ax} ${ay}L${afx} ${afy}`} />
        <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${bx} ${by}L${bfx} ${bfy}`} />
        <path className="zhg__vybor" d={`M${ax} ${ay}L${bx} ${by}`} />
        <text className="zhv__v" x={ax - 5} y={ay + 18}>
          a
        </text>
        <text className="zhv__v" x={bx - 4} y={by + 18}>
          b
        </text>
        {/* Флажок — наибольшее значение. */}
        <path className="zhv__ln zhv__ln--tonko" d={`M${mx} ${my}L${mx} ${my - 24}`} />
        <path
          className="zhg__flag"
          d={`M${mx} ${my - 24}L${mx + 15} ${my - 19}L${mx} ${my - 13}Z`}
        />
        <circle className="zhv__tochka zhv__tochka--or" cx={mx} cy={my} r={3.5} />
        {/* Бусина — наименьшее значение. */}
        <circle className="zhg__busina" cx={nx} cy={ny} r={7} />
        <Ruchka
          svg={svg}
          x={ax}
          y={ay}
          tyanut={(p) => zadatA(sEkrana(ST, p)[0])}
          strelka={(d) => zadatA(a + d[0] * 0.1)}
          label="Левый конец отрезка"
          r={5}
        />
        <Ruchka
          svg={svg}
          x={bx}
          y={by}
          tyanut={(p) => zadatB(sEkrana(ST, p)[0])}
          strelka={(d) => zadatB(b + d[0] * 0.1)}
          label="Правый конец отрезка"
          r={5}
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`\\max\\approx ${tex(max[1])},\\ \\min\\approx ${tex(min[1])}`} />
      </span>
      <Begunki>
        <Begunok
          podpis="a"
          min={X0}
          max={X1}
          shag={0.1}
          znachenie={a}
          pokaz={chislo(a)}
          menyat={zadatA}
        />
        <Begunok
          podpis="b"
          min={X0}
          max={X1}
          shag={0.1}
          znachenie={b}
          pokaz={chislo(b)}
          menyat={zadatB}
        />
      </Begunki>
    </ZhivoyKoren>
  );
}
