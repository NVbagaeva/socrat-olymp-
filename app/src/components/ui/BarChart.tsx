import { clsx } from 'clsx';

export interface Bar {
  label: string;
  /** Высота столбца в процентах от поля графика. */
  value: number;
  /** Выделяется только модальный интервал. */
  highlight?: boolean;
}

export interface BarChartProps {
  bars: Bar[];
  caption: string;
  className?: string;
}

export function BarChart({ bars, caption, className }: BarChartProps) {
  return (
    <div className={clsx('bars', className)} role="img" aria-label={caption}>
      {bars.map((bar) => (
        <div key={bar.label}>
          <b className={clsx(bar.highlight && 'hi')} style={{ height: `${bar.value}%` }} />
          <span>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
