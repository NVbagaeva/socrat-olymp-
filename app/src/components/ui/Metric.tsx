import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type MetricDirection = 'up' | 'down' | 'flat';
export type MetricSize = 'default' | 'compact' | 'tight';

export interface MetricProps {
  value: ReactNode;
  label: ReactNode;
  /** Подпись под значением: изменение за период или пояснение к числу. */
  delta?: ReactNode;
  direction?: MetricDirection;
  size?: MetricSize;
  className?: string;
}

const DIRECTION: Record<MetricDirection, string> = {
  up: 'metric__delta--up',
  down: 'metric__delta--down',
  flat: 'metric__delta--flat',
};

const SIZE: Record<MetricSize, string | null> = {
  default: null,
  compact: 'metric--compact',
  tight: 'metric--tight',
};

/** Стрелка — только оформление: направление уже сказано словами в delta. */
const ARROW: Record<MetricDirection, string> = { up: '↑', down: '↓', flat: '' };

export function Metric({
  value,
  label,
  delta,
  direction = 'flat',
  size = 'default',
  className,
}: MetricProps) {
  return (
    <div className={clsx('metric', SIZE[size], className)}>
      <div className="metric__val">{value}</div>
      <div className="metric__lbl">{label}</div>
      {delta !== undefined ? (
        <div className={clsx('metric__delta', DIRECTION[direction])}>
          {ARROW[direction] ? <span aria-hidden="true">{ARROW[direction]}</span> : null}
          <span>{delta}</span>
        </div>
      ) : null}
    </div>
  );
}
