import type { Metadata } from 'next';
import { Trenazher7 } from '@/components/tasks/zadanie7/Trenazher7';
import { ZADANIE7 } from '@/content/zadanie7';
import { gruppy7, protoInfo7 } from '@/lib/zadanie7/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(7, 'trenazher');

/**
 * Вкладка «Тренажёр» №7. Сервер отдаёт только список прототипов;
 * условия задач тренажёр загружает сам (public/data/zadanie7, без
 * ответов), разбор строит решатель в браузере.
 */
export default function Trenazher7Tab() {
  return (
    <>
      <Trenazher7
        prototipy={protoInfo7()}
        gruppy={gruppy7()}
        base={`${ZADANIYA}/${ZADANIE7.slug}`}
      />
      <BlokRazdela no={7} vid="trenazher" />
    </>
  );
}
