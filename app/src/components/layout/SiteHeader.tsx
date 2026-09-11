import { clsx } from 'clsx';
import Link from 'next/link';
import { site } from '@/content/site';

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
          {site.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === currentHref ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-head__cta">
          <a className="btn btn--ghost btn--sm" href={site.headerActions.login.href}>
            {site.headerActions.login.label}
          </a>
          <a className="btn btn--primary btn--sm" href={site.headerActions.signup.href}>
            {site.headerActions.signup.label}
          </a>
        </div>
      </div>
    </header>
  );
}
