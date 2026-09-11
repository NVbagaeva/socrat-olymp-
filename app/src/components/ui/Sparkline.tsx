import { clsx } from 'clsx';

export interface SparklineProps {
  /** Путь в системе viewBox 200 × 60. */
  path?: string;
  endX?: number;
  endY?: number;
  caption: string;
  className?: string;
}

const PATH = 'M5 52 C40 50 55 40 80 32 C110 22 140 16 195 8';

/** Компактная кривая для мобильных карточек. */
export function Sparkline({
  path = PATH,
  endX = 195,
  endY = 8,
  caption,
  className,
}: SparklineProps) {
  return (
    <svg viewBox="0 0 200 60" className={clsx('chart', className)} role="img" aria-label={caption}>
      <path d={path} className="chart__line chart__line--thin" />
      <circle className="chart__dot--goal" cx={endX} cy={endY} r={3.5} />
    </svg>
  );
}
