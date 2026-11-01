import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya10 } from '@/components/tasks/zadanie10/Teoriya10';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE10.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie10Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №10: девять разделов в рамках, содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №10
 * (content/kartochki/10-prikladnye.ts); их «Повторить теорию» ведёт к
 * рамкам, ловушкам и карточкам «Физики в двух словах» этой страницы (lib/zadanie10/teoriya-yakorya.ts).
 */
export default function Teoriya10Tab() {
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  return (
    <>
      <ProverkaTeorii
        task={10}
        href={`${base}/kartochki/`}
        ids={kolodaNomera(10).kartochki.map((k) => k.id)}
      />
      <Teoriya10 vkladka={VKLADKA} base={base} />
    </>
  );
}
