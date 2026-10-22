import type { Metadata } from 'next';
import { TeoriyaStereo } from '@/components/stereo/TeoriyaStereo';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('teoriya');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/** Вкладка «Теория» №3: главы подряд, «Содержание» рядом. Формулы набираются KaTeX на сборке. */
export default function Page() {
  return <TeoriyaStereo no="3" vkladka={VKLADKA} />;
}
