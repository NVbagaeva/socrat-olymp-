import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import {
  findSection,
  findSubtopic,
  prepSubtopicParams,
  SEKCIYA_GRAFIKOV,
} from '@/content/sections';
import { prepPage } from '@/content/prepSkills';
import '../../../zadaniya.css';
import '../../../[task]/section.css';
import '../topic.css';
import '../prep.css';
import '../trainer.css';
import '../configurator.css';

/* Адрес есть только у подтем со списком навыков. */
export function generateStaticParams() {
  return prepSubtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  return subtopic ? { title: `${prepPage.title} · ${subtopic.title} — Будет на ЕГЭ` } : {};
}

/**
 * Прямой заход на опорные задачи.
 *
 * Страница та же, что и у темы, и рамка та же: крошки, заголовок,
 * кольцо разделов и ряд вкладок. Отличается только одним — открыта
 * сразу вкладка опорных задач. Голого списка навыков без
 * шапки не должно быть ни по какому адресу.
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
      <FunctionTopicPage section={section} subtopic={subtopic} initialTab="prep" />
    </AppShell>
  );
}
