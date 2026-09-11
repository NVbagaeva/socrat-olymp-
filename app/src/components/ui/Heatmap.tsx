export type HeatLevel = 1 | 2 | 3 | 4 | 5;

export interface HeatmapRow {
  label: string;
  /** По одной ступени на столбец. Пять ступеней — больше глаз не различает. */
  levels: HeatLevel[];
}

export interface HeatmapProps {
  rows: HeatmapRow[];
  /** Подписи столбцов для скринридера. */
  columnLabels: string[];
  caption: string;
  legendLow?: string;
  legendHigh?: string;
  className?: string;
}

const LEVELS: HeatLevel[] = [1, 2, 3, 4, 5];

export function Heatmap({
  rows,
  columnLabels,
  caption,
  legendLow = 'Меньше',
  legendHigh = 'Больше',
  className,
}: HeatmapProps) {
  return (
    <div className={className}>
      <div
        className="heat"
        style={{ gridTemplateColumns: `104px repeat(${columnLabels.length}, 1fr)` }}
        role="img"
        aria-label={caption}
      >
        {rows.map((row) => (
          <div key={row.label} className="heat__row" role="presentation">
            <span className="heat__lbl">{row.label}</span>
            {row.levels.map((level, index) => (
              <span
                key={columnLabels[index] ?? String(index)}
                className="heat__cell"
                data-l={level}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only">
        {rows
          .map(
            (row) =>
              `${row.label}: ${row.levels
                .map((level, index) => `${columnLabels[index] ?? index + 1} — ${level} из 5`)
                .join(', ')}`,
          )
          .join('. ')}
      </p>
      <p className="heat-legend">
        <span>{legendLow}</span>
        {LEVELS.map((level) => (
          <i key={level} className="heat__cell" data-l={level} />
        ))}
        <span>{legendHigh}</span>
      </p>
    </div>
  );
}
