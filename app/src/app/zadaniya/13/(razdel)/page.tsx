import type { Metadata } from 'next';
import { OZadanii13 } from '@/components/tasks/zadanie13/OZadanii13';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'o-zadanii')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Title(VKLADKA),
};

/** Вкладка «О задании» живёт на адресе самого раздела. */
export default function OZadanii13Tab() {
  return <OZadanii13 />;
}
