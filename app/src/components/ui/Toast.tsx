import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface ToastProps {
  children: ReactNode;
  /** assertive — только для того, что прерывает работу. */
  urgent?: boolean;
  action?: ReactNode;
  className?: string;
}

export function Toast({ children, urgent = false, action, className }: ToastProps) {
  return (
    <div
      className={clsx('toast', className)}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
