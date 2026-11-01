import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { HowtoFromUrl, HowtoView } from '@/components/onboarding/HowtoPage';
import { Breadcrumbs } from '@/components/ui';
import { HOWTO } from '@/content/kakPolzovatsya';
import { SEO_STRANITSY } from '@/content/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqLd } from '@/lib/schema';

export const metadata: Metadata = SEO_STRANITSY.kakPolzovatsya;

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
        {/* Частые вопросы вкладки по умолчанию — те, что видны в HTML страницы. */}
        <JsonLd data={faqLd(HOWTO.repetitor.faq)} />
        <Suspense fallback={<HowtoView tab="repetitor" />}>
          <HowtoFromUrl />
        </Suspense>
      </main>
    </AppShell>
  );
}
