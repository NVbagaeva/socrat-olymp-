import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { TeoriyaShell, telaRazdelov4 } from '@/components/tasks/veroyatnost/teoriya';
import { kolodaNomera } from '@/content/kartochki';
import { RAZDELY_4 } from '@/content/veroyatnost-teoriya';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'teoriya')),
};

/**
 * Вкладка «Теория» задания №4.
 *
 * Разделы идут подряд на одной странице, содержание — рядом.
 * Написаны «Виды событий», «Как изображать события» и «Классическая
 * вероятность»; «Противоположное событие» стоит в содержании и честно
 * говорит, что материал готовится: придуманного здесь нет. Раздел
 * «Координатная прямая» уехал в теорию задания №5 — там его метод.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №4
 * (content/kartochki/04-veroyatnost.ts); их «Повторить теорию» ведёт
 * к блокам этой страницы.
 *
 * Страница серверная: формулы набираются KaTeX на сборке, а верные
 * ответы самопроверки закрываются отпечатком и вниз не уезжают.
 */
export default function Teoriya4Tab() {
  return (
    <>
      <ProverkaTeorii
        task={4}
        href={`${ZADANIYA}/4/kartochki/`}
        ids={kolodaNomera(4).kartochki.map((k) => k.id)}
      />
      <TeoriyaShell vkladka={vkladka('4', 'teoriya')} razdely={RAZDELY_4} tela={telaRazdelov4} />
    </>
  );
}
