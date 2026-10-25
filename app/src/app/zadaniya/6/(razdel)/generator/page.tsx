import type { Metadata } from 'next';
import { Generator6 } from '@/components/tasks/zadanie6/Generator6';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config6 } from '@/lib/zadanie6/generator6';
import { gruppy6, protoInfo6 } from '@/lib/zadanie6/protoInfo';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/${ZADANIE6.slug}`;

export const metadata: Metadata = {
  title: zadanie6Title('Генератор'),
};

/** Вкладка «Генератор» №6: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator6Tab() {
  return (
    <Generator6
      config={config6(BASE, protoInfo6(), gruppy6(), indeksBanka('data/zadanie6'))}
      base={BASE}
    />
  );
}
