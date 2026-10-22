'use client';

import { clsx } from 'clsx';

export interface StepTabsProps {
  steps: string[];
  /** Текущий шаг, с нуля. */
  current: number;
  onSelect: (index: number) => void;
}

/** Шаги-вкладки сверху: номер в кружке и название; текущий подсвечен. */
export function StepTabs({ steps, current, onSelect }: StepTabsProps) {
  return (
    <nav className="steps" aria-label="Шаги">
      <ol>
        {steps.map((title, i) => (
          <li key={title}>
            <button
              type="button"
              className={clsx('steps__item', i === current && 'is-current', i < current && 'is-done')}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => onSelect(i)}
              data-step={i + 1}
            >
              <span className="steps__no">{i + 1}</span>
              <span className="steps__title">{title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
