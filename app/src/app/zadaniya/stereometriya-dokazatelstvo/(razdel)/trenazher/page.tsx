import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('trenazher');

export const metadata: Metadata = {
  title: stereoTitle('15', VKLADKA),
};

/** Тренажёр №15 — после банка №15 (этап 5б плана); пока честная заглушка. */
export default function Page() {
  return <ZaglushkaStereo no="15" vkladka={VKLADKA} />;
}
