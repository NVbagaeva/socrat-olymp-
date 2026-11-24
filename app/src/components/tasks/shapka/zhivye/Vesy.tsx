'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, vSvg, ZhivoyKoren, type Tochka } from './obshchee';

/** Ось коромысла и его полудлина — по картинке. */
const OS: Tochka = [130, 74];
const PLECHO = 72;
const PODVES = 86;
/** Неизвестное — оранжевый кубик, гирьки — по 1. */
const X = 3;
const GIREK = 7;

/** Места гирек на чаше: смещение от центра чаши (x, вверх). */
const MESTA_L: Tochka[] = [
  [4, 0],
  [16, 0],
  [28, 0],
  [10, 13],
  [22, 13],
  [16, 26],
  [-17, 24],
];
const MESTA_R: Tochka[] = [
  [-26, 0],
  [-14, 0],
  [-2, 0],
  [10, 0],
  [22, 0],
  [-20, 13],
  [-8, 13],
];

type Storona = 'L' | 'R';

function Girka({ x, y, aktiv }: { x: number; y: number; aktiv?: boolean }) {
  /* Стеклянная гирька: цилиндр с шишечкой; (x, y) — середина дна. */
  return (
    <g>
      <rect
        x={x - 5.5}
        y={y - 11}
        width={11}
        height={11}
        rx={2.5}
        fill="rgb(205 222 250 / 0.85)"
        stroke={aktiv ? '#f08a2c' : 'var(--blue-600)'}
        strokeWidth={1.3}
      />
      <circle
        cx={x}
        cy={y - 13.5}
        r={2.6}
        fill="rgb(225 236 252)"
        stroke={aktiv ? '#f08a2c' : 'var(--blue-600)'}
        strokeWidth={1.1}
      />
      <path d={`M${x - 3} ${y - 9}v6`} stroke="rgb(255 255 255 / 0.9)" strokeWidth={1.5} />
    </g>
  );
}

/**
 * №6 «Уравнения»: весы. Слева — неизвестное x (оранжевый кубик),
 * гирьки по 1 переносятся между чашами. Весы наклоняются на пружине;
 * в равновесии x + a = b, и появляется найденный x. Стрелки влево и
 * вправо переносят гирьку на эту чашу.
 */
export default function Vesy({ label, tiho, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [storony, setStorony] = useState<Storona[]>(() => Array<Storona>(GIREK).fill('R'));
  const [tyanu, setTyanu] = useState<{ i: number; p: Tochka } | null>(null);
  const L = storony.filter((s) => s === 'L').length;
  const R = GIREK - L;
  const levo = X + L;

  /* Наклон коромысла: тяжелее справа — правый конец ниже. */
  const cel = Math.max(-16, Math.min(16, (R - levo) * 4));
  const [ugol, setUgol] = useState(cel);
  const sk = useRef({ u: cel, v: 0 });
  useEffect(() => {
    let kadr = 0;
    const shag = () => {
      const s = sk.current;
      if (tiho) {
        sk.current = { u: cel, v: 0 };
        setUgol(cel);
        return;
      }
      s.v = (s.v + (cel - s.u) * 0.08) * 0.82;
      s.u += s.v;
      setUgol(s.u);
      if (Math.abs(s.v) > 0.01 || Math.abs(cel - s.u) > 0.01) kadr = requestAnimationFrame(shag);
    };
    kadr = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(kadr);
  }, [cel, tiho]);

  const a = (ugol * Math.PI) / 180;
  const konL: Tochka = [OS[0] - PLECHO * Math.cos(a), OS[1] - PLECHO * Math.sin(a)];
  const konR: Tochka = [OS[0] + PLECHO * Math.cos(a), OS[1] + PLECHO * Math.sin(a)];
  const chashaL: Tochka = [konL[0], konL[1] + PODVES];
  const chashaR: Tochka = [konR[0], konR[1] + PODVES];

  const perenesti = (kuda: Storona) =>
    setStorony((s) => {
      const i = s.lastIndexOf(kuda === 'L' ? 'R' : 'L');
      if (i < 0) return s;
      const n = [...s];
      n[i] = kuda;
      return n;
    });

  const polozhenie = (i: number): Tochka => {
    const s = storony[i]!;
    const nomer = storony.slice(0, i).filter((x) => x === s).length;
    const [dx, dy] = (s === 'L' ? MESTA_L : MESTA_R)[nomer]!;
    const c = s === 'L' ? chashaL : chashaR;
    return [c[0] + dx, c[1] - 2 - dy];
  };

  const down = (i: number) => (e: PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setTyanu({ i, p: vSvg(svg.current, e.clientX, e.clientY) });
  };
  const move = (e: PointerEvent<SVGGElement>) => {
    if (tyanu === null) return;
    setTyanu({ ...tyanu, p: vSvg(svg.current, e.clientX, e.clientY) });
  };
  const up = () => {
    if (tyanu === null) return;
    const kuda: Storona = tyanu.p[0] < OS[0] ? 'L' : 'R';
    setStorony((s) => s.map((v, j) => (j === tyanu.i ? kuda : v)));
    setTyanu(null);
  };

  const ravno = levo === R;
  const znak = ravno ? '=' : levo < R ? '<' : '>';
  const chasha = (c: Tochka) => (
    <g>
      <path
        d={`M${c[0] - 38} ${c[1]}Q${c[0]} ${c[1] + 22} ${c[0] + 38} ${c[1]}Z`}
        fill="rgb(200 220 250 / 0.6)"
        stroke="var(--blue-600)"
        strokeWidth={1.6}
      />
      <ellipse
        cx={c[0]}
        cy={c[1]}
        rx={38}
        ry={5}
        fill="rgb(235 243 255 / 0.85)"
        stroke="var(--blue-600)"
        strokeWidth={1.4}
      />
    </g>
  );
  const niti = (kon: Tochka, c: Tochka) =>
    `M${kon[0]} ${kon[1]}L${c[0] - 34} ${c[1]}M${kon[0]} ${kon[1]}L${c[0] + 34} ${c[1]}`;

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        if (d[0] < 0) perenesti('L');
        else if (d[0] > 0) perenesti('R');
      }}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        {/* Стойка и подставка. */}
        <ellipse
          cx={130}
          cy={214}
          rx={50}
          ry={11}
          fill="rgb(200 220 250 / 0.7)"
          stroke="var(--blue-600)"
          strokeWidth={1.5}
        />
        <path
          d="M124 80L121 206H139L136 80Z"
          fill="rgb(205 222 250 / 0.8)"
          stroke="var(--blue-600)"
          strokeWidth={1.5}
        />
        <circle
          cx={130}
          cy={42}
          r={9}
          fill="rgb(225 236 252)"
          stroke="var(--blue-600)"
          strokeWidth={1.5}
        />
        <path d="M128 51V66M132 51V66" stroke="var(--blue-600)" strokeWidth={1.5} />
        <path className="zhv__ln zhv__ln--tonko" d={niti(konL, chashaL)} />
        <path className="zhv__ln zhv__ln--tonko" d={niti(konR, chashaR)} />
        {/* Коромысло. */}
        <path
          d={`M${konL[0]} ${konL[1]}L${konR[0]} ${konR[1]}`}
          stroke="rgb(190 212 248)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          className="zhv__ln"
          d={`M${konL[0]} ${konL[1]}L${konR[0]} ${konR[1]}`}
          strokeWidth={2}
        />
        <circle
          cx={konL[0]}
          cy={konL[1]}
          r={4.5}
          fill="rgb(225 236 252)"
          stroke="var(--blue-600)"
          strokeWidth={1.3}
        />
        <circle
          cx={konR[0]}
          cy={konR[1]}
          r={4.5}
          fill="rgb(225 236 252)"
          stroke="var(--blue-600)"
          strokeWidth={1.3}
        />
        <circle
          cx={OS[0]}
          cy={OS[1]}
          r={7}
          fill="rgb(225 236 252)"
          stroke="var(--blue-600)"
          strokeWidth={1.5}
        />
        {chasha(chashaL)}
        {chasha(chashaR)}
        {/* Неизвестное x. */}
        <g>
          <rect
            x={chashaL[0] - 32}
            y={chashaL[1] - 22}
            width={20}
            height={20}
            rx={3}
            fill="url(#vesy-or)"
            stroke="#e07a2f"
            strokeWidth={1.4}
          />
          <text
            className="zhv__v"
            x={chashaL[0] - 22}
            y={chashaL[1] - 7}
            textAnchor="middle"
            style={{ fill: '#a24e12' }}
          >
            x
          </text>
        </g>
        <defs>
          <linearGradient id="vesy-or" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd7a8" />
            <stop offset="1" stopColor="#f5a04a" />
          </linearGradient>
        </defs>
        {storony.map((_, i) => {
          const p = tyanu?.i === i ? tyanu.p : polozhenie(i);
          return (
            <g
              key={i}
              className="zhv__ruchka"
              onPointerDown={down(i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
            >
              <rect x={p[0] - 9} y={p[1] - 19} width={18} height={21} fill="transparent" />
              <Girka x={p[0]} y={p[1]} aktiv={tyanu?.i === i} />
            </g>
          );
        })}
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`x+${L}\\;${znak}\\;${R}`} />
      </span>
      <span className="zhv__plashka" aria-live="polite">
        {ravno ? <Formula tex={`x=${R}-${L}=${X}`} /> : 'Перенеси гирьки до равновесия'}
      </span>
    </ZhivoyKoren>
  );
}
