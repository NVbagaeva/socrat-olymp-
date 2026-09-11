import { clsx } from 'clsx';
import { useId } from 'react';

export interface TrajectoryPoint {
  /** Координаты в системе viewBox, 620 × 260. */
  x: number;
  y: number;
  label: string;
}

export interface TrajectoryGoal extends TrajectoryPoint {
  /** Подпись над пунктирной линией цели. */
  caption: string;
}

export interface TrajectoryChartProps {
  points?: TrajectoryPoint[];
  goal?: TrajectoryGoal;
  /** Линия траектории и заливка под ней. Кривая подобрана вручную. */
  linePath?: string;
  areaPath?: string;
  gridLines?: number[];
  caption?: string;
  className?: string;
}

const LINE = 'M50 212 C120 208 160 192 210 170 C270 144 310 114 370 94 C420 78 480 58 570 40';
const AREA = `${LINE} L570 220 L50 220 Z`;

const POINTS: TrajectoryPoint[] = [
  { x: 50, y: 212, label: '72' },
  { x: 210, y: 170, label: '80' },
  { x: 370, y: 94, label: '84' },
  { x: 470, y: 63, label: '87' },
];

const GOAL: TrajectoryGoal = { x: 570, y: 40, label: '90+', caption: 'цель' };

/**
 * Траектория подготовки — фирменный компонент.
 * Цвета берутся из классов в components.css, внутри SVG хексов нет.
 */
export function TrajectoryChart({
  points = POINTS,
  goal = GOAL,
  linePath = LINE,
  areaPath = AREA,
  gridLines = [220, 165, 110, 55],
  caption = 'Траектория результатов и целевой балл',
  className,
}: TrajectoryChartProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 620 260"
      className={clsx('chart', className)}
      role="img"
      aria-label={`${caption}: ${points.map((point) => point.label).join(', ')}, цель ${goal.label}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="chart__stop" stopOpacity="0.16" />
          <stop offset="100%" className="chart__stop" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="chart__grid">
        {gridLines.map((y) => (
          <line key={y} x1="30" y1={y} x2="600" y2={y} />
        ))}
      </g>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} className="chart__line" />

      <line className="chart__goal" x1={goal.x} y1={goal.y} x2={goal.x} y2={220} />

      <g className="chart__dot">
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r={5} />
        ))}
      </g>
      <circle className="chart__dot--goal" cx={goal.x} cy={goal.y} r={6} />

      <g className="chart__label">
        {points.map((point) => (
          <text key={point.label} x={point.x} y={240}>
            {point.label}
          </text>
        ))}
      </g>
      <g className="chart__label--goal">
        <text x={goal.x} y={240}>
          {goal.label}
        </text>
        <text x={goal.x} y={26}>
          {goal.caption}
        </text>
      </g>
    </svg>
  );
}
