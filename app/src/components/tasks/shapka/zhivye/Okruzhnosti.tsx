'use client';

import { useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, Ruchka, ZhivoyKoren, type Tochka } from './obshchee';
import './zhivye-geom.css';

const O1: Tochka = [126, 124];
const R1 = 54;
const R2 = 28;
const D = R1 + R2;
const RAD = Math.PI / 180;

/**
 * №17 «Планиметрия»: две окружности касаются внешним образом. Малую
 * ведут вокруг большой — касание сохраняется, общая внешняя касательная
 * AB и внутренняя касательная в точке K перестраиваются.
 */
export default function Okruzhnosti({ label, avtofokus }: ZhivoyProps) {
  const svg = useRef<SVGSVGElement>(null);
  /* Угол центра малой окружности, градусы, как в математике. */
  const [fi, setFi] = useState(-25);

  const u: Tochka = [Math.cos(fi * RAD), -Math.sin(fi * RAD)];
  const O2: Tochka = [O1[0] + u[0] * D, O1[1] + u[1] * D];
  const K: Tochka = [O1[0] + u[0] * R1, O1[1] + u[1] * R1];
  /* Нормаль внешней касательной: n·u = (R1 − R2)/D. Из двух берём ту, что выше. */
  const th = Math.acos((R1 - R2) / D);
  const povorot = (s: number): Tochka => [
    u[0] * Math.cos(s * th) - u[1] * Math.sin(s * th),
    u[0] * Math.sin(s * th) + u[1] * Math.cos(s * th),
  ];
  const n1 = povorot(1);
  const n2 = povorot(-1);
  const n = n1[1] < n2[1] ? n1 : n2;
  const A: Tochka = [O1[0] + n[0] * R1, O1[1] + n[1] * R1];
  const B: Tochka = [O2[0] + n[0] * R2, O2[1] + n[1] * R2];
  const t: Tochka = [B[0] - A[0], B[1] - A[1]];
  const tl = Math.hypot(t[0], t[1]) || 1;
  const tx = t[0] / tl;
  const ty = t[1] / tl;
  const kas = `M${A[0] - tx * 40} ${A[1] - ty * 40}L${B[0] + tx * 40} ${B[1] + ty * 40}`;
  /* Внутренняя касательная в K — до пересечения с AB (точка M — середина AB). */
  const M: Tochka = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const vnutr = `M${M[0]} ${M[1]}L${K[0] - (M[0] - K[0]) * 0.6} ${K[1] - (M[1] - K[1]) * 0.6}`;

  const podpis = (p: Tochka, imya: string, ot: Tochka, sdvig = 14) => {
    const d = Math.hypot(p[0] - ot[0], p[1] - ot[1]) || 1;
    return (
      <text
        className="zhv__v"
        x={p[0] + ((p[0] - ot[0]) / d) * sdvig}
        y={p[1] + ((p[1] - ot[1]) / d) * sdvig + 5}
        textAnchor="middle"
      >
        {imya}
      </text>
    );
  };

  const tyanut = (p: Tochka) => setFi(Math.atan2(O1[1] - p[1], p[0] - O1[0]) / RAD);

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => setFi((v) => v + (d[0] !== 0 ? -d[0] : d[1]) * 5)}
    >
      <svg ref={svg} viewBox="0 0 260 260" aria-hidden="true">
        <circle
          cx={O1[0]}
          cy={O1[1]}
          r={R1}
          fill="color-mix(in srgb, var(--chertezh-zalivka-siniy) 22%, transparent)"
          className="zhv__ln"
          strokeWidth={5}
        />
        <circle
          cx={O2[0]}
          cy={O2[1]}
          r={R2}
          fill="color-mix(in srgb, var(--chertezh-zalivka-siniy) 22%, transparent)"
          className="zhv__ln"
          strokeWidth={5}
        />
        <path className="zhv__ln zhv__ln--or" d={kas} />
        <path className="zhv__ln zhv__ln--tonko zhv__ln--pk" d={vnutr} />
        <path
          className="zhv__ln zhv__ln--tonko zhv__ln--pk"
          d={`M${O1[0]} ${O1[1]}L${A[0]} ${A[1]}M${O2[0]} ${O2[1]}L${B[0]} ${B[1]}M${O1[0]} ${O1[1]}L${O2[0]} ${O2[1]}`}
        />
        {[A, B, K, M].map((p, i) => (
          <circle
            key={i}
            className={i < 2 ? 'zhv__tochka--or' : 'zhv__tochka'}
            cx={p[0]}
            cy={p[1]}
            r={3.5}
          />
        ))}
        <circle className="zhv__tochka" cx={O1[0]} cy={O1[1]} r={3} />
        <text className="zhv__v" x={O1[0] - 6} y={O1[1] + 18}>
          O₁
        </text>
        {podpis(A, 'A', O1)}
        {podpis(B, 'B', O2)}
        {podpis(M, 'M', K, 13)}
        <text className="zhv__v" x={K[0] + u[1] * 14 - 4} y={K[1] - u[0] * 14 + 5}>
          K
        </text>
        <circle
          className="zhv-okr__malaya"
          cx={O2[0]}
          cy={O2[1]}
          r={R2}
          fill="transparent"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              const m = svg.current?.getScreenCTM();
              if (m) {
                const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
                tyanut([q.x, q.y]);
              }
            }
          }}
        />
        <Ruchka
          svg={svg}
          x={O2[0]}
          y={O2[1]}
          r={5}
          tyanut={tyanut}
          strelka={(d) => setFi((v) => v + (d[0] !== 0 ? -d[0] : d[1]) * 5)}
          label="Центр малой окружности"
        />
        <text className="zhv__v" x={O2[0] + 8} y={O2[1] + 18}>
          O₂
        </text>
      </svg>
      <span className="zhv__plashka">
        <Formula tex="AB=2\sqrt{Rr},\ \ MA=MK=MB" />
      </span>
    </ZhivoyKoren>
  );
}
