'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import {
  Formula,
  naEkran,
  PlitaSteklo,
  Ruchka,
  sEkrana,
  klamp,
  ZhivoyKoren,
  type Plita,
  type Tochka,
} from './obshchee';

/** Плита 8 × 6 клеток, наклонённая, как на картинке. */
const PL: Plita = { o: [15, 136], ex: [19, 9], ey: [13, -14] };
const W = 8;
const H = 6;
const O: Tochka = [1, 1];

function strelka(a: Tochka, b: Tochka): [string, string] {
  const [x1, y1] = naEkran(PL, a[0], a[1]);
  const [x2, y2] = naEkran(PL, b[0], b[1]);
  const d = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / d;
  const uy = (y2 - y1) / d;
  const L = 11;
  const s = 5;
  const bx = x2 - ux * L;
  const by = y2 - uy * L;
  return [
    `M${x1} ${y1}L${bx} ${by}`,
    `M${x2} ${y2}L${bx - uy * s} ${by + ux * s}L${bx + uy * s} ${by - ux * s}Z`,
  ];
}

const vek = (t: string, v: Tochka) => `\\vec ${t}\\{${v[0]};\\,${v[1]}\\}`;

/**
 * №2 «Векторы»: два вектора из одной точки на клетчатой плите. Концы
 * тянутся по узлам сетки, координаты и сумма пересчитываются,
 * параллелограмм достраивается пунктиром.
 */
export default function Vektory({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [A, setA] = useState<Tochka>([2, 5]);
  const [B, setB] = useState<Tochka>([6, 2]);
  const [vybran, setVybran] = useState<0 | 1>(0);

  const k = (p: Tochka): Tochka => [klamp(Math.round(p[0]), 0, W), klamp(Math.round(p[1]), 0, H)];
  const nePustoy = (p: Tochka) => (p[0] === O[0] && p[1] === O[1] ? null : p);
  const tyanut = (set: (p: Tochka) => void) => (p: Tochka) => {
    const q = nePustoy(k(sEkrana(PL, p)));
    if (q !== null) set(q);
  };
  const sdvinut = (set: (f: (p: Tochka) => Tochka) => void) => (d: Tochka) =>
    set((p) => nePustoy(k([p[0] + Math.sign(d[0]), p[1] - Math.sign(d[1])])) ?? p);

  const a: Tochka = [A[0] - O[0], A[1] - O[1]];
  const b: Tochka = [B[0] - O[0], B[1] - O[1]];
  const S: Tochka = [O[0] + a[0] + b[0], O[1] + a[1] + b[1]];
  const sVnutri = S[0] >= -2 && S[0] <= W + 2 && S[1] >= -2 && S[1] <= H + 2;
  const e = (p: Tochka) => naEkran(PL, p[0], p[1]);

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => (vybran === 0 ? sdvinut(setA)(d) : sdvinut(setB)(d))}
      naEnter={() => setVybran((v) => (v === 0 ? 1 : 0))}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <PlitaSteklo pl={PL} x0={0} x1={W} y0={0} y1={H} tolshchina={9} setka={1} />
        {sVnutri ? (
          <>
            <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${e(A)}L${e(S)}`} />
            <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${e(B)}L${e(S)}`} />
            <path
              className="zhv__ln zhv__ln--tonko zhv__ln--or zhv__ln--pk"
              d={`M${e(O)}L${e(S)}`}
            />
          </>
        ) : null}
        <path className="zhv__ln" d={strelka(O, A)[0]} />
        <path d={strelka(O, A)[1]} fill="var(--blue-600)" />
        <path className="zhv__ln zhv__ln--or" d={strelka(O, B)[0]} />
        <path d={strelka(O, B)[1]} fill="var(--chertezh-akcent)" />
        <circle className="zhv__tochka" cx={e(O)[0]} cy={e(O)[1]} r={4} />
        <text className="zhv__v" x={e(O)[0] - 16} y={e(O)[1] + 4}>
          O
        </text>
        <text className="zhv__v" x={e(A)[0] - 6} y={e(A)[1] - 12}>
          a
        </text>
        <text className="zhv__v" x={e(B)[0] + 8} y={e(B)[1] + 14}>
          b
        </text>
        <Ruchka
          svg={svg}
          x={e(A)[0]}
          y={e(A)[1]}
          tyanut={tyanut(setA)}
          strelka={sdvinut(setA)}
          label="Конец первого вектора"
        />
        <Ruchka
          svg={svg}
          x={e(B)[0]}
          y={e(B)[1]}
          tyanut={tyanut(setB)}
          strelka={sdvinut(setB)}
          label="Конец второго вектора"
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`${vek('a', a)},\\ ${vek('b', b)}`} />
      </span>
      <span className="zhv__plashka">
        <Formula tex={`\\vec a+\\vec b=\\{${a[0] + b[0]};\\,${a[1] + b[1]}\\}`} />
      </span>
    </ZhivoyKoren>
  );
}
