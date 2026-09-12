/**
 * Миниатюры карточек банка заданий. Только линии, общий viewBox 96×96,
 * одна толщина обводки. Цвет берётся из currentColor, то есть задаётся
 * токеном снаружи, а не вписан внутрь фигуры.
 *
 * Это декор, а не учебный чертёж: движок graph/ здесь не участвует.
 */

import type { ReactElement } from 'react';

/* Геометрия строится по формулам, а не на глаз: парабола считается как
   парабола, синусоида как синусоида. */
function path(fn: (x: number) => number, x0: number, x1: number, steps = 40): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    pts.push(`${x.toFixed(1)} ${fn(x).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')}`;
}

/** Вершины правильного n-угольника на окружности. */
function poly(cx: number, cy: number, r: number, n: number, turn = -90): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((turn + (360 / n) * i) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

const TRI = poly(48, 50, 30, 3);

/* 06 — плавная кривая нормального вида поверх гистограммы. */
const BELL = path((x) => 74 - 42 * Math.exp(-((x - 48) ** 2) / 300), 12, 84);
/* 09 — кубическая кривая. Экстремумы ровно в t = ±1, то есть при
   x = 26 и x = 70; ординаты 72 и 20 — по ним и ставятся точки. */
const CUBIC = path((x) => {
  const t = (x - 48) / 22;
  return 46 + 13 * (t ** 3 - 3 * t);
}, 16, 80);

export const ILLUSTRATIONS: Record<string, ReactElement> = {
  /* 01 — треугольник, вписанный в окружность. */
  '1': (
    <>
      <circle className="ill-line" cx="48" cy="50" r="30" />
      <polygon className="ill-accent" points={TRI.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} />
      {TRI.map(([x, y]) => (
        <circle className="ill-dot" key={`${x}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" />
      ))}
    </>
  ),

  /* 02 — две стрелки из одной точки под углом. */
  '2': (
    <>
      <path className="ill-accent" d="M24 74 L 72 32" markerEnd="url(#ill-arrow)" />
      <path className="ill-line" d="M24 74 L 66 70" markerEnd="url(#ill-arrow)" />
      <path className="ill-line" d="M40 74 A 16 16 0 0 0 35 63" />
      <circle className="ill-dot" cx="24" cy="74" r="2.5" />
    </>
  ),

  /* 03 — каркасный куб: передняя грань, задняя и четыре ребра между ними. */
  '3': (
    <>
      <rect className="ill-line" x="22" y="34" width="40" height="40" />
      <rect className="ill-line" x="36" y="20" width="40" height="40" />
      <path className="ill-line" d="M22 34 L 36 20 M62 34 L 76 20 M22 74 L 36 60 M62 74 L 76 60" />
    </>
  ),

  /* 04 — окружность на четыре сектора, один залит светлым. */
  '4': (
    <>
      <path className="ill-fill" d="M48 50 L 48 20 A 30 30 0 0 1 78 50 Z" />
      <circle className="ill-line" cx="48" cy="50" r="30" />
      <path className="ill-accent" d="M18 50 H 78 M48 20 V 80" />
    </>
  ),

  /* 05 — дерево вариантов: корень, две ветви, от каждой ещё две. */
  '5': (
    <>
      <path className="ill-line" d="M20 50 L 46 30 M20 50 L 46 70 M46 30 L 74 20 M46 30 L 74 40 M46 70 L 74 60 M46 70 L 74 80" />
      <circle className="ill-accent" cx="20" cy="50" r="3.5" />
      {[
        [46, 30],
        [46, 70],
        [74, 20],
        [74, 40],
        [74, 60],
        [74, 80],
      ].map(([x, y]) => (
        <circle className="ill-dot" key={`${x}-${y}`} cx={x} cy={y} r="2.5" />
      ))}
    </>
  ),

  /* 06 — гистограмма из пяти столбцов с плавной кривой поверх. */
  '6': (
    <>
      {[
        [16, 62],
        [30, 46],
        [44, 34],
        [58, 46],
        [72, 62],
      ].map(([x, y]) => (
        <rect className="ill-line" key={x} x={x} y={y} width="10" height={78 - y} />
      ))}
      <path className="ill-line" d="M12 78 H 84" />
      <path className="ill-accent" d={BELL} fill="none" />
    </>
  ),

  /* 07 — знак равенства и символ x. */
  '7': (
    <>
      <path className="ill-accent" d="M14 36 L 38 64 M38 36 L 14 64" />
      <path className="ill-line" d="M52 42 H 82 M52 58 H 82" />
    </>
  ),

  /* 08 — знак квадратного корня. */
  '8': (
    <>
      <path className="ill-accent" d="M16 52 L 26 52 L 38 76 L 56 20 L 82 20" />
      <path className="ill-line" d="M56 28 H 78" />
    </>
  ),

  /* 09 — кривая с максимумом и минимумом, к максимуму горизонтальная касательная. */
  '9': (
    <>
      <path className="ill-line" d="M14 78 H 84 M18 14 V 82" />
      <path className="ill-accent" d={CUBIC} fill="none" />
      {/* горизонтальная касательная в точке максимума */}
      <path className="ill-line" d="M50 20 H 88" />
      <circle className="ill-dot" cx="70" cy="20" r="3" />
      <circle className="ill-dot" cx="26" cy="72" r="3" />
    </>
  ),

  /* 10 — оси t и v, на них возрастающая прямая. */
  '10': (
    <>
      <path className="ill-line" d="M18 78 H 84 M18 14 V 78" />
      <path className="ill-accent" d="M22 72 L 76 26" />
      <text className="ill-text" x="78" y="90">
        t
      </text>
      <text className="ill-text" x="6" y="20">
        v
      </text>
    </>
  ),

  /* 11 — символ процента и два столбца рядом. */
  '11': (
    <>
      <circle className="ill-accent" cx="26" cy="30" r="8" />
      <circle className="ill-accent" cx="50" cy="60" r="8" />
      <path className="ill-accent" d="M56 22 L 20 68" />
      <rect className="ill-line" x="66" y="44" width="10" height="34" />
      <rect className="ill-line" x="80" y="30" width="10" height="48" />
    </>
  ),

  /* 12 — оси координат и наклонная прямая с отмеченной точкой. */
  '12': (
    <>
      <path className="ill-line" d="M16 78 H 84 M22 14 V 84" />
      <path className="ill-accent" d="M20 70 L 78 24" />
      <circle className="ill-dot" cx="49" cy="47" r="3.5" />
      <path className="ill-line" d="M49 47 V 78 M49 47 H 22" />
    </>
  ),

  /* 13 — три столбца и возрастающая линия со стрелкой поверх. */
  '13': (
    <>
      <path className="ill-line" d="M14 78 H 84" />
      {[
        [22, 58],
        [42, 46],
        [62, 32],
      ].map(([x, y]) => (
        <rect className="ill-line" key={x} x={x} y={y} width="14" height={78 - y} />
      ))}
      <path className="ill-accent" d="M20 68 L 44 52 L 78 22" markerEnd="url(#ill-arrow)" />
    </>
  ),
};

/** Наконечник стрелки — один на все миниатюры, объявляется один раз. */
export function IllustrationDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <marker
          id="ill-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L 9 5 L 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </marker>
      </defs>
    </svg>
  );
}

export function TaskIllustration({ slug }: { slug: string }) {
  const shape = ILLUSTRATIONS[slug];
  if (shape === undefined) {
    return null;
  }
  return (
    <svg className="ill" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  );
}
