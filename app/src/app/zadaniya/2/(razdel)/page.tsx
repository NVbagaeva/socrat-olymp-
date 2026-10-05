import type { Metadata } from 'next';
import { OZadanii2 } from '@/components/tasks/vektory/OZadanii2';
import { O_ZADANII, vektoryTitle } from '@/content/vektory';

export const metadata: Metadata = {
  title: vektoryTitle(O_ZADANII.title),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №4, №8 и №12. */
export default function OZadanii2Tab() {
  return <OZadanii2 />;
}
