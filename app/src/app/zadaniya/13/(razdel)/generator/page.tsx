import type { Metadata } from 'next';
import { Zaglushka13 } from '@/components/tasks/zadanie13/Zaglushka13';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'generator')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Title(VKLADKA),
  robots: { index: false },
};

/** Вкладка задания №13, которая ещё готовится: что в ней будет. */
export default function Generator13Tab() {
  return <Zaglushka13 vkladka="generator" />;
}
