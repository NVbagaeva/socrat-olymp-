/**
 * Миниатюры карточек банка заданий. Только линии, общий viewBox 96×96,
 * одна толщина обводки. Цвет берётся из currentColor, то есть задаётся
 * токеном снаружи, а не вписан внутрь фигуры.
 *
 * Это декор, а не учебный чертёж: движок graph/ здесь не участвует.
 */

import type { ReactElement, ReactNode } from 'react';
import { katex } from '@/lib/graph/katex';

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

const TRI = poly(48, 50, 28, 3);

/* 06 — плавная кривая нормального вида поверх гистограммы. */
const BELL = path((x) => 72 - 32 * Math.exp(-((x - 48) ** 2) / 220), 24, 72);
/* 09 — кубическая кривая. Экстремумы ровно в t = ±1, то есть при
   x = 30 и x = 66; ординаты 70 и 26 — по ним и ставятся точки. */
const CUBIC = path((x) => {
  const t = (x - 48) / 18;
  return 48 + 11 * (t ** 3 - 3 * t);
}, 24, 72);

export const ILLUSTRATIONS: Record<string, ReactElement> = {
  /* 01 — треугольник, вписанный в окружность. */
  '1': (
    <>
      <circle className="ill-line" cx="48" cy="50" r="28" />
      <polygon
        className="ill-accent"
        points={TRI.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
      />
      {TRI.map(([x, y]) => (
        <circle className="ill-dot" key={`${x}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" />
      ))}
    </>
  ),

  /* 02 — две стрелки из одной точки под углом. */
  '2': (
    <>
      <path className="ill-accent" d="M26 70 L 70 32" markerEnd="url(#ill-arrow)" />
      <path className="ill-line" d="M26 70 L 66 66" markerEnd="url(#ill-arrow)" />
      <path className="ill-line" d="M40 70 A 14 14 0 0 0 36 60" />
      <circle className="ill-dot" cx="26" cy="70" r="2.5" />
    </>
  ),

  /* 03 — каркасный куб: передняя грань залита, остальные линиями. */
  '3': (
    <>
      <rect className="ill-fill" x="24" y="36" width="36" height="36" />
      <rect className="ill-line" x="24" y="36" width="36" height="36" />
      <rect className="ill-line" x="36" y="24" width="36" height="36" />
      <path className="ill-line" d="M24 36 L 36 24 M60 36 L 72 24 M24 72 L 36 60 M60 72 L 72 60" />
    </>
  ),

  /* 04 — окружность на четыре сектора, один залит светлым. */
  '4': (
    <>
      <path className="ill-fill" d="M48 50 L 48 22 A 28 28 0 0 1 76 50 Z" />
      <circle className="ill-line" cx="48" cy="50" r="28" />
      <path className="ill-accent" d="M20 50 H 76 M48 22 V 78" />
    </>
  ),

  /* 05 — дерево вариантов: корень, две ветви, от каждой ещё две. */
  '5': (
    <>
      <path
        className="ill-line"
        d="M24 48 L 46 32 M24 48 L 46 64 M46 32 L 70 24 M46 32 L 70 40 M46 64 L 70 56 M46 64 L 70 72"
      />
      <circle className="ill-accent" cx="24" cy="48" r="3.5" />
      {[
        [46, 32],
        [46, 64],
        [70, 24],
        [70, 40],
        [70, 56],
        [70, 72],
      ].map(([x, y]) => (
        <circle className="ill-dot" key={`${x}-${y}`} cx={x} cy={y} r="2.5" />
      ))}
    </>
  ),

  /* 06 — гистограмма из пяти столбцов с плавной кривой поверх. */
  '6': (
    <>
      {/* три средних столбца залиты, два крайних остаются контуром */}
      {[
        [37, 50],
        [48, 40],
        [59, 50],
      ].map(([x, y]) => (
        <rect className="ill-fill" key={`f${x}`} x={x} y={y} width="9" height={72 - y} />
      ))}
      {[
        [26, 62],
        [37, 50],
        [48, 40],
        [59, 50],
        [70, 62],
      ].map(([x, y]) => (
        <rect className="ill-line" key={x} x={x} y={y} width="9" height={72 - y} />
      ))}
      <path className="ill-line" d="M22 72 H 78" />
      <path className="ill-accent" d={BELL} fill="none" />
    </>
  ),

  /* 09 — кривая с максимумом и минимумом, к максимуму горизонтальная касательная. */
  '9': (
    <>
      <path className="ill-line" d="M22 72 H 76 M26 22 V 76" />
      <path className="ill-accent" d={CUBIC} fill="none" />
      {/* горизонтальная касательная в точке максимума */}
      <path className="ill-line" d="M50 26 H 78" />
      <circle className="ill-dot" cx="66" cy="26" r="3" />
      <circle className="ill-dot" cx="30" cy="70" r="3" />
    </>
  ),

  /* 10 — оси t и v, на них возрастающая прямая. */
  '10': (
    <>
      <path className="ill-line" d="M26 72 H 74 M26 24 V 72" />
      <path className="ill-accent" d="M30 68 L 70 32" />
      {/* подписи осей прижаты внутрь: у текста габарит шире якоря,
          и на прежнем месте он задевал край круга */}
      <text className="ill-text" x="63" y="76">
        t
      </text>
      <text className="ill-text" x="22" y="34">
        v
      </text>
    </>
  ),

  /* 12 — оси координат и наклонная прямая с отмеченной точкой. */
  '12': (
    <>
      <path className="ill-line" d="M24 72 H 76 M30 22 V 76" />
      <path className="ill-accent" d="M28 66 L 72 30" />
      <circle className="ill-dot" cx="50" cy="48" r="3.5" />
      <path className="ill-line" d="M50 48 V 72 M50 48 H 30" />
    </>
  ),

  /* 13 — три столбца и возрастающая линия со стрелкой поверх. */
  '13': (
    <>
      <path className="ill-line" d="M22 72 H 76" />
      {[
        [26, 56],
        [44, 46],
        [62, 34],
      ].map(([x, y]) => (
        <g key={x}>
          {/* все три столбца залиты и обведены */}
          <rect className="ill-fill" x={x} y={y} width="12" height={72 - y} />
          <rect className="ill-line" x={x} y={y} width="12" height={72 - y} />
        </g>
      ))}
      <path className="ill-accent" d="M26 66 L 46 54 L 70 30" markerEnd="url(#ill-arrow)" />
    </>
  ),
};

/* Три сюжета — это математические символы, а не схемы: они набираются
   формулой, а не рисуются линиями. Кегли подобраны так, чтобы в ряду
   все три читались одинаково заметно: короткий знак крупнее длинного
   выражения. */
const FORMULAS: Record<string, { tex: string; size: 'long' | 'mid' | 'short' }> = {
  '7': { tex: 'ax^2 + bx + c = 0', size: 'long' },
  '8': { tex: '\\sqrt{x}', size: 'mid' },
  '11': { tex: '\\%', size: 'short' },
};

/**
 * Круглая подложка и центрирование содержимого. Круг описан здесь
 * один раз: у всех тринадцати миниатюр он гарантированно одинаковый,
 * и меняется одной правкой.
 *
 * Содержимым может быть и фигура, и формула. Фигуры приходят в поле
 * 96×96 из координатного задания, круг уже — поэтому группа
 * поджимается, а исходные координаты переписывать не нужно.
 */
export function IllustrationFrame({
  children,
  tex,
  size,
}: {
  children?: ReactNode;
  tex?: string;
  size?: 'long' | 'mid' | 'short';
}) {
  return (
    <span className="ill-frame">
      <svg className="ill" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
        <circle className="ill-disc" cx="48" cy="48" r="34" />
        {children !== undefined ? (
          <g transform="translate(48,48) scale(0.82) translate(-48,-48)">{children}</g>
        ) : null}
      </svg>
      {tex !== undefined ? (
        <span
          className={`ill-formula ill-formula--${size ?? 'mid'}`}
          aria-hidden="true"
          /* Вёрстка KaTeX по постоянной строке из этого файла: данных
             извне здесь нет. */
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(tex, { throwOnError: false, displayMode: false }),
          }}
        />
      ) : null}
    </span>
  );
}

export function TaskIllustration({ slug }: { slug: string }) {
  const formula = FORMULAS[slug];
  if (formula !== undefined) {
    return <IllustrationFrame tex={formula.tex} size={formula.size} />;
  }
  const shape = ILLUSTRATIONS[slug];
  if (shape === undefined) {
    return null;
  }
  return <IllustrationFrame>{shape}</IllustrationFrame>;
}
