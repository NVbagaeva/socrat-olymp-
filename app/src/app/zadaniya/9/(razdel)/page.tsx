import type { Metadata } from 'next';
import { OZadanii9 } from '@/components/tasks/proizvodnaya/OZadanii9';
import { O_ZADANII_9, proizvodnayaTitle } from '@/content/proizvodnaya';

export const metadata: Metadata = {
  title: proizvodnayaTitle(O_ZADANII_9.title),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2, №8 и №12. */
export default function OZadanii9Tab() {
  return <OZadanii9 />;
}
