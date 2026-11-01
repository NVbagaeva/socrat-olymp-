import type { Metadata } from 'next';
import { OZadanii5 } from '@/components/tasks/veroyatnost/OZadanii5';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(5, 'o-zadanii');

/**
 * Вкладка «О задании» задания №5 — живёт на адресе самого раздела,
 * как у задания №4. Теория — на /teoriya/.
 */
export default function OZadanii5Tab() {
  return <OZadanii5 base={`${ZADANIYA}/5`} />;
}
