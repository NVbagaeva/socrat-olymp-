import type { Metadata } from 'next';
import { Trenazher8Tab } from '@/components/tasks/vychisleniya/Trenazher8Tab';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(8, 'trenazher');

/** Вкладка «Тренажёр» задания №8: конфигуратор, сессия собирается в браузере. */
export default function Trenazher8Page() {
  return (
    <>
      <Trenazher8Tab base={`${ZADANIYA}/8/trenazher/`} />
      <BlokRazdela no={8} vid="trenazher" />
    </>
  );
}
