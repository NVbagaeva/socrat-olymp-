import type { Metadata } from 'next';
import { Teoriya16 } from '@/components/zadanie16/Teoriya16';
import { ZADANIE16, zadanie16Title } from '@/content/zadanie16';

const VKLADKA = ZADANIE16.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie16Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №16: главы подряд, содержание рядом.
 * Страница серверная: формулы и чертежи набираются на сборке.
 */
export default function Teoriya16Tab() {
  return <Teoriya16 vkladka={VKLADKA} />;
}
