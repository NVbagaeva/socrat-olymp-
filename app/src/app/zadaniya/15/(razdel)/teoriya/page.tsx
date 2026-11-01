import type { Metadata } from 'next';
import { TeoriyaStereo } from '@/components/stereo/TeoriyaStereo';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('teoriya');

export const metadata: Metadata = metaVkladki(15, 'teoriya');

/** Вкладка «Теория» №15: главы подряд, «Содержание» рядом. Формулы набираются KaTeX на сборке. */
export default function Page() {
  return <TeoriyaStereo no="15" vkladka={VKLADKA} />;
}
