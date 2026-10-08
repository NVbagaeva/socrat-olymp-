import { clsx } from 'clsx';
import { site } from '@/content/site';

export interface SiteFooterProps {
  className?: string;
}

/** Подвал публичных страниц: копирайт и правовые ссылки. */
export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={clsx('site-foot', className)}>
      <div className="wrap site-foot__in">
        <span>{site.footer.copyright}</span>
        {/* Правовых страниц пока нет: пустой список ссылок не рисуется. */}
        {site.footer.links.length > 0 ? (
          <nav className="site-foot__links" aria-label="Правовая информация">
            {site.footer.links.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
