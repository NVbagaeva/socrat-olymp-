import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface TopbarProps {
  searchPlaceholder?: string;
  /** Подпись поля поиска для скринридера. */
  searchLabel?: string;
  /** Есть непрочитанные уведомления — точка на колокольчике. */
  unread?: boolean;
  user?: { initials: string; name: string };
  actions?: ReactNode;
  className?: string;
}

export function Topbar({
  searchPlaceholder = 'Поиск по заданиям, темам и номерам',
  searchLabel = 'Поиск',
  unread = true,
  user,
  actions,
  className,
}: TopbarProps) {
  return (
    <header className={clsx('topbar', className)}>
      <input
        type="search"
        className="search"
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
      />
      <div className="topbar__spacer" />
      {actions}
      <button
        type="button"
        className="bell"
        aria-label={unread ? 'Уведомления, есть новые' : 'Уведомления'}
      >
        <span className="bell__ico" aria-hidden="true" />
      </button>
      {user !== undefined ? (
        <span className="avatar avatar--sm" role="img" aria-label={user.name}>
          {user.initials}
        </span>
      ) : null}
    </header>
  );
}
