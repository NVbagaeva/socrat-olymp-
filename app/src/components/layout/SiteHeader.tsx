import { clsx } from 'clsx';
import Link from 'next/link';
import { AuthWidget } from '@/components/auth/AuthWidget';
import { TemaSwitch } from '@/components/tema/TemaSwitch';
import { LevelLink, LevelSwitch } from '@/components/level/LevelSwitch';
import { isNavGroup, site } from '@/content/site';
import { NavDropdown } from './NavDropdown';
import { SaytPanel } from './SaytPanel';
import { SiteHeadCompact } from './SiteHeadCompact';
import { SiteMenu } from './SiteMenu';

export interface SiteHeaderProps {
  /** Какой пункт меню отмечен текущим. Значение — href из site.nav. */
  currentHref?: string;
  className?: string;
}

/**
 * Шапка публичных страниц: логотип с названием, меню, вход.
 *
 * Телефон (до 768px): знак и название слева, справа одна кнопка —
 * «Войти» или кружок аккаунта — и бургер. «Начать бесплатно» — на
 * первом экране главной. Компьютер: ещё меню разделов и основная
 * «Начать бесплатно» рядом со вторичной «Войти». На прокрутке шапка
 * становится ниже (SiteHeadCompact, site.css).
 */
export function SiteHeader({ currentHref, className }: SiteHeaderProps) {
  return (
    <>
      <header className={clsx('site-head', className)}>
        <div className="site-head__in">
          <Link className="logo" href="/">
            <i aria-hidden="true" />
            {site.brand}
          </Link>

          {/* Уровень экзамена — сразу после логотипа, на всех страницах. */}
          <LevelSwitch className="site-head__level" />

          <nav className="site-nav" aria-label="Разделы сайта">
            {site.nav.map((link) =>
              isNavGroup(link) ? (
                <NavDropdown key={link.label} group={link} currentHref={currentHref} />
              ) : link.hrefBase !== undefined ? (
                <LevelLink
                  key={link.href}
                  hrefs={{ profile: link.href, base: link.hrefBase }}
                  aria-current={link.href === currentHref ? 'page' : undefined}
                >
                  {link.label}
                </LevelLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.akcent === true ? 'is-akcent' : undefined}
                  aria-current={link.href === currentHref ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="site-head__cta">
            {/* «Войти» или кружок аккаунта и «Начать бесплатно» (её на
              телефоне нет). Вход выключен — остаётся одна «Начать
              бесплатно». */}
            <TemaSwitch />
            <AuthWidget variant="site" />
            <SiteMenu />
          </div>
        </div>
        <SiteHeadCompact />
      </header>
      {/* Нижняя панель телефона — как в приложении; на главных её нет. */}
      <SaytPanel />
    </>
  );
}
