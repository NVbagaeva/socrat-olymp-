import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { parentConsentText } from '@/lib/legal/documents';
import { documentsVersion } from '@/lib/legal/operator';
import { Demo } from './Demo';
import './demo.css';

export const metadata: Metadata = {
  title: 'Согласия — витрина',
  robots: { index: false, follow: false },
};

/**
 * Витрина согласий: регистрация, плашка «Ждём подтверждения родителя»,
 * окно «Документы обновлены», выгрузка и удаление — на демо-сервере в
 * памяти. Только next dev (или SOGLASIYA=1): сервера с аккаунтами пока
 * нет, на сайте этих экранов быть не должно.
 */
export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="wrap sgl">
        <Demo consentText={parentConsentText()} version={documentsVersion} />
      </main>
      <SiteFooter />
    </>
  );
}
