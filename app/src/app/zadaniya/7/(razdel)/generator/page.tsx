import type { Metadata } from 'next';
import { Generator7 } from '@/components/tasks/zadanie7/Generator7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { indeksBanka } from '@/lib/generator/obshchiy/bankServer';
import { config7 } from '@/lib/zadanie7/generator7';
import { gruppy7, protoInfo7 } from '@/lib/zadanie7/protoInfo';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/${ZADANIE7.slug}`;

export const metadata: Metadata = {
  title: zadanie7Title('Генератор'),
};

export default function Generator7Tab() {
  return (
    <Generator7
      config={config7(BASE, protoInfo7(), gruppy7(), indeksBanka('data/zadanie7'))}
      base={BASE}
    />
  );
}
