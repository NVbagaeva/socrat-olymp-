import { clsx } from 'clsx';

export interface ProgressBarProps {
  /** Доля выполненного, 0–100. */
  value: number;
  /** Описание для скринридера: полоса без подписи молчит. */
  label: string;
  className?: string;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Прогресс всегда в синей шкале, даже когда показатель низкий. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = clamp(value);
  return (
    <div
      className={clsx('pbar', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="pbar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
