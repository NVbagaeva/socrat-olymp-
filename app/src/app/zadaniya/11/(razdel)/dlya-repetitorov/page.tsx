import type { Metadata } from 'next';
import { Repetitory11 } from '@/components/tasks/zadanie11/Repetitory11';
import { ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import type { SectionId } from '@/lib/zadanie11/types';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE11.tabs.find((tab) => tab.id === 'repetitory')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie11Title(VKLADKA),
};

/**
 * Вкладка «Для репетиторов» задания №11: готовые уроки (открываются
 * в генераторе) и методические заметки со ссылками в теорию, блоки
 * и тренажёр.
 */
export default function Repetitory11Tab() {
  const d = dannyeTrenazhera();
  const teoriya = Object.fromEntries(
    Object.entries(d.ssylki).map(([id, s]) => [id, s.teoriya]),
  ) as Record<SectionId, string>;
  return (
    <Repetitory11
      razdely={d.razdely}
      bloki={BLOKI.map((b) => ({ id: b.id, slug: b.slug, nazvanie: b.nazvanie, razdel: b.razdel }))}
      teoriya={teoriya}
      base={`${ZADANIYA}/${ZADANIE11.slug}`}
    />
  );
}
