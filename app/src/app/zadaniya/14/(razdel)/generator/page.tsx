import type { Metadata } from 'next';
import { Generator14 } from '@/components/zadanie14/Generator14';
import { zadanie14Title } from '@/content/zadanie14';
import { config14 } from '@/lib/zadanie14/generator14';

export const metadata: Metadata = {
  title: zadanie14Title('Генератор'),
};

/** Вкладка «Генератор» №14: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator14Tab() {
  return <Generator14 config={config14()} />;
}
