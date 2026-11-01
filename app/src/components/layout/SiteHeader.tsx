import { clsx } from 'clsx';
import Link from 'next/link';
import { AuthWidget } from '@/components/auth/AuthWidget';
import { isNavGroup, site } from '@/content/site';
import { NavDropdown } from './NavDropdown';
import { SiteMenu } from './SiteMenu';

export interface SiteHeaderProps {
  /** Какой пункт меню отмечен текущим. Значение — href из site.nav. */
  currentHref?: string;
  className?: string;
}

/** Шапка публичных страниц: логотип, меню, вход и регистрация. */
export function SiteHeader({ currentHref, className }: SiteHeaderProps) {
  return (
    <header className={clsx('site-head', className)}>
      <div className="site-head__in">
        <Link className="logo" href="/">
          <i aria-hidden="true" />
          {site.brand}
        </Link>

        <nav className="site-nav" aria-label="Разделы сайта">
          {site.nav.map((link) =>
            isNavGroup(link) ? (
              <NavDropdown key={link.label} group={link} currentHref={currentHref} />
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
          {/* «Войти» или кружок аккаунта и «Начать бесплатно». Вход
              выключен — остаётся одна прежняя кнопка. */}
          <AuthWidget variant="site" />
          <SiteMenu />
        </div>
      </div>
    </header>
  );
}
