import { clsx } from 'clsx';
import { site, type SiteLink } from '@/content/site';

export interface SiteFooterProps {
  /** Свои ссылки вместо общих: у страницы услуги — её оферта и почта. */
  links?: readonly SiteLink[];
  className?: string;
}

/** Подвал публичных страниц: копирайт и правовые ссылки. */
export function SiteFooter({ links = site.footer.links, className }: SiteFooterProps) {
  return (
    <footer className={clsx('site-foot', className)}>
      <div className="wrap site-foot__in">
        <span>{site.footer.copyright}</span>
        <nav className="site-foot__links" aria-label="Правовая информация">
          {links.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
