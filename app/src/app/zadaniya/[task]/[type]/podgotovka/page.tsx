import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { activeSubtopicParams, findSection, findSubtopic } from '@/content/sections';
import { prepPage } from '@/content/prepSkills';
import '../../../zadaniya.css';
import '../../section.css';
import '../topic.css';
import '../prep.css';
import '../trainer.css';

/* Вложенные разделы существуют только у открытых подтем. */
export function generateStaticParams() {
  return activeSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  return subtopic ? { title: `${prepPage.title} · ${subtopic.title} — Будет на ЕГЭ` } : {};
}

/**
 * Прямой заход на подготовительные задачи.
 *
 * Страница та же, что и у темы, и рамка та же: крошки, заголовок,
 * кольцо разделов и ряд вкладок. Отличается только одним — открыта
 * сразу вкладка подготовительных задач. Голого списка навыков без
 * шапки не должно быть ни по какому адресу.
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
      <FunctionTopicPage section={section} subtopic={subtopic} initialTab="prep" />
    </AppShell>
  );
}
