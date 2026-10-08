import type { Metadata } from 'next';
import { OZadanii5 } from '@/components/tasks/veroyatnost/OZadanii5';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'o-zadanii')),
};

/**
 * Вкладка «О задании» задания №5 — живёт на адресе самого раздела,
 * как у задания №4. Теория — на /teoriya/.
 */
export default function OZadanii5Tab() {
  return <OZadanii5 base={`${ZADANIYA}/5`} />;
}
