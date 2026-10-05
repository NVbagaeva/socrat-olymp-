import type { Metadata } from 'next';
import { Trenazher2Tab } from '@/components/tasks/vektory/Trenazher2Tab';
import { tasksPage } from '@/content/tasks';
import { TRENAZHER_2, VEKTORY, vektoryTitle } from '@/content/vektory';

export const metadata: Metadata = {
  title: vektoryTitle(TRENAZHER_2.title),
};

/** Вкладка «Тренажёр» задания №2: конфигуратор, сессия собирается в браузере. */
export default function Trenazher2Page() {
  return <Trenazher2Tab base={`${tasksPage.href}/${VEKTORY.slug}/trenazher/`} />;
}
