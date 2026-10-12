'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { clockText, sessionText } from './text';

export interface SessionBarProps {
  /** Номер текущего задания (с нуля). */
  index: number;
  total: number;
  solved: number;
  paused: boolean;
  /** Тренировка остановлена другой вкладкой: кнопки не работают. */
  blocked: boolean;
  /** Активное время тренировки, мс. */
  elapsed: () => number;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}

/**
 * Часы тренировки. Перерисовываются сами раз в полсекунды: экран
 * заданий вместе с ними не мигает.
 */
function SessionClock({ elapsed }: { elapsed: () => number }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => setMs(elapsed());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [elapsed]);
  return (
    <span className="tsess__timer" role="timer" aria-label={sessionText.timer}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
        <circle cx="10" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 7.8V11l2.2 1.4M8 2.5h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {clockText(ms)}
    </span>
  );
}

/** Панель тренировки: прогресс, время и кнопки управления. */
export function SessionBar({
  index,
  total,
  solved,
  paused,
  blocked,
  elapsed,
  onPause,
  onResume,
  onFinish,
}: SessionBarProps) {
  const shown = total === 0 ? 0 : Math.min(index + 1, total);
  return (
    <div className="tsess__bar" role="group" aria-label={sessionText.barLabel}>
      <p className="tsess__progress">
        {sessionText.task} <b>{shown}</b> {sessionText.of} {total}
        <span className="tsess__solved">
          {sessionText.solved} <b>{solved}</b>
        </span>
      </p>
      <SessionClock elapsed={elapsed} />
      <div className="tsess__actions">
        {paused ? (
          <Button size="sm" onClick={onResume} disabled={blocked}>
            {sessionText.resume}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onPause} disabled={blocked}>
            {sessionText.pause}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onFinish} disabled={blocked}>
          <span className="tsess__finish-long">{sessionText.finishShort}</span>
          <span className="tsess__finish-short">{sessionText.finish}</span>
        </Button>
      </div>
    </div>
  );
}
