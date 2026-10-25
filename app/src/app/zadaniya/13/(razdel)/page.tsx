import type { Metadata } from 'next';
import { OZadanii13 } from '@/components/tasks/zadanie13/OZadanii13';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { ZADANIYA } from '@/lib/paths';
import '../../11/zadanie11.css';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'o-zadanii')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Title(VKLADKA),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №11. Вёрстка — общие слои №11. */
export default function OZadanii13Tab() {
  return <OZadanii13 base={`${ZADANIYA}/${ZADANIE13.slug}`} />;
}
