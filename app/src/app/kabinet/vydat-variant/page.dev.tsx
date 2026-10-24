import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { VydatVariantScreen } from '@/components/kabinet/KabinetScreens';

export const metadata: Metadata = {
  title: 'Выдать вариант — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Выдать вариант повышенной сложности ученикам или классу.
 * Служебная страница (page.dev.tsx): только next dev и сборка с KABINET=1,
 * пока у сайта нет сервера (docs/chast2-onlayn.md).
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Кабинет', href: '/kabinet/' },
            { label: 'Выдать вариант' },
          ]}
        />
        <VydatVariantScreen />
      </main>
    </AppShell>
  );
}
