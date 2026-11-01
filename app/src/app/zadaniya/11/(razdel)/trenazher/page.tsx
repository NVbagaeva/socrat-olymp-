import type { Metadata } from 'next';
import { Trenazher11 } from '@/components/tasks/zadanie11/Trenazher11';
import { ZADANIE11 } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(11, 'trenazher');

/**
 * Вкладка «Тренажёр» задания №11 (макеты trenazher-vybor.png и
 * trenazher-reshenie-mobile.png). Разделы, счётчики и условия банка
 * без ответов собираются на сборке; задачи тренировки — в браузере,
 * ответ закрывается отпечатком сразу после решения движком.
 */
export default function Trenazher11Tab() {
  return (
    <>
      <Trenazher11 dannye={dannyeTrenazhera()} base={`${ZADANIYA}/${ZADANIE11.slug}`} />
      <BlokRazdela no={11} vid="trenazher" />
    </>
  );
}
