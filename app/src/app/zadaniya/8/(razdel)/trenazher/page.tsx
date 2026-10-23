import type { Metadata } from 'next';
import { Trenazher8Tab } from '@/components/tasks/vychisleniya/Trenazher8Tab';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Тренажёр'),
};

/** Вкладка «Тренажёр» задания №8: конфигуратор, сессия собирается в браузере. */
export default function Trenazher8Page() {
  return <Trenazher8Tab base={`${ZADANIYA}/8/trenazher/`} />;
}
