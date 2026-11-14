import type { Metadata } from 'next';
import { OZadanii12 } from '@/components/tasks/zadanie12/OZadanii12';
import { findSection } from '@/content/sections';
import '@/lib/graph/graph.css';

const section = findSection('12');

export const metadata: Metadata =
  section === undefined
    ? {}
    : {
        title: `${section.title}. ${section.subtitle} — Будет на ЕГЭ`,
        description: section.description,
      };

/** Вкладка «О задании» живёт на адресе самого раздела: карта задания по типам. */
export default function OZadanii12Tab() {
  return <OZadanii12 />;
}
