import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { NavIcon } from './NavIcons';
import type { NavItem } from './Sidebar';

export interface TopbarProps {
  /** Разделы кабинета. Не переданы — шапка без меню, как была. */
  nav?: NavItem[];
  /**
   * Поле поиска в шапке. Выключается там, где у страницы свой поиск:
   * два поля на одном экране — это два разных поиска, и человек не
   * знает, какое из них фильтрует список.
   */
  search?: boolean;
  /** Название меню шапки для скринридера. */
  navLabel?: string;
  searchPlaceholder?: string;
  /** Подпись поля поиска для скринридера. */
  searchLabel?: string;
  /** Есть непрочитанные уведомления — точка на колокольчике. */
  unread?: boolean;
  /** Адрес страницы уведомлений. Не задан — колокольчик кнопкой. */
  notificationsHref?: string;
  user?: { initials: string; name: string; role?: string };
  actions?: ReactNode;
  className?: string;
}

export function Topbar({
  nav,
  navLabel = 'Разделы кабинета',
  search = true,
  searchPlaceholder = 'Поиск по заданиям, темам и номерам',
  searchLabel = 'Поиск',
  unread = true,
  notificationsHref,
  user,
  actions,
  className,
}: TopbarProps) {
  const bellLabel = unread ? 'Уведомления, есть новые' : 'Уведомления';

  return (
    <header className={clsx('topbar', className)}>
      {nav !== undefined ? (
        <>
          <nav className="topnav" aria-label={navLabel}>
            {nav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={clsx(item.active === true && 'is-active')}
                aria-current={item.active === true ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="topbar__spacer" />
        </>
      ) : null}

      {search ? (
        <input
          type="search"
          className="search"
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
        />
      ) : null}
      <div className="topbar__spacer" />
      {actions}

      {/* Колокольчик: ссылка, когда страница уведомлений есть, и кнопка,
          когда её нет, — чтобы не обещать переход в никуда. */}
      {notificationsHref !== undefined ? (
        <a className="bell" href={notificationsHref} aria-label={bellLabel}>
          <NavIcon name="notifications" />
        </a>
      ) : (
        <button type="button" className="bell" aria-label={bellLabel}>
          <span className="bell__ico" aria-hidden="true" />
        </button>
      )}

      {user !== undefined ? (
        <span className="topbar__user">
          <span className="avatar avatar--sm" aria-hidden="true">
            {user.initials}
          </span>
          {/* Имя видимым текстом: на макете оно в шапке, а не только
              подписью к аватару. */}
          <span className="topbar__who">
            <span className="topbar__name">{user.name}</span>
            {user.role !== undefined ? (
              <span className="topbar__role">{user.role}</span>
            ) : null}
          </span>
        </span>
      ) : null}
    </header>
  );
}
