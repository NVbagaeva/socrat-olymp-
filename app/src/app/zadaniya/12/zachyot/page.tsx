import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { ZachyotSetup } from '@/components/tasks/ves12/ZachyotSetup';
import { zachyotText } from '@/content/ves12';
import { tasksPage } from '@/content/tasks';
import { ves12Catalog } from '@/lib/ves12/catalog';
import { href, ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../../[task]/[type]/configurator.css';
import '@/components/tasks/ves12/ves12.css';
import '@/components/tasks/ves12/zachyot-setup.css';

export const metadata: Metadata = {
  title: `${zachyotText.pageTitle} — Будет на ЕГЭ`,
  description: zachyotText.lead,
};

/**
 * Зачётная работа по всем типам №12: экран учителя. Каталог типов и
 * прототипов собирается на сборке; задачи — в браузере, по коду работы.
 */
export default function ZachyotPage() {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: '№12', href: href(ZADANIYA, 12) },
            { label: 'Зачётная работа' },
          ]}
          title={zachyotText.pageTitle}
          lead={zachyotText.lead}
        />
        {/* Настройки — в адресе страницы (useSearchParams): без границы
            ожидания статический экспорт страницу не собирает. */}
        <Suspense fallback={null}>
          <ZachyotSetup catalog={ves12Catalog()} />
        </Suspense>
      </main>
    </AppShell>
  );
}
