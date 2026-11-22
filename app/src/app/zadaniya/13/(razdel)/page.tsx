import type { Metadata } from 'next';
import { OZadanii13 } from '@/components/tasks/zadanie13/OZadanii13';
import { ZADANIE13 } from '@/content/zadanie13';
import { zadanie13Zagolovok } from '@/lib/seo-razdely';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'o-zadanii')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Zagolovok(VKLADKA),
};

/** Вкладка «О задании» живёт на адресе самого раздела. */
export default function OZadanii13Tab() {
  return <OZadanii13 />;
}
