import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { ClassScreen } from '@/components/kabinet/KabinetScreens';

export const metadata: Metadata = {
  title: 'Класс — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Класс репетитора: ученики, добавить, пригласить (?id=…).
 * Служебная страница (page.dev.tsx): только next dev и сборка с KABINET=1,
 * пока у сайта нет сервера (docs/kabinet-roli-dz.md).
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Кабинет', href: '/kabinet/proba/' },
            { label: 'Класс' },
          ]}
        />
        <ClassScreen />
      </main>
    </AppShell>
  );
}
