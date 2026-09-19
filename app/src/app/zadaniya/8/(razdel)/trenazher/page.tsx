import type { Metadata } from 'next';
import { Trenazher8Tab } from '@/components/tasks/vychisleniya/Trenazher8Tab';
import { tasksPage } from '@/content/tasks';
import { vychisleniyaTitle } from '@/content/vychisleniya';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Тренажёр'),
};

/** Вкладка «Тренажёр» задания №8: конфигуратор, сессия собирается в браузере. */
export default function Trenazher8Page() {
  return <Trenazher8Tab base={`${tasksPage.href}/8/trenazher/`} />;
}
