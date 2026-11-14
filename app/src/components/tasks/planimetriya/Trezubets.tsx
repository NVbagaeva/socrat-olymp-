'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/**
 * Живая композиция в шапке раздела №1 — лемма о трезубце: треугольник
 * $ABC$ с вписанной и описанной окружностями, $W$ — середина дуги $BC$,
 * и «трезубец» $WB = WI = WC$. Композицию можно вращать: пальцем или
 * мышью вокруг центра, с клавиатуры — стрелками. Сама она медленно
 * поворачивается, пока её не тронули; при «уменьшить движение» стоит.
 *
 * Это украшение шапки, а не чертёж задачи: движок планиметрии и его
 * правила чертежей здесь не участвуют. Буквы при вращении остаются
 * прямыми.
 */

const R = 100;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Точка окружности; угол — как в математике, ось y экрана вниз. */
const na = (deg: number): [number, number] => [R * Math.cos(rad(deg)), -R * Math.sin(rad(deg))];

const A = na(108);
const B = na(212);
const C = na(328);
const W = na(270);
const dist = (p: [number, number], q: [number, number]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const a = dist(B, C);
const b = dist(A, C);
const c = dist(A, B);
const I: [number, number] = [
  (a * A[0] + b * B[0] + c * C[0]) / (a + b + c),
  (a * A[1] + b * B[1] + c * C[1]) / (a + b + c),
];
/* Радиус вписанной окружности: расстояние от I до прямой BC. */
const r = Math.abs((C[0] - B[0]) * (B[1] - I[1]) - (B[0] - I[0]) * (C[1] - B[1])) / dist(B, C);

const TOCHKI: { bukva: string; p: [number, number]; iz: [number, number] }[] = [
  { bukva: 'A', p: A, iz: [0, 0] },
  { bukva: 'B', p: B, iz: [0, 0] },
  { bukva: 'C', p: C, iz: [0, 0] },
  { bukva: 'W', p: W, iz: [0, 0] },
  { bukva: 'I', p: I, iz: [I[0] + 30, I[1] + 30] },
];

/** Засечка равных отрезков посередине отрезка. */
function zasechka(p: [number, number], q: [number, number]) {
  const mx = (p[0] + q[0]) / 2;
  const my = (p[1] + q[1]) / 2;
  const d = dist(p, q);
  const nx = (-(q[1] - p[1]) / d) * 5;
  const ny = ((q[0] - p[0]) / d) * 5;
  return `M${mx - nx} ${my - ny}L${mx + nx} ${my + ny}`;
}

const pts = (...ps: [number, number][]) => ps.map((p) => p.join(',')).join(' ');

/** hintHtml — подпись под чертежом, формулы уже набраны KaTeX на сборке. */
export function Trezubets({ label, hintHtml }: { label: string; hintHtml: string }) {
  const [ugol, setUgol] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const tashchim = useRef<{ ot: number; bylo: number } | null>(null);
  const tronuli = useRef(false);

  /* Медленное вращение, пока композицию не тронули. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    let kadr = 0;
    let proshlo = performance.now();
    const shag = (t: number) => {
      if (!tronuli.current) {
        const dt = Math.min(64, t - proshlo);
        setUgol((u) => (u + dt * 0.004) % 360);
      }
      proshlo = t;
      kadr = requestAnimationFrame(shag);
    };
    kadr = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(kadr);
  }, []);

  function ugolUkazatelya(event: PointerEvent<SVGSVGElement>): number {
    const box = svg.current?.getBoundingClientRect();
    if (box === undefined) return 0;
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onDown(event: PointerEvent<SVGSVGElement>) {
    tronuli.current = true;
    tashchim.current = { ot: ugolUkazatelya(event), bylo: ugol };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onMove(event: PointerEvent<SVGSVGElement>) {
    const t = tashchim.current;
    if (t === null) return;
    setUgol((((t.bylo + ugolUkazatelya(event) - t.ot) % 360) + 360) % 360);
  }
  function onUp() {
    tashchim.current = null;
  }
  function onKey(event: KeyboardEvent<SVGSVGElement>) {
    const d = event.key === 'ArrowRight' ? 10 : event.key === 'ArrowLeft' ? -10 : 0;
    if (d === 0) return;
    event.preventDefault();
    tronuli.current = true;
    setUgol((u) => (((u + d) % 360) + 360) % 360);
  }

  return (
    <div className="z1-trezubets">
      <svg
        ref={svg}
        className="z1-trezubets__svg"
        viewBox="-132 -132 264 264"
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <defs>
          <radialGradient id="z1-trz-steklo" cx="35%" cy="28%" r="80%">
            <stop offset="0" stopColor="var(--white)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--blue-100)" stopOpacity="0.75" />
          </radialGradient>
        </defs>
        <g transform={`rotate(${ugol})`}>
          <circle className="z1-trz__opisannaya" r={R} fill="url(#z1-trz-steklo)" />
          <polygon className="z1-trz__treugolnik" points={pts(A, B, C)} />
          <circle className="z1-trz__vpisannaya" cx={I[0]} cy={I[1]} r={r} />
          {/* Биссектриса AW проходит через I. */}
          <line className="z1-trz__bissektrisa" x1={A[0]} y1={A[1]} x2={I[0]} y2={I[1]} />
          {/* Трезубец: WB = WI = WC. */}
          {[B, I, C].map((p, i) => (
            <g key={i}>
              <line className="z1-trz__zub" x1={W[0]} y1={W[1]} x2={p[0]} y2={p[1]} />
              <path className="z1-trz__zasechka" d={zasechka(W, p)} />
            </g>
          ))}
          {TOCHKI.map(({ bukva, p, iz }) => {
            /* Буква — снаружи от точки (у I — в сторону от трезубца),
               повёрнута обратно: читается при любом угле. */
            const d = Math.hypot(p[0] - iz[0], p[1] - iz[1]) || 1;
            const x = p[0] + ((p[0] - iz[0]) / d) * 17;
            const y = p[1] + ((p[1] - iz[1]) / d) * 17;
            return (
              <g key={bukva}>
                <circle
                  className={
                    bukva === 'W' || bukva === 'I' ? 'z1-trz__tochka is-aktsent' : 'z1-trz__tochka'
                  }
                  cx={p[0]}
                  cy={p[1]}
                  r={4}
                />
                <text
                  className="z1-trz__bukva"
                  x={x}
                  y={y}
                  transform={`rotate(${-ugol} ${x} ${y})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {bukva}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="z1-trezubets__podpis" dangerouslySetInnerHTML={{ __html: hintHtml }} />
    </div>
  );
}
