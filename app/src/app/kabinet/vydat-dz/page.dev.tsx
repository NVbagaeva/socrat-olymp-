import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { IssueHomeworkScreen } from '@/components/kabinet/KabinetScreens';

export const metadata: Metadata = {
  title: 'Выдать домашнее задание — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Репетитор выдаёт ДЗ: кому, срок, задачи из банка (номер и прототип).
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
            { label: 'Выдать домашнее задание' },
          ]}
        />
        <IssueHomeworkScreen />
      </main>
    </AppShell>
  );
}
