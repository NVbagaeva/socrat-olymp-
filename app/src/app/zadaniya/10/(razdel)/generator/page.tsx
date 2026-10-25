import type { Metadata } from 'next';
import { Generator10 } from '@/components/tasks/zadanie10/Generator10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config10 } from '@/lib/zadanie10/generator10';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { gruppy10, protoInfo10 } from '@/lib/zadanie10/protoInfo';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/${ZADANIE10.slug}`;

export const metadata: Metadata = {
  title: zadanie10Title('Генератор'),
};

/** Вкладка «Генератор» №10: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator10Tab() {
  return (
    <Generator10
      config={config10(BASE, protoInfo10(), gruppy10(), indeksBanka('data/zadanie10'))}
      base={BASE}
      ill={kartinkiPrototipov()}
    />
  );
}
