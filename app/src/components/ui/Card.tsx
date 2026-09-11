import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface CardProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Заголовок карточки. Вместе с action образует шапку. */
  title?: ReactNode;
  /** Правый угол шапки: кнопка, бейдж или счётчик. */
  action?: ReactNode;
  /** Уменьшенные поля — 20px вместо 24px. */
  compact?: boolean;
}

export function Card({ title, action, compact = false, className, children, ...rest }: CardProps) {
  return (
    <div className={clsx('card', compact && 'card--sm', className)} {...rest}>
      {title !== undefined || action !== undefined ? (
        <div className="card__head">
          <span className="card__title">{title}</span>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
