import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { RezultatUchitelya } from '@/components/otchet/RezultatUchitelya';
import { Breadcrumbs } from '@/components/ui';
import { OTCHET_STRANICA } from '@/content/otchet';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: OTCHET_STRANICA.metaTitle,
  /* Личная страница по ссылке ученика: в поиск ей незачем. */
  robots: { index: false, follow: false },
};

/**
 * Результат тренировки, присланный учеником (временная замена
 * кабинета, lib/otchet/). Данные — в части адреса после «#»: на
 * хостинг они не уходят, страница собирается статически и читает их в
 * браузере.
 */
export default function Page() {
  return (
    <AppShell>
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: OTCHET_STRANICA.crumbs }]} />
        <RezultatUchitelya />
      </main>
    </AppShell>
  );
}
