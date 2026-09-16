import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { findSection, findSubtopic, subtopicParams } from '@/content/sections';
import '../../zadaniya.css';
/* Список наборов на вкладке подготовительных задач берёт разметку
   страницы раздела: второго набора правил для него не заводится. */
import '../section.css';
import './topic.css';
import './prep.css';

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
  return { title: `${subtopic.title} — Будет на ЕГЭ` };
}

export default async function SubtopicPage({ params }: { params: Params }) {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks" task={task}>
      <FunctionTopicPage section={section} subtopic={subtopic} />
    </AppShell>
  );
}
