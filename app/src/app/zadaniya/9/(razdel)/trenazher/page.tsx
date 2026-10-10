import type { Metadata } from 'next';
import { Trenazher9Tab } from '@/components/tasks/proizvodnaya/Trenazher9Tab';
import { proizvodnayaTitle } from '@/content/proizvodnaya';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Тренажёр'),
};

/** Вкладка «Тренажёр» задания №9: конфигуратор; сессия собирается в браузере. */
export default function Trenazher9Page() {
  return <Trenazher9Tab />;
}
