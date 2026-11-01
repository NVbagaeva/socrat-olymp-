import type { Metadata } from 'next';
import { Generator2 } from '@/components/tasks/vektory/Generator2';
import { VEKTORY } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(2, 'generator');

/** Вкладка «Генератор» задания №2: общий генератор листов. */
export default function Generator2Page() {
  return (
    <>
      <VariantFromSection />
      <Generator2 base={`${ZADANIYA}/${VEKTORY.slug}`} />
      <BlokRazdela no={2} vid="generator" />
    </>
  );
}
