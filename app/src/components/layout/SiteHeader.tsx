import { clsx } from 'clsx';
import Link from 'next/link';
import { AuthWidget } from '@/components/auth/AuthWidget';
import { LevelLink, LevelSwitch } from '@/components/level/LevelSwitch';
import { isNavGroup, site } from '@/content/site';
import { NavDropdown } from './NavDropdown';
import { ShapkaKompakt } from './ShapkaKompakt';
import { SiteMenu } from './SiteMenu';

export interface SiteHeaderProps {
  /** Какой пункт меню отмечен текущим. Значение — href из site.nav. */
  currentHref?: string;
  className?: string;
}

/**
 * Шапка публичных страниц: логотип с названием, меню, вход и «Начать
 * бесплатно». Липкая; при прокрутке компактнее (ShapkaKompakt).
 */
export function SiteHeader({ currentHref, className }: SiteHeaderProps) {
  return (
    <header className={clsx('site-head', className)}>
      <div className="site-head__in">
        <ShapkaKompakt />
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
                aria-current={link.href === currentHref ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="site-head__cta">
          {/* «Войти» (вторичная) или кружок аккаунта; от 768px рядом —
              основная «Начать бесплатно». На телефоне её нет: она на
              первом экране главной. Вход выключен — одна «Начать
              бесплатно». */}
          <AuthWidget variant="site" />
          <SiteMenu />
        </div>
      </div>
    </header>
  );
}
