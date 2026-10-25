import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ReshatPage } from '@/components/variant/online/ReshatPage';
import { ShapkaReshat, ShapkaReshatObshchaya } from '@/components/variant/online/ShapkaReshat';
import '@/components/variant/sectionStyles';
import '@/components/tasks/card/problem-card.css';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';

export const metadata: Metadata = {
  title: `${T.panel.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Решение варианта онлайн по ссылке учителя. Параметры — в адресе, страница одна на все варианты. */
export default function Page() {
  return (
    <AppShell active="variant">
      <main className="app-main">
        <Suspense fallback={<ShapkaReshatObshchaya />}>
          <ShapkaReshat />
        </Suspense>
        {/* useSearchParams требует границы ожидания: без неё статический
            экспорт страницу не собирает. */}
        <Suspense fallback={null}>
          <ReshatPage />
        </Suspense>
      </main>
    </AppShell>
  );
}
