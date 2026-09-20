import type { Metadata } from 'next';
import { TeoriyaShell, telaRazdelov4 } from '@/components/tasks/veroyatnost/teoriya';
import { RAZDELY_4 } from '@/content/veroyatnost-teoriya';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'teoriya')),
};

/**
 * Вкладка «Теория» задания №4.
 *
 * Разделы идут подряд на одной странице, содержание — рядом.
 * Написаны первые два, «Виды событий» и «Классическая вероятность»;
 * остальные стоят в содержании и честно говорят, что материал
 * готовится: придуманного здесь нет. Раздел «Координатная прямая»
 * уехал в теорию задания №5 — там его метод.
 *
 * Страница серверная: формулы набираются KaTeX на сборке, а верные
 * ответы самопроверки закрываются отпечатком и вниз не уезжают.
 */
export default function Teoriya4Tab() {
  return (
    <TeoriyaShell vkladka={vkladka('4', 'teoriya')} razdely={RAZDELY_4} tela={telaRazdelov4} />
  );
}
