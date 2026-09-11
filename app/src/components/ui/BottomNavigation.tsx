import { clsx } from 'clsx';
import type { NavItem } from './Sidebar';

export interface BottomNavigationProps {
  items: NavItem[];
  label?: string;
  className?: string;
}

/** Нижняя навигация мобильной оболочки: не больше четырёх пунктов. */
export function BottomNavigation({
  items,
  label = 'Основная навигация',
  className,
}: BottomNavigationProps) {
  return (
    <nav className={clsx('bnav', className)} aria-label={label}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={clsx(item.active && 'is-active')}
          aria-current={item.active ? 'page' : undefined}
        >
          <i aria-hidden="true" />
          {item.label}
        </a>
      ))}
    </nav>
  );
}
