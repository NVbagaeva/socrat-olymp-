'use client';

import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';

export interface DetailsProps {
  /** Строка-переключатель: «Откуда берётся минус», «Ещё один факт». */
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Раскрывающаяся врезка: строка с пунктирным подчёркиванием, по
 * нажатию под ней плавно открывается тело. Одна на всю платформу —
 * разбор задачи №12 и теория №4 пользуются ею вместе; оформление и
 * раскрытие описаны в components.css (.solution-details).
 */
export function Details({ title, children, className }: DetailsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={clsx('solution-details', open && 'open', className)}>
      <button
        type="button"
        className="solution-details-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {title}
      </button>
      <div className="solution-details-body">
        <div>{children}</div>
      </div>
    </div>
  );
}
