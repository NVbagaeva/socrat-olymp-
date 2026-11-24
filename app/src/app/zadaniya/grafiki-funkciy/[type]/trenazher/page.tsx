import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import {
  findSection,
  findSubtopic,
  trainerSubtopicParams,
  SEKCIYA_GRAFIKOV,
} from '@/content/sections';
import { trainerPage } from '@/content/trainerModes';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../zadaniya.css';
import '../../../[task]/section.css';
import '../topic.css';
import '../prep.css';
import '../trainer.css';
import '../configurator.css';

/* Тренажёр есть только у подтем с наборами прототипов в данных движка. */
export function generateStaticParams() {
  return trainerSubtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
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
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <FunctionTopicPage section={section} subtopic={subtopic} initialTab="trainer" />
    </AppShell>
  );
}
