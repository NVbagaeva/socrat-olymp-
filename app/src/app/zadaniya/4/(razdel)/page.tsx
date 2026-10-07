import type { Metadata } from 'next';
import { OZadanii4 } from '@/components/tasks/veroyatnost/OZadanii4';
import { veroyatnostMeta, vkladka } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  ...veroyatnostMeta('4', vkladka('4', 'o-zadanii'), true),
};

/**
 * Вкладка «О задании» задания №4 — живёт на адресе самого раздела,
 * как первая вкладка у задания №12. Содержимое — раздел 01 референса.
 */
export default function OZadanii4Tab() {
  return <OZadanii4 base={`${ZADANIYA}/4`} />;
}
