import type { Metadata } from 'next';
import { Generator9 } from '@/components/tasks/proizvodnaya/Generator9';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(9, 'generator');

/** Вкладка «Генератор» задания №9: общий генератор листов. */
export default function Generator9Page() {
  return (
    <>
      <VariantFromSection />
      <Generator9 base={`${ZADANIYA}/9`} />
      <BlokRazdela no={9} vid="generator" />
    </>
  );
}
