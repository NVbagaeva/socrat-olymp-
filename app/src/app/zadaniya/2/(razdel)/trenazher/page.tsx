import type { Metadata } from 'next';
import { Trenazher2Tab } from '@/components/tasks/vektory/Trenazher2Tab';
import { vektoryTitle } from '@/content/vektory';
import { TRENAZHER2 } from '@/content/vektory2';
import { TRENAZHER2_HREF } from '@/lib/vektory/links';

export const metadata: Metadata = {
  title: vektoryTitle(TRENAZHER2.title),
};

/** Вкладка «Тренажёр» задания №2: общий тренажёр, задачи строит генератор в браузере. */
export default function Trenazher2Page() {
  return <Trenazher2Tab base={TRENAZHER2_HREF} />;
}
