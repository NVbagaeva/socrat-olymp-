import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya16 } from '@/components/zadanie16/Teoriya16';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE16, zadanie16Title } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE16.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie16Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №16: главы подряд, содержание рядом.
 * Страница серверная: формулы и чертежи набираются на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №16
 * (content/kartochki/16-neravenstva.ts); их «Повторить теорию» ведёт к
 * карточкам написанных пунктов этой страницы (lib/zadanie16/teoriya-yakorya.ts).
 */
export default function Teoriya16Tab() {
  return (
    <>
      <ProverkaTeorii
        task={16}
        href={`${ZADANIYA}/${ZADANIE16.slug}/kartochki/`}
        ids={kolodaNomera(16).kartochki.map((k) => k.id)}
      />
      <Teoriya16 vkladka={VKLADKA} />
    </>
  );
}
