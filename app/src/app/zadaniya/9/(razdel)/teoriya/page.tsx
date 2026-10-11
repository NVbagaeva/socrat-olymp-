import type { Metadata } from 'next';
import { Teoriya9 } from '@/components/tasks/proizvodnaya/Teoriya9';
import { PROIZVODNAYA, proizvodnayaTitle } from '@/content/proizvodnaya';

const VKLADKA = PROIZVODNAYA.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: proizvodnayaTitle(VKLADKA),
};

/**
 * Вкладка «Теория» задания №9: шесть разделов подряд, содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке,
 * рисунки рисует движок графиков из сцен.
 */
export default function Teoriya9Tab() {
  return <Teoriya9 vkladka={VKLADKA} />;
}
