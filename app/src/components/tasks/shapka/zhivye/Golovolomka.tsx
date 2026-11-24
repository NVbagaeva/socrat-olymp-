'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { dot, type V } from '@/lib/stereo/vec';
import type { ZhivoyProps } from './tip';
import { ZhivoyKoren, type Tochka } from './obshchee';
import { naHolst, useVrashchenie } from './tri';

type Kletka = readonly [number, number, number];

/** Головоломка 3 × 3 × 3 из семи деталей; оранжевая — №4, как на картинке. */
const DETALI: Kletka[][] = [
  [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [0, 1, 0],
  ],
  [
    [1, 1, 0],
    [2, 1, 0],
    [2, 2, 0],
    [1, 2, 0],
    [0, 2, 0],
  ],
  [
    [0, 0, 1],
    [0, 1, 1],
    [0, 2, 1],
    [1, 2, 1],
  ],
  [
    [1, 1, 1],
    [2, 1, 1],
    [2, 2, 1],
  ],
  [
    [1, 0, 1],
    [2, 0, 1],
    [2, 0, 2],
  ],
  [
    [0, 0, 2],
    [1, 0, 2],
    [0, 1, 2],
  ],
  [
    [1, 1, 2],
    [2, 1, 2],
    [0, 2, 2],
    [1, 2, 2],
    [2, 2, 2],
  ],
];
const ORANZH = 4;

/** Шесть направлений граней: нормаль и две оси в плоскости грани. */
const STORONY: { n: Kletka; u: Kletka; v: Kletka }[] = [
  { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
];

const kl = (c: Kletka) => c.join(',');
const plus = (a: Kletka, b: Kletka, k = 1): Kletka => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
  a[2] + b[2] * k,
];

/** Куда выдвигается деталь: по оси, где её центр дальше всего от середины. */
const NARUZHU: V[] = DETALI.map((d) => {
  const c = [0, 1, 2].map((i) => d.reduce((s, k) => s + k[i]!, 0) / d.length - 1);
  const os = c.reduce((best, v, i) => (Math.abs(v) > Math.abs(c[best]!) ? i : best), 0);
  const out: [number, number, number] = [0, 0, 0];
  out[os] = Math.sign(c[os]!) || 1;
  return out;
});

/** Видимая сторона детали: грань клетки, за которой нет клетки той же детали. */
interface Gran {
  detal: number;
  centr: V;
  ugly: V[];
  /** Какие из четырёх сторон грани — кромка детали (рисуются). */
  kromki: boolean[];
  n: V;
}

const GRANI: Gran[] = DETALI.flatMap((d, di) => {
  const svoi = new Set(d.map(kl));
  return d.flatMap((c) =>
    STORONY.filter((s) => !svoi.has(kl(plus(c, s.n)))).map((s) => {
      const centr: V = [c[0] - 1 + s.n[0] / 2, c[1] - 1 + s.n[1] / 2, c[2] - 1 + s.n[2] / 2];
      const t = (a: number, b: number): V => [
        centr[0] + (s.u[0] * a + s.v[0] * b) / 2,
        centr[1] + (s.u[1] * a + s.v[1] * b) / 2,
        centr[2] + (s.u[2] * a + s.v[2] * b) / 2,
      ];
      const ugly = [t(-1, -1), t(1, -1), t(1, 1), t(-1, 1)];
      /* Сторона грани — шов внутри детали, если соседняя клетка той же
         детали тоже показывает эту сторону. */
      const napr: Kletka[] = [[-s.v[0], -s.v[1], -s.v[2]], s.u, s.v, [-s.u[0], -s.u[1], -s.u[2]]];
      const kromki = napr.map((dn) => {
        const sosed = plus(c, dn);
        return !(svoi.has(kl(sosed)) && !svoi.has(kl(plus(sosed, s.n))));
      });
      return { detal: di, centr, ugly, kromki, n: [s.n[0], s.n[1], s.n[2]] as V };
    }),
  );
});

const M = 40;
const C: Tochka = [130, 132];
const VYDVIG = 1.25;

/**
 * №19 «Олимпиадная задача»: головоломка из кубиков. Крутится во все
 * стороны, нажатие на деталь выдвигает её наружу и возвращает. Enter —
 * выдвинуть оранжевую деталь. Грани рисуются от дальних к ближним.
 */
export default function Golovolomka({ label, tiho, avtofokus }: ZhivoyProps) {
  const vr = useVrashchenie({ azimut: 32, vysota: 26 }, tiho);
  const [vydvinuty, setVydvinuty] = useState<boolean[]>(() => DETALI.map(() => false));
  const [sdvig, setSdvig] = useState<number[]>(() => DETALI.map(() => 0));
  const tek = useRef(sdvig);

  useEffect(() => {
    const cel = vydvinuty.map((v) => (v ? VYDVIG : 0));
    const ot = tek.current;
    const dlit = tiho ? 0 : 380;
    const t0 = performance.now();
    let id = 0;
    const tik = (t: number) => {
      const x = dlit === 0 ? 1 : Math.min(1, (t - t0) / dlit);
      const e = 1 - (1 - x) ** 3;
      const n = ot.map((v, i) => v + (cel[i]! - v) * e);
      tek.current = n;
      setSdvig(n);
      if (x < 1) id = requestAnimationFrame(tik);
    };
    id = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(id);
  }, [vydvinuty, tiho]);

  const pereklyuchit = (i: number) => setVydvinuty((v) => v.map((x, j) => (j === i ? !x : x)));

  const { b } = vr;
  const grani = useMemo(() => {
    const vidimye = GRANI.filter((g) => dot(g.n, b.k) > 1e-6).map((g) => {
      const o = NARUZHU[g.detal]!;
      const s = sdvig[g.detal]!;
      const sd = (p: V): V => [p[0] + o[0] * s, p[1] + o[1] * s, p[2] + o[2] * s];
      const pts = g.ugly.map((p) => naHolst(b, sd(p), M, C));
      return { g, pts, glub: dot(sd(g.centr), b.k) };
    });
    vidimye.sort((a, c) => a.glub - c.glub);
    return vidimye;
  }, [b, sdvig]);

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    vr.pointer.onPointerUp(e);
    if (vr.bylPovorot()) return;
    const el = (e.target as Element).closest('[data-detal]');
    if (el !== null) pereklyuchit(Number(el.getAttribute('data-detal')));
  };

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      className="zhv--3d"
      naStrelku={(d, e) => vr.naStrelku(d, e)}
      naEnter={() => pereklyuchit(ORANZH)}
      {...vr.pointer}
      onPointerUp={onPointerUp}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        {grani.map(({ g, pts }, i) => {
          const or = g.detal === ORANZH;
          const svet = 0.55 + 0.45 * Math.max(0, dot(g.n, [-0.3, -0.45, 0.84]));
          const zalivka = or
            ? `rgb(255 ${Math.round(160 + svet * 60)} ${Math.round(90 + svet * 60)} / 0.9)`
            : `rgb(${Math.round(130 + svet * 75)} ${Math.round(168 + svet * 58)} 246 / 0.92)`;
          const d =
            pts
              .map(([x, y], j) => `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
              .join('') + 'Z';
          const kromki = g.kromki
            .map((k, j) => {
              if (!k) return '';
              const [x1, y1] = pts[j]!;
              const [x2, y2] = pts[(j + 1) % 4]!;
              return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
            })
            .join('');
          return (
            <g key={i} data-detal={g.detal} style={{ cursor: 'pointer' }}>
              <path d={d} fill={zalivka} stroke={zalivka} strokeWidth={0.6} />
              <path
                d={kromki}
                fill="none"
                stroke={or ? '#e07a2f' : 'var(--blue-600)'}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <span className="zhv__plashka">Нажми на деталь — она выдвинется</span>
    </ZhivoyKoren>
  );
}
