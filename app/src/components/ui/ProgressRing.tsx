import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface ProgressRingProps {
  /** Доля выполненного, 0–100. */
  value: number;
  label: ReactNode;
  /** Подпись для скринридера, если label не текст. */
  srLabel?: string;
  className?: string;
}

const SIZE = 160;
const RADIUS = 68;
const STROKE = 12;
const LENGTH = 2 * Math.PI * RADIUS;

/** Один показатель на экран. */
export function ProgressRing({ value, label, srLabel, className }: ProgressRingProps) {
  const percent = Math.min(100, Math.max(0, value));
  const offset = LENGTH * (1 - percent / 100);

  return (
    <div className={clsx('ring', className)}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={srLabel ?? `${Math.round(percent)}%`}
      >
        <circle className="ring__track" cx={80} cy={80} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className="ring__fill"
          cx={80}
          cy={80}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={LENGTH.toFixed(2)}
          strokeDashoffset={offset.toFixed(2)}
        />
      </svg>
      <div className="ring__c" aria-hidden="true">
        <span className="t-data-lg">{Math.round(percent)}%</span>
        <span className="t-caption muted">{label}</span>
      </div>
    </div>
  );
}
