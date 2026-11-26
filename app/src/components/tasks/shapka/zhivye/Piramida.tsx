'use client';

import { useMemo, useState } from 'react';
import { teloIzIndeksov } from '@/lib/stereo/telo';
import { dot, lerp, type V } from '@/lib/stereo/vec';
import type { ZhivoyProps } from './tip';
import { Begunki, Begunok, chislo, ZhivoyKoren, type Tochka } from './obshchee';
import { naHolst, risovatTelo, svetGrani, useVrashchenie } from './tri';

/** Правильная четырёхугольная пирамида SABCD. */
const VERSHINY: V[] = [
  [-1, -1, -0.9],
  [1, -1, -0.9],
  [1, 1, -0.9],
  [-1, 1, -0.9],
  [0, 0, 1.3],
];
const IMENA = ['A', 'B', 'C', 'D', 'S'];
const GRANI = [
  [0, 3, 2, 1],
  [0, 1, 4],
  [1, 2, 4],
  [2, 3, 4],
  [3, 0, 4],
];
const TELO = teloIzIndeksov(VERSHINY, GRANI);
const M = 62;
const C: Tochka = [130, 126];

/**
 * №14 «Стереометрия»: пирамида с сечением, параллельным основанию.
 * Крутится во все стороны, бегунок двигает секущую плоскость, сечение
 * перестраивается. Рёбра за телом — пунктиром.
 */
export default function Piramida({ label, tiho, avtofokus }: ZhivoyProps) {
  const vr = useVrashchenie({ azimut: 28, vysota: 18 }, tiho);
  const [t, setT] = useState(0.45);
  const { b } = vr;
  const chasti = useMemo(() => risovatTelo(TELO, b, M, C), [b]);

  /* Сечение: точки на боковых рёбрах SA, SB, SC, SD. */
  const sech = [0, 1, 2, 3].map((i) => lerp(VERSHINY[i]!, VERSHINY[4]!, t));
  const vidnaGran = (i: number) => dot(TELO.grani[i]!.n, b.k) > 0;
  /* Сторона сечения лежит в боковой грани: видна вместе с ней. */
  const bokovaya = [1, 2, 3, 4];
  const storony = sech.map((p, i) => {
    const q = sech[(i + 1) % 4]!;
    const [x1, y1] = naHolst(b, p, M, C);
    const [x2, y2] = naHolst(b, q, M, C);
    const gran = TELO.grani.findIndex(
      (g, gi) =>
        bokovaya.includes(gi) &&
        Math.abs(dot(g.n, p) - g.c) < 1e-6 &&
        Math.abs(dot(g.n, q) - g.c) < 1e-6,
    );
    return { d: `M${x1} ${y1}L${x2} ${y2}`, vid: gran >= 0 && vidnaGran(gran) };
  });
  const sechPut =
    sech
      .map((p, i) => {
        const [x, y] = naHolst(b, p, M, C);
        return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join('') + 'Z';

  const centr = naHolst(b, [0, 0, 0], M, C);
  const podpisi = VERSHINY.map((p, i) => {
    const [x, y] = naHolst(b, p, M, C);
    const dx = x - centr[0];
    const dy = y - centr[1];
    const d = Math.hypot(dx, dy) || 1;
    return { x: x + (dx / d) * 13, y: y + (dy / d) * 13 + 5, imya: IMENA[i]! };
  });

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      className="zhv--3d"
      naStrelku={(d, e) => {
        if (e.altKey) setT((v) => Math.min(0.9, Math.max(0.1, v - d[1] * 0.05)));
        else vr.naStrelku(d, e);
      }}
      {...vr.pointer}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        {chasti.grani.map((g) => (
          <path
            key={g.i}
            d={g.d}
            fill={`rgb(${150 + svetGrani(g.n) * 90} ${185 + svetGrani(g.n) * 60} 245 / 0.32)`}
          />
        ))}
        <path className="zhv__ln zhv__ln--tonko zhv__ln--skryt" d={chasti.skrytye} />
        <path d={sechPut} fill="color-mix(in srgb, var(--chertezh-akcent) 38%, transparent)" />
        {storony.map((s, i) => (
          <path
            key={i}
            className={`zhv__ln zhv__ln--or ${s.vid ? '' : 'zhv__ln--skryt'}`}
            d={s.d}
          />
        ))}
        <path className="zhv__ln" d={chasti.vidimye} />
        {podpisi.map((p) => (
          <text key={p.imya} className="zhv__v" x={p.x} y={p.y} textAnchor="middle">
            {p.imya}
          </text>
        ))}
      </svg>
      <Begunki>
        <Begunok
          podpis="Сечение"
          min={0.1}
          max={0.9}
          shag={0.01}
          znachenie={t}
          pokaz={`${chislo(t * 100, 0)} %`}
          menyat={setT}
        />
      </Begunki>
    </ZhivoyKoren>
  );
}
