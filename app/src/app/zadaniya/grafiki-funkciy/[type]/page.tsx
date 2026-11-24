import { ogStranicy } from '@/lib/og';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { findSection, findSubtopic, subtopicParams, SEKCIYA_GRAFIKOV } from '@/content/sections';
import '../../zadaniya.css';
/* Список наборов на вкладке подготовительных задач берёт разметку
   страницы раздела: второго набора правил для него не заводится. */
import '../../[task]/section.css';
import './topic.css';
import './prep.css';
import './trainer.css';
import './configurator.css';
import '../../komplekt.css';

/* Собираются все подтемы, включая закрытые: прямой заход на закрытую
   должен показывать «Скоро», а не 404. */
export function generateStaticParams() {
  return subtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  if (!subtopic) {
    return {};
  }
  /* Название и название графика — из общего списка разделов
     (data/functionTypes.ts), одни и те же в заголовке, описании и
     карточке при отправке ссылки. */
  const title = `${subtopic.title} — Будет на ЕГЭ`;
  /* task — часть адреса; номер задания ЕГЭ — у раздела. */
  const description = `Задание №${findSection(task)?.no ?? task}. ${subtopic.title}. ${subtopic.graphName}.`;
  return { title, description, openGraph: ogStranicy(title, description) };
}

export default async function SubtopicPage({ params }: { params: Params }) {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <FunctionTopicPage section={section} subtopic={subtopic} />
    </AppShell>
  );
}
