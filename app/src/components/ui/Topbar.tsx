import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { LevelLink } from '@/components/level/LevelSwitch';
import { NavIcon } from './NavIcons';
import type { NavItem } from './Sidebar';

export interface TopbarProps {
  /** Разделы кабинета. Не переданы — шапка без меню, как была. */
  nav?: NavItem[];
  /** В начале шапки, перед меню: переключатель уровня экзамена. */
  lead?: ReactNode;
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
  /** Показывать ли колокольчик. false — раздела уведомлений ещё нет. */
  bell?: boolean;
  user?: { initials: string; name: string; role?: string };
  /**
   * Блок аккаунта справа: кнопка входа или кружок с меню. Задан —
   * показывается вместо user; это живой компонент, а не данные.
   */
  userSlot?: ReactNode;
  actions?: ReactNode;
  /**
   * Пункт меню, вместо которого встаёт свой узел — выпадающий список
   * («Варианты», components/layout/NavDropdown.tsx). Пункты до него
   * листаются вбок, как всё меню; список и пункты после него стоят
   * вне прокрутки: внутри неё выпавший список обрезался бы.
   */
  navSlot?: { id: string; node: ReactNode };
  className?: string;
}

export function Topbar({
  nav,
  lead,
  navLabel = 'Разделы кабинета',
  search = true,
  searchPlaceholder = 'Поиск по заданиям, темам и номерам',
  searchLabel = 'Поиск',
  /* Уведомлений пока нет — точку «есть новые» по умолчанию не рисуем. */
  unread = false,
  notificationsHref,
  bell = true,
  user,
  userSlot,
  actions,
  navSlot,
  className,
}: TopbarProps) {
  const bellLabel = unread ? 'Уведомления, есть новые' : 'Уведомления';
  const punkt = (item: NavItem) => {
    const body =
      item.short !== undefined ? (
        <>
          <span className="topnav__full">{item.label}</span>
          <span className="topnav__short">{item.short}</span>
        </>
      ) : (
        item.label
      );
    const props = {
      className: clsx(item.active === true && 'is-active', item.akcent === true && 'is-akcent'),
      'aria-current': item.active === true ? ('page' as const) : undefined,
      'aria-label': item.short !== undefined ? item.label : undefined,
    };
    /* Пункт с адресом для базы: на странице без своего уровня
       ведёт туда, какой уровень запомнен. */
    return item.hrefBase !== undefined ? (
      <LevelLink key={item.id} plain hrefs={{ profile: item.href, base: item.hrefBase }} {...props}>
        {body}
      </LevelLink>
    ) : (
      <a key={item.id} href={item.href} {...props}>
        {body}
      </a>
    );
  };
  const slot =
    navSlot === undefined || nav === undefined
      ? -1
      : nav.findIndex((item) => item.id === navSlot.id);
  const doSlota = nav === undefined ? [] : slot === -1 ? nav : nav.slice(0, slot);
  const posleSlota = nav === undefined || slot === -1 ? [] : nav.slice(slot + 1);

  return (
    <header className={clsx('topbar', className)}>
      {lead}
      {nav !== undefined ? (
        <>
          <nav
            className={clsx('topnav', navSlot !== undefined && 'topnav--so-spiskom')}
            aria-label={navLabel}
          >
            {navSlot === undefined ? (
              nav.map(punkt)
            ) : (
              <>
                <div className="topnav__lenta">{doSlota.map(punkt)}</div>
                {navSlot.node}
                {posleSlota.map(punkt)}
              </>
            )}
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
      {!bell ? null : notificationsHref !== undefined ? (
        <a
          className={clsx('bell', unread && 'bell--unread')}
          href={notificationsHref}
          aria-label={bellLabel}
        >
          <NavIcon name="notifications" />
        </a>
      ) : (
        <button
          type="button"
          className={clsx('bell', unread && 'bell--unread')}
          aria-label={bellLabel}
        >
          <span className="bell__ico" aria-hidden="true" />
        </button>
      )}

      {userSlot}
      {user !== undefined ? (
        <span className="topbar__user">
          <span className="avatar avatar--sm" aria-hidden="true">
            {user.initials}
          </span>
          {/* Имя видимым текстом: на макете оно в шапке, а не только
              подписью к аватару. */}
          <span className="topbar__who">
            <span className="topbar__name">{user.name}</span>
            {user.role !== undefined ? <span className="topbar__role">{user.role}</span> : null}
          </span>
        </span>
      ) : null}
    </header>
  );
}
