import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { findSection, findSubtopic, subtopicParams } from '@/content/sections';
import '../../zadaniya.css';

/* Собираются все подтемы, включая закрытые: прямой заход на закрытую
   должен показывать «Скоро», а не 404. */
export function generateStaticParams() {
  return subtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  if (!subtopic) {
    return {};
  }
  return { title: `${subtopic.name} — Будет на ЕГЭ` };
}

export default async function SubtopicPage({ params }: { params: Params }) {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <h1 className="t-h1">{subtopic.name}</h1>
      </main>
    </AppShell>
  );
}
