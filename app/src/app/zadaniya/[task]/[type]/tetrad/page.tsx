import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { builtSubtopicParams, findSubtopic } from '@/content/sections';
import '../../../zadaniya.css';
import { metaPodrazdela12 } from '@/content/seo';

/* Вложенные разделы существуют только у собранных подтем. */
export function generateStaticParams() {
  return builtSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  return subtopic ? metaPodrazdela12(subtopic.title, subtopic.graphName, 'tetrad') : {};
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
        <h1 className="t-h1">Интерактивная тетрадь</h1>
      </main>
    </AppShell>
  );
}
