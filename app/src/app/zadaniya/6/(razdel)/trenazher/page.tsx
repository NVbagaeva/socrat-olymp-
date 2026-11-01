import type { Metadata } from 'next';
import { Trenazher6 } from '@/components/tasks/zadanie6/Trenazher6';
import { ZADANIE6 } from '@/content/zadanie6';
import { gruppy6, protoInfo6 } from '@/lib/zadanie6/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(6, 'trenazher');

/**
 * Вкладка «Тренажёр» №6. Сервер отдаёт только список прототипов;
 * условия задач тренажёр загружает сам (public/data/zadanie6, без
 * ответов), рисунок и разбор строит решатель в браузере.
 */
export default function Trenazher6Tab() {
  return (
    <>
      <Trenazher6
        prototipy={protoInfo6()}
        gruppy={gruppy6()}
        base={`${ZADANIYA}/${ZADANIE6.slug}`}
      />
      <BlokRazdela no={6} vid="trenazher" />
    </>
  );
}
