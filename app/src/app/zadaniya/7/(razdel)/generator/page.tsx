import type { Metadata } from 'next';
import { Generator7 } from '@/components/tasks/zadanie7/Generator7';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { ZADANIE7 } from '@/content/zadanie7';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config7 } from '@/lib/zadanie7/generator7';
import { gruppy7, protoInfo7 } from '@/lib/zadanie7/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

const BASE = `${ZADANIYA}/${ZADANIE7.slug}`;

export const metadata: Metadata = metaVkladki(7, 'generator');

/** Вкладка «Генератор» №7: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator7Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator7
        config={config7(BASE, protoInfo7(), gruppy7(), indeksBanka('data/zadanie7'))}
        base={BASE}
      />
      <BlokRazdela no={7} vid="generator" />
    </>
  );
}
