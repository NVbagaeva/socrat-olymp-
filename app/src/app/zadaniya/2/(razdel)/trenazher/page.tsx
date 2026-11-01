import type { Metadata } from 'next';
import { Trenazher2Tab } from '@/components/tasks/vektory/Trenazher2Tab';
import { VEKTORY } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(2, 'trenazher');

/** Вкладка «Тренажёр» задания №2: конфигуратор, сессия собирается в браузере. */
export default function Trenazher2Page() {
  return (
    <>
      <Trenazher2Tab base={`${ZADANIYA}/${VEKTORY.slug}/trenazher/`} />
      <BlokRazdela no={2} vid="trenazher" />
    </>
  );
}
