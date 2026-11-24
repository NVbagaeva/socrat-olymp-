import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('opornye');

export const metadata: Metadata = {
  title: stereoTitle('15', VKLADKA),
};

/** Опорные задачи №15 — этап 4 плана; пока честная заглушка. */
export default function Page() {
  return <ZaglushkaStereo no="15" vkladka={VKLADKA} />;
}
