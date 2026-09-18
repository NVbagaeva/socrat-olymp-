'use client';

import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { NavIcon, type NavIconName } from './NavIcons';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /**
   * Пункт отмечен текущим принудительно. Не задан — считается по
   * адресу открытой страницы, и это обычный случай: меню само знает,
   * где находится пользователь, и страницам об этом сообщать не надо.
   */
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

/* Хвостовая косая ничего не значит для раздела: в конфиге адреса
   записаны и с ней, и без неё, а маршрут у страницы один. */
function normalize(path: string): string {
  const clean = path.split('?')[0]?.split('#')[0] ?? path;
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

/**
 * Пункт текущий, когда открыта его страница или страница внутри него:
 * раздел №12 подсвечен на /zadaniya/12 и на всём, что под ним, и не
 * подсвечен на /zadaniya — список разделов лежит не внутри раздела.
 *
 * Сравниваются целые отрезки пути, а не строки: иначе /zadaniya/1
 * отмечал бы себя на странице /zadaniya/12.
 */
function isCurrent(pathname: string | null, href: string): boolean {
  if (pathname === null) {
    return false;
  }
  const here = normalize(pathname);
  const target = normalize(href);
  /* Ссылка-якорь внутри страницы разделом не является: сверять с ней
     маршрут нечем, и такой пункт подсвечивается только явным active. */
  if (!target.startsWith('/')) {
    return false;
  }
  return here === target || here.startsWith(`${target}/`);
}

function NavLink({ item, className }: { item: NavItem; className?: string }) {
  /* Адрес открытой страницы. Пункт сверяется с ним сам — потому и
     подсветка одинаково верна на всех страницах кабинета. */
  const pathname = usePathname();
  const active = item.active ?? isCurrent(pathname, item.href);

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
      {/* Стрелка у текущего задания: указывает, что раздел открыт. */}
      {active && item.no !== undefined ? (
        <svg className="snav__go" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m9 5 7 7-7 7" />
        </svg>
      ) : null}
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
      className={clsx(className, active && 'is-active')}
      aria-current={active ? 'page' : undefined}
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
          {/* Подвал идёт сверху вниз: сначала декор с подписью, под
              ним личные разделы — порядок задан макетом. */}
          {footer}
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
        </div>
      ) : null}
    </aside>
  );
}
