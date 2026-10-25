import Link from 'next/link';
import { clsx } from 'clsx';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import './variant-entry.css';

/**
 * Плашка-вход «Собрать вариант» в стиле «голубое стекло»: первый экран
 * главной и над сеткой заданий банка.
 */
export function VariantEntry({ className }: { className?: string }) {
  const T = VARIANT_SCREEN.entry;
  return (
    <Link className={clsx('var-entry', className)} href={VARIANT_HREF}>
      <span className="var-entry__ico" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8.5 3.5h8.2l3.3 3.3v10.7a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M5.5 7v12.5a1 1 0 0 0 1 1h9" />
          <path d="M10.5 9.5h6M10.5 12.5h6M10.5 15.5h3.5" />
        </svg>
      </span>
      <span className="var-entry__text">
        <span className="var-entry__title">{T.title}</span>
        <span className="var-entry__note">{T.note}</span>
      </span>
      <span className="var-entry__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

/** Ссылка во вкладке «Генератор» раздела. */
export function VariantFromSection() {
  return (
    <p className="var-from-section">
      <Link href={VARIANT_HREF}>{VARIANT_SCREEN.entry.fromSection}</Link>
    </p>
  );
}
