'use client';

import { useEffect, useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, Ruchka, ZhivoyKoren, type Tochka } from './obshchee';

const C0: Tochka = [130, 112];
const R = 88;
const RAD = Math.PI / 180;
const na = (deg: number): Tochka => [
  C0[0] + R * Math.cos(deg * RAD),
  C0[1] - R * Math.sin(deg * RAD),
];
const dist = (p: Tochka, q: Tochka) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const norm = (d: number) => ((d % 360) + 360) % 360;
/** Наименьшее расстояние между вершинами на окружности, градусы. */
const ZAZOR = 24;

/** Дуга от a к b против часовой (в градусах математики), длина. */
const dlinaDugi = (a: number, b: number) => norm(b - a);

/**
 * №1 «Планиметрия»: треугольник ABC, вписанный в окружность. Вершины
 * тянутся по описанной окружности, вписанная окружность (центр I)
 * пересчитывается, W — середина дуги BC, не содержащей A: трезубец
 * WB = WI = WC. Пока не тронули — композиция медленно поворачивается.
 */
export default function Planimetriya({ label, tiho, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [ugly, setUgly] = useState<[number, number, number]>([108, 212, 328]);
  const [vybran, setVybran] = useState(0);
  const [tronut, setTronut] = useState(false);

  /* Медленный поворот, пока чертёж не тронули. */
  useEffect(() => {
    if (tiho || tronut) return;
    let pred = performance.now();
    let id = 0;
    const shag = (t: number) => {
      const dt = Math.min(0.05, (t - pred) / 1000);
      pred = t;
      setUgly(([a, b, c]) => [norm(a + 6 * dt), norm(b + 6 * dt), norm(c + 6 * dt)]);
      id = requestAnimationFrame(shag);
    };
    id = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(id);
  }, [tiho, tronut]);

  /* Вершина i на угол u: не ближе ZAZOR к соседям и без смены порядка. */
  const postavit = (i: number, u: number) => {
    setTronut(true);
    setUgly((prev) => {
      const pred = prev[(i + 2) % 3]!;
      const sled = prev[(i + 1) % 3]!;
      const okno = dlinaDugi(pred, sled);
      let s = dlinaDugi(pred, u);
      if (s > okno) s = s - okno < 360 - s ? okno : 0;
      s = Math.min(okno - ZAZOR, Math.max(ZAZOR, s));
      const next = [...prev] as [number, number, number];
      next[i] = norm(pred + s);
      return next;
    });
  };
  const ugolUkazatelya = (p: Tochka) => Math.atan2(C0[1] - p[1], p[0] - C0[0]) / RAD;

  const [A, B, C] = ugly.map(na) as [Tochka, Tochka, Tochka];
  const a = dist(B, C);
  const b = dist(A, C);
  const c = dist(A, B);
  const I: Tochka = [
    (a * A[0] + b * B[0] + c * C[0]) / (a + b + c),
    (a * A[1] + b * B[1] + c * C[1]) / (a + b + c),
  ];
  const r = Math.abs((C[0] - B[0]) * (B[1] - I[1]) - (B[0] - I[0]) * (C[1] - B[1])) / a;
  /* W — середина дуги BC без A: луч AI до окружности. */
  const dx = I[0] - A[0];
  const dy = I[1] - A[1];
  const fx = A[0] - C0[0];
  const fy = A[1] - C0[1];
  const qa = dx * dx + dy * dy;
  const qb = 2 * (fx * dx + fy * dy);
  const t = -qb / qa;
  const W: Tochka = [A[0] + dx * t, A[1] + dy * t];

  const pts = (...ps: Tochka[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const podpis = (p: Tochka, imya: string, ot: Tochka = C0) => {
    const d = dist(p, ot) || 1;
    return (
      <text
        className="zhv__v"
        x={p[0] + ((p[0] - ot[0]) / d) * 15}
        y={p[1] + ((p[1] - ot[1]) / d) * 15 + 5}
        textAnchor="middle"
      >
        {imya}
      </text>
    );
  };
  const IMENA = ['A', 'B', 'C'];
  const chisloTex = (v: number) => (Math.round(v * 100) / 100).toString().replace('.', '{,}');

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        const shag = (d[0] !== 0 ? -d[0] : d[1]) * 4;
        postavit(vybran, ugly[vybran]! + shag);
      }}
      naEnter={() => setVybran((v) => (v + 1) % 3)}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <circle cx={C0[0]} cy={C0[1]} r={R} fill="none" className="zhv__ln" />
        <polygon points={pts(A, B, C)} fill="rgb(170 200 245 / 0.25)" className="zhv__ln" />
        <circle
          cx={I[0]}
          cy={I[1]}
          r={r}
          fill="rgb(255 190 120 / 0.14)"
          className="zhv__ln zhv__ln--or"
        />
        <path
          className="zhv__ln zhv__ln--tonko zhv__ln--or"
          d={`M${pts(W)}L${pts(B)}M${pts(W)}L${pts(I)}M${pts(W)}L${pts(C)}`}
        />
        <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={`M${pts(A)}L${pts(I)}`} />
        <circle className="zhv__tochka--or" cx={I[0]} cy={I[1]} r={3.5} />
        <circle className="zhv__tochka" cx={W[0]} cy={W[1]} r={3.5} />
        {podpis(W, 'W')}
        <text className="zhv__v" x={I[0] + 9} y={I[1] - 6}>
          I
        </text>
        {[A, B, C].map((p, i) => (
          <g key={IMENA[i]}>
            {podpis(p, IMENA[i]!)}
            <Ruchka
              svg={svg}
              x={p[0]}
              y={p[1]}
              tyanut={(q) => postavit(i, ugolUkazatelya(q))}
              strelka={(d) => postavit(i, ugly[i]! + (d[0] !== 0 ? -d[0] : d[1]) * 4)}
              label={`Вершина ${IMENA[i]}`}
            />
          </g>
        ))}
      </svg>
      <span className="zhv__plashka">
        <Formula tex={`WB=WI=WC\\approx ${chisloTex(dist(W, B) / R)}\\,R`} />
      </span>
    </ZhivoyKoren>
  );
}
