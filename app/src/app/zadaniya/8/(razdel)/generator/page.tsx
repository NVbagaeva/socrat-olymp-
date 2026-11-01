import type { Metadata } from 'next';
import { Generator8 } from '@/components/tasks/vychisleniya/Generator8';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(8, 'generator');

/** Вкладка «Генератор» задания №8: общий генератор листов. */
export default function Generator8Page() {
  return (
    <>
      <VariantFromSection />
      <Generator8 base={`${ZADANIYA}/8`} />
      <BlokRazdela no={8} vid="generator" />
    </>
  );
}
