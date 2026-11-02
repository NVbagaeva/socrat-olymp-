import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { Teoriya6 } from '@/components/tasks/zadanie6/Teoriya6';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE6.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie6Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №6: девять разделов в рамках и карточках,
 * содержание рядом, «Проверь себя» после каждого раздела. Страница
 * серверная: формулы набираются KaTeX на сборке.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №6
 * (content/kartochki/06-sluchaynye-velichiny.ts); их «Повторить
 * теорию» ведёт к рамкам и карточкам этой страницы
 * (lib/zadanie6/teoriya-yakorya.ts).
 */
export default function Teoriya6Tab() {
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  return (
    <>
      <ProverkaTeorii
        task={6}
        href={`${base}/kartochki/`}
        ids={kolodaNomera(6).kartochki.map((k) => k.id)}
      />
      <Teoriya6 vkladka={VKLADKA} base={base} />
    </>
  );
}
