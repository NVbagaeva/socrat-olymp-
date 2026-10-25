import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { Generator12 } from '@/components/tasks/generator/Generator12';
import { razdelyZadaniya } from '@/components/tasks/razdely/razdely12';
import { findSection } from '@/content/sections';
import { generatorAllText } from '@/content/ves12';
import { tasksPage } from '@/content/tasks';
import { config12 } from '@/lib/ves12/generator12';
import { href, ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../../[task]/[type]/configurator.css';
import '../../komplekt.css';
import '@/components/tasks/ves12/ves12.css';
import '@/components/tasks/ves12/zachyot-setup.css';

export const metadata: Metadata = {
  title: `${generatorAllText.pageTitle} — Будет на ЕГЭ`,
  description: generatorAllText.lead,
};

const BASE = `${ZADANIYA}/12/generator`;

/** Генератор по всем типам №12: общий генератор со всеми типами функций. */
export default function GeneratorAllPage() {
  const section = findSection('12');
  const ikonki = Object.fromEntries(
    (section === undefined ? [] : razdelyZadaniya(section, '').razdely).map((r) => [r.id, r.icon]),
  );
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
        <Generator12 config={config12(BASE)} base={BASE} ekran={`${BASE}/?`} ikonki={ikonki} />
      </main>
    </AppShell>
  );
}
