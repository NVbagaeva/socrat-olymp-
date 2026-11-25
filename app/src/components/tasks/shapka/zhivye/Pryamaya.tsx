'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import './zhivye-geom.css';
import { Formula, klamp, naEkran, Ruchka, sEkrana, ZhivoyKoren, type Plita } from './obshchee';

/** Числовая прямая чуть наклонена, как стеклянная стрелка на картинке. */
const PL: Plita = { o: [128, 132], ex: [22, -6], ey: [6, 22] };
const MIN = -4;
const MAX = 4;

interface Konec {
  x: number;
  /** Закрашенная точка — конец входит в промежуток. */
  vkl: boolean;
}

const tex = (n: number) => (n < 0 ? `-${-n}` : String(n));

/**
 * №15 «Неравенство»: промежуток на числовой прямой. Концы тянутся по
 * делениям, нажатие на точку делает её выколотой или закрашенной;
 * запись промежутка и неравенства обновляется.
 */
export default function Pryamaya({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [lev, setLev] = useState<Konec>({ x: -2, vkl: false });
  const [prav, setPrav] = useState<Konec>({ x: 2, vkl: true });
  const [vybran, setVybran] = useState<0 | 1>(1);

  const dvigat = (kto: 0 | 1, x: number) => {
    setVybran(kto);
    const n = Math.round(x);
    if (kto === 0) setLev((k) => ({ ...k, x: klamp(n, MIN, prav.x - 1) }));
    else setPrav((k) => ({ ...k, x: klamp(n, lev.x + 1, MAX) }));
  };
  const pereklyuchit = (kto: 0 | 1) => {
    setVybran(kto);
    (kto === 0 ? setLev : setPrav)((k) => ({ ...k, vkl: !k.vkl }));
  };

  const e = (x: number, y = 0) => naEkran(PL, x, y);
  const [l0, l1] = e(MIN - 1.2);
  const [r0, r1] = e(MAX + 1.4);
  const [a0, a1] = e(lev.x);
  const [b0, b1] = e(prav.x);
  const nakl = Math.atan2(PL.ex[1], PL.ex[0]);
  const ux = Math.cos(nakl);
  const uy = Math.sin(nakl);

  const zapis = `x\\in${lev.vkl ? '[' : '('}${tex(lev.x)};\\,${tex(prav.x)}${prav.vkl ? ']' : ')'}`;
  const nerav = `${tex(lev.x)}${lev.vkl ? '\\le' : '<'} x ${prav.vkl ? '\\le' : '<'}${tex(prav.x)}`;

  const tochka = (k: Konec, kto: 0 | 1, imya: string) => {
    const [x, y] = e(k.x);
    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={7}
          fill={k.vkl ? 'var(--chertezh-akcent)' : 'var(--chertezh-fon)'}
          stroke="var(--chertezh-akcent)"
          strokeWidth={3}
        />
        <Ruchka
          svg={svg}
          x={x}
          y={y}
          r={7}
          className="zhv-pryamaya__ruchka"
          tyanut={(p) => dvigat(kto, sEkrana(PL, p)[0])}
          strelka={(d) => dvigat(kto, k.x + (d[0] !== 0 ? Math.sign(d[0]) : -Math.sign(d[1])))}
          nazhat={() => pereklyuchit(kto)}
          label={`${imya} конец промежутка, ${k.vkl ? 'закрашенная' : 'выколотая'} точка`}
        />
      </g>
    );
  };

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        const k = vybran === 0 ? lev : prav;
        dvigat(vybran, k.x + (d[0] !== 0 ? Math.sign(d[0]) : -Math.sign(d[1])));
      }}
      naEnter={() => pereklyuchit(vybran)}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        {/* Штриховка промежутка: дуга метода интервалов над ним. */}
        <path
          d={`M${a0} ${a1}Q${(a0 + b0) / 2 + uy * 70} ${(a1 + b1) / 2 - ux * 70} ${b0} ${b1}`}
          fill="color-mix(in srgb, var(--chertezh-akcent-svet) 18%, transparent)"
          className="zhv__ln zhv__ln--tonko zhv__ln--or zhv__ln--pk"
        />
        <path className="zhv__ln" strokeWidth={5} d={`M${l0} ${l1}L${r0} ${r1}`} />
        <path
          d={`M${r0} ${r1}l${-ux * 12 - uy * 6} ${-uy * 12 + ux * 6}M${r0} ${r1}l${-ux * 12 + uy * 6} ${-uy * 12 - ux * 6}`}
          className="zhv__ln"
          strokeWidth={4}
        />
        <text className="zhv__v" x={r0 - 4} y={r1 + 22}>
          x
        </text>
        {Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i).map((n) => {
          const [x, y] = e(n);
          return (
            <g key={n}>
              <path
                className="zhv__ln zhv__ln--tonko"
                d={`M${x - uy * 7} ${y + ux * 7}L${x + uy * 7} ${y - ux * 7}`}
              />
              <text className="zhv__t" x={x - uy * 20} y={y + ux * 20 + 4} textAnchor="middle">
                {n < 0 ? `−${-n}` : n}
              </text>
            </g>
          );
        })}
        <path className="zhv__ln zhv__ln--or" strokeWidth={6} d={`M${a0} ${a1}L${b0} ${b1}`} />
        {tochka(lev, 0, 'Левый')}
        {tochka(prav, 1, 'Правый')}
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={nerav} />
      </span>
      <span className="zhv__plashka">
        <Formula tex={zapis} />
      </span>
    </ZhivoyKoren>
  );
}
