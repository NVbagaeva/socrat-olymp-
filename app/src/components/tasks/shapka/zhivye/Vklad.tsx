'use client';

import { useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Begunki, Begunok, Formula, klamp, ZhivoyKoren } from './obshchee';
import './grafiki.css';

const S0 = 100_000;
const R_MIN = 5;
const R_MAX = 30;
const N_MAX = 10;
/** Самый большой рост на бегунках — от него шкала столбиков. */
const ROST_MAX = Math.log((1 + R_MAX / 100) ** N_MAX);
const OSNOVANIE = 192;
const LEVO = 92;
const PRAVO = 236;
/** Глубина столбика: сдвиг боковой грани. */
const GX = 7;
const GY = -5;

/** 176234 → «176\,234» для KaTeX. */
const tysyachi = (v: number) =>
  Math.round(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
const dolya = (r: number) => (1 + r / 100).toFixed(2).replace(/0$/, '').replace('.', '{,}');

/**
 * №16 «Финансовая грамотность»: вклад под сложный процент. Бегунки
 * «ставка» и «срок» — столбики сумм по годам растут, стопка монет
 * увеличивается, сверху итоговая сумма.
 */
export default function Vklad({ label, avtofokus }: ZhivoyProps) {
  const [r, setR] = useState(12);
  const [n, setN] = useState(5);
  const summa = (k: number) => S0 * (1 + r / 100) ** k;
  const vysota = (k: number) => 26 + 110 * (Math.log(summa(k) / S0) / ROST_MAX) ** 0.6;
  const shag = (PRAVO - LEVO) / n;
  const w = Math.min(22, shag - 5);
  const stolbiki = Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    const x = LEVO + shag * i + (shag - w) / 2;
    return { k, x, h: vysota(k) };
  });
  const monet = 1 + Math.round((9 * Math.log(summa(n) / S0)) / ROST_MAX);
  const posl = stolbiki[stolbiki.length - 1]!;
  const strelka = {
    x0: 58,
    y0: OSNOVANIE - 60,
    x1: posl.x + w / 2 + GX / 2,
    y1: OSNOVANIE - posl.h - 12,
  };
  /* Наконечник — по касательной в конце кривой (от опорной точки). */
  const ux0 = strelka.x1 - (strelka.x0 + 70);
  const uy0 = strelka.y1 - (strelka.y0 - 40);
  const ud = Math.hypot(ux0, uy0) || 1;
  const [ux, uy] = [ux0 / ud, uy0 / ud];
  const tip: [number, number] = [strelka.x1 + ux * 6, strelka.y1 + uy * 6];
  const golovka = `M${tip[0]} ${tip[1]}L${tip[0] - ux * 13 - uy * 6} ${tip[1] - uy * 13 + ux * 6}L${tip[0] - ux * 13 + uy * 6} ${tip[1] - uy * 13 - ux * 6}Z`;

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        if (d[0] !== 0) setN((v) => klamp(v + Math.sign(d[0]), 1, N_MAX));
        if (d[1] !== 0) setR((v) => klamp(v - Math.sign(d[1]), R_MIN, R_MAX));
      }}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <linearGradient id="zhg-zoloto" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d49a1e" />
            <stop offset="0.45" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#c58a12" />
          </linearGradient>
        </defs>
        {/* Растущая стрелка над столбиками. */}
        <path
          className="zhg__strelka"
          d={`M${strelka.x0} ${strelka.y0}Q${strelka.x0 + 70} ${strelka.y0 - 40} ${strelka.x1} ${strelka.y1}`}
        />
        <path d={golovka} fill="rgb(61 121 224 / 0.85)" />
        {stolbiki.map((s) => {
          const y = OSNOVANIE - s.h;
          return (
            <g key={s.k} className={s.k === n ? 'zhg__stolbik--posl' : undefined}>
              <path
                className="zhg__stolbik-bok"
                d={`M${s.x + w} ${y}l${GX} ${GY}V${OSNOVANIE + GY}l${-GX} ${-GY}Z`}
              />
              <rect className="zhg__stolbik-pered" x={s.x} y={y} width={w} height={s.h} />
              <path
                className="zhg__stolbik-verh"
                d={`M${s.x} ${y}l${GX} ${GY}h${w}l${-GX} ${-GY}Z`}
              />
            </g>
          );
        })}
        <path
          className="zhv__ln zhv__ln--tonko"
          d={`M${LEVO - 4} ${OSNOVANIE}H${PRAVO + 6}`}
          opacity={0.6}
        />
        {/* Стопка монет. */}
        {Array.from({ length: monet }, (_, i) => {
          const cy = OSNOVANIE + 2 - i * 7;
          return (
            <g key={i}>
              <path className="zhg__moneta" d={`M33 ${cy}v6a22 7 0 0 0 44 0v-6Z`} />
              <ellipse className="zhg__moneta-verh" cx={55} cy={cy} rx={22} ry={7} />
            </g>
          );
        })}
        <text className="zhv__t" x={LEVO + 2} y={OSNOVANIE + 15}>
          1-й год
        </text>
        <text className="zhv__t" x={PRAVO} y={OSNOVANIE + 15} textAnchor="end">
          {n}-й
        </text>
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`S=${tysyachi(S0)}\\cdot ${dolya(r)}^{${n}}\\approx ${tysyachi(summa(n))}`} />
        <span>₽</span>
      </span>
      <Begunki>
        <Begunok
          podpis="Ставка"
          min={R_MIN}
          max={R_MAX}
          shag={1}
          znachenie={r}
          pokaz={`${r} %`}
          menyat={setR}
        />
        <Begunok
          podpis="Срок"
          min={1}
          max={N_MAX}
          shag={1}
          znachenie={n}
          pokaz={`${n} ${n === 1 ? 'год' : n < 5 ? 'года' : 'лет'}`}
          menyat={setN}
        />
      </Begunki>
    </ZhivoyKoren>
  );
}
