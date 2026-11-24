import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { HowtoFromUrl, HowtoView } from '@/components/onboarding/HowtoPage';
import { Breadcrumbs } from '@/components/ui';
import { HOWTO } from '@/content/kakPolzovatsya';
import { withVersion } from '@/lib/assetUrl';

export const metadata: Metadata = {
  title: HOWTO.meta.title,
  description: HOWTO.meta.description,
};

/**
 * Картинки и снимки страницы, которые есть в сборке: путь → адрес с
 * версией. Таблица (HOWTO_ASSET_VERSIONS, next.config.ts) читается
 * только здесь, на сервере: в общую таблицу первой загрузки эти файлы
 * не входят.
 */
function failyStranicy(): Record<string, string> {
  const versii = JSON.parse(process.env.HOWTO_ASSET_VERSIONS ?? '{}') as Record<string, string>;
  return Object.fromEntries(Object.keys(versii).map((p) => [p, withVersion(p, versii)]));
}

/**
 * «Как пользоваться сайтом». Вкладка берётся из адреса (?dlya=…);
 * при статической сборке страница собирается с вкладкой по умолчанию,
 * а в браузере сразу переключается на ту, что в ссылке.
 */
export default function Page() {
  const faily = failyStranicy();
  return (
    <AppShell active="help">
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: HOWTO.crumbs }]} />
        <Suspense fallback={<HowtoView tab="repetitor" faily={faily} />}>
          <HowtoFromUrl faily={faily} />
        </Suspense>
      </main>
    </AppShell>
  );
}
