import type { Metadata } from 'next';
import { OZadanii6 } from '@/components/tasks/zadanie6/OZadanii6';
import { zadanie6Title } from '@/content/zadanie6';

export const metadata: Metadata = {
  title: zadanie6Title('О задании'),
};

/** Вкладка «О задании» задания №6. */
export default function OZadanii6Tab() {
  return <OZadanii6 />;
}
