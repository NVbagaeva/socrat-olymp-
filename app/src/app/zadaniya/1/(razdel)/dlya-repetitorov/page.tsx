import type { Metadata } from 'next';
import { Repetitory1 } from '@/components/tasks/planimetriya/Repetitory1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';

const DANNYE = dannyeTrenazhera1();
const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'repetitory')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/**
 * Вкладка «Для репетиторов» задания №1: серия из 13 уроков по коду
 * комплекта и методические заметки по блокам. Числа задач банка и
 * аналогов приходят без ответов: листы собирает движок в браузере.
 */
export default function Repetitory1Tab() {
  return (
    <Repetitory1
      razdely={DANNYE.razdely}
      bank={DANNYE.bank}
      base={`${ZADANIYA}/${ZADANIE1.slug}`}
    />
  );
}
