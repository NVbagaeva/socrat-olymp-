import type { Metadata } from 'next';
import { Teoriya1 } from '@/components/tasks/planimetriya/Teoriya1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/**
 * Вкладка «Теория» задания №1: тринадцать разделов справочника,
 * содержание рядом. Пока вкладка у раздела одна, она живёт на адресе
 * самого раздела (как теория у фигур №3); с вкладкой «О задании»
 * переедет на …/teoriya/.
 *
 * Страница серверная: формулы набирает KaTeX, чертежи рисует движок
 * планиметрии на сборке; живые чертежи оживают в браузере.
 */
export default function Teoriya1Tab() {
  return (
    <Teoriya1
      vkladka={VKLADKA}
      spravochnik={`${ZADANIYA}/${ZADANIE1.slug}/pechat/spravochnik/`}
    />
  );
}
