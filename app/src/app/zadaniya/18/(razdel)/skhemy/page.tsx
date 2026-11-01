import type { Metadata } from 'next';
import { SkhemyVkladka18 } from '@/components/zadanie18/SkhemyVkladka18';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(18, 'skhemy');

/** Вкладка «Ключевые схемы»: вводная плашка и список схем. Страницы схем — skhemy/[skhema]/. */
export default function Skhemy18Tab() {
  return <SkhemyVkladka18 />;
}
