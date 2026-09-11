import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface MetricRowProps {
  children: ReactNode;
  /** Сколько метрик в строке. На узком экране строка всегда сворачивается в 2×2. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMNS: Record<2 | 3 | 4, string | null> = {
  2: 'metric-row--2',
  3: 'metric-row--3',
  4: null,
};

/** Строка метрик — один блок с разделителями, а не четыре отдельные плитки. */
export function MetricRow({ children, columns = 4, className }: MetricRowProps) {
  return <div className={clsx('metric-row', COLUMNS[columns], className)}>{children}</div>;
}
