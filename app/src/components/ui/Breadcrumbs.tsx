import { clsx } from 'clsx';
import Link from 'next/link';

export interface Crumb {
  label: string;
  /** Без адреса пункт считается текущим: он последний и не ссылка. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** Название цепочки для скринридера. */
  label?: string;
  className?: string;
}

/**
 * Хлебные крошки. Последний пункт — текущая страница: не ссылка
 * и помечен aria-current, иначе скринридер объявит её как переход.
 *
 * Разделитель рисуется через ::before у пункта, а не текстом: символ
 * в разметке скринридер прочитал бы вслух.
 */
export function Breadcrumbs({ items, label = 'Вы здесь', className }: BreadcrumbsProps) {
  return (
    <nav className={clsx('crumbs', className)} aria-label={label}>
      <ol className="crumbs__list">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li className="crumbs__item" key={`${item.label}-${index}`}>
              {item.href !== undefined && !last ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
