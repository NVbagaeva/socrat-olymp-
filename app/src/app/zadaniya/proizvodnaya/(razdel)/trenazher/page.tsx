import type { Metadata } from 'next';
import { Trenazher9Tab } from '@/components/tasks/proizvodnaya/Trenazher9Tab';
import { TRENAZHER9 } from '@/content/proizvodnaya9';
import { TRENAZHER9_HREF } from '@/lib/proizvodnaya/links';
import { proizvodnayaZagolovok } from '@/lib/seo-razdely';

export const metadata: Metadata = {
  title: proizvodnayaZagolovok(TRENAZHER9.title),
};

/** Вкладка «Тренажёр» задания №9: общий тренажёр, задачи строит генератор в браузере. */
export default function Trenazher9Page() {
  return <Trenazher9Tab base={TRENAZHER9_HREF} />;
}
