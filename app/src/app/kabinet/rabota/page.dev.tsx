import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { VariantWorkScreen } from '@/components/variant/online/kabinet/screens';
import '@/components/variant/sectionStyles';
import '@/components/tasks/card/problem-card.css';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';

export const metadata: Metadata = {
  title: 'Работа — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Работа-вариант из кабинета: ученику — варианты и решение (проверка на
 * сервере), репетитору — результаты класса и выгрузка в Excel.
 * Служебная страница (page.dev.tsx): только next dev и сборка с KABINET=1.
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Кабинет', href: '/kabinet/proba/' },
            { label: 'Работа' },
          ]}
        />
        <VariantWorkScreen />
      </main>
    </AppShell>
  );
}
