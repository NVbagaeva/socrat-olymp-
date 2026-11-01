import type { Metadata } from 'next';
import { OZadaniiStereo } from '@/components/stereo/OZadaniiStereo';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('o-zadanii');

export const metadata: Metadata = metaVkladki(15, 'o-zadanii');

/** Вкладка «О задании» №15: что проверяет задание и типы задач открытого банка. */
export default function Page() {
  return <OZadaniiStereo no="15" vkladka={VKLADKA} />;
}
