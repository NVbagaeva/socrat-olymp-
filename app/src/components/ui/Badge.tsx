import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface BadgeProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  tone?: BadgeTone;
  children: ReactNode;
}

const TONE: Record<BadgeTone, string | null> = {
  neutral: null,
  info: 'badge--info',
  success: 'badge--success',
  warning: 'badge--warning',
  error: 'badge--error',
};

/** Бейдж всегда содержит текст: цвет не может быть единственным носителем смысла. */
export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={clsx('badge', TONE[tone], className)} {...rest}>
      {children}
    </span>
  );
}
