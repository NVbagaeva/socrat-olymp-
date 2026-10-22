import type { Metadata } from 'next';
import { OZadaniiStereo } from '@/components/stereo/OZadaniiStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('o-zadanii');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/** Вкладка «О задании» №3: что проверяет задание и типы задач открытого банка. */
export default function Page() {
  return <OZadaniiStereo no="3" vkladka={VKLADKA} />;
}
