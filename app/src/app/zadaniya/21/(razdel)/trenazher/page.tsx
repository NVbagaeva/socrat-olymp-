import type { Metadata } from 'next';
import { Trenazher21Tab } from '@/components/tasks/zadanie21/Trenazher21Tab';
import { TRENAZHER21 } from '@/content/naibolshee21';
import { zadanie21Title } from '@/content/zadanie21';
import { TRENAZHER21_HREF } from '@/lib/zadanie21/links';

export const metadata: Metadata = {
  title: zadanie21Title(TRENAZHER21.title),
};

/** Вкладка «Тренажёр»: общий тренажёр, задачи строит генератор в браузере. */
export default function Trenazher21Page() {
  return <Trenazher21Tab base={TRENAZHER21_HREF} />;
}
