import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Repetitory45 } from '@/components/tasks/veroyatnost/Repetitory45';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { metaVkladki } from '@/content/seo';

const TUTORS = veroyatnostBySlug('4')?.tutors;

export const metadata: Metadata = metaVkladki(4, 'repetitory');

/**
 * Вкладка «Для репетиторов» задания №4: страница с карточками
 * материалов для скачивания — вместо прежнего выпадающего меню в ленте.
 */
export default function Repetitoram4Page() {
  if (TUTORS === undefined) {
    notFound();
  }
  return <Repetitory45 tutors={TUTORS} />;
}
