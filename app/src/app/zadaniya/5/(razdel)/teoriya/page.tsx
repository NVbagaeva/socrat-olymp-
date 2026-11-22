import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { TeoriyaShell, telaRazdelov5 } from '@/components/tasks/veroyatnost/teoriya';
import { kolodaNomera } from '@/content/kartochki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { RAZDELY_5 } from '@/content/veroyatnost-teoriya';
import { ZADANIYA } from '@/lib/paths';
import '@/components/tasks/teoriya/teoriya-steklo.css';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'teoriya')),
};

/**
 * Вкладка «Теория» задания №5 — на своём адресе, как у №4; адрес
 * раздела — «О задании».
 *
 * Написан один раздел, «Координатная прямая»: он переехал из теории
 * №4, потому что разбирает два события-промежутка и их вложенность —
 * метод 3 задания №5. Остальные разделы автор ещё не писал, и
 * придуманного здесь не будет.
 *
 * Над теорией — «Проверить теорию»: карточки по теории №5
 * (content/kartochki/05-veroyatnost.ts). Определения событий написаны
 * в теории №4, и такие карточки ведут туда.
 *
 * Страница серверная: формулы набираются KaTeX на сборке.
 */
export default function Teoriya5Tab() {
  return (
    <>
      <ProverkaTeorii
        task={5}
        href={`${ZADANIYA}/5/kartochki/`}
        ids={kolodaNomera(5).kartochki.map((k) => k.id)}
      />
      {/* «Стеклянная сцена»: общий слой рамок теории (teoriya-steklo.css),
          содержание и разметка разделов не меняются. */}
      <div className="teor-steklo z45-teoriya">
        <TeoriyaShell vkladka={vkladka('5', 'teoriya')} razdely={RAZDELY_5} tela={telaRazdelov5} />
      </div>
    </>
  );
}
