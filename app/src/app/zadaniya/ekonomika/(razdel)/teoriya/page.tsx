import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya13 } from '@/components/tasks/zadanie13/Teoriya13';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE13 } from '@/content/zadanie13';
import { razdelBase } from '@/lib/paths';
import { zadanie13Zagolovok } from '@/lib/seo-razdely';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie13Zagolovok(VKLADKA),
};

/**
 * Вкладка «Теория» задания №13: девять глав подряд, содержание рядом.
 * Страница серверная: формулы и разборы задач набираются на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №13
 * (content/kartochki/13-ekonomicheskie.ts); их «Повторить теорию» ведёт к
 * карточкам, таблицам и рисункам глав этой страницы (lib/zadanie13/teoriya-yakorya.ts).
 */
export default function Teoriya13Tab() {
  return (
    <>
      <ProverkaTeorii
        task={13}
        href={`${razdelBase(ZADANIE13.slug)}/kartochki/`}
        ids={kolodaNomera(13).kartochki.map((k) => k.id)}
      />
      <Teoriya13 vkladka={VKLADKA} />
    </>
  );
}
