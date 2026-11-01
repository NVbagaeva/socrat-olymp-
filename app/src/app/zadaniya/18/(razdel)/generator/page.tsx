import type { Metadata } from 'next';
import { Zaglushka18 } from '@/components/zadanie18/Zaglushka18';
import { vkladka18 } from '@/content/zadanie18';
import { metaZaglushkiVkladki } from '@/content/seo';

const VKLADKA = vkladka18('generator');

export const metadata: Metadata = metaZaglushkiVkladki(18, 'Генератор');

/** Вкладка задания №18 ещё не собрана: заглушка со ссылкой на ключевые схемы. */
export default function Zadanie18Tab() {
  return (
    <>
      <Zaglushka18 vkladka={VKLADKA} />
    </>
  );
}
