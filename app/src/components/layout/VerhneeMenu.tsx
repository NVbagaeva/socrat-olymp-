import { clsx } from 'clsx';
import Link from 'next/link';
import { LevelLink } from '@/components/level/LevelSwitch';
import { isNavGroup, site, type NavItem } from '@/content/site';
import { levelInfo, type Level } from '@/lib/level';
import { NavSpisok } from './NavSpisok';

export interface VerhneeMenuProps {
  /**
   * id текущего раздела: пункта site.nav или ссылки внутри «Вариантов»
   * (на всех страницах заданий — 'tasks', «Банк заданий»).
   */
  current?: string | undefined;
  /** Уровень страницы: «Банк заданий» на странице базы ведёт в банк базы. */
  level?: Level;
}

/* Пункты, которые уходят в бургер, когда места мало: первым —
   «Учителям», за ним «Как пользоваться» (verh-menu.css, контейнерные
   запросы). В бургере (SiteMenu) они есть всегда. */
const SKRYTIE: Record<string, string> = {
  uchitelyam: 'verh-menu__p--1',
  help: 'verh-menu__p--2',
};

/** id текущего пункта по адресу страницы — для страниц сайта. */
export function idPoAdresu(adres: string | undefined): string | undefined {
  if (adres === undefined) return undefined;
  for (const item of site.nav) {
    if (isNavGroup(item)) {
      const v = item.items.find((link) => link.href === adres);
      if (v !== undefined) return v.id;
    } else if (item.href === adres) return item.id;
  }
  return undefined;
}

/**
 * Верхнее меню — одно на весь сайт: шапка публичных страниц и шапка
 * кабинета (SiteHeader в обоих местах). Пункты — site.nav, названия
 * всегда полные. «Варианты» — список без JavaScript (NavSpisok): шапка
 * стоит на каждой странице заданий, и бюджет первой загрузки не
 * пускает туда клиентский код (scripts/check-first-load.mjs).
 */
export function VerhneeMenu({ current, level = 'profile' }: VerhneeMenuProps) {
  const base = levelInfo('base');
  return (
    <nav className="verh-menu" aria-label="Разделы сайта">
      <div className="verh-menu__in">
        {site.nav.map((item: NavItem) => {
          if (isNavGroup(item)) {
            const tekushchiy = item.items.find((link) => link.id === current)?.href;
            return (
              <NavSpisok
                key={item.id}
                group={item}
                {...(tekushchiy === undefined ? {} : { currentHref: tekushchiy })}
              />
            );
          }
          const props = {
            className: clsx(
              'verh-menu__p',
              item.akcent === true && 'is-akcent',
              item.id !== undefined && SKRYTIE[item.id],
            ),
            'aria-current': item.id === current ? ('page' as const) : undefined,
          };
          if (item.hrefBase !== undefined) {
            /* «Банк заданий»: на странице уровня — его банк, на странице
               без уровня — запомненного (LevelLink). */
            const profile = level === 'base' ? base.bank : item.href;
            return (
              <LevelLink key={item.href} hrefs={{ profile, base: item.hrefBase }} {...props}>
                {item.label}
              </LevelLink>
            );
          }
          return (
            <Link key={item.href} href={item.href} {...props}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
