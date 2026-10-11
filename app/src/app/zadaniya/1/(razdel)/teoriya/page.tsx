import type { Metadata } from 'next';
import { Teoriya1 } from '@/components/tasks/planimetriya/Teoriya1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';

const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №1: девять разделов подряд, содержание
 * рядом. Страница серверная: формулы набираются KaTeX, чертежи рисует
 * движок планиметрии на сборке.
 */
export default function Teoriya1Tab() {
  return <Teoriya1 vkladka={VKLADKA} />;
}
