import type { Metadata } from 'next';
import { katex } from '@/lib/graph/katex';
import { findSection } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { BankScreen } from './BankScreen';
import type { SubtopicView } from './SubtopicDialog';
import './zadaniya.css';

export const metadata: Metadata = {
  title: `${tasksPage.title} — Будет на ЕГЭ`,
  description: tasksPage.lead,
};

/* Формулы вёрстываются на сборке: в браузер уходит готовая разметка,
   а не библиотека ради шести постоянных строк. */
function formulaHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

/* Раздел с окном выбора подтемы — тот, что открыт в банке. */
const section = findSection('12');

const dialog = {
  slug: section?.slug ?? '',
  no: section?.no ?? '',
  subtitle: section?.subtitle ?? '',
  hint: section?.dialogHint ?? '',
  items: (section?.subtopics ?? []).map(
    (item, index): SubtopicView => ({
      id: item.id,
      no: String(index + 1).padStart(2, '0'),
      title: item.title,
      formulaHtml: formulaHtml(item.formula),
      status: item.status,
      href: item.status === 'active' ? `${tasksPage.href}/12/${item.id}` : null,
    }),
  ),
};

export default function TasksPage() {
  return <BankScreen dialog={dialog} />;
}
