import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { VariantScreen } from '@/components/variant/VariantScreen';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { VARIANT_SCREEN as T } from '@/content/variant';
import { tasksPage } from '@/content/tasks';
import { SEO_STRANITSY } from '@/content/seo';
import { BlokVarianta } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = SEO_STRANITSY.variant;

/**
 * «Собрать вариант»: генератор вариантов первой части (задания 1–13).
 * Всё считается в браузере — страница статическая.
 */
export default function VariantPage() {
  return (
    <AppShell active="variant">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: T.crumbs.home, href: '/' },
            { label: T.crumbs.bank, href: tasksPage.href },
            { label: T.title },
          ]}
          title={T.title}
          lead={T.lead}
        />
        <VariantScreen />
        <BlokVarianta />
      </main>
    </AppShell>
  );
}
