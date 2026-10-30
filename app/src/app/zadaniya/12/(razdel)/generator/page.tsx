import type { Metadata } from 'next';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { Generator12 } from '@/components/tasks/generator/Generator12';
import { razdelyZadaniya } from '@/components/tasks/razdely/razdely12';
import { findSection } from '@/content/sections';
import { generatorAllText } from '@/content/ves12';
import { config12 } from '@/lib/ves12/generator12';
import { ZADANIYA } from '@/lib/paths';
import '../../../[task]/[type]/configurator.css';
import '../../../komplekt.css';
import '@/components/tasks/ves12/ves12.css';
import '@/components/tasks/ves12/zachyot-setup.css';

export const metadata: Metadata = {
  title: `${generatorAllText.pageTitle} — Будет на ЕГЭ`,
  description: generatorAllText.lead,
};

const BASE = `${ZADANIYA}/12/generator`;

/**
 * Вкладка «Генератор» №12 — по всем типам функций: общий генератор
 * со всеми типами. Шапка и лента — в layout раздела.
 */
export default function GeneratorAllPage() {
  const section = findSection('12');
  const ikonki = Object.fromEntries(
    (section === undefined ? [] : razdelyZadaniya(section, '').razdely).map((r) => [r.id, r.icon]),
  );
  return (
    <>
      <VariantFromSection />
      <Generator12 config={config12(BASE)} base={BASE} ekran={`${BASE}/?`} ikonki={ikonki} />
    </>
  );
}
