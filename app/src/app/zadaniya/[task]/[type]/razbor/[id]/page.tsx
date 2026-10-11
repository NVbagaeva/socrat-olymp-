import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AnalysisPage } from '@/components/tasks/about/AnalysisPage';
import { analysisParams, findAnalysis, findSection, findSubtopic } from '@/content/sections';
import { ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '../../../../zadaniya.css';
import '../../../section.css';
import '../../topic.css';

/* Разбор типа задачи со вкладки «О задании». Вкладка подгружает эту
   страницу по клику на плашку и вставляет из неё блок разбора; без
   скриптов на неё ведёт обычная ссылка с плашки. */
export function generateStaticParams() {
  return analysisParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type, id } = await params;
  const subtopic = findSubtopic(task, type);
  const form = findAnalysis(task, type, id);
  return subtopic && form
    ? { title: `${form.title.replace(/\$/g, '')} · ${subtopic.title} — Будет на ЕГЭ` }
    : {};
}

export default async function Page({ params }: { params: Params }) {
  const { task, type, id } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  const form = findAnalysis(task, type, id);
  if (!section || !subtopic || !form) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <AnalysisPage form={form} base={`${ZADANIYA}/${section.slug}/${subtopic.id}`} />
    </AppShell>
  );
}
