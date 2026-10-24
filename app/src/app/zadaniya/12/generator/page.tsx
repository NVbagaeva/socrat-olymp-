import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { GeneratorAll } from '@/components/tasks/ves12/GeneratorAll';
import { generatorAllText } from '@/content/ves12';
import { tasksPage } from '@/content/tasks';
import { ves12Catalog } from '@/lib/ves12/catalog';
import { href, ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../../[task]/[type]/configurator.css';
import '../../komplekt.css';
import '@/components/tasks/ves12/ves12.css';
import '@/components/tasks/ves12/zachyot-setup.css';

import { VariantFromSection } from '@/components/variant/VariantEntry';
export const metadata: Metadata = {
  title: `${generatorAllText.pageTitle} — Будет на ЕГЭ`,
  description: generatorAllText.lead,
};

/** Генератор по всем типам №12: экран учителя. */
export default function GeneratorAllPage() {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: '№12', href: href(ZADANIYA, 12) },
            { label: 'Генератор по всем типам' },
          ]}
          title={generatorAllText.pageTitle}
          lead={generatorAllText.lead}
        />
        <VariantFromSection />
        <GeneratorAll catalog={ves12Catalog()} />
      </main>
    </AppShell>
  );
}
