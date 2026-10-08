import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { HowtoFromUrl, HowtoView } from '@/components/onboarding/HowtoPage';
import { Breadcrumbs } from '@/components/ui';
import { HOWTO } from '@/content/kakPolzovatsya';

export const metadata: Metadata = {
  title: HOWTO.meta.title,
  description: HOWTO.meta.description,
};

/**
 * «Как пользоваться сайтом». Вкладка берётся из адреса (?dlya=…);
 * при статической сборке страница собирается с вкладкой по умолчанию,
 * а в браузере сразу переключается на ту, что в ссылке.
 */
export default function Page() {
  return (
    <AppShell active="help">
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: HOWTO.crumbs }]} />
        <Suspense fallback={<HowtoView tab="repetitor" />}>
          <HowtoFromUrl />
        </Suspense>
      </main>
    </AppShell>
  );
}
