import { clsx } from 'clsx';
import { site } from '@/content/site';
import { operator } from '@/lib/legal/operator';
import { rekvizityVidny, strokaRekvizitov } from '@/lib/legal/prodavets';

export interface SiteFooterProps {
  className?: string;
}

const PRAVOVYE = new Set<string>(site.footer.pravovye.map((link) => link.href));

/**
 * Подвал публичных страниц: копирайт, оператор персональных данных,
 * правовые ссылки и связь. С флагом NEXT_PUBLIC_LEGAL_READY вместо
 * строки оператора — реквизиты продавца и четыре документа под ними.
 */
export function SiteFooter({ className }: SiteFooterProps) {
  const links = rekvizityVidny
    ? site.footer.links.filter((link) => !PRAVOVYE.has(link.href))
    : site.footer.links;
  return (
    <footer className={clsx('site-foot', className)}>
      <div className="wrap site-foot__in">
        <div className="site-foot__about">
          <span>{site.footer.copyright}</span>
          {rekvizityVidny ? (
            <>
              <p className="site-foot__rekvizity">
                {strokaRekvizitov.map((chast) => (
                  <span key={chast}>{chast}</span>
                ))}
              </p>
              <nav className="site-foot__pravo" aria-label={site.footer.pravovyeLabel}>
                {site.footer.pravovye.map((link) => (
                  <a key={link.href} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </>
          ) : (
            <span>
              {site.footer.operatorLabel} {operator.fio}
            </span>
          )}
        </div>
        <nav className="site-foot__links" aria-label="Правовая информация и связь">
          {links.map((link) =>
            'external' in link ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ) : (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
