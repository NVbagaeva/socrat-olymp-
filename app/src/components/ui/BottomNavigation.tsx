import { clsx } from 'clsx';
import { NavIcon } from './NavIcons';
import type { NavItem } from './Sidebar';

export interface BottomNavigationProps {
  items: NavItem[];
  label?: string;
  className?: string;
}

/**
 * Нижняя навигация мобильной оболочки: четыре раздела и вход в
 * остальные. Больше пяти ячеек в строку на телефоне не помещается.
 */
export function BottomNavigation({
  items,
  label = 'Основная навигация',
  className,
}: BottomNavigationProps) {
  return (
    <nav className={clsx('bnav', className)} aria-label={label}>
      {/* Подпись сокращается только на вид: вслух читается полное
          название раздела, то же самое, что в сайдбаре. */}
      {items.map((item) => {
        const podpis = item.panel ?? item.short ?? item.label;
        return (
          <a
            key={item.id}
            href={item.href}
            className={clsx(item.active && 'is-active')}
            aria-current={item.active ? 'page' : undefined}
            aria-label={podpis !== item.label ? item.label : undefined}
          >
            {item.icon !== undefined ? <NavIcon name={item.icon} /> : <i aria-hidden="true" />}
            {podpis}
          </a>
        );
      })}
    </nav>
  );
}
