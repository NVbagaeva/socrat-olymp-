import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { activeSubtopicParams, findSection, findSubtopic } from '@/content/sections';
import { trainerPage } from '@/content/trainerModes';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../zadaniya.css';
import '../../section.css';
import '../topic.css';
import '../prep.css';
import '../trainer.css';
import '../generator.css';

/* Вложенные разделы существуют только у открытых подтем. */
export function generateStaticParams() {
  return activeSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  return subtopic ? { title: `${trainerPage.title} · ${subtopic.title} — Будет на ЕГЭ` } : {};
}

/**
 * Вкладка «Тренажёр» до выбора типа заданий.
 *
 * Рамка темы та же, что и везде: крошки, заголовок, кольцо разделов
 * и лента вкладок. Отдельной страницы без ленты вкладок у тренажёра
 * больше нет — по ней было некуда возвращаться.
 */
export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks" task={task}>
      <FunctionTopicPage section={section} subtopic={subtopic} initialTab="trainer" />
    </AppShell>
  );
}
