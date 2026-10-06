import type { Metadata } from 'next';
import { Teoriya2 } from '@/components/tasks/vektory/Teoriya2';
import { VEKTORY, vektoryTitle } from '@/content/vektory';

const VKLADKA = VEKTORY.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: vektoryTitle(VKLADKA),
};

/**
 * Вкладка «Теория» задания №2: восемь разделов подряд, содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке,
 * рисунки собирает движок векторов из сцен.
 */
export default function Teoriya2Tab() {
  return <Teoriya2 vkladka={VKLADKA} />;
}
