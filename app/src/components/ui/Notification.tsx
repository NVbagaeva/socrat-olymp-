import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface NotificationProps {
  title: ReactNode;
  /** Автор и время: «Наталья В. · 12 минут назад». */
  meta: ReactNode;
  unread?: boolean;
  className?: string;
}

export function Notification({ title, meta, unread = false, className }: NotificationProps) {
  return (
    <article className={clsx('notif', unread && 'is-unread', className)}>
      <span className={clsx('notif__dot', !unread && 'notif__dot--read')} aria-hidden="true" />
      <div>
        <p className="notif__title">
          {unread ? <span className="sr-only">Не прочитано. </span> : null}
          {title}
        </p>
        <p className="t-caption muted">{meta}</p>
      </div>
    </article>
  );
}
