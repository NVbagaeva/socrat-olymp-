import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { StatistikaPage } from '@/components/variant/online/StatistikaPage';
import '@/components/variant/sectionStyles';
import '@/components/tasks/card/problem-card.css';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';

export const metadata: Metadata = {
  title: `${T.stats.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Статистика ученика по онлайн-вариантам. Параметры — в адресе, страница одна на все варианты. */
export default function Page() {
  return (
    <AppShell active="variant">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: VARIANT_SCREEN.crumbs.home, href: '/' },
            { label: VARIANT_SCREEN.title, href: VARIANT_HREF },
            { label: T.stats.title },
          ]}
          title={T.stats.title}
          lead={T.stats.lead}
        />
        {/* useSearchParams требует границы ожидания: без неё статический
            экспорт страницу не собирает. */}
        <Suspense fallback={null}>
          <StatistikaPage />
        </Suspense>
      </main>
    </AppShell>
  );
}
