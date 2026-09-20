import type { Metadata } from 'next';
import { TeoriyaShell, telaRazdelov5 } from '@/components/tasks/veroyatnost/teoriya';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { RAZDELY_5 } from '@/content/veroyatnost-teoriya';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Теория'),
};

/**
 * Вкладка «Теория» задания №5 — она же адрес раздела.
 *
 * Написан один раздел, «Координатная прямая»: он переехал из теории
 * №4, потому что разбирает два события-промежутка и их вложенность —
 * метод 3 задания №5. Остальные разделы автор ещё не писал, и
 * придуманного здесь не будет.
 *
 * Страница серверная: формулы набираются KaTeX на сборке.
 */
export default function Teoriya5Tab() {
  return <TeoriyaShell razdely={RAZDELY_5} tela={telaRazdelov5} />;
}
