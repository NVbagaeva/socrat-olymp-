import type { Metadata } from 'next';
import { OZadanii21 } from '@/components/tasks/zadanie21/OZadanii21';
import { zadanie21Title } from '@/content/zadanie21';

export const metadata: Metadata = {
  title: zadanie21Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела. */
export default function OZadanii21Tab() {
  return <OZadanii21 />;
}
