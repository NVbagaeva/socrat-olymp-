import type { Metadata } from 'next';
import { OZadanii18 } from '@/components/zadanie18/OZadanii18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

export const metadata: Metadata = {
  title: zadanie18Title(vkladka18('o-zadanii')),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №16 и №19. */
export default function OZadanii18Tab() {
  return <OZadanii18 />;
}
