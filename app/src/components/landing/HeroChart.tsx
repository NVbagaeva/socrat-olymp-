/**
 * График героя. Геометрия из эталона, цвета — классами из components.css.
 * Прочерчивание кривой сделано на CSS через pathLength, без скрипта.
 */

export interface HeroChartProps {
  alt: string;
}

const LINE = 'M50 222 C120 218 160 202 210 180 C270 154 310 124 370 104 C420 88 480 66 570 44';
const AREA = `${LINE} L570 230 L50 230 Z`;
const POINTS = [
  { x: 50, y: 222, label: '72' },
  { x: 210, y: 180, label: '80' },
  { x: 370, y: 104, label: '84' },
  { x: 470, y: 73, label: '87' },
];

export function HeroChart({ alt }: HeroChartProps) {
  return (
    <svg viewBox="0 0 620 280" className="chart" role="img" aria-label={alt}>
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="chart__stop" stopOpacity="0.18" />
          <stop offset="100%" className="chart__stop" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="chart__grid">
        {[230, 175, 120, 65].map((y) => (
          <line key={y} x1="30" y1={y} x2="600" y2={y} />
        ))}
      </g>

      <path d={AREA} fill="url(#hero-fill)" />
      <path d={LINE} className="chart__line hero__curve" pathLength={1} />

      <line className="chart__goal" x1={570} y1={44} x2={570} y2={230} />

      <g className="chart__dot">
        {POINTS.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r={5.5} />
        ))}
      </g>
      <circle className="chart__dot--goal" cx={570} cy={44} r={7} />

      <g className="chart__label">
        {POINTS.map((point) => (
          <text key={point.label} x={point.x} y={254}>
            {point.label}
          </text>
        ))}
      </g>
      <g className="chart__label--goal">
        <text x={570} y={256} fontSize={16}>
          90+
        </text>
        <text x={570} y={28} fontSize={13}>
          цель
        </text>
      </g>
    </svg>
  );
}
