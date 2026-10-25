import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { IssueVariantScreen } from '@/components/variant/online/kabinet/screens';
import '@/components/variant/online/online.css';

export const metadata: Metadata = {
  title: 'Выдать вариант — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Репетитор выдаёт вариант или серию «Собрать вариант» классу или ученикам.
 * Служебная страница (page.dev.tsx): только next dev и сборка с KABINET=1,
 * пока у сайта нет сервера (docs/variant-onlayn.md, этап 2).
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Кабинет', href: '/kabinet/proba/' },
            { label: 'Выдать вариант' },
          ]}
        />
        <IssueVariantScreen />
      </main>
    </AppShell>
  );
}
