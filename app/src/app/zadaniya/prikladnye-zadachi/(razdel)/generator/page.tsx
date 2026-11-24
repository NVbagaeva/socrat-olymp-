import type { Metadata } from 'next';
import { Generator10 } from '@/components/tasks/zadanie10/Generator10';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config10 } from '@/lib/zadanie10/generator10';
import { kartinkiZadach10 } from '@/lib/zadanie10/kartinkiZadach10';
import { gruppy10, protoInfo10 } from '@/lib/zadanie10/protoInfo';
import { razdelBase } from '@/lib/paths';

const BASE = `${razdelBase(ZADANIE10.slug)}`;

export const metadata: Metadata = {
  title: zadanie10Title('Генератор'),
};

/** Вкладка «Генератор» №10: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator10Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator10
        config={config10(BASE, protoInfo10(), gruppy10(), indeksBanka('data/zadanie10'))}
        base={BASE}
        ill={kartinkiZadach10()}
      />
    </>
  );
}
