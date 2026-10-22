import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('repetitory');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/** Листы по урокам №3 — этап 5 плана; пока честная заглушка. */
export default function Page() {
  return <ZaglushkaStereo no="3" vkladka={VKLADKA} />;
}
