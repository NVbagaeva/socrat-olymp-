import type { Metadata } from 'next';
import { OZadaniiStereo } from '@/components/stereo/OZadaniiStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('o-zadanii');

export const metadata: Metadata = {
  title: stereoTitle('15', VKLADKA),
};

/** Вкладка «О задании» №15: что проверяет задание и типы задач открытого банка. */
export default function Page() {
  return <OZadaniiStereo no="15" vkladka={VKLADKA} />;
}
