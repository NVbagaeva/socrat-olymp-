import type { Metadata } from 'next';
import { Generator6 } from '@/components/tasks/zadanie6/Generator6';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { ZADANIE6 } from '@/content/zadanie6';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config6 } from '@/lib/zadanie6/generator6';
import { gruppy6, protoInfo6 } from '@/lib/zadanie6/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

const BASE = `${ZADANIYA}/${ZADANIE6.slug}`;

export const metadata: Metadata = metaVkladki(6, 'generator');

/** Вкладка «Генератор» №6: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator6Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator6
        config={config6(BASE, protoInfo6(), gruppy6(), indeksBanka('data/zadanie6'))}
        base={BASE}
      />
      <BlokRazdela no={6} vid="generator" />
    </>
  );
}
