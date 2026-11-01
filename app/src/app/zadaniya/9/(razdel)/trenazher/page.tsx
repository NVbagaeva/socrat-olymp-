import type { Metadata } from 'next';
import { Trenazher9Tab } from '@/components/tasks/proizvodnaya/Trenazher9Tab';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(9, 'trenazher');

/** Вкладка «Тренажёр» задания №9: конфигуратор; сессия собирается в браузере. */
export default function Trenazher9Page() {
  return (
    <>
      <Trenazher9Tab />
      <BlokRazdela no={9} vid="trenazher" />
    </>
  );
}
