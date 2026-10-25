import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/layout';
import './auth.css';

/**
 * Оболочка страниц входа и кабинета: та же шапка и подвал, что у
 * публичных страниц, посередине — одна узкая колонка.
 */
export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main className={wide ? 'auth-page auth-page--wide' : 'auth-page'}>
        <div className="wrap auth-page__in">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
