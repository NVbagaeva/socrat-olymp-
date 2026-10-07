import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { findSection, findSubtopic, subtopicParams } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { NOINDEX, SITE_NAME, razdelDescription } from '@/lib/seo';
import '../../zadaniya.css';
/* Список наборов на вкладке подготовительных задач берёт разметку
   страницы раздела: второго набора правил для него не заводится. */
import '../section.css';
import './topic.css';
import './prep.css';
import './trainer.css';
import './configurator.css';

/* Собираются все подтемы, включая закрытые: прямой заход на закрытую
   должен показывать «Скоро», а не 404. */
export function generateStaticParams() {
  return subtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    return {};
  }
  /* «Линейные функции · Задание 12 ЕГЭ — графики функций | Будет на ЕГЭ».
     Описание — текст подтемы, если он написан, иначе общее описание
     раздела. Несобранная подтема («Скоро») в поиск не идёт. */
  const description =
    subtopic.description === ''
      ? razdelDescription(section.no, section.subtitle, section.description)
      : `${subtopic.description} Задание ${Number(section.no)} ЕГЭ по профильной математике.`;
  return {
    title: `${subtopic.title} · Задание ${Number(section.no)} ЕГЭ — ${section.subtitle.toLowerCase()} | ${SITE_NAME}`,
    description,
    ...(subtopicBuilt(subtopic) ? {} : { robots: NOINDEX }),
  };
}

export default async function SubtopicPage({ params }: { params: Params }) {
  const { task, type } = await params;
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
