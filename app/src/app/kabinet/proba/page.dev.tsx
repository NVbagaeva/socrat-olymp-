import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { KabinetHomeScreen } from '@/components/kabinet/KabinetScreens';

export const metadata: Metadata = {
  title: 'Кабинет — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Главная пробного кабинета: ученик, репетитор или администратор — по роли.
 * Адрес /kabinet/proba/: сам /kabinet/ — настоящий кабинет со входом
 * по почте (page.tsx).
 * Служебная страница (page.dev.tsx): только next dev и сборка с KABINET=1,
 * пока у сайта нет сервера (docs/kabinet-roli-dz.md).
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Кабинет' }]} />
        <KabinetHomeScreen />
      </main>
    </AppShell>
  );
}
