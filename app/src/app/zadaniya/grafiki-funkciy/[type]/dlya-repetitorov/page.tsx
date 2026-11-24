import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import {
  builtSubtopicParams,
  findSection,
  findSubtopic,
  SEKCIYA_GRAFIKOV,
} from '@/content/sections';
import '../../../zadaniya.css';
import '../../../[task]/section.css';
import '../topic.css';
import '../prep.css';
import '../trainer.css';
import '../configurator.css';

/* Вложенные разделы существуют только у собранных подтем. */
export function generateStaticParams() {
  return builtSubtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    return {};
  }
  return { title: `${section.tutors.title} · ${subtopic.title} — Будет на ЕГЭ` };
}

/**
 * Прямой заход на материалы для репетиторов.
 *
 * Страница та же, что и у темы, и рамка та же: крошки, заголовок,
 * кольцо разделов и ряд вкладок. Отличается только одним — открыта
 * сразу вкладка «Для репетиторов». Отдельной страницы без ленты
 * вкладок больше нет: по ней было некуда возвращаться.
 */
export default async function TutorsPage({ params }: { params: Params }) {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <FunctionTopicPage section={section} subtopic={subtopic} initialTab="tutors" />
    </AppShell>
  );
}
