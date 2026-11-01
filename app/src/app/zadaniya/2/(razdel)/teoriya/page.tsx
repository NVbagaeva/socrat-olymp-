import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya2 } from '@/components/tasks/vektory/Teoriya2';
import { kolodaNomera } from '@/content/kartochki';
import { VEKTORY, vektoryTitle } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = VEKTORY.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: vektoryTitle(VKLADKA),
};

/**
 * Вкладка «Теория» задания №2: восемь разделов подряд, содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке,
 * рисунки собирает движок векторов из сцен.
 */
export default function Teoriya2Tab() {
  return (
    <>
      <ProverkaTeorii
        task={2}
        href={`${ZADANIYA}/${VEKTORY.slug}/kartochki/`}
        ids={kolodaNomera(2).kartochki.map((k) => k.id)}
      />
      <Teoriya2 vkladka={VKLADKA} />
    </>
  );
}
