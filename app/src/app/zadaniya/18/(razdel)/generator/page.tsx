import type { Metadata } from 'next';
import { Zaglushka18 } from '@/components/zadanie18/Zaglushka18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

const VKLADKA = vkladka18('generator');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/** Вкладка задания №18 ещё не собрана: заглушка со ссылкой на ключевые схемы. */
export default function Zadanie18Tab() {
  return <Zaglushka18 vkladka={VKLADKA} />;
}
