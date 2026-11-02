import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya7 } from '@/components/tasks/zadanie7/Teoriya7';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE7.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie7Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №7: девять разделов в рамках и карточках,
 * содержание рядом, живой тригонометрический круг. Страница серверная:
 * формулы набираются KaTeX на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №7
 * (content/kartochki/07-uravneniya.ts); их «Повторить теорию» ведёт к рамкам и
 * карточкам этой страницы (lib/zadanie7/teoriya-yakorya.ts).
 */
export default function Teoriya7Tab() {
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  return (
    <>
      <ProverkaTeorii
        task={7}
        href={`${base}/kartochki/`}
        ids={kolodaNomera(7).kartochki.map((k) => k.id)}
      />
      <Teoriya7 vkladka={VKLADKA} base={base} />
    </>
  );
}
