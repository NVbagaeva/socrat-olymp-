import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { NavIcon, type NavIconName } from './NavIcons';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  /** Значок пункта. Не задан — на его месте пустая метка, как было. */
  icon?: NavIconName;
  /** Короткая подпись для нижней панели. Не задана — берётся label. */
  short?: string;
  /** Номер перед названием: список заданий экзамена. */
  no?: string;
  /** Раздел ещё не открыт: пункт не ссылка и не берёт фокус. */
  disabled?: boolean;
}

export interface SidebarProps {
  /** Название продукта в шапке меню. */
  brand: string;
  items: NavItem[];
  /** Подпись над списком: чему посвящён этот столбец. */
  caption?: { title: string; subtitle: string };
  /** Нижняя группа: личные разделы. */
  secondaryItems?: NavItem[];
  user?: { initials: string; name: string };
  /** Подвал меню: подпись, сноска — что угодно от страницы. */
  footer?: ReactNode;
  /** Название меню для скринридера. */
  label?: string;
  className?: string;
}

function NavLink({ item, className }: { item: NavItem; className?: string }) {
  const body = (
    <>
      {item.no !== undefined ? (
        <span className="snav__no" aria-hidden="true">
          {item.no}
        </span>
      ) : null}
      {item.icon !== undefined ? <NavIcon name={item.icon} /> : null}
      {item.icon === undefined && item.no === undefined ? <i aria-hidden="true" /> : null}
      {/* Подпись сокращается только на вид: вслух читается полное
          название раздела — оно уходит в aria-label ниже. */}
      <span>{item.short ?? item.label}</span>
    </>
  );

  /* Закрытый раздел: ни ссылки, ни обработчика — как на карточке
     банка. Обычный span не попадает в обход по Tab и не обещает
     перехода, а aria-disabled сообщает состояние скринридеру. */
  if (item.disabled === true) {
    return (
      <span
        className={clsx(className, 'is-soon')}
        aria-disabled="true"
        aria-label={item.short !== undefined ? item.label : undefined}
      >
        {body}
      </span>
    );
  }
  return (
    <a
      href={item.href}
      className={clsx(className, item.active === true && 'is-active')}
      aria-current={item.active === true ? 'page' : undefined}
      aria-label={item.short !== undefined ? item.label : undefined}
    >
      {body}
    </a>
  );
}

function NavList({
  items,
  label,
  className,
}: {
  items: NavItem[];
  label: string;
  className?: string;
}) {
  /* Список с номерами — это список заданий: названия в нём длинные и
     переносятся, поэтому ряд там растёт по содержимому. */
  const numbered = items.some((item) => item.no !== undefined);

  return (
    <nav className={clsx('snav', numbered && 'snav--numbered', className)} aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.id} item={item} />
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
  caption,
  secondaryItems,
  user,
  footer,
  label = 'Основное меню',
  className,
}: SidebarProps): ReactNode {
  return (
    <aside className={clsx('sidebar', className)}>
      <div className="sidebar__mark">
        <span className="sidebar__logo" aria-hidden="true" />
        <span>{brand}</span>
      </div>

      {caption !== undefined ? (
        <div className="sidebar__caption">
          <span className="sidebar__caption-title">{caption.title}</span>
          <span className="sidebar__caption-sub">{caption.subtitle}</span>
        </div>
      ) : null}

      <NavList items={items} label={label} />

      {secondaryItems !== undefined || user !== undefined || footer !== undefined ? (
        <div className="sidebar__foot">
          {secondaryItems !== undefined ? (
            <NavList items={secondaryItems} label="Личные разделы" />
          ) : null}
          {user !== undefined ? (
            <div className="sidebar__user">
              <span className="avatar avatar--sm avatar--on-brand" aria-hidden="true">
                {user.initials}
              </span>
              <span>{user.name}</span>
            </div>
          ) : null}
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
