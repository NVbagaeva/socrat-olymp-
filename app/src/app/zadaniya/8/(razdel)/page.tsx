import type { Metadata } from 'next';
import { VychisleniyaAbout } from '@/components/tasks/vychisleniya/VychisleniyaAbout';
import { vychisleniyaMeta } from '@/content/vychisleniya';

export const metadata: Metadata = {
  ...vychisleniyaMeta('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №4 и №12. */
export default function OZadanii8Tab() {
  return <VychisleniyaAbout />;
}
