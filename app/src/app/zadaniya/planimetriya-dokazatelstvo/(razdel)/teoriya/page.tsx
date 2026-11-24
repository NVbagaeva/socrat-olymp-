import type { Metadata } from 'next';
import { Teoriya18 } from '@/components/zadanie18/Teoriya18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

const VKLADKA = vkladka18('teoriya');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №18: факты для доказательств и вычислений
 * второй части. Страница серверная: формулы и чертежи — на сборке.
 */
export default function Teoriya18Tab() {
  return <Teoriya18 vkladka={VKLADKA} />;
}
