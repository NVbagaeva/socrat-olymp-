import type { Metadata } from 'next';
import { Teoriya21 } from '@/components/tasks/zadanie21/Teoriya21';
import { ZADANIE21, zadanie21Title } from '@/content/zadanie21';

const VKLADKA = ZADANIE21.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie21Title(VKLADKA),
};

/** Вкладка «Теория»: шесть разделов подряд, содержание рядом. Формулы набираются на сборке. */
export default function Teoriya21Tab() {
  return <Teoriya21 vkladka={VKLADKA} />;
}
