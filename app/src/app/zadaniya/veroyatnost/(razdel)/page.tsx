import type { Metadata } from 'next';
import { OZadanii4Karta } from '@/components/tasks/veroyatnost/karta/OZadanii4Karta';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'o-zadanii')),
};

/**
 * Вкладка «О задании» задания №4 — живёт на адресе самого раздела:
 * карта задания по методам («Стеклянная сцена»).
 */
export default function OZadanii4Tab() {
  return <OZadanii4Karta />;
}
