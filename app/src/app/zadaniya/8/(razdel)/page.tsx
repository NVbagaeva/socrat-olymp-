import type { Metadata } from 'next';
import { VychisleniyaAbout } from '@/components/tasks/vychisleniya/VychisleniyaAbout';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(8, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №4 и №12. */
export default function OZadanii8Tab() {
  return <VychisleniyaAbout />;
}
