import type { Metadata } from 'next';
import { SkhemyVkladka18 } from '@/components/zadanie18/SkhemyVkladka18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

export const metadata: Metadata = {
  title: zadanie18Title(vkladka18('skhemy')),
};

/** «Ключевые схемы» живут на адресе раздела: сейчас раздел открывается ими. */
export default function Skhemy18Tab() {
  return <SkhemyVkladka18 />;
}
