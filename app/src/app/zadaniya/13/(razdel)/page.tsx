import type { Metadata } from 'next';
import { OZadanii13 } from '@/components/tasks/zadanie13/OZadanii13';
import { ZADANIE13 } from '@/content/zadanie13';
import { ZADANIYA } from '@/lib/paths';
import '../../11/zadanie11.css';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(13, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №11. Вёрстка — общие слои №11. */
export default function OZadanii13Tab() {
  return <OZadanii13 base={`${ZADANIYA}/${ZADANIE13.slug}`} />;
}
