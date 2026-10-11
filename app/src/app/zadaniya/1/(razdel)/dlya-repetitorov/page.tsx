import type { Metadata } from 'next';
import { Repetitory1 } from '@/components/tasks/planimetriya/Repetitory1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { BLOKI } from '@/lib/planimetriya/prep/bloki';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';

const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'repetitory')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/**
 * Вкладка «Для репетиторов» задания №1 — как у №11: девять уроков,
 * методические заметки по блокам, быстрый лист.
 */
export default function Repetitory1Tab() {
  return (
    <Repetitory1
      razdely={dannyeTrenazhera1().razdely}
      bloki={BLOKI.map((b) => ({ id: b.id, slug: b.slug, nazvanie: b.nazvanie }))}
      base={`${ZADANIYA}/${ZADANIE1.slug}`}
    />
  );
}
