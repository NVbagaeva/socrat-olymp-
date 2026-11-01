import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya11 } from '@/components/tasks/zadanie11/Teoriya11';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE11.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie11Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №11: разделы подряд, содержание рядом.
 * Страница серверная: формулы и таблицы набираются KaTeX на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №11
 * (content/kartochki/11-tekstovye.ts); их «Повторить теорию» ведёт к
 * блокам разделов, лайфхакам и ловушкам этой страницы (lib/zadanie11/teoriya-yakorya.ts).
 */
export default function Teoriya11Tab() {
  const base = `${ZADANIYA}/${ZADANIE11.slug}`;
  return (
    <>
      <ProverkaTeorii
        task={11}
        href={`${base}/kartochki/`}
        ids={kolodaNomera(11).kartochki.map((k) => k.id)}
      />
      <Teoriya11 vkladka={VKLADKA} base={base} />
    </>
  );
}
