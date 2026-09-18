import type { Metadata } from 'next';
import { findManifestFamily } from '@/lib/generator/manifest';
import { findSection } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { BankScreen } from './BankScreen';
import type { SubtopicView } from './SubtopicDialog';
import './zadaniya.css';

export const metadata: Metadata = {
  title: `${tasksPage.title} — Будет на ЕГЭ`,
  description: tasksPage.lead,
};

/* Раздел с окном выбора подтемы — тот, что открыт в банке. */
const section = findSection('12');

const dialog = {
  slug: section?.slug ?? '',
  no: section?.no ?? '',
  subtitle: section?.subtitle ?? '',
  hint: section?.dialogHint ?? '',
  items: (section?.subtopics ?? []).map((item, index): SubtopicView => {
    /* Числа на карточке — из манифеста генератора, он один считает
       наборы движка. Семейство без наборов в манифесте есть, но с
       нулями: карточка у него закрыта, и нулей она не показывает. */
    const family = findManifestFamily(item.id);
    return {
      id: item.id,
      no: String(index + 1).padStart(2, '0'),
      title: item.title,
      status: item.status,
      prototypes: family?.prototypes.sets ?? 0,
      tasks: family?.prototypes.tasks ?? 0,
      href: item.status === 'active' ? `${tasksPage.href}/12/${item.id}` : null,
    };
  }),
};

export default function TasksPage() {
  return <BankScreen dialog={dialog} />;
}
