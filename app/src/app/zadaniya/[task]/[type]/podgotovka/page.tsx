import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PrepSkills } from '@/components/tasks/prep';
import { Breadcrumbs } from '@/components/ui';
import { prepPage } from '@/content/prepSkills';
import { tasksPage } from '@/content/tasks';
import { activeSubtopicParams, findSubtopic } from '@/content/sections';
import '../../../zadaniya.css';
import '../prep.css';

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

export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  if (!subtopic) {
    notFound();
  }

  const base = `${tasksPage.href}/${task}/${type}`;

  return (
    <AppShell active="tasks" task={task}>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Задания', href: tasksPage.href },
            { label: `№${task}`, href: `${tasksPage.href}/${task}` },
            { label: subtopic.title, href: `${base}/` },
            { label: prepPage.title },
          ]}
        />
        {/* Тот же экран, что и во вкладке темы: второй разметки нет.
            Сюда попадают по прямой ссылке и кнопкой «назад». */}
        <PrepSkills base={base} />
      </main>
    </AppShell>
  );
}
