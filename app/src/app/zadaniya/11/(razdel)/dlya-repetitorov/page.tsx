import type { Metadata } from 'next';
import { Repetitory11 } from '@/components/tasks/zadanie11/Repetitory11';
import { ZADANIE11 } from '@/content/zadanie11';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(11, 'repetitory');

/**
 * Вкладка «Для репетиторов» задания №11 (макет dlya-repetitorov.png):
 * маршруты уроков, методические заметки, быстрый лист.
 */
export default function Repetitory11Tab() {
  return (
    <Repetitory11
      razdely={dannyeTrenazhera().razdely}
      bloki={BLOKI.map((b) => ({ id: b.id, slug: b.slug, nazvanie: b.nazvanie, razdel: b.razdel }))}
      base={`${ZADANIYA}/${ZADANIE11.slug}`}
    />
  );
}
