import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Repetitory45 } from '@/components/tasks/veroyatnost/Repetitory45';
import { veroyatnostBySlug, veroyatnostTitle } from '@/content/veroyatnost';

const TUTORS = veroyatnostBySlug('5')?.tutors;

export const metadata: Metadata = {
  title: veroyatnostTitle('5', TUTORS?.title ?? 'Для репетиторов'),
};

/**
 * Вкладка «Для репетиторов» задания №5: страница с карточками
 * материалов для скачивания — вместо прежнего выпадающего меню в ленте.
 */
export default function Repetitoram5Page() {
  if (TUTORS === undefined) {
    notFound();
  }
  return <Repetitory45 tutors={TUTORS} />;
}
