import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { activeSubtopicParams, findSubtopic } from '@/content/sections';
import '../../../zadaniya.css';

/* Вложенные разделы существуют только у открытых подтем. */
export function generateStaticParams() {
  return activeSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  return subtopic ? { title: `Тренажёр · ${subtopic.name} — Будет на ЕГЭ` } : {};
}

export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  if (!subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <h1 className="t-h1">Тренажёр</h1>
      </main>
    </AppShell>
  );
}
