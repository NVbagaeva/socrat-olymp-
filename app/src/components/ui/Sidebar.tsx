import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

export interface SidebarProps {
  /** Название продукта в шапке меню. */
  brand: string;
  items: NavItem[];
  /** Нижняя группа: уведомления, настройки. */
  secondaryItems?: NavItem[];
  user?: { initials: string; name: string };
  /** Название меню для скринридера. */
  label?: string;
  className?: string;
}

function NavList({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav className="snav" aria-label={label}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={clsx(item.active && 'is-active')}
          aria-current={item.active ? 'page' : undefined}
        >
          <i aria-hidden="true" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

/**
 * Сайдбар: 240px на широком экране, 72px на планшете,
 * на мобильном скрыт — навигацию берёт на себя BottomNavigation.
 */
export function Sidebar({
  brand,
  items,
  secondaryItems,
  user,
  label = 'Основное меню',
  className,
}: SidebarProps): ReactNode {
  return (
    <aside className={clsx('sidebar', className)}>
      <div className="sidebar__mark">
        <span className="sidebar__logo" aria-hidden="true" />
        <span>{brand}</span>
      </div>
      <NavList items={items} label={label} />
      {secondaryItems !== undefined || user !== undefined ? (
        <div className="sidebar__foot">
          {secondaryItems !== undefined ? (
            <NavList items={secondaryItems} label="Служебное меню" />
          ) : null}
          {user !== undefined ? (
            <div className="sidebar__user">
              <span className="avatar avatar--sm avatar--on-brand" aria-hidden="true">
                {user.initials}
              </span>
              <span>{user.name}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
