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
import './trainer.css';
import './configurator.css';
import '../../komplekt.css';
import { metaPodrazdela12 } from '@/content/seo';
import { VsyoPodrazdela12 } from '@/components/seo/VsyoVRazdele';

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
  /* Название и название графика — из общего списка разделов
     (data/functionTypes.ts); заголовок и описание — по шаблону
     content/seo.ts, карточка при отправке ссылки собирается из них. */
  return metaPodrazdela12(subtopic.title, subtopic.graphName, 'o');
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
      <FunctionTopicPage
        section={section}
        subtopic={subtopic}
        posle={<VsyoPodrazdela12 type={type} />}
      />
    </AppShell>
  );
}
