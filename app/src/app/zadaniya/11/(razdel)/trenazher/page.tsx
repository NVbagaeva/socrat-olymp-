import type { Metadata } from 'next';
import { Trenazher11 } from '@/components/tasks/zadanie11/Trenazher11';
import { tasksPage } from '@/content/tasks';
import { TRENAZHER_11, ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';

export const metadata: Metadata = {
  title: zadanie11Title(TRENAZHER_11.title),
};

/**
 * Вкладка «Тренажёр» задания №11 (макеты trenazher-vybor.png и
 * trenazher-reshenie-mobile.png). Разделы, счётчики и условия банка
 * без ответов собираются на сборке; задачи тренировки — в браузере,
 * ответ закрывается отпечатком сразу после решения движком.
 */
export default function Trenazher11Tab() {
  return <Trenazher11 dannye={dannyeTrenazhera()} base={`${tasksPage.href}/${ZADANIE11.slug}`} />;
}
