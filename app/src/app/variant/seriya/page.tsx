import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { SeriyaPage } from '@/components/variant/online/SeriyaPage';
import '@/components/variant/sectionStyles';
import '@/components/tasks/card/problem-card.css';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';

export const metadata: Metadata = {
  title: `${T.seriya.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Серия вариантов для ученика: карточки и статистика серии. Параметры — в адресе, страница одна на все варианты. */
export default function Page() {
  return (
    <AppShell active="variant">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: VARIANT_SCREEN.crumbs.home, href: '/' },
            { label: VARIANT_SCREEN.title, href: VARIANT_HREF },
            { label: T.seriya.title },
          ]}
          title={T.seriya.title}
        />
        {/* useSearchParams требует границы ожидания: без неё статический
            экспорт страницу не собирает. */}
        <Suspense fallback={null}>
          <SeriyaPage />
        </Suspense>
      </main>
    </AppShell>
  );
}
