import type { Metadata } from 'next';
import { Trenazher13 } from '@/components/tasks/zadanie13/Trenazher13';
import { ZADANIE13 } from '@/content/zadanie13';
import { BANK_13 } from '@/lib/zadanie13/bank';
import { prototypes } from '@/lib/zadanie13/generate';
import { trenazherConfig13, zadachi13 } from '@/lib/zadanie13/trenazher/filtry13';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(13, 'trenazher');

/**
 * Вкладка «Тренажёр» задания №13 на общей панели фильтров. Реестр
 * прототипов, список задач банка раздела и названия с формулами —
 * на сборке; задачи тренировки — в браузере, ответ закрывается
 * отпечатком сразу после сборки задачи движком.
 */
export default function Trenazher13Tab() {
  const protos = prototypes().map((p) => ({
    id: p.id,
    type: p.type,
    difficulty: p.difficulty,
    source: p.source,
    title: p.title,
  }));
  return (
    <>
      <Trenazher13
        config={trenazherConfig13(protos, typeset)}
        refs={zadachi13(protos, BANK_13)}
        base={`${ZADANIYA}/${ZADANIE13.slug}`}
      />
      <BlokRazdela no={13} vid="trenazher" />
    </>
  );
}
