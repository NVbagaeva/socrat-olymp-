import type { Metadata } from 'next';
import { OZadanii2 } from '@/components/tasks/vektory/OZadanii2';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(2, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №4, №8 и №12. */
export default function OZadanii2Tab() {
  return <OZadanii2 />;
}
