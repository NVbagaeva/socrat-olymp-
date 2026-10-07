import type { Metadata } from 'next';
import { OZadanii14 } from '@/components/tasks/zadanie14/OZadanii14';
import { zadanie14Title } from '@/content/zadanie14';

export const metadata: Metadata = {
  title: zadanie14Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2, №8 и №11. */
export default function OZadanii14Tab() {
  return <OZadanii14 />;
}
