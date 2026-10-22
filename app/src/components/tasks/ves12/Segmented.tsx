'use client';

import { clsx } from 'clsx';
import { useId, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentedProps<T extends string | number> {
  label: ReactNode;
  options: { value: T; title: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  /** Подпись спрятана от глаз (но не от чтения с экрана). */
  hideLabel?: boolean;
}

/**
 * Сегментированный переключатель: один выбор из нескольких, стрелками с
 * клавиатуры. Вместо больших карточек-вариантов там, где выбор короткий.
 */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
}: SegmentedProps<T>) {
  const id = useId();
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const at = options.findIndex((item) => item.value === value);
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step !== 0) {
      event.preventDefault();
      const next = options[(at + step + options.length) % options.length];
      if (next !== undefined) {
        onChange(next.value);
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
        buttons[(at + step + options.length) % options.length]?.focus();
      }
    }
  }
  return (
    <div className="seg-field">
      <span className={clsx('seg-field__label', hideLabel && 'sr-only')} id={id}>
        {label}
      </span>
      <div className="seg" role="radiogroup" aria-labelledby={id} onKeyDown={onKey}>
        {options.map((item) => {
          const on = item.value === value;
          return (
            <button
              key={String(item.value)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              className={clsx('seg__item', on && 'is-checked')}
              onClick={() => onChange(item.value)}
            >
              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
