import type { Metadata } from 'next';
import { TeoriyaStereo } from '@/components/stereo/TeoriyaStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('teoriya');

export const metadata: Metadata = {
  title: stereoTitle('15', VKLADKA),
};

/** Вкладка «Теория» №15: главы подряд, «Содержание» рядом. Формулы набираются KaTeX на сборке. */
export default function Page() {
  return <TeoriyaStereo no="15" vkladka={VKLADKA} />;
}
