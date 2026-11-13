import type { Metadata } from 'next';
import { OZadanii1 } from '@/components/tasks/planimetriya/OZadanii1';
import { zadanie1Title } from '@/content/zadanie1';

export const metadata: Metadata = {
  title: zadanie1Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела. */
export default function OZadanii1Tab() {
  return <OZadanii1 />;
}
