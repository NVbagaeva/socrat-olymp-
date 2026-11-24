import type { Metadata } from 'next';
import { SkhemyVkladka18 } from '@/components/zadanie18/SkhemyVkladka18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

export const metadata: Metadata = {
  title: zadanie18Title(vkladka18('skhemy')),
};

/** Вкладка «Ключевые схемы»: вводная плашка и список схем. Страницы схем — skhemy/[skhema]/. */
export default function Skhemy18Tab() {
  return <SkhemyVkladka18 />;
}
