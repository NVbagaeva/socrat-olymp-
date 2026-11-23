'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type Vektor = { x: number; y: number };
type KlyuchVektora = 'a' | 'b';

const WIDTH = 480;
const HEIGHT = 320;
const OX = WIDTH / 2;
const OY = 176;
const STEP = 36;
const gran = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const px = (x: number) => OX + x * STEP;
const py = (y: number) => OY - y * STEP;

/** Интерактивная схема суммы векторов для шапки задания №2. */
export function VektorShapka() {
  const [a, setA] = useState<Vektor>({ x: 2, y: 1 });
  const [b, setB] = useState<Vektor>({ x: 1, y: 2 });
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<KlyuchVektora | null>(null);
  const sum = { x: a.x + b.x, y: a.y + b.y };

  function update(which: KlyuchVektora, point: Vektor) {
    (which === 'a' ? setA : setB)(point);
  }

  function startDrag(event: PointerEvent<SVGGElement>, which: KlyuchVektora) {
    event.preventDefault();
    dragging.current = which;
    svg.current?.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<SVGSVGElement>) {
    const which = dragging.current;
    const matrix = svg.current?.getScreenCTM();
    if (which === null || matrix === undefined || matrix === null) return;
    const point = svg.current!.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    update(which, {
      x: gran(Math.round((local.x - OX) / STEP), -5, 5),
      y: gran(Math.round((OY - local.y) / STEP), -3, 3),
    });
  }

  function stopDrag() {
    dragging.current = null;
  }

  function moveByKey(event: KeyboardEvent<SVGGElement>, which: KlyuchVektora) {
    const delta =
      event.key === 'ArrowRight'
        ? { x: 1, y: 0 }
        : event.key === 'ArrowLeft'
          ? { x: -1, y: 0 }
          : event.key === 'ArrowUp'
            ? { x: 0, y: 1 }
            : event.key === 'ArrowDown'
              ? { x: 0, y: -1 }
              : null;
    if (delta === null) return;
    event.preventDefault();
    const current = which === 'a' ? a : b;
    update(which, {
      x: gran(current.x + delta.x, -5, 5),
      y: gran(current.y + delta.y, -3, 3),
    });
  }

  function pointHandle(which: KlyuchVektora, v: Vektor, label: string, tone: string) {
    const x = px(v.x);
    const y = py(v.y);
    return (
      <g
        key={which}
        className={`z2-vector-art__handle z2-vector-art__handle--${tone}`}
        role="slider"
        aria-label={`Вектор ${label}; стрелками меняйте его координаты`}
        aria-valuemin={-5}
        aria-valuemax={5}
        aria-valuenow={v.x}
        aria-valuetext={`${label} = (${v.x}; ${v.y})`}
        tabIndex={0}
        onPointerDown={(event) => startDrag(event, which)}
        onKeyDown={(event) => moveByKey(event, which)}
      >
        <circle className="z2-vector-art__handle-hit" cx={x} cy={y} r="18" />
        <circle className="z2-vector-art__handle-dot" cx={x} cy={y} r="7" />
      </g>
    );
  }

  return (
    <figure className="z2-vector-art">
      <svg
        ref={svg}
        className="z2-vector-art__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label="Интерактивная координатная схема сложения векторов"
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onDragStart={(event) => event.preventDefault()}
      >
        <defs>
          <linearGradient id="z2-vector-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.98" />
            <stop offset="1" stopColor="#eaf2ff" stopOpacity="0.92" />
          </linearGradient>
          <marker id="z2-vector-arrow-a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M1 1 8 5 1 9" className="z2-vector-art__arrow-a" />
          </marker>
          <marker id="z2-vector-arrow-b" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M1 1 8 5 1 9" className="z2-vector-art__arrow-b" />
          </marker>
          <marker id="z2-vector-arrow-sum" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M1 1 8 5 1 9" className="z2-vector-art__arrow-sum" />
          </marker>
        </defs>
        <rect className="z2-vector-art__panel" x="1" y="1" width="478" height="318" rx="22" fill="url(#z2-vector-glass)" />
        <g className="z2-vector-art__grid" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => i - 5).map((n) => (
            <line key={`x${n}`} x1={px(n)} y1="48" x2={px(n)} y2="284" />
          ))}
          {Array.from({ length: 7 }, (_, i) => i - 3).map((n) => (
            <line key={`y${n}`} x1="50" y1={py(n)} x2="430" y2={py(n)} />
          ))}
        </g>
        <g className="z2-vector-art__axes" aria-hidden="true">
          <line x1="38" y1={OY} x2="444" y2={OY} />
          <line x1={OX} y1="292" x2={OX} y2="34" />
          <text x="449" y={OY + 5}>x</text>
          <text x={OX + 8} y="36">y</text>
          <text x={OX - 18} y={OY + 19}>0</text>
        </g>
        <g className="z2-vector-art__construction" aria-hidden="true">
          <line x1={px(a.x)} y1={py(a.y)} x2={px(sum.x)} y2={py(sum.y)} />
          <line x1={px(b.x)} y1={py(b.y)} x2={px(sum.x)} y2={py(sum.y)} />
        </g>
        <g className="z2-vector-art__vectors" aria-hidden="true">
          <line className="z2-vector-art__line-a" x1={OX} y1={OY} x2={px(a.x)} y2={py(a.y)} markerEnd="url(#z2-vector-arrow-a)" />
          <line className="z2-vector-art__line-b" x1={OX} y1={OY} x2={px(b.x)} y2={py(b.y)} markerEnd="url(#z2-vector-arrow-b)" />
          <line className="z2-vector-art__line-sum" x1={OX} y1={OY} x2={px(sum.x)} y2={py(sum.y)} markerEnd="url(#z2-vector-arrow-sum)" />
          <circle className="z2-vector-art__origin" cx={OX} cy={OY} r="5" />
          <text className="z2-vector-art__label-a" x={px(a.x) + 10} y={py(a.y) - 10}>a</text>
          <text className="z2-vector-art__label-b" x={px(b.x) - 18} y={py(b.y) - 10}>b</text>
          <text className="z2-vector-art__label-sum" x={px(sum.x) + 10} y={py(sum.y) + 18}>a + b</text>
        </g>
        {pointHandle('a', a, 'a', 'a')}
        {pointHandle('b', b, 'b', 'b')}
      </svg>
      <figcaption className="z2-vector-art__caption">
        <span>Перетаскивай концы векторов или двигай их стрелками</span>
        <span className="z2-vector-art__coordinates" aria-live="polite">
          <b>a=({a.x}; {a.y})</b>
          <b>b=({b.x}; {b.y})</b>
          <b>a+b=({sum.x}; {sum.y})</b>
        </span>
      </figcaption>
    </figure>
  );
}
