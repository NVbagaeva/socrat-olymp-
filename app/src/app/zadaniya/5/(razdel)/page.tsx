import type { Metadata } from 'next';
import { OZadanii5Karta } from '@/components/tasks/veroyatnost/karta/OZadanii5Karta';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'o-zadanii')),
};

/**
 * Вкладка «О задании» задания №5 — живёт на адресе самого раздела:
 * карта задания по методам («Стеклянная сцена»).
 */
export default function OZadanii5Tab() {
  return <OZadanii5Karta />;
}
