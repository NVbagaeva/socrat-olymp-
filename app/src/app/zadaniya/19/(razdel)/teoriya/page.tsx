import type { Metadata } from 'next';
import { Teoriya19 } from '@/components/zadanie19/Teoriya19';
import { ZADANIE19, zadanie19Title } from '@/content/zadanie19';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie19Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №19: главы подряд, содержание рядом.
 * Страница серверная: формулы и рисунки набираются на сборке.
 */
export default function Teoriya19Tab() {
  return <Teoriya19 vkladka={VKLADKA} />;
}
