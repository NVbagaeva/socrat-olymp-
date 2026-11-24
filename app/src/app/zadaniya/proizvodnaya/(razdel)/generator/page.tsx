import type { Metadata } from 'next';
import { Generator9 } from '@/components/tasks/proizvodnaya/Generator9';
import { razdelBase } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { proizvodnayaZagolovok } from '@/lib/seo-razdely';

export const metadata: Metadata = {
  title: proizvodnayaZagolovok('Генератор'),
};

/** Вкладка «Генератор» задания №9: общий генератор листов. */
export default function Generator9Page() {
  return (
    <>
      <VariantFromSection />
      <Generator9 base={`${razdelBase(9)}`} />
    </>
  );
}
