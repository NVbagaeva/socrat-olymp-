import type { Metadata } from 'next';
import { OZadanii11 } from '@/components/tasks/zadanie11/OZadanii11';
import { zadanie11Title } from '@/content/zadanie11';

export const metadata: Metadata = {
  title: zadanie11Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №6 и №7. */
export default function OZadanii11Tab() {
  return <OZadanii11 />;
}
