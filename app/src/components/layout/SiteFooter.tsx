import { clsx } from 'clsx';
import { site } from '@/content/site';
import { operator } from '@/lib/legal/operator';

export interface SiteFooterProps {
  className?: string;
}

/** Подвал публичных страниц: копирайт, оператор персональных данных и правовые ссылки. */
export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={clsx('site-foot', className)}>
      <div className="wrap site-foot__in">
        <div className="site-foot__about">
          <span>{site.footer.copyright}</span>
          <span>
            {site.footer.operatorLabel} {operator.fio}
          </span>
        </div>
        <nav className="site-foot__links" aria-label="Правовая информация">
          {site.footer.links.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
