import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { ProverkaRabotyScreen } from '@/components/kabinet/KabinetScreens';

export const metadata: Metadata = {
  title: 'Проверка работы — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Проверка работы (?id=…): фото, критерии, баллы, пометки.
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
            { label: 'Проверка работы' },
          ]}
        />
        <ProverkaRabotyScreen />
      </main>
    </AppShell>
  );
}
