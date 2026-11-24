import type { Metadata } from 'next';
import { VychisleniyaAbout } from '@/components/tasks/vychisleniya/VychisleniyaAbout';
import { vychisleniyaTitle } from '@/content/vychisleniya';

export const metadata: Metadata = {
  title: vychisleniyaTitle('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №4 и №12. */
export default function OZadanii8Tab() {
  return <VychisleniyaAbout />;
}
