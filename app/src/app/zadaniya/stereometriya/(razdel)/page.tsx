import type { Metadata } from 'next';
import { OZadanii3 } from '@/components/tasks/zadanie3/OZadanii3';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('o-zadanii');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «О задании» №3: карта задания — что проверяет, чем опасно,
 * семь групп типов с разобранными примерами и блок «Что нужно знать».
 */
export default function Page() {
  return <OZadanii3 />;
}
