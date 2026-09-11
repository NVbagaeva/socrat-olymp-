'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import type { ReactNode } from 'react';

export interface TooltipProps {
  /** Текст подсказки. Одна строка: пузырь не переносится. */
  content: string;
  children: ReactNode;
  className?: string;
}

/** Подсказка раскрывается и по наведению, и по фокусу с клавиатуры. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  return (
    <span className={clsx('tip', className)} tabIndex={0} aria-describedby={id}>
      {children}
      <span className="tip__bubble" role="tooltip" id={id}>
        {content}
      </span>
    </span>
  );
}
