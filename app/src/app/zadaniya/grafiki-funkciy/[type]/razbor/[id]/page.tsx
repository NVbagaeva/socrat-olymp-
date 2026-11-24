import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AnalysisPage } from '@/components/tasks/about/AnalysisPage';
import {
  analysisParams,
  findAnalysis,
  findSection,
  findSubtopic,
  SEKCIYA_GRAFIKOV,
} from '@/content/sections';
import { razdelBase } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '../../../../zadaniya.css';
import '../../../../[task]/section.css';
import '../../topic.css';

/* Разбор типа задачи со вкладки «О задании». Вкладка подгружает эту
   страницу по клику на плашку и вставляет из неё блок разбора; без
   скриптов на неё ведёт обычная ссылка с плашки. */
export function generateStaticParams() {
  return analysisParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type, id } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  const form = findAnalysis(task, type, id);
  return subtopic && form
    ? { title: `${form.title.replace(/\$/g, '')} · ${subtopic.title} — Будет на ЕГЭ` }
    : {};
}

export default async function Page({ params }: { params: Params }) {
  const { type, id } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  const form = findAnalysis(task, type, id);
  if (!section || !subtopic || !form) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <AnalysisPage form={form} base={`${razdelBase(section.slug)}/${subtopic.id}`} />
    </AppShell>
  );
}
