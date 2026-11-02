import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya9 } from '@/components/tasks/proizvodnaya/Teoriya9';
import { kolodaNomera } from '@/content/kartochki';
import { PROIZVODNAYA, proizvodnayaTitle } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = PROIZVODNAYA.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: proizvodnayaTitle(VKLADKA),
};

/**
 * Вкладка «Теория» задания №9: семь разделов подряд (первый — «Понятие производной»), содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке,
 * рисунки рисует движок графиков из сцен.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №9
 * (content/kartochki/09-proizvodnaya.ts); их «Повторить теорию» ведёт к
 * рамкам и подразделам этой страницы (lib/proizvodnaya/teoriya-yakorya.ts).
 */
export default function Teoriya9Tab() {
  return (
    <>
      <ProverkaTeorii
        task={9}
        href={`${ZADANIYA}/${PROIZVODNAYA.slug}/kartochki/`}
        ids={kolodaNomera(9).kartochki.map((k) => k.id)}
      />
      <Teoriya9 vkladka={VKLADKA} />
    </>
  );
}
