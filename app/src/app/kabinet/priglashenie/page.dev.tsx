import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { InvitePage } from '@/components/kabinet/InvitePage';

export const metadata: Metadata = {
  title: 'Регистрация по приглашению — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Регистрация по приглашению (?kod=…). Гость ещё не в кабинете — оболочка
 * публичных страниц. Служебная страница: только next dev и KABINET=1.
 */
export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="wrap kab-public">
        <InvitePage />
      </main>
      <SiteFooter />
    </>
  );
}
