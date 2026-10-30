import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ZachyotSetup } from '@/components/tasks/ves12/ZachyotSetup';
import { vesRazdel, zachyotText } from '@/content/ves12';
import { ves12Catalog } from '@/lib/ves12/catalog';
import '@/lib/graph/graph.css';
import '../../../[task]/[type]/configurator.css';
import '@/components/tasks/ves12/ves12.css';
import '@/components/tasks/ves12/zachyot-setup.css';

export const metadata: Metadata = {
  title: `${zachyotText.pageTitle} — Будет на ЕГЭ`,
  description: zachyotText.lead,
};

/**
 * Вкладка «Зачётная работа» №12 — контроль по всем типам функций:
 * экран учителя. Шапка и лента — в layout раздела. Каталог типов и
 * прототипов собирается на сборке; задачи — в браузере, по коду работы.
 */
export default function ZachyotPage() {
  return (
    <>
      <p className="zachyot-lead">{vesRazdel.zachyot.lead}</p>
      {/* Настройки — в адресе страницы (useSearchParams): без границы
          ожидания статический экспорт страницу не собирает. */}
      <Suspense fallback={null}>
        <ZachyotSetup catalog={ves12Catalog()} />
      </Suspense>
    </>
  );
}
