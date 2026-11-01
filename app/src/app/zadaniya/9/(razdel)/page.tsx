import type { Metadata } from 'next';
import { OZadanii9 } from '@/components/tasks/proizvodnaya/OZadanii9';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(9, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2, №8 и №12. */
export default function OZadanii9Tab() {
  return <OZadanii9 />;
}
