'use client';

/**
 * Игральная кость для живых чертежей №4 и №5 — на ядре стереометрии
 * (lib/stereo): кость поворачивается своими углами (бросок), смотрят на
 * неё ракурсом шапки (useVrashchenie). Грани и точки проецируются
 * параллельно; видна грань, нормаль которой смотрит на зрителя.
 *
 * Противоположные грани в сумме дают 7: верх 1 — низ 6, справа 3 —
 * слева 4, сзади 2 — спереди 5.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Bazis } from '@/lib/stereo/proekciya';
import { add, dot, scale, type V } from '@/lib/stereo/vec';
import type { Tochka } from './obshchee';
import { naHolst } from './tri';

/** Углы кости, градусы: сначала вокруг y, потом x, потом z. */
export interface Ugly {
  rx: number;
  ry: number;
  rz: number;
}

const RAD = Math.PI / 180;

export function povernutTochku(p: V, u: Ugly): V {
  const [ax, ay, az] = [u.rx * RAD, u.ry * RAD, u.rz * RAD];
  /* Ry */
  let [x, y, z] = p;
  [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  /* Rx */
  [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
  /* Rz */
  [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
  return [x, y, z];
}

interface Gran {
  znachenie: number;
  n: V;
  u: V;
  v: V;
}

const GRANI: Gran[] = [
  { znachenie: 1, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { znachenie: 6, n: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] },
  { znachenie: 3, n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { znachenie: 4, n: [-1, 0, 0], u: [0, -1, 0], v: [0, 0, 1] },
  { znachenie: 2, n: [0, 1, 0], u: [-1, 0, 0], v: [0, 0, 1] },
  { znachenie: 5, n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
];

/** Точки на грани в долях полуребра. */
const TOCHKI: Record<number, Tochka[]> = {
  1: [[0, 0]],
  2: [
    [-0.5, -0.5],
    [0.5, 0.5],
  ],
  3: [
    [-0.5, -0.5],
    [0, 0],
    [0.5, 0.5],
  ],
  4: [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ],
  5: [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0, 0],
    [-0.5, 0.5],
    [0.5, 0.5],
  ],
  6: [
    [-0.5, -0.55],
    [0.5, -0.55],
    [-0.5, 0],
    [0.5, 0],
    [-0.5, 0.55],
    [0.5, 0.55],
  ],
};

/** Углы, при которых грань со значением k смотрит вверх. */
export function uglyVerkh(k: number): { rx: number; ry: number } {
  switch (k) {
    case 6:
      return { rx: 180, ry: 0 };
    case 3:
      return { rx: 0, ry: -90 };
    case 4:
      return { rx: 0, ry: 90 };
    case 2:
      return { rx: 90, ry: 0 };
    case 5:
      return { rx: -90, ry: 0 };
    default:
      return { rx: 0, ry: 0 };
  }
}

export interface KubikProps {
  b: Bazis;
  ugly: Ugly;
  /** Половина ребра в единицах сцены — 1; m — пикселей на единицу. */
  m: number;
  c: Tochka;
  /** Подъём кости над столом во время броска, единицы сцены. */
  pod?: number;
  /** Значение, грань которого подсвечена. */
  podsvetka?: number | null;
  /** На передней грани (5) — буква P вместо точек, как на картинке №4. */
  bukvaP?: boolean;
}

/** Буква P в долях полуребра: ножка и петля. */
const BUKVA_P: Tochka[] = (() => {
  const out: Tochka[] = [
    [-0.32, -0.62],
    [-0.32, 0.62],
    [0.08, 0.62],
  ];
  for (let i = 1; i <= 10; i += 1) {
    const a = Math.PI / 2 - (i / 10) * Math.PI;
    out.push([0.08 + 0.31 * Math.cos(a), 0.31 + 0.31 * Math.sin(a)]);
  }
  out.push([-0.32, 0]);
  return out;
})();

/** Кость на холсте SVG. */
export function Kubik({ b, ugly, m, c, pod = 0, podsvetka = null, bukvaP = false }: KubikProps) {
  const sdvig: V = [0, 0, pod];
  const tochka = (p: V) => naHolst(b, add(povernutTochku(p, ugly), sdvig), m, c);
  const grani = GRANI.map((g) => {
    const n = povernutTochku(g.n, ugly);
    return { ...g, nr: n, vid: dot(n, b.k) > 1e-6 };
  });
  const ugolki = (g: Gran, r: number): V[] => [
    add(add(g.n, scale(g.u, -r)), scale(g.v, -r)),
    add(add(g.n, scale(g.u, r)), scale(g.v, -r)),
    add(add(g.n, scale(g.u, r)), scale(g.v, r)),
    add(add(g.n, scale(g.u, -r)), scale(g.v, r)),
  ];
  const put = (pts: V[]) =>
    pts
      .map((p, i) => {
        const [x, y] = tochka(p);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join('') + 'Z';
  const krug = (g: Gran, [tu, tv]: Tochka) => {
    const centr = add(add(scale(g.n, 1.001), scale(g.u, tu)), scale(g.v, tv));
    const pts: V[] = [];
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2;
      pts.push(add(add(centr, scale(g.u, 0.17 * Math.cos(a))), scale(g.v, 0.17 * Math.sin(a))));
    }
    return put(pts);
  };
  /* Свет на грани — по нормали: верх светлее. */
  const svet = (n: V) => 0.5 + 0.5 * Math.max(0, dot(n, [-0.3, -0.4, 0.86]));
  const vidimye = grani.filter((g) => g.vid);
  return (
    <g className="kubik">
      {vidimye.map((g) => {
        const s = svet(g.nr);
        const or = podsvetka === g.znachenie;
        return (
          <g key={g.znachenie}>
            <path
              d={put(ugolki(g, 1))}
              fill={
                or
                  ? `rgb(255 ${170 + s * 40} ${100 + s * 40} / 0.55)`
                  : `rgb(${170 + s * 70} ${200 + s * 45} 250 / 0.55)`
              }
              stroke={or ? '#f08a2c' : 'var(--blue-600)'}
              strokeWidth={or ? 2.4 : 1.8}
              strokeLinejoin="round"
            />
            <path
              d={put(ugolki(g, 0.86))}
              fill="none"
              stroke="rgb(255 255 255 / 0.7)"
              strokeWidth={1}
            />
            {bukvaP && g.znachenie === 5 ? (
              <path
                d={BUKVA_P.map(([tu, tv], i) => {
                  const [x, y] = tochka(
                    add(add(scale(g.n, 1.001), scale(g.u, tu)), scale(g.v, tv)),
                  );
                  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join('')}
                fill="none"
                stroke="var(--blue-700)"
                strokeWidth={m * 0.16}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {(bukvaP && g.znachenie === 5 ? [] : TOCHKI[g.znachenie]!).map((t, i) => (
              <path
                key={i}
                d={krug(g, t)}
                fill={or ? '#e07a2f' : 'var(--blue-600)'}
                opacity={0.9}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Бросок кости: анимация углов к выпавшей грани с лишними оборотами и
 * прыжком. tiho — сразу на место.
 */
export function useBrosok(tiho: boolean, nachalo: Ugly) {
  const [ugly, setUgly] = useState<Ugly>(nachalo);
  const [pod, setPod] = useState(0);
  const [letit, setLetit] = useState(false);
  const tek = useRef(nachalo);
  const kadr = useRef(0);
  useEffect(() => () => cancelAnimationFrame(kadr.current), []);

  const brosit = useCallback(
    (k: number, gotovo: () => void) => {
      const cel = uglyVerkh(k);
      const ot = tek.current;
      const krugi = (v: number) => Math.round(v / 360) * 360;
      const target: Ugly = {
        rx: krugi(ot.rx) + 720 + cel.rx,
        ry: krugi(ot.ry) + 360 + cel.ry,
        rz: ot.rz + 90 + Math.round(Math.random() * 3) * 90 + (Math.random() - 0.5) * 30,
      };
      if (tiho) {
        tek.current = target;
        setUgly(target);
        gotovo();
        return;
      }
      cancelAnimationFrame(kadr.current);
      const t0 = performance.now();
      const DLIT = 950;
      setLetit(true);
      const shag = (t: number) => {
        const x = Math.min(1, (t - t0) / DLIT);
        const e = 1 - (1 - x) ** 3;
        const u: Ugly = {
          rx: ot.rx + (target.rx - ot.rx) * e,
          ry: ot.ry + (target.ry - ot.ry) * e,
          rz: ot.rz + (target.rz - ot.rz) * e,
        };
        tek.current = u;
        setUgly(u);
        setPod(Math.sin(Math.PI * Math.min(1, x * 1.15)) * 0.9 * (1 - x * 0.3));
        if (x < 1) {
          kadr.current = requestAnimationFrame(shag);
        } else {
          setPod(0);
          setLetit(false);
          gotovo();
        }
      };
      kadr.current = requestAnimationFrame(shag);
    },
    [tiho],
  );
  return { ugly, pod, letit, brosit };
}
